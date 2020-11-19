const socket = io.connect();
const [, , roomId] = location.pathname.split("/");

socket.emit("connect to gameroom", roomId);
