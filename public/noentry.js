const socket = io.connect({ autoConnect: false });

socket.open();

let connected = true;

const goIntoRoom = () => {
    if (connected) {
        window.location = "/";
    }
};

socket.on("connect", () => {
    connected = true;
    setTimeout(goIntoRoom, 500);
});

socket.on("disconnect", (reason) => {
    connected = false;
    if (reason === "io server disconnect") {
        setTimeout(() => socket.connect(), 1000);
    }
});
