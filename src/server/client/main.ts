import io from "socket.io-client";

const port = 3001;
const server = `http://127.0.0.1:${port}`;

const socket = io(server);

socket.on("connect", () => {
    console.log("CLIENT: Connected to server ");
})