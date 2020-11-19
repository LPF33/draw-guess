module.exports = () => {
    let counter = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let players = [];
    return {
        getCounter(socket) {
            if (!counter.length) {
                socket.disconnect();
            } else {
                const num = counter.shift();
                players.push(num);
                console.log(players.length);
                return [num, players.length === 1 ? true : false];
            }
        },
        socketLeft(num) {
            players = players.filter((item) => item !== num);
            counter.unshift(num);
        },
        nextPlayer() {
            const num = players.shift();
            players.push(num);
            return num;
        },
    };
};

// module.exports = () => {
//     let counter = 0;
//     return {
//         getCounter() {
//             return counter++;
//         },
//         socketLeft() {
//             if (counter >= 0) {
//                 counter -= 1;
//             }
//         },
//     };
// };
