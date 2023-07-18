const express = require("express");

const app = express();
const http = require("http").createServer(app);
const path = require("path");
const port = 3000;

const { Server } = require("socket.io");
const io = new Server({
    maxHttpBufferSize: 1e8 // 100 MB
}).listen(http);

const fs = require("fs");

const nodemailer = require("nodemailer");
const bp = require("body-parser");

require("dotenv").config();
const userMail = process.env["EMAIL"];
if (userMail === undefined) throw "Need e-mail";
const password = process.env["EMAIL_PASSWORD"];
if (password === undefined) throw "Need Password";

const FeedManager = require("./Feed.js");

app.use("/jquery", express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use(express.static("public"));
app.use(express.static("private"));

Array.prototype.remove = function() {
  // Helper function to remove a single element from a list if exists
  const item = arguments[0]
  if (this.includes(item)) {
      const index = this.indexOf(item)
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

const feedManager = new FeedManager(
    "./public/feed.json",
    {
      "newsletters": {},
      "events": {},
      "themes": {}
    }
);

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
  res.sendFile(path.join(__dirname, "/private/admin/index.html"));
});

function randomID() {
  return Math.random().toString(36).substr(2, 9);
}

function dataURLtoFile(dataurl, callback) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    const filename = `${randomID()}.${mime.split("/")[1]}`;
    fs.writeFileSync(`./public/feed-data/${filename}`, u8arr);
    callback(filename);
}

(async function cleanFeedData() {
    console.log("Cleaning feed data folder...");
    let n = 0;
    const feedString = feedManager.getDataAsString();
    for (const file of fs.readdirSync("./public/feed-data/")) {
        if (!feedString.includes(file)) {
            console.log(`${file} is not used. Deleting...`);
            await fs.promises.unlink(`./public/feed-data/${file}`);
            n ++;
        }
    }
    console.log(`Cleaning finished : ${n} fils deleted`);
})();

const tokens = [];

const adminCode = process.env["ADMIN_CODE"];
if (adminCode === undefined) throw "Need Password";
io.on("connection", (socket) => {
  let token;

  socket.on("get-wingets-data", () => {
    const allPost = feedManager.getAllPostsFromFeed();
    allPost.sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
    const res = []
    for (let i = 0; i < Math.min(allPost.length, 5); i++) {
      res.push(allPost[i]);
    }
    socket.emit("get-wingets-data", res);
  });

  socket.on("login", (pass) => {
    if (pass !== adminCode) {
      socket.emit("login", "wrong password");
      return
    }
    token = randomID();
    tokens.push(token);
    socket.emit("login", token);

    console.log(`${socket.id} is connected to the admin pannel`);

    socket.on("create-folder", (askedToken, path, name) => {
      if (askedToken !== token) return
      try {
        feedManager.createFolder(path, name);
        socket.emit("create-folder", "OK", feedManager.data);
      } catch (e) {
        socket.emit("create-folder", e);
      }
    });

    socket.on("edit-folder", (askedToken, path, newName) => {
       if (askedToken !== token) return
       try {
           feedManager.editFolder(path, newName);
           socket.emit("edit-folder", "OK", feedManager.data);
       } catch (e) {
           socket.emit("edit-folder", e);
       }
    });

    socket.on("delete-folder", (askedToken, path) => {
       if (askedToken !== token) return
       try {
           feedManager.deleteFolder(path);
           socket.emit("delete-folder", "OK", feedManager.data);
       } catch (e) {
           socket.emit("delete-folder", e);
       }
    });

    socket.on("create-article", (askedToken, path, name, content, date, author) => {
       if (askedToken !== token) return
       try {
           feedManager.createArticle(path, name, content, date, author);
           socket.emit("create-article", "OK", feedManager.data);
       } catch (e) {
           socket.emit("create-article", e);
       }
    });

    socket.on("edit-article", (askedToken, path, name, content, date, author) => {
       if (askedToken !== token) return
       try {
           feedManager.editArticle(path, name, content, date, author);
           socket.emit("edit-article", "OK", feedManager.data);
       } catch (e) {
           socket.emit("edit-article", e);
       }
    });

    socket.on("delete-article", (askedToken, path) => {
        if (askedToken !== token) return
        try {
            feedManager.deleteArticle(path);
            socket.emit("delete-article", "OK", feedManager.data);
        } catch (e) {
            socket.emit("delete-article", e);
        }
    });

    socket.on("add-image-to-feed-data", (askedToken, imageToken, url) => {
        if (askedToken !== token) return
        dataURLtoFile(url, (filename) => {
            socket.emit("add-image-to-feed-data", imageToken, filename);
        });
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} is diconnected to the admin pannel`);
        tokens.remove(token);
    });
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
	
  transporter.sendMail(mailOptions, (e) => {
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
  console.log(`--> App server is running on port ${port}`);
});