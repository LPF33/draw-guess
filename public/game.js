const socket = io.connect();

socket.on("disconnect", (reason) => {
    window.location = "/blank";
});
