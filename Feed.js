const fs = require("fs");

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
        console.log("Updating feed.js");
        fs.writeSync(this.data, this.path);
    }

    getAllPosts(list) {
        let res = [];
        for (const data of list) {
            if (data.type === "folder")
                res = [res, this.getAllPosts(data.infos)].flat();
            else if (data.type === "blog")
                res.push(data);
        }
        return res
    }

    getAllPostsFromFeed() {
        const res = [];
        for (const list of Object.values(this.data))
            res.push(this.getAllPosts(list));
        return res.flat();
    }
}

module.exports = FeedManager;