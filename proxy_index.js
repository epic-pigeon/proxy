const http = require("http");
const net = require("net");
const url = require("url");
const process = require("process");


function generateHttpResponse(response) {
    response = response.toString();
    return `HTTP/1.1 200 OK\n` +
        `Date: ${new Date().toUTCString()}\n` +
        `Server: Apache/2.2.14 (Win32)\n` +
        `Last-Modified: ${new Date().toUTCString()}\n` +
        `Content-Length: ${response.length}\n` +
        `Content-Type: text/plain\n` +
        `Connection: Closed\n\n` +
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
    function end(request) {
        console.log("end");
        let [header, ...requestEnd] = request.split("\r\n");
        let [requestType, requestUrl, protocol] = header.split(" ");
        if (requestType === "CONNECT") {
            if (requestUrl.indexOf("://") === -1) requestUrl = "http://" + requestUrl;
            console.log(`Connecting to ${requestUrl} via ${protocol}...`);
            //socket.write(generateHttpResponse(`Connecting to ${url} via ${protocol}...`));
            let parsed = url.parse(requestUrl);
            console.log("[end] requestUrl=" + requestUrl);
            console.log("[end] parsed=" + JSON.stringify(parsed));
            let connection = net.createConnection(parseInt(parsed.port), parsed.hostname, () => {
            });
            connection.on("error", console.log);
            connection.write(`GET ${parsed.path} ${protocol}\r\n${requestEnd.join("\r\n")}`);
            connection.pipe(socket);
        } else {
            console.log(`Wrong request type ${requestType}`);
            socket.write(generateHttpResponse("gtfo"));
            socket.end();
        }
    }
}).listen(8080);
