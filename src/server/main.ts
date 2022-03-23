/* SERVER SIDE */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";

const app = express();
const server = http.createServer(app);

/* Creating a socket.io server instance */
const io = new Server(server, {
    cors: { origin: "*" },
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});


io.on('connection', (socket) => {
    console.log(`SERVER: User connected ${socket.id}`);
})


server.listen(3001, "0.0.0.0", () => {
    console.log("Listening to port: 3001");
});