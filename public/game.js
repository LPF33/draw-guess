const socket = io.connect();

let playerData;
let drawPlayer;
const emojiElem = document.querySelector(".my-emoji");
const emojiOtherPlayers = document.querySelector("#other-players");

socket.emit("player-online");

socket.on("get-emoji", (data) => {
    emojiElem.innerHTML = data.emoji;
    emojiElem.id = data.socketId;
    emojiElem.innerHTML += `<span>${data.points}</span>`;
    playerData = data;
    if (data.drawPlayer) {
        emojiElem.classList.add("drawPlayer");
        drawPlayer = data.playerNumber;
    }
});

socket.on("new-player", (data) => {
    const newPlayerElem = `<div id="${data.socketId}" class="players">${data.emoji}<span>${data.points}</span></div>`;
    emojiOtherPlayers.innerHTML += newPlayerElem;
    socket.emit("send-emoji-to-new-player", {
        newPlayer: data.socketId,
        playerData,
    });
});

socket.on("send-my-emoji", (data) => {
    const newPlayerElem = data.drawPlayer
        ? `<div id="${data.socketId}" class="players drawPlayer">${data.emoji}<span>${data.points}</span></div>`
        : `<div id="${data.socketId}" class="players">${data.emoji}<span>${data.points}</span></div>`;
    emojiOtherPlayers.innerHTML += newPlayerElem;
    if (data.drawPlayer) {
        drawPlayer = data.playerNumber;
    }
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
    if (guessedValue && drawPlayer !== playerData.playerNumber) {
        socket.emit("guess", { guessedValue, playerData });
        inputField.value = "";
    }
});

socket.on("guess", (data) => {
    const userJson = JSON.stringify(data.playerData);
    const chatNode = `<p>${
        data.playerData.emoji
    } guessed: <strong>${data.guessedValue.toUpperCase()}</strong> <button class="correct" datauser=${userJson} dataword="${
        data.guessedValue
    }">👍🏻</button></p>`;
    chatField.innerHTML += chatNode;
    chatField.scrollTop = chatField.scrollHeight;
});

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let startPointX;
let startPointY;

const drawstart = (e) => {
    if (drawPlayer === playerData.playerNumber) {
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
        playerData.playerNumber === drawPlayer
    ) {
        const parsedUser = JSON.parse(e.target.attributes.datauser.value);
        const guessedWord = e.target.attributes.dataword.value;
        socket.emit("correct-answer", {
            parsedUser,
            guessedWord,
        });
    }
});

const correctWord = document.querySelector("#correct-word");

socket.on("correct-answer", (data) => {
    const winnerEmoji = document.getElementById(data.parsedUser.socketId);
    winnerEmoji.classList.add("winner");
    const chatNode = `<p>Correct answer: <strong>${data.guessedWord.toUpperCase()}</strong> </br> Winner: ${
        data.parsedUser.emoji
    }</p>`;
    chatField.innerHTML += chatNode;
    chatField.scrollTop = chatField.scrollHeight;
    const pointElement = document.querySelector(
        "div#" + data.parsedUser.socketId + " > span"
    );
    if (data.parsedUser.playerNumber === playerData.playerNumber) {
        playerData.points += 1;
    }
    console.log(playerData);
    console.log(data.parsedUser);
    pointElement.innerHTML = data.parsedUser.points + 1;
});

const clearFunction = () => {
    const winnerEmoji = document.querySelector(".winner");
    if (winnerEmoji) {
        winnerEmoji.classList.remove("winner");
    }
};

socket.on("next-player", (data) => {
    setTimeout(clearFunction, 1000);

    const correctButtons = document.querySelectorAll("button.correct");
    correctButtons.forEach((item) => {
        item.disabled = true;
    });

    const currentDrawPlayer = document.querySelector(".drawPlayer");
    if (currentDrawPlayer) {
        currentDrawPlayer.classList.remove("drawPlayer");
    }

    drawPlayer = data;
    playerData.drawPlayer = false;
    if (data === playerData.playerNumber) {
        playerData.drawPlayer = true;
        socket.emit("i-am-next-player", playerData);
    }
});

socket.on("i-am-next-player", (data) => {
    const nextPlayer = document.getElementById(data.socketId);
    nextPlayer.classList.add("drawPlayer");
    ctx.clearRect(0, 0, 600, 400);
});
