const fs = require("fs");
const moment = require("moment");

function nameToPath(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9_]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()
}

class FeedManager {

    constructor(path, originalData) {
        this.path = path;
        this.data = originalData;
        if (!fs.existsSync(path)) {
            console.log("Creating feed file...");
            fs.writeFile(path, JSON.stringify(originalData), "utf8", () => {
                console.log("File created!");
            });
        } else
            this.data = require(path);
    }

    update() {
        console.log("Updating feed.js...");
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 4));
        console.log("Update complete!")
    }

    getAllPosts(object) {
        let res = [];
        for (const value of Object.values(object)) {
            if (value.type === "folder")
                res = [res, this.getAllPosts(value.content)].flat();
            else if (value.type === "blog")
                res.push(value);
        }
        return res
    }

    getAllPostsFromFeed() {
        const res = [];
        for (const categorie of Object.keys(this.data))
            res.push(this.getAllPosts(this.data[categorie]));
        return res.flat();
    }

    getListFromPath(path) {
        const pathList = path.split(".");
        let data = this.data;
        for (let i = 0; i < pathList.length; i++) {
            if (i === 0)
                data = data[pathList[0]];
            else
                data = data[pathList[i]].content;
        }
        return data;
    }

    checkIfExist(path) {
        try {
            this.getListFromPath(path);
            return true
        } catch (e) {
            return false
        }
    }

    createFolder(path, name) {
        if (this.checkIfExist(path + "." + nameToPath(name))) throw "Folder already exist"
        const workingData = this.getListFromPath(path);
        workingData[nameToPath(name)] = {
            "title": name,
            "type": "folder",
            "content": {}
        };
        console.log(`Folder "${name}" succecfully created in "${path}"!`);
        this.update();
    }

    editFolder(path, newName) {
        if (!this.checkIfExist(path)) throw "Folder not exist"
        const workingData = this.getListFromPath(path.split(".").slice(0, path.split(".").length-1).join("."));
        const oldPath = path.split(".")[path.split(".").length-1];
        const folderData = workingData[oldPath];
        delete workingData[oldPath];
        workingData[nameToPath(newName)] = {
            "title": newName,
            "type": "folder",
            "content": folderData.content
        }
        console.log(`Folder "${path}" succecfully edited as "${newName}"`);
        this.update();
    }

    deleteFolder(path) {
        if (!this.checkIfExist(path)) throw "Folder not exist"
        const workingData = this.getListFromPath(path.split(".").slice(0, path.split(".").length-1).join("."));
        const oldPath = path.split(".")[path.split(".").length-1];
        delete workingData[oldPath];
        console.log(`Folder "${path}" succecfully deleted`);
        this.update();
    }

    createArticle(path, name, content, date, author) {
        if (this.checkIfExist(path + "." + nameToPath(name))) throw "Article already exist"
        const workingData = this.getListFromPath(path);
        workingData[nameToPath(name)] = {
            "title": name,
            "type": "blog",
            "content": content,
            "date": moment(date).format("DD-MM-YYYY"),
            "author": author,
            "absolute_path": path.replace(".", "/") + "/" + nameToPath(name)
        };
        console.log(`Article "${name}" succecfully created in "${path}"!`);
        this.update();
    }
}

module.exports = FeedManager;