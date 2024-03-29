const express = require("express");
const socket = require("socket.io");
const counter = require("./counter")();

// prettier-ignore
const emojis = ['🐸','🐱','🦊', '🐻', '🐼', '🐨', '🐙', '🦁','🐹', '🐰'];

//Setup for the Server and binding to Socket.io
const port = process.env.PORT || 8080;

//just assign the express-server to a variable and pass it to the socket.io instance
const app = express();
const server = app.listen(port, () =>
    console.log("Server running on port ", port)
);

// alternative way how to setup a http-server
//const server = require("http").Server(app);
//server.listen(port, () => console.log("Server running on port ", port));

const io = socket(server);

app.use(express.static("public"));

//Express routes
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/views/index.html");
});

app.get("/noentry", (request, response) => {
    response.sendFile(__dirname + "/views/noentry.html");
});

app.get("/winner", (request, response) => {
    response.sendFile(__dirname + "/views/winner.html");
});

app.get("/getwinner", (request, response) => {
    const winner = counter.getWinner();
    response.json(winner);
});

//socket.io event handling
io.on("connection", (socket) => {
    const [playerNumber, drawPlayer] = counter.getCounter(socket);

    console.log(`socket with the id ${socket.id} is now connected`);

    socket.on("player-online", () => {
        const emoji = emojis[playerNumber];

        const playerData = {
            emoji,
            socketId: socket.id,
            playerNumber,
            drawPlayer,
            points: 0,
        };

        //sending to the client
        socket.emit("get-emoji", playerData);

        //broadcasting
        //sending to all clients connected to the server except the sender
        socket.broadcast.emit("new-player", playerData);
    });

    socket.on("send-emoji-to-new-player", (data) => {
        //send to a specific client
        io.to(data.newPlayer).emit("send-my-emoji", data.playerData);
    });

    socket.on("disconnect", () => {
        //sending to all connected clients
        io.emit("player-left", playerNumber);

        counter.socketLeft(playerNumber, io);
    });

    socket.on("guess", (data) => {
        //sending to all connected clients
        io.sockets.emit("guess", data);
    });

    socket.on("draw", (data) => {
        //sending to all clients connected to the server except the sender
        socket.broadcast.emit("draw", data);
    });

    socket.on("correct-answer", (data) => {
        //sending to all connected clients
        io.sockets.emit("correct-answer", data);

        const nextPlayer = counter.nextPlayer();
        //sending to all connected clients
        io.sockets.emit("next-player", nextPlayer);
    });

    socket.on("i-am-next-player", (data) => {
        //sending to all connected clients
        io.sockets.emit("i-am-next-player", data);
    });

    socket.on("i-am-winner", (data) => {
        counter.setWinner(data);

        //sending to all connected clients
        io.emit("winner-found");
    });
});
