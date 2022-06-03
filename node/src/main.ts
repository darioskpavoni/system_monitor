/* CLIENT SIDE */

import io from "socket.io-client";
import dotenv from 'dotenv'
import { System } from "./System";
import { SystemData } from "./SystemData";
import { Logger } from "./Logger";
import { Utils } from "./Utils";
import { IPID } from "./IConfig";

// todo: read config data from file
const port = 3001;
const serverIP = `127.0.0.1`;
const server = `http://${serverIP}:${port}`;
const socket = io(server);

export let data: System;

const SEND_DATA_TIMER = 2000;
export const TIMER = 2000;
let systemDataTimer: NodeJS.Timer;

dotenv.config()

socket.on("connect", () => {
    console.log(`[CLIENT] Connected to hub at ${server}`);
    start();
});

socket.on("killPID", async (pid: string) => {
    console.log(`[CLIENT] Termination request for PID: ${pid}`);

    const res = await Utils.killPID(pid);
    const obj: IPID = {
        pid: pid,
        status: res
    }
    socket.emit("killPID-result", obj);
})

function start() {
    data = System.getInstance();
    systemDataTimer = setTimeout(function repeat() {
        // wait for partition data to initialize before sending data
        if (!data.initializedAllData) {
            Logger.log(`[DISK] Initializing...`);
            setTimeout(repeat, SEND_DATA_TIMER);
            return;
        }

        socket.emit("system-data", SystemData.generateObject())
        setTimeout(repeat, SEND_DATA_TIMER);
    }, SEND_DATA_TIMER);
}