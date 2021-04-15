var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var MongoClient = require("mongodb").MongoClient;

const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

MongoClient.connect(
  "mongodb://47.103.217.181:27017",
  { useUnifiedTopology: true },
  function (err, client) {
    chat = client.db("chat").collection("chat");

    io.on("connection", function (socket) {
      socket.on("userId", async (userId) => {
        const hasRoom = await chat.findOne({
          [userId[0]]: 1,
          [userId[1]]: 1,
        });
        let roomId = "";
        let detail = [];
        if (!hasRoom) {
          roomId = uuid();
          await chat.insertOne({
            [userId[0]]: 1,
            [userId[1]]: 1,
            room: roomId,
            detail: [],
          });
        } else {
          roomId = hasRoom.room;
          detail = hasRoom.detail;
        }
        socket.join(roomId);
        io.to(roomId).emit("allList", {
          detail,
          roomId: roomId,
        });
      });
      socket.on("addItem", async (item) => {
        const old = await chat.findOne({
          room: item.roomId,
        });
        const newItem = {
          info: item.info,
          userId: item.userId,
          time: new Date().getTime(),
        };
        await chat.update(
          { room: item.roomId },
          {
            ...old,
            room: item.roomId,
            detail: [...old.detail, newItem],
          }
        );
        io.to(item.roomId).emit("addItem", newItem);
      });

      socket.on("getList", async (item) => {
        const list = await chat
          .find({
            [item[0]]: 1,
          })
          .toArray();
        socket.join(item[0]);
        io.to(item[0]).emit("postList", list);
      });
    });

    http.listen(3333, function () {
      console.log("listening on *:3333");
    });
  }
);
