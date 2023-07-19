// Importing fs and moment
const fs = require("fs");
const moment = require("moment");

/**
 * Transform string to a string who can be use in URL
 * @param name {string} Original string
 * @returns {string}
 */
function nameToPath(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]+/gi, "-")
        .replace(/^-|-$/g, "");
}

class FeedManager {
    /**
     * Create feed manager
     * @param path {string} Path to feed file
     * @param originalData {JSON} Data when feed not exist
     */
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

    /**
     * Stringify feed data
     * @returns {string}
     */
    getDataAsString() {
        return JSON.stringify(this.data);
    }

    /**
     * Update feed file
     */
    update() {
        console.log("Updating feed file...");
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 4));
        console.log("Update complete!");
    }

    /**
     * Get all articles from feed data by part
     * @param object {JSON} Original data
     * @returns {[]}
     */
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

    /**
     * Get all articles from feed data
     * @returns {[]}
     */
    getAllPostsFromFeed() {
        const res = [];
        for (const categorie of Object.keys(this.data)) {
            res.push(...this.getAllPosts(this.data[categorie]));
        }
        return res;
    }

    /**
     * Get articles from path
     * @param path {string}
     * @returns {JSON}
     */
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

    /**
     * Check if an element exist
     * @param path {string}
     * @returns {boolean}
     */
    checkIfExist(path) {
        try {
            this.getListFromPath(path);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Create folder in feed data
     * @param path {string}
     * @param name {string} Folder name
     */
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

    /**
     * Edit folder name
     * @param path {string} Path to folder
     * @param newName {string} New folder name
     */
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

    /**
     * Delete folder
     * @param path {string} Path to folder
     */
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

    /**
     * Create article
     * @param path {string}
     * @param name {string}
     * @param content {string}
     * @param date {date}
     * @param author {string}
     */
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

    /**
     * Edit article
     * @param path {string} Path to article
     * @param name {string}
     * @param content {string}
     * @param date {date}
     * @param author {string}
     */
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

    /**
     * Delete article
     * @param path {string} Path to article
     */
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

// Export class
module.exports = FeedManager;
