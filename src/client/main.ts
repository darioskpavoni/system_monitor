/* CLIENT SIDE */

import io from "socket.io-client";
import { System } from "./System";
import { SystemData } from "./SystemData";

// todo: read config data from file
const port = 3001;
const serverIP = `127.0.0.1`
const server = `http://${serverIP}:${port}`;
const socket = io(server);

socket.on("connect", () => {
    console.log(`CLIENT: Connected to hub at ${server}`);
})

const getData = new SystemData;