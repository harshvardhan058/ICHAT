const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const formatMessage = require(".messages");
const { userJoin , getCurrentUser , userLeave , getRoomUsers} = require(".Users");


const app = express();
const server = http.createServer(app);
const io = new Server(server);



// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botname = "I-Chat Bot";

// Run when client connects 
io.on("connection", socket => {   
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);    

    // Welcome current user 
    socket.emit("message", formatMessage(botname ,  "Welcome to I-Chat!"));

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit("message", formatMessage(botname , ` ${user.username} has joined the chat`));

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

    });

    // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

   // Runs when client disconnects
   socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if(user) {
    io.to(user.room).emit("message", formatMessage(botname , ` ${user.username} has left the chat`));

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
});

});

const PORT = 4000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));