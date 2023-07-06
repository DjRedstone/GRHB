const socket = io();
const form = $("form");
const password = $("#password");

form.on("submit", (e) => {
    e.preventDefault();
    socket.emit("login", password.val());
});

let feedData;
socket.on("login", (res) => {
    if (res === "wrong password") {
        alert("Le mot de passe est incorrect !");
        return
    }
    form.remove();

    const foldersTitle = $("<h2>Dossiers</h2>");
    const foldersAdd = $(`<form id="folder-add-form">
                                    <label>Créer un dossier : </label>
                                    <input id="folder-add-input" type="text" required>
                                    <input type="submit" required>
                                  </form>`);
    const foldersGrid = $("<div id='grid-folders' class='blog-grid'></div>");

    const blogsTitle = $("<h2>Blogs</h2>");
    const blogsAdd = $(`<form id="blogs-add-form">
                                    <input type="submit" value="Créer un article" required>
                                 </form>`);
    const blogsGrid = $("<div id='grid-blogs' class='blog-grid'></div>");

    const lastBr = $("#last-br")
    lastBr.before(foldersTitle);
    lastBr.before(foldersAdd);
    lastBr.before("<br>");
    lastBr.before(foldersGrid);
    lastBr.before(blogsTitle);
    lastBr.before(blogsAdd);
    lastBr.before("<br>");
    lastBr.before(blogsGrid);

    foldersAdd.on("submit", (e) => {
        e.preventDefault();
    });
    blogsAdd.on("submit", (e) => {
        e.preventDefault();
    });

    $.getJSON("../feed.json", (data) => {
        feedData = data;
        firstLoad();
    });
});

function firstLoad() {
    [["newsletters", "Les bulletins"], ["events", "Les manifestations"], ["themes", "Les thèmes"]].forEach((categorie) => {
        const item = $(`<a id="${categorie[0]}" class="folder-grid-case">${categorie[1]}</a>`);
        $("#grid-folders").append(item);
        item.on("click", (e) => {
            e.preventDefault();
            path += categorie[0];
            loadFoldersAndBlogs(feedData[categorie[0]]);
        });
    });
}

function getListFromPath(path) {
    const pathList = path.split(".");
    let data = feedData;
    for (let i = 0; i < pathList.length; i++) {
        if (i === 0) {
            data = data[pathList[0]];
        } else {
            data = findInList(pathList[i], data).infos;
        }
    }
    return data;
}

function findInList(path, list) {
    for (const ele of list) {
        if (ele.path === path) {
            return ele
        }
    }
}

let path = "";
function loadFoldersAndBlogs(list) {
    const foldersGrid = $("#grid-folders");
    const blogsGrid = $("#grid-blogs");
    foldersGrid.empty();
    blogsGrid.empty();

    if (path !== "") {
        foldersGrid.append("<a id='go-back-folder' class='folder-grid-case'>...</a>");
        $("#go-back-folder").on("click", (e) => {
            e.preventDefault();
            path = path.split(".").slice(0, path.split(".").length-1).join(".");
            loadFoldersAndBlogs(getListFromPath(path));
        });

        for (const data of list) {
            const titleLength = 55;
            let title = data.title;
            if (title.length >= titleLength) {
                title = title.slice(0, titleLength-1) + "...";
            }
            if (data.type === "folder") {
                foldersGrid.append(`<a id="${data.path}" class="folder-grid-case" >${title}</a>`);
                $(`#${data.path}`).on("click", (e) => {
                    e.preventDefault();
                    path += "." + data.path;
                    loadFoldersAndBlogs(getListFromPath(path));
                });
            } else {
                blogsGrid.append(`<a id="${data.path}" class="folder-grid-case" >${title}</a>`);
            }
        }
    } else {
        firstLoad();
    }
}