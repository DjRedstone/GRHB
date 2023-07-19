const socket = io();

const delay = ms => new Promise(res => setTimeout(res, ms));

const form = $("form");
const password = $("#password");

form.on("submit", (e) => {
    e.preventDefault();
    socket.emit("login", password.val());
});

let feedData;

socket.on("login", (token) => {
    if (token === "wrong password") {
        alert("Le mot de passe est incorrect !");
        return;
    }
    form.remove();

    loadFolderAndBlogsTab();

    $.getJSON("/feed.json", (data) => {
        feedData = data;
        firstLoad();
    });

    function afterManaging(res, data) {
        if (res === "OK") {
            feedData = data;
        } else {
            alert("Une erreur est apparue :\n\n" + res);
        }
        loadFolderAndBlogsTab();
        loadFoldersAndBlogs(getListFromPath(path));
    }

    function loadFolderAndBlogsTab() {
        $("article")
            .empty()
            .append("<h1>Admin Pannel</h1>")
            .append("<hr>")
            .append("<br id='last-br'>");

        const foldersTitle = $("<h2>Dossiers</h2>");
        const foldersAdd = $(`<form id="folder-add-form">
                                    <label>Créer un dossier : </label>
                                    <input id="folder-add-input" type="text" required>
                                    <input type="submit" value="Créer" required>
                                  </form>`);
        const foldersGrid = $("<div id='grid-folders' class='blog-grid'></div>");

        const blogsTitle = $("<h2>Blogs</h2>");
        const blogsAdd = $(`<form id="blogs-add-form">
                                    <input type="submit" value="Créer un article" required>
                                 </form>`);
        const blogsGrid = $("<div id='grid-blogs' class='blog-grid'></div>");

        const lastBr = $("#last-br");
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
            socket.emit("create-folder", token, path, $("#folder-add-input").val());
        });
        blogsAdd.on("submit", (e) => {
            e.preventDefault();
            loadBlogEditor({
                "title": "Titre de l'article",
                "content": "Commencez à écrire ici...",
                "date": Date.now(),
                "author": "Admin"
            }, false);
        });
    }

    socket.on("create-folder", afterManaging);
    socket.on("edit-folder", afterManaging);
    socket.on("delete-folder", afterManaging);

    let imagesInChange;

    function loadBlogEditor(data, editing = true) {
        $("article")
            .empty()
            .append("<h1>Admin Pannel</h1>")
            .append("<hr>")
            .append("<br id='last-br'>");

        const lastBr = $("#last-br");

        const cancelIcon = $("<lord-icon id='go-back-icon' src='https://cdn.lordicon.com/jxwksgwv.json' trigger='hover' state='hover-2'></lord-icon>");
        lastBr.before(cancelIcon);
        const iconData = $(cancelIcon[0].shadowRoot.querySelector("div"));
        iconData.css({display: "grid", "justify-items": "center", "align-items": "center", width: "100%", height: "100%"});
        cancelIcon.on("click", () => {
           const res = window.confirm("Vous confirmez l'abandon des modifications de cet article");
           if (res) {
               loadFolderAndBlogsTab();
               loadFoldersAndBlogs(getListFromPath(path));
           }
        });

        const editorForm = $("<form id='editor-form'>");
        lastBr.before(editorForm);

        const titleInput = $(`<h1><label for="title-input">Titre : </label><input style="width: calc(100% - 15px)" type="text" id="title-input" value="${data.title}" required></h1>`);
        editorForm.append(titleInput);

        const textInput = $("<div id='editor'></div><br>");
        const textAreaCss = { "height": "auto", "min-height": "250px" };
        textInput.css(textAreaCss);
        editorForm.append(textInput);

        const authorInput = $(`<label for="author-input">Auteur : </label><input type="text" id="author-input" value="${data.author}"><br><br>`);
        editorForm.append(authorInput);

        const saveInput = $(`<input type="submit" value="${editing ? "Sauvegarder" : "Créer"}">`);
        editorForm.append(saveInput);

        const quill = new Quill("#editor", {
            modules: {
                toolbar: [
                    [{ "header": [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote", "code-block"],
                    [{ "list": "ordered" }, { "list": "bullet" }],
                    [{ "indent": "-1" }, { "indent": "+1" }],
                    ["link", "image"]
                ]
            },
            theme: "snow"
        });

        $(textInput.children()[0]).css(textAreaCss);

        quill.setContents(quill.clipboard.convert(data.content), "silent");

        editorForm.on("submit", async (e) => {
            e.preventDefault();

            const imgs = $("#editor").find("img");
            imagesInChange = {};
            for (let n = 0; n < imgs.length; n++) {
                const img = imgs[n];
                const imgData = $(img);
                const src = imgData.attr("src");
                if (!src.startsWith("/feed-data/")) {
                    imgData.attr("id", `image-${n}`);
                    socket.emit("add-image-to-feed-data", token, n, src);
                    imagesInChange[n] = n;
                }
            }

            while (Object.values(imagesInChange).length !== 0) {
                await delay(100);
            }

            const title = $("#title-input").val();
            const content = quill.root.innerHTML;
            const author = $("#author-input").val();

            if (editing) {
                const articlePath = data.absolute_path.split("/").pop();
                socket.emit("edit-article", token, `${path}.${articlePath}`, title, content, new Date(data.date), author);
            } else {
                socket.emit("create-article", token, path, title, content, Date.now(), author);
            }
        });
    }

    socket.on("add-image-to-feed-data", (imageKey, filename) => {
        delete imagesInChange[imageKey];
        $(`#image-${imageKey}`).attr("src", `/feed-data/${filename}`);
    });

    socket.on("create-article", afterManaging);
    socket.on("edit-article", afterManaging);
    socket.on("delete-article", afterManaging);

    function firstLoad() {
        $("#folder-add-form").hide();
        $("#blogs-add-form").hide();
        [["newsletters", "Les bulletins"], ["events", "Les manifestations"], ["themes", "Les thèmes"]].forEach((categorie) => {
            const item = $(`<div id="${categorie[0]}" class="admin-grid-item">
                            <span>${categorie[1]}</span>
                        </div>`);
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
                data = data[pathList[i]].content;
            }
        }
        return data;
    }

    let path = "";

    function loadFoldersAndBlogs(list) {
        const foldersGrid = $("#grid-folders");
        const blogsGrid = $("#grid-blogs");
        foldersGrid.empty();
        blogsGrid.empty();

        if (path !== "") {
            $("#folder-add-form").show();
            $("#blogs-add-form").show();

            foldersGrid.append("<div id='go-back-folder' class='admin-grid-item'><span>...</span></div>");
            $("#go-back-folder").on("click", (e) => {
                e.preventDefault();
                path = path.split(".").slice(0, -1).join(".");
                loadFoldersAndBlogs(getListFromPath(path));
            });

            const listKeys = Object.keys(list);
            listKeys.sort((a, b) => {
                return ((list[a].date !== undefined && list[b].date !== undefined) ? list[b].date.localeCompare(list[a].date) : 0);
            });
            for (const dataPath of listKeys) {
                const data = list[dataPath];
                const titleLength = 50;
                let title = data.title;
                if (title.length >= titleLength) {
                    title = title.slice(0, titleLength - 1) + "...";
                }
                if (data.type === "folder") {
                    foldersGrid.append(`<div id="folder-${dataPath}" class="admin-grid-item">
                                        <span>${title}</span>
                                        <div>
                                            <lord-icon id="folder-${dataPath}-edit-button" src="https://cdn.lordicon.com/dycatgju.json" trigger="hover"></lord-icon>
                                            <lord-icon id="folder-${dataPath}-delete-button" src="https://cdn.lordicon.com/jmkrnisz.json" trigger="hover"></lord-icon>
                                        </div>
                                    </div>`);
                    const editIcon = $(`#folder-${dataPath}-edit-button`);
                    const deleteIcon = $(`#folder-${dataPath}-delete-button`);
                    for (const icon of [editIcon, deleteIcon]) {
                        const iconData = $(icon[0].shadowRoot.querySelector("div"));
                        iconData.css({display: "grid", "justify-items": "center", "align-items": "center", width: "100%", height: "100%"});
                    }
                    $(`#folder-${dataPath}`).on("click", (e) => {
                        e.preventDefault();
                        // EDIT FOLDER
                        if ($(`#folder-${dataPath}-edit-button:hover`)[0] === $(`#folder-${dataPath}-edit-button`)[0]) {
                            const newName = window.prompt("Entrez un nouveau nom", data.title);
                            if (!newName) {
                                alert("Votre modification n'a pas été prise en compte");
                            } else {
                                socket.emit("edit-folder", token, `${path}.${dataPath}`, newName);
                            }
                            // DELETE FOLDER
                        } else if ($(`#folder-${dataPath}-delete-button:hover`)[0] === $(`#folder-${dataPath}-delete-button`)[0]) {
                            const result = window.confirm(`Vous confirmez la suppression du dossier "${data.title}"`);
                            if (result) {
                                socket.emit("delete-folder", token, `${path}.${dataPath}`);
                            }
                            // GOTO FOLDER
                        } else {
                            path += `.${dataPath}`;
                            loadFoldersAndBlogs(getListFromPath(path));
                        }
                    });
                } else {
                    blogsGrid.append(`<div id="article-${dataPath}" class="admin-grid-item">
                                      <span>${title}</span>
                                      <div>
                                          <lord-icon id="article-${dataPath}-edit-button" src="https://cdn.lordicon.com/dycatgju.json" trigger="hover"></lord-icon>
                                          <lord-icon id="article-${dataPath}-delete-button" src="https://cdn.lordicon.com/jmkrnisz.json" trigger="hover"></lord-icon>
                                       </div>
                                  </div>`);
                    const editIcon = $(`#article-${dataPath}-edit-button`);
                    const deleteIcon = $(`#article-${dataPath}-delete-button`);
                    for (const icon of [editIcon, deleteIcon]) {
                        const iconData = $(icon[0].shadowRoot.querySelector("div"));
                        iconData.css({display: "grid", "justify-items": "center", "align-items": "center", width: "100%", height: "100%"});
                    }
                    $(`#article-${dataPath}`).on("click", (e) => {
                        e.preventDefault();
                        // EDIT ARTICLE
                        if ($(`#article-${dataPath}-edit-button:hover`)[0] === $(`#article-${dataPath}-edit-button`)[0]) {
                            loadBlogEditor(data);
                            // DELETE ARTICLE
                        } else if ($(`#article-${dataPath}-delete-button:hover`)[0] === $(`#article-${dataPath}-delete-button`)[0]) {
                            const result = window.confirm(`Vous confirmez la suppression du dossier "${data.title}"`);
                            if (result) {
                                socket.emit("delete-article", token, `${path}.${dataPath}`);
                            }
                        }
                    });
                }
            }
        } else {
            firstLoad();
        }
    }
});
