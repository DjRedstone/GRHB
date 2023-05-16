const express = require("express");

const app = express();
const http = require("http").createServer(app);
const path = require("path");
const port = 3000;

const io = require("socket.io")(http);

const nodemailer = require("nodemailer");
const bp = require("body-parser");

const userMail = "baptistemay@hotmail.fr";
require("dotenv").config();
const password = process.env['EMAIL-PASSWORD'];
if (password == undefined) throw "Need Password";

require("dotenv").config();

app.use("/jquery", express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use(express.static("public"));
app.use(express.static("private"));

Array.prototype.remove = function() {
  // Helper function to remove a single element from a list if exists
  item = arguments[0]
  if (this.includes(item)) {
      index = this.indexOf(item)
      this.splice(index, 1)
   }
}

const pages = ["home", "introducing", "newsletters", "events", "themes", "contact"];
for (i = 0; i < pages.length; i++) {
    const page = pages[i];
    app.get(`/${page}/`, (req, res) => {
        res.sendFile(path.join(__dirname, `/public/${page}/`));
    });
}

app.get("/", (req, res) => {
    res.redirect("./home");
});

const fs = require("fs-extra");

// ----- FEED -----

var FEED;

function loadFeed() {
  const feed = `{
    "newsletters": [

    ],
    "events": [

    ],
    "themes": [
        
    ]
  }`;

  const path = "./public/feed.json";
  const existsFile = fs.existsSync(path);
  if (!existsFile) {
    console.log("Creating feed file...");
    fs.writeFile(path, feed, "utf8", () => {
        console.log("File created!");
    });
  }
  FEED = require(path);
}

function getAllPost(list) {
  res = []
  for (const data of list) {
    if (data.type == "folder") {
      res = [res, getAllPost(data.infos)].flat();
    } else if (data.type == "blog") {
      res.push(data);
    }
  }
  return res
}

function getAllPostFromFeed() {
  loadFeed();
  return [getAllPost(FEED.newsletters), getAllPost(FEED.events), getAllPost(FEED.themes)].flat();
}

app.get("/newsletters/*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/newsletters/index.html"));
});
app.get("/themes/*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/themes/index.html"));
});
app.get("/events/*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/events/index.html"));
});

app.get("/admin/", (req, res) => {
  res.sendFile(path.join(__dirname, "/private/index.html"));
});

function randomID() {
  return Math.random().toString(36).substr(2, 9);
}

console.log();

const tokens = [];

const adminCode = process.env["ADMIN-CODE"];
if (adminCode == undefined) throw "Need Password";
io.on("connection", (socket) => {
  let token;

  socket.on("get-wingets-data", () => {
    const allPost = getAllPostFromFeed();
    allPost.sort((a, b) => {
      return b.infos.date.localeCompare(a.infos.date);
    });
    res = []
    for (let i = 0; i < Math.min(allPost.length, 5); i++) {
      res.push(allPost[i]);
    }
    socket.emit("get-wingets-data", res);
  });

  socket.on("login", (pass) => {
    if (pass != adminCode) {
      socket.emit("login", "wrong password");
      return
    }
    token = randomID();
    tokens.push(token);
    socket.emit("login", token);

    socket.on("first-load", (tok) => {
      if (tok != token) return
      const path = "./public/feed.json";
      socket.emit("first-load", require(path));
    });
  });

  socket.on("disconnect", () => {
    if (token != undefined)  tokens.remove(token);
  });
});

// ----- E-MAIL -----
app.use(bp.json());

app.post("/sendMail/", (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "Hotmail",
    auth: {
      user: userMail,
      pass: password
    }
  });
	
  const mailOptions = {
    from: userMail,
    to: userMail,
    subject: `[Site web] ${req.body.name} - ${req.body.subject}`,
    text: req.body.message
  }
	
  transporter.sendMail(mailOptions, (e, info) => {
    if (e) {
      console.log(e);
      res.send("error");
    } else
      res.send("success");
  })
})

// START

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/404.html"), 404);
});

http.listen(port, () => {
  console.log(`App server is running on port ${port}`);
});