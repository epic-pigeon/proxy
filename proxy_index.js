const http = require("http");
const net = require("net");
const url = require("url");
const process = require("process");


function generateHttpResponse(response, status = "200 OK") {
    response = response.toString();
    return `HTTP/1.1 ${status}\n` +
        `Content-Length: ${response.length}\n` +
        `Content-Type: text/html\n` +
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
        console.log("-------------------------------------------------\nRequest:\n" + request);
        let [header, ...requestEnd] = request.split("\r\n");
        let [requestType, requestUrl, protocol] = header.split(" ");
        if (requestUrl.indexOf("://") === -1) requestUrl = "http://" + requestUrl;
        console.log(`Connecting to ${requestUrl} via ${protocol}...`);
        //socket.write(generateHttpResponse(`Connecting to ${url} via ${protocol}...`));
        let parsed = url.parse(requestUrl);
        console.log("[end] requestUrl=" + requestUrl);
        console.log("[end] parsed=" + JSON.stringify(parsed));
        if (requestType === "CONNECT") {
            if (isHostAllowed(parsed.hostname)) {
                let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {});
                connection.on("error", console.log);
                socket.write("HTTP/1.1 200 Connection Established\r\nProxy-agent: Kar\r\n\r\n");
                socket.pipe(connection, {end: false});
                connection.pipe(socket, {end: false});
            } else {
                socket.end("HTTP/1.1 403 Forbidden\r\nProxy-agent: Kar\r\n\r\n");
            }
        } else {
            if (isHostAllowed(parsed.hostname)) {
                let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {});
                connection.on("error", console.log);
                connection.write(`${requestType} ${parsed.path} ${protocol}\r\n${requestEnd.join("\r\n")}`);
                connection.pipe(socket);
            } else {
                socket.write(generateHttpResponse("Forbidden", "403 Forbidden"));
            }
        }
    }
}).listen(8080);

function isHostAllowed(hostname) {
    console.log("[is host allowed] '" + hostname + "' (" + (hostname != "info.cern.ch") + ")");
    return hostname != "info.cern.ch";
}
