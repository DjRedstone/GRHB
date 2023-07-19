const fs = require("fs");
const moment = require("moment");

function nameToPath(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]+/gi, "-")
        .replace(/^-|-$/g, "");
}

class FeedManager {
    constructor(path, originalData) {
        this.path = path;
        this.data = originalData;
        if (!fs.existsSync(path)) {
            console.log("Creating feed file...");
            fs.writeFileSync(path, JSON.stringify(originalData), "utf8");
            console.log("File created!");
        } else {
            this.data = require(path);
        }
    }

    getDataAsString() {
        return JSON.stringify(this.data);
    }

    update() {
        console.log("Updating feed.js...");
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 4));
        console.log("Update complete!");
    }

    getAllPosts(object) {
        let res = [];
        for (const value of Object.values(object)) {
            if (value.type === "folder") {
                res = [...res, ...this.getAllPosts(value.content)];
            } else if (value.type === "blog") {
                res.push(value);
            }
        }
        return res;
    }

    getAllPostsFromFeed() {
        const res = [];
        for (const categorie of Object.keys(this.data)) {
            res.push(...this.getAllPosts(this.data[categorie]));
        }
        return res;
    }

    getListFromPath(path) {
        const pathList = path.split(".");
        let data = this.data;
        for (let i = 0; i < pathList.length; i++) {
            if (i === 0) {
                data = data[pathList[0]];
            } else {
                data = data[pathList[i]].content;
            }
        }
        return data;
    }

    checkIfExist(path) {
        try {
            this.getListFromPath(path);
            return true;
        } catch (e) {
            return false;
        }
    }

    createFolder(path, name) {
        if (this.checkIfExist(`${path}.${nameToPath(name)}`)) {
            throw "Folder already exists";
        }
        const workingData = this.getListFromPath(path);
        workingData[nameToPath(name)] = {
            title: name,
            type: "folder",
            content: {},
        };
        console.log(`Folder "${name}" successfully created in "${path}"!`);
        this.update();
    }

    editFolder(path, newName) {
        if (!this.checkIfExist(path)) {
            throw "Folder does not exist";
        }
        const workingData = this.getListFromPath(
            path.split(".").slice(0, -1).join(".")
        );
        const oldPath = path.split(".").pop();
        const folderData = workingData[oldPath];
        delete workingData[oldPath];
        workingData[nameToPath(newName)] = {
            title: newName,
            type: "folder",
            content: folderData.content,
        };
        console.log(`Folder "${path}" successfully edited as "${newName}"`);
        this.update();
    }

    deleteFolder(path) {
        if (!this.checkIfExist(path)) {
            throw "Folder does not exist";
        }
        const workingData = this.getListFromPath(
            path.split(".").slice(0, -1).join(".")
        );
        const oldPath = path.split(".").pop();
        delete workingData[oldPath];
        console.log(`Folder "${path}" successfully deleted`);
        this.update();
    }

    createArticle(path, name, content, date, author) {
        if (this.checkIfExist(`${path}.${nameToPath(name)}`)) {
            throw "Article already exists";
        }
        const workingData = this.getListFromPath(path);
        workingData[nameToPath(name)] = {
            title: name,
            type: "blog",
            content: content,
            date: moment(date).format("YYYY-MM-DD"),
            author: author,
            absolute_path: `${path.replace(".", "/")}/${nameToPath(name)}`,
        };
        console.log(`Article "${name}" successfully created in "${path}"!`);
        this.update();
    }

    editArticle(path, name, content, date, author) {
        if (!this.checkIfExist(path)) {
            throw "Article does not exist";
        }
        const workingData = this.getListFromPath(
            path.split(".").slice(0, -1).join(".")
        );
        const oldPath = path.split(".").pop();
        const articleData = workingData[oldPath];
        delete workingData[oldPath];
        workingData[nameToPath(name)] = {
            title: name,
            type: "blog",
            content: content,
            date: moment(date).format("YYYY-MM-DD"),
            author: author,
            absolute_path: `${path.split(".").slice(0, -1).join("/")}/${nameToPath(
                name
            )}`,
        };
        console.log(`Article "${path}" successfully edited as "${name}"`);
        this.update();
    }

    deleteArticle(path) {
        if (!this.checkIfExist(path)) {
            throw "Article does not exist";
        }
        const workingData = this.getListFromPath(
            path.split(".").slice(0, -1).join(".")
        );
        const oldPath = path.split(".").pop();
        delete workingData[oldPath];
        console.log(`Article "${path}" successfully deleted`);
        this.update();
    }
}

module.exports = FeedManager;
