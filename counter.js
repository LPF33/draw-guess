module.exports = () => {
    let counter = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let players = [];
    let drawPlayer = null;
    let winner = "";
    return {
        getCounter(socket) {
            if (!counter.length) {
                socket.disconnect();
                return [null, false];
            } else {
                const num = counter.shift();
                players.push(num);
                if (
                    players.length === 1 ||
                    (typeof drawPlayer === "object" && !drawPlayer)
                ) {
                    drawPlayer = num;
                    return [num, true];
                }
                return [num, false];
            }
        },
        socketLeft(num, io) {
            players = players.filter((item) => item !== num);
            counter.unshift(num);
            if (num === drawPlayer) {
                drawPlayer = players[0];
                io.emit("next-player", drawPlayer);
            }
        },
        nextPlayer() {
            const num = players.pop();
            players.unshift(num);
            drawPlayer = num;
            return num;
        },
        setWinner(data) {
            winner = data;
        },
        getWinner(data) {
            return winner;
        },
    };
};
