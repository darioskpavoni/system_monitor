/* SERVER SIDE */

import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { ISystemData, ISystemDataFields } from "./ISystemData";
import cors from "cors";

const app = express();
const server = http.createServer(app);
// const staticPath = path.join(__dirname, "..", "client", "public");
const staticPath = path.join(__dirname, "..", "dist"); // this is good for development. serve the dist .html file transpiled by parcel

let nodesData: ISystemData = {};

/* Creating a socket.io server instance */
const io = new Server(server, {
    cors: { origin: "*" },
});

app.use(cors())

app.use(express.static(staticPath));

app.get('/', function (req, res) {
    res.sendFile(path.join(staticPath, "index.html"));
});


app.get("/system-data", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(nodesData)
})


io.on("connection", (socket) => {
    console.log(`[SERVER] User connected ${socket.id}`);
    socket.on("hello", (data) => {
        console.log(data);
    })

    socket.on("system-data", (data: ISystemDataFields) => {
        // console.log(`[SERVER] Data coming from ${socket.id}`);
        /* console.log(`[${data[socket.id]?.hostname}] Partitions: ${data[socket.id]?.partitions?.length ? data[socket.id]?.partitions?.length : "uninitialized"}`);
        nodeData[socket.id] = data[socket.id]; */

        const ipAddress = socket.conn.remoteAddress;
        updateNodesData(data, ipAddress);
    })

    socket.on("disconnect", () => {
        console.log(`[SERVER] User ${socket.id} disconnected`);

        /* if (nodeData[socket.id]) {
            delete nodeData[socket.id];
        } */
    })

});

server.listen(3001, "0.0.0.0", () => {
    console.log("Listening to port: 3001");
});

const updateNodesData = (data: ISystemDataFields, remoteAddress: string) => {
    const id = `${remoteAddress}_${data.hostname}`;
    nodesData[id] = data;
    // console.log(nodesData);
}