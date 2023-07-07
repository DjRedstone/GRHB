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
}

module.exports = FeedManager;