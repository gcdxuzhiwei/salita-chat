var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var MongoClient = require("mongodb").MongoClient;

MongoClient.connect(
  "mongodb://47.103.217.181:27017",
  { useUnifiedTopology: true },
  function (err, client) {
    chat = client.db("chat").collection("chat");

    io.on("connection", function (socket) {
      socket.on("room", async (room) => {
        const hasRoom = await chat.findOne({
          room,
        });
        if (!hasRoom) {
          await chat.insertOne({
            room,
            detail: [],
          });
        } else {
          socket.emit("chat", hasRoom.detail);
        }
        socket.on("add", async (e) => {
          const findRoom = await chat.findOne({
            room,
          });
          await chat.update(
            { room },
            {
              room,
              detail: [e, ...findRoom.detail],
            }
          );
          io.emit("addChat", e);
        });
      });
    });

    http.listen(3333, function () {
      console.log("listening on *:3333");
    });
  }
);
