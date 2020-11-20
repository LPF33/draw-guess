# Socket.io

## Cheatsheet (server-side)

### sending to the client:

-   socket.emit('hello', 'can you hear me?', 1, 2, 'abc');

### sending to all clients except sender:

-   socket.broadcast.emit('broadcast', 'hello friends!');

### sending to individual socketid (private message):

-   io.to(socketId).emit('hey', 'I just met you');

### sending to all connected clients:

-   io.emit('an event sent to all connected clients');
-   io.sockets.emit('an event sent to all connected clients');

### sending to a specific socketId:

-   socket.broadcast.to(socketId).emit('message', 'for your eyes only');
-   io.sockets.sockets.get(socketId).emit("message", "for your eyes only"); (v3.0.0)

### Send to all sockets except for a specific one:

-   io.sockets.sockets.get(data.socket).broadcast.emit("message", "we exclude one socket"); (v3.0.0)

## Rooms

### join to subscribe the socket to a given channel (server-side):

-   socket.join('some room');

### sending to all clients in 'game' room except sender:

-   socket.to('game').emit('nice game', "let's play a game");
-   socket.broadcast.to('game').emit('message', 'nice game');

### sending to all clients in 'game1' and/or in 'game2' room, except sender:

-   socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");

### sending to all clients in 'game' room, including sender:

-   io.to('some room').emit('some event'):
-   io.in('game').emit('big-announcement', 'the game will start soon');

### leave to unsubscribe the socket to a given channel (server-side):

-   socket.leave('some room');
