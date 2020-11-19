const socket = io.connect();

let playerData;
let startingPlayer;
const emojiElem = document.querySelector(".my-emoji");
const emojiOtherPlayers = document.querySelector("#other-players");

socket.emit("player-online");

socket.on("get-emoji", (data) => {
    emojiElem.innerHTML = data.emoji;
    emojiElem.id = data.socketId;
    playerData = data;
    if (data.startPlayer) {
        emojiElem.classList.add("startPlayer");
        startingPlayer = data.playerNumber;
    }
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
    const newPlayerElem = data.startPlayer
        ? `<div id="${data.socketId}" class="players startPlayer">${data.emoji}</div>`
        : `<div id="${data.socketId}" class="players">${data.emoji}</div>`;
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
    console.log(startingPlayer, playerData.playerNumber);
    if (guessedValue && startingPlayer !== playerData.playerNumber) {
        socket.emit("guess", { guessedValue, playerData });
    }
});

socket.on("guess", (data) => {
    const chatNode = `<p>${
        data.playerData.emoji
    } guessed: <strong>${data.guessedValue.toUpperCase()}</strong> <button class="correct" datauser="${
        data.playerData.socketId
    }" dataword="${data.guessedValue}" dataemoji="${
        data.playerData.emoji
    }">👍🏻</button></p>`;
    chatField.innerHTML += chatNode;
    chatField.scrollTop = chatField.scrollHeight;
});

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let startPointX;
let startPointY;

const drawstart = (e) => {
    if (startingPlayer === playerData.playerNumber) {
        startPointX = e.offsetX;
        startPointY = e.offsetY;
        canvas.addEventListener("mousemove", draw);
    }
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

chatField.addEventListener("click", (e) => {
    if (
        e.target.attributes.hasOwnProperty("datauser") &&
        e.target.attributes.hasOwnProperty("dataword") &&
        playerData.playerNumber === startingPlayer
    ) {
        const playerGuessedRight = e.target.attributes.datauser.value;
        const playerEmoji = e.target.attributes.dataemoji.value;
        const guessedWord = e.target.attributes.dataword.value;
        socket.emit("correct-answer", {
            playerGuessedRight,
            guessedWord,
            playerEmoji,
        });
    }
});

const correctWord = document.querySelector("#correct-word");

socket.on("correct-answer", (data) => {
    const winnerEmoji = document.querySelector(`#${data.playerGuessedRight}`);
    winnerEmoji.classList.add("winner");
    const chatNode = `<p>Correct answer: <strong>${data.guessedWord.toUpperCase()}</strong> </br> Winner: ${
        data.playerEmoji
    }</p>`;
    chatField.innerHTML += chatNode;
    chatField.scrollTop = chatField.scrollHeight;
});

const clearFunction = (data) => {
    const winnerEmoji = document.querySelector(`#${data.playerGuessedRight}`);
    winnerEmoji.classList.remove("winner");
    if (startingPlayer === playerData.playerNumber) {
        socket.emit("next-player");
    }
};

socket.on("next-round", (data) => {
    setTimeout(() => clearFunction(data), 1000);
});

socket.on("next-player", (data) => {
    console.log(data);
    const currentStartPlayer = document.querySelector(".startPlayer");
    currentStartPlayer.classList.remove("startPlayer");
    startingPlayer = data;
    if (startingPlayer === playerData.playerNumber) {
        socket.emit("i-am-next-player", playerData);
    }
});

socket.on("i-am-next-player", (data) => {
    const nextPlayer = document.querySelector(`#${data.socketId}`);
    nextPlayer.classList.add("startPlayer");
    ctx.clearRect(0, 0, 600, 400);
});
