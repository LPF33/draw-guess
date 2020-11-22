const counter = require("./counter")();

// prettier-ignore
const emojis = ['🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐶', '🐱', '🐭', '🐹', '🐰', '🐷', '🐸', '🐵', '🐙', '🐳', '🐢', '🐿', '🐔'];

app.get("/blank", (request, response) => {
    response.sendFile(__dirname + "/views/blank.html");
});
