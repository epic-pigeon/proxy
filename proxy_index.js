const http = require("http");
const net = require("net");
const process = require("process");

net.createServer(function (socket) {
    let request = "";
    socket.on("data", data => request += data);
    socket.on("end", () => {
        let header = request.split("\n")[0];
        let [requestType, url, protocol] = header.split(" ");
        if (requestType === "CONNECT") {
            console.log(`Connecting to ${url} via ${protocol}...`);
            socket.write(`Connecting to ${url} via ${protocol}...`);
            socket.end();
        } else {
            socket.write("gtfo");
            socket.end();
        }
    });
}).listen(8080);
