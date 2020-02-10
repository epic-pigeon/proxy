// дима если ты это смотришь то всоси мой предсказательный пенис

const http = require("http");
const net = require("net");
const url = require("url");
const process = require("process");
const fs = require("fs");


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
            end(request);
        }
        //console.log(encodeURI(request));
    });
    socket.on("error", console.log);

    function end(request) {
        //console.log("-------------------------------------------------\nRequest:\n" + request);
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
                    socket.pipe(connection, {end: false});
                    connection.pipe(socket, {end: false});
                });
                connection.on("error", console.log);
            } else {
                socket.end("HTTP/1.1 403 Forbidden\r\nStatus: 403 Forbidden\r\nProxy-agent: Kar\r\nConnection: close\r\n\r\n");
            }
        } else {
            if (isHostAllowed(parsed.hostname)) {
                let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {
                    connection.write(`${requestType} ${parsed.path} ${protocol}\r\n${requestEnd.join("\r\n")}`);
                    connection.pipe(socket);
                });
                connection.on("error", console.log);
            } else {
                socket.end(generateHttpResponse("Forbidden", "403 Forbidden"));
            }
        }
    }
}).listen(8080);

function isHostAllowed(hostname) {
    //console.log("[is host allowed] '" + hostname + "' (" + (hostname != "info.cern.ch") + ")");
    //return hostname != "info.cern.ch";
    try {
        let bans = fs.readFileSync("./prohibited");
        return !bans.toString().split(";").some(val => val == hostname);
    } catch (e) {
        console.log(e); return true;
    }
}
