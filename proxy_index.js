const http = require("http");
const net = require("net");
const process = require("process");

net.createServer(function (socket) {
    let request = "";
    socket.on("data", data => {
        console.log(data.toString());
        request += data.toString();
        if (request.endsWith("\n\n")) {
            end(request);
        }
    });
    function end(request) {
        console.log("end");
        let header = request.split("\n")[0];
        let [requestType, url, protocol] = header.split(" ");
        if (requestType === "CONNECT") {
            console.log(`Connecting to ${url} via ${protocol}...`);
            socket.write(`Connecting to ${url} via ${protocol}...`);
            socket.end();
        } else {
            console.log(`Wrong request type ${requestType}`);
            socket.write("gtfo");
            socket.end();
        }
    }
}).listen(8080);
