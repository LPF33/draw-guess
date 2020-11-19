const express = require("express");
const socket = require("socket.io");
const cryptoRandomString = require("crypto-random-string");

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

    socket.on("player-online", () => {
        const randomNum = Math.floor(Math.random() * 20);
        const emoji = emojis[randomNum];
        const playerData = { emoji, socketId: socket.id };
        socket.emit("get-emoji", playerData);
        socket.broadcast.emit("new-player", playerData);
        //error with io.sockets.sockets[socket.id].broadcast.emit("new-player", playerData);
    });

    socket.on("send-emoji-to-new-player", (data) => {
        io.to(data.newPlayer).emit("send-my-emoji", data.playerData);
    });

    socket.on("disconnect", () => {
        io.emit("player-left", { socketId: socket.id });
    });

    socket.on("guess", (data) => {
        io.sockets.emit("guess", data);
    });

    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);
    });
});
