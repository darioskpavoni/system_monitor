/* SERVER SIDE */

import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { Server, Socket } from "socket.io";
import { ISystemData, ISystemDataFields } from "./ISystemData";
import { DBDriver } from "./DBDriver";
import { EUserAuthStatus, EUserSignupStatus, IPID, IUserCredentials } from "./IConfig";
import { SessionToken } from "./SessionToken";

dotenv.config()

const app = express();
const server = http.createServer(app);
// const staticPath = path.join(__dirname, "..", "client", "public");
const staticPath = path.join(__dirname, "..", "dist"); // this is good for development. serve the dist .html file transpiled by parcel

let nodesData: ISystemData = {};
const pendingPIDs: IPID[] = [];

/* Creating a socket.io server instance */
const io = new Server(server, {
    cors: { origin: "*" },
});

app.use(cors())
app.use(express.json());
app.use(express.static(staticPath));

const db = DBDriver.getInstance();

app.get('/', function (req, res) {
    res.sendFile(path.join(staticPath, "index.html"));
});

app.get("/system-data", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(nodesData)
})

app.post("/login", async (req, res) => {
    // handle user login
    const credentials = req.body as IUserCredentials;

    let result!: EUserAuthStatus;
    await db.loginUser(credentials).then(status => result = status);
    console.log(`[AUTH] ${result}`);

    // send response to client
    switch (result) {
        case EUserAuthStatus.SUCCESSFUL:
            res.setHeader("Content-Type", "application/json")
            res.status(200).send({ "message": EUserAuthStatus.SUCCESSFUL, "sessionToken": SessionToken.generate(12) });
            break;
        case EUserAuthStatus.WRONG_CREDENTIALS:
            res.setHeader("Content-Type", "application/json")
            res.status(401).send({ "message": EUserAuthStatus.WRONG_CREDENTIALS });
            break;
        case EUserAuthStatus.NO_SUCH_USER:
            res.setHeader("Content-Type", "application/json")
            res.status(401).send({ "message": EUserAuthStatus.NO_SUCH_USER });
            break;

        default:
            break;
    }
})

app.post("/signup", async (req, res) => {
    // handle user signup
    const credentials = req.body as IUserCredentials;
    console.log(credentials)

    let result!: EUserSignupStatus;
    await db.registerUser(credentials).then(status => result = status);
    console.log(`[SIGNUP] ${result}`);

    // send response to client
    switch (result) {
        case EUserSignupStatus.SUCCESSFUL:
            res.setHeader("Content-Type", "application/json")
            res.status(200).send({ "message": EUserSignupStatus.SUCCESSFUL, "sessionToken": SessionToken.generate(12) });
            break;
        case EUserSignupStatus.USER_ALREADY_EXISTS:
            res.setHeader("Content-Type", "application/json")
            res.send({ "message": EUserSignupStatus.USER_ALREADY_EXISTS });
            break;

        default:
            break;
    }
})

app.get("/PID/list", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({ pendingPIDs });
})

app.post("/PID/remove", (req, res) => {
    console.log(`[Server] Removing PID from local array`);

    const pidObj = req.body as IPID;

    for (let i = 0; i < pendingPIDs.length; i++) {
        if (pendingPIDs[i].socketId === pidObj.socketId && pendingPIDs[i].pid === pidObj.pid) {
            pendingPIDs.splice(i);
        }
    }

    res.sendStatus(200);
})


io.on("connection", (socket) => {
    console.log(`[Server] User connected ${socket.id}`);
    socket.on("hello", (data) => {
        console.log(`[${socket.id}] ${data}`);
    })

    socket.on("system-data", (data: ISystemDataFields) => {
        // console.log(`[Server] Data coming from ${socket.id}`);
        /* console.log(`[${data[socket.id]?.hostname}] Partitions: ${data[socket.id]?.partitions?.length ? data[socket.id]?.partitions?.length : "uninitialized"}`);
        nodeData[socket.id] = data[socket.id]; */

        const ipAddress = socket.conn.remoteAddress;
        const socketId = socket.id;
        updateNodesData(data, ipAddress, socketId);
    })

    socket.on("disconnect", () => {
        console.log(`[Server] User ${socket.id} disconnected`);

        /* if (nodeData[socket.id]) {
            delete nodeData[socket.id];
        } */
    })

    app.post("/PID/kill", async (req, res) => {
        const pidObj: IPID = req.body;

        // add current pidObj to list of pending pids
        let match: boolean = false;
        for (const pid of pendingPIDs) {
            if (pid.socketId === pidObj.socketId && pid.pid === pidObj.pid) {
                match = true;
            }
        }
        if (!match) {
            pendingPIDs.push(pidObj);
        }


        // request has arrived, send ok status to client
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(pidObj);

        // socketId and PID to kill from the frontend
        const socketId = pidObj.socketId!;
        console.log(`[Server] Termination request for PID: ${pidObj.pid}, user: ${socketId}`);

        // send killPID event to a specific socket ID
        io.to(socketId).emit("killPID", pidObj.pid);
    })

    socket.on("killPID-result", (data: IPID) => {
        console.log(`[Server] Received PID ${data.pid} termination status: ${data.status}`);

        // expand response object by adding socket id
        const response: IPID = { ...data, socketId: socket.id };

        // update status of PID kill action
        for (const pid of pendingPIDs) {
            if (pid.socketId === response.socketId && pid.pid === response.pid) {
                pid.status = response.status;
            }
        }
    })

});

server.listen(3001, "0.0.0.0", () => {
    console.log("[Server] Listening to port: 3001");
});

const updateNodesData = (data: ISystemDataFields, remoteAddress: string, socketId: string) => {
    const id = `${remoteAddress}_${data.hostname}`;
    nodesData[id] = data;
    nodesData[id].socketId = socketId;
    // console.log(nodesData);
}