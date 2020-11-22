(() => {
    const socket = io.connect();

    //game state
    let playerData;
    let drawPlayer;

    const emojiElem = document.querySelector(".my-emoji");
    const emojiOtherPlayers = document.querySelector("#other-players");

    //just grabbing the audio element and play it when someone guesses right
    const audioElement = document.querySelector("audio");

    //emit event, that a new player is online
    socket.emit("player-online");

    // get your own player data with emoji, change innerHTML and check if you are the startplayer
    socket.on("get-emoji", (data) => {
        emojiElem.innerHTML = data.emoji;
        emojiElem.id = `player${data.playerNumber}`;
        emojiElem.innerHTML += `<span>${data.points}</span>`;
        playerData = data;

        if (data.drawPlayer) {
            emojiElem.classList.add("drawPlayer");
            drawPlayer = data.playerNumber;
        }
    });

    //new player enters the room, send your data to this new socket and append in the HTML document the new player
    socket.on("new-player", (data) => {
        const newPlayerElem = `<div id="player${data.playerNumber}" class="players">${data.emoji}<span>${data.points}</span></div>`;
        emojiOtherPlayers.innerHTML += newPlayerElem;

        socket.emit("send-emoji-to-new-player", {
            newPlayer: data.socketId,
            playerData,
        });
    });

    //get the emojis of the other players, how have already been in the room
    socket.on("send-my-emoji", (data) => {
        const newPlayerElem = data.drawPlayer
            ? `<div id="player${data.playerNumber}" class="players drawPlayer">${data.emoji}<span>${data.points}</span></div>`
            : `<div id="player${data.playerNumber}" class="players">${data.emoji}<span>${data.points}</span></div>`;

        emojiOtherPlayers.innerHTML += newPlayerElem;

        if (data.drawPlayer) {
            drawPlayer = data.playerNumber;
        }
    });

    //if a player leaves the room, delete the socket from dem DOM
    socket.on("player-left", (data) => {
        const playerNode = document.getElementById(`player${data}`);
        if (playerNode) {
            emojiOtherPlayers.removeChild(playerNode);
        }
    });

    //handling of the input field and guess button
    const inputField = document.getElementById("input-field");
    const guessButton = document.getElementById("guess-button");
    const chatField = document.getElementById("chat");

    const sendGuess = () => {
        const guessedValue = inputField.value;
        if (guessedValue && drawPlayer !== playerData.playerNumber) {
            socket.emit("guess", { guessedValue, playerData });
            inputField.value = "";
        }
    };

    guessButton.addEventListener("click", () => {
        sendGuess();
    });

    inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            sendGuess();
        }
    });

    //when a guess is emitted, append the new guess to the Chat DOM element
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

    //handle the canvas drawing , copied from the petition project
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

        //send the x,y values to the other sockets
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

    //event listener for getting the x,y values to draw it on the canvas
    socket.on("draw", (data) => {
        ctx.beginPath();
        ctx.moveTo(data.start.x, data.start.y);
        ctx.lineTo(data.end.x, data.end.y);
        ctx.closePath();
        ctx.stroke();
    });

    //event listener for the "thumbs-up"-buttons, when the guess is correct
    chatField.addEventListener("click", (e) => {
        if (
            e.target.attributes.hasOwnProperty("datauser") &&
            e.target.attributes.hasOwnProperty("dataword") &&
            playerData.playerNumber === drawPlayer
        ) {
            const parsedUser = JSON.parse(e.target.attributes.datauser.value);
            const guessedWord = e.target.attributes.dataword.value;

            audioElement.play();

            socket.emit("correct-answer", {
                parsedUser,
                guessedWord,
            });
        }
    });

    //event for showing the correct guess and the player, who guessed right
    const correctWord = document.querySelector("#correct-word");

    socket.on("correct-answer", (data) => {
        //play the audio "applause"
        audioElement.play();

        //show the winner emoji, green background
        const winnerEmoji = document.getElementById(
            `player${data.parsedUser.playerNumber}`
        );
        winnerEmoji.classList.add("winner");

        //show in the chat the correct answer with winner emoji
        const chatNode = `<p>Correct answer: <strong>${data.guessedWord.toUpperCase()}</strong> </br> Winner: ${
            data.parsedUser.emoji
        }</p>`;

        chatField.innerHTML += chatNode;
        chatField.scrollTop = chatField.scrollHeight;

        //the winner gets one point
        const pointElement = document.querySelector(
            "#player" + data.parsedUser.playerNumber + " > span"
        );

        if (data.parsedUser.playerNumber === playerData.playerNumber) {
            playerData.points += 1;
        }

        pointElement.innerHTML = data.parsedUser.points + 1;

        //check for game finish
        if (playerData.points === 1) {
            socket.emit("i-am-winner", playerData);
        }
    });

    //clear for next round, remove CSS winner-class
    const clearFunction = () => {
        const winnerEmoji = document.querySelector(".winner");
        if (winnerEmoji) {
            winnerEmoji.classList.remove("winner");
        }
    };

    //event for next round
    socket.on("next-player", (data) => {
        setTimeout(clearFunction, 2000);

        //disable the buttons of the last round
        const correctButtons = document.querySelectorAll("button.correct");
        correctButtons.forEach((item) => {
            item.disabled = true;
        });

        //change CSS: remove active-player class
        const currentDrawPlayer = document.querySelector(".drawPlayer");
        if (currentDrawPlayer) {
            currentDrawPlayer.classList.remove("drawPlayer");
        }

        drawPlayer = data;
        playerData.drawPlayer = false;

        //send data for the new player, so game state can be updated
        if (data === playerData.playerNumber) {
            playerData.drawPlayer = true;
            socket.emit("i-am-next-player", playerData);
        }
    });

    //add CSS "drawPlayer"-class to the next player
    socket.on("i-am-next-player", (data) => {
        const nextPlayer = document.getElementById(
            `player${data.playerNumber}`
        );
        nextPlayer.classList.add("drawPlayer");
        ctx.clearRect(0, 0, 600, 400);
    });

    //handling if someone enters the room, but already 10 people are in the room, redirect to the noentry-Route
    let disconnect = true;

    socket.on("disconnect", (reason) => {
        if (disconnect) {
            window.location = "/noentry";
        }
    });

    //winner found, go to winner-Route, (variable disconnect handles the error, that the disconnect event can be sended before or while redirecting to the winner-Route)
    socket.on("winner-found", () => {
        disconnect = false;
        window.location = "/winner";
    });
})();
