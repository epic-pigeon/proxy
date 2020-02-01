const http = require("http");
const net = require("net");
const process = require("process");

net.createServer(function (socket) {
    socket.pipe(process.stdout);
}).listen(8080, "127.0.0.1");
