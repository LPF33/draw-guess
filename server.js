const counter = require("./counter")();
const express = require("express");
const socket = require("socket.io");

// prettier-ignore
const emojis = ['🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐶', '🐱', '🐭', '🐹', '🐰', '🐷', '🐸', '🐵', '🐙', '🐳', '🐢', '🐿', '🐔'];

const port = process.env.PORT || 8080;

const app = express();
//const server = app.listen(port);

const server = require("http").Server(app);
server.listen(port, () => console.log("Server running on port ", port));

const io = socket(server);

app.use(express.static("public"));

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/views/index.html");
});

io.on("connection", (socket) => {
    console.log(`socket with the id ${socket.id} is now connected`);
});

app.get("/blank", (request, response) => {
    response.sendFile(__dirname + "/views/blank.html");
});
