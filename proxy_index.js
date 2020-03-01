// дима если ты это смотришь то всоси мой предсказательный пенис

const http = require("http");
const net = require("net");
const url = require("url");
const process = require("process");
const fs = require("fs");
const crypto = require("crypto");

class Group {
    isHostAllowed(hostname) {
        throw new Error("Abstract method error");
    }
}

class WhitelistGroup extends Group {
    constructor(...whitelisted) {
        super();
        this.whitelisted = whitelisted;
    }
    isHostAllowed(hostname) {
        return this.whitelisted.some(equals(hostname));
    }
}

class BlacklistGroup extends Group {
    constructor(...blacklisted) {
        super();
        this.blacklisted = blacklisted;
    }
    isHostAllowed(hostname) {
        return !this.blacklisted.some(equals(hostname));
    }
}

class DefaultGroup extends WhitelistGroup {
    constructor() {
        super("google.com");
    }
}

Group.DEFAULT = new DefaultGroup();

class User {
    constructor(password, groups) {
        Object.assign(this, {
            passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
            groups
        });
    }
    isUserAllowed(hostname) {
        return !Array.isArray(this.groups) || this.groups.every(group => group.isHostAllowed(hostname));
    }
    verifyCredentials(password) {
        return crypto.createHash('sha256').update(password).digest('hex') === this.passwordHash;
    }
}

class AdminUser extends User {
    constructor() {
        super("karkar", null);
    }
    isUserAllowed(hostname) {
        return true;
    }
}

class DefaultUser extends User {
    constructor() {
        super(null, [Group.DEFAULT]);
    }
    verifyCredentials(username, password) {
        return true;
    }
}

User.users = {
    admin: new AdminUser()
};

function generateHttpResponse(response, status = "200 OK") {
    response = response.toString();
    return `HTTP/1.1 ${status}\r\n` +
        `Content-Length: ${response.length}\r\n` +
        `Content-Type: text/html\r\n` +
        `Connection: close\r\n` +
        response;
}

net.createServer(function (socket) {
    let request = "";
    socket.on("data", data => {
        //console.log(data.toString());
        request += data.toString();
        if (request.endsWith("\r\n\r\n")) {
            let [header, ...requestEnd] = request.split("\r\n");
            let [requestType, requestUrl, protocol] = header.split(" ");
            if (requestUrl.indexOf("://") === -1) requestUrl = "http://" + requestUrl;
            //console.log(`Connecting to ${requestUrl} via ${protocol}...`);
            //socket.write(generateHttpResponse(`Connecting to ${url} via ${protocol}...`));
            let parsed = url.parse(requestUrl);
            //console.log("[end] requestUrl=" + requestUrl);
            //console.log("[end] parsed=" + JSON.stringify(parsed));
            if (requestType === "CONNECT") {
                if (isHostAllowed(parsed.hostname)) {
                    let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {
                        socket.write("HTTP/1.1 200 Connection Established\r\nProxy-agent: Kar\r\n\r\n");
                        socket.pipe(connection,
                            //{end: false}
                            );
                        connection.pipe(socket,
                            //{end: false}
                            );
                    });
                    connection.on("error", handleProxyConnectionError(socket));
                } else {
                    socket.end("HTTP/1.1 403 Forbidden\r\nStatus: 403 Forbidden\r\nProxy-agent: Kar\r\nConnection: close\r\n\r\n");
                }
            } else {
                if (isHostAllowed(parsed.hostname)) {
                    let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {
                        connection.write(`${requestType} ${parsed.path} ${protocol}\r\n${requestEnd.join("\r\n")}`);
                        connection.pipe(socket);
                    });
                    connection.on("error", handleProxyConnectionError(socket));
                } else {
                    socket.end(generateHttpResponse("Forbidden", "403 Forbidden"));
                }
            }
        }
        //console.log(encodeURI(request));
    });
    socket.on("error", handleClientConnectionError(socket));
}).listen(8080);

function handleClientConnectionError(socket) {
    return function(error) {
        console.log(error);
    }
}

function handleProxyConnectionError(clientSocket) {
    return function(error) {
        clientSocket.end(generateHttpResponse(`<b style="color: red;">Error occurred: </b><br>${error.toString()}`));
        //clientSocket.destroy();
        console.log("[handleProxyConnectionError] " + error);
    }
}

const equals = val => val2 => val == val2;

function isHostAllowed(hostname) {
    //console.log("[is host allowed] '" + hostname + "' (" + (hostname != "info.cern.ch") + ")");
    //return hostname != "info.cern.ch";
    try {
        let bans = fs.readFileSync("./prohibited");
        return !bans.toString().split(";").some(equals(hostname));
    } catch (e) {
        console.log(e); return true;
    }
}
