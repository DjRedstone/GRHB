const express = require("express");

const app = express();
const http = require("http").createServer(app);
const path = require("path");
const port = 3000;

const nodemailer = require("nodemailer");
const bp = require("body-parser");

const userMail = "baptistemay@hotmail.fr";
require("dotenv").config();
const password = process.env['EMAIL-PASSWORD'];
if (password == undefined) throw "Need Password";

require("dotenv").config();

app.use("/jquery", express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use(express.static("public"));

const pages = ["home", "introducing", "newsletters", "events", "themes", "contact"];
for (i = 0; i < pages.length; i++) {
    const page = pages[i];
    app.get(`/${page}/`, (req, res) => {
        res.sendFile(path.join(__dirname, `/public/${page}/`));
    });
}

/*
const feed = require("./public/feed.json");
const themes = feed.themes;
for (i = 0; i < themes.length; i++) {
    const theme = themes[i];
    app.get(`/themes/${theme.path}/`, (req, res) => {
      res.sendFile(path.join(__dirname, `/public/themes/template.html`));
    });
}
*/

app.get("/", (req, res) => {
    res.redirect("./home");
});

const fs = require("fs-extra");

// ----- FEED -----

(function createRssFeed() {
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
})();

app.get("/themes/*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/themes/index.html"));
});
app.get("/events/*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/events/index.html"));
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