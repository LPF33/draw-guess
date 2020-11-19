const socket = io.connect();

let playerData;
const emojiElem = document.querySelector("#my-emoji");
const emojiOtherPlayers = document.querySelector("#other-players");

socket.emit("player-online");

socket.on("get-emoji", (data) => {
    emojiElem.innerHTML = data.emoji;
    playerData = data;
});

socket.on("new-player", (data) => {
    const newPlayerElem = `<div id="${data.socketId}" class="players">${data.emoji}</div>`;
    emojiOtherPlayers.innerHTML += newPlayerElem;
    socket.emit("send-emoji-to-new-player", {
        newPlayer: data.socketId,
        playerData,
    });
});

socket.on("send-my-emoji", (data) => {
    const newPlayerElem = `<div id="${data.socketId}" class="players">${data.emoji}</div>`;
    emojiOtherPlayers.innerHTML += newPlayerElem;
});

socket.on("player-left", (data) => {
    const playerNode = document.getElementById(`${data.socketId}`);
    if (playerNode) {
        emojiOtherPlayers.removeChild(playerNode);
    }
});

const inputField = document.getElementById("input-field");
const guessButton = document.getElementById("guess-button");
const chatField = document.getElementById("chat");

guessButton.addEventListener("click", () => {
    const guessedValue = inputField.value;

    if (guessedValue) {
        socket.emit("guess", { guessedValue, playerData });
    }
});

socket.on("guess", (data) => {
    console.log(data);
    const chatNode = `<p>${
        data.playerData.emoji
    } guessed: <strong>${data.guessedValue.toUpperCase()}</strong> <button class="correct">👍🏻</button></p>`;
    chatField.innerHTML += chatNode;
    chatField.scrollTop = chatField.scrollHeight;
});

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let startPointX;
let startPointY;

const drawstart = (e) => {
    startPointX = e.offsetX;
    startPointY = e.offsetY;
    canvas.addEventListener("mousemove", draw);
};

const draw = (e) => {
    ctx.beginPath();
    ctx.moveTo(startPointX, startPointY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.closePath();
    ctx.stroke();
    socket.emit("draw", {
        start: { x: startPointX, y: startPointY },
        end: { x: e.offsetX, y: e.offsetY },
    });
    startPointX = e.offsetX;
    startPointY = e.offsetY;
};

const drawend = () => {
    canvas.removeEventListener("mousemove", draw);
};

canvas.addEventListener("mousedown", drawstart);
canvas.addEventListener("mouseup", drawend);

socket.on("draw", (data) => {
    ctx.beginPath();
    ctx.moveTo(data.start.x, data.start.y);
    ctx.lineTo(data.end.x, data.end.y);
    ctx.closePath();
    ctx.stroke();
});
