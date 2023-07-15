const socket = io();

const converter = new showdown.Converter({
    "emoji": "true",
    "simpleLineBreaks": "true",
    "tables": "true",
    "noHeaderId": "true",
    "openLinksInNewWindow": "true",
    "simplifiedAutoLink": "true"
});

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
        return
    }
    form.remove();

    loadFolderAndBlogsTab();

    $.getJSON("/feed.json", (data) => {
        feedData = data;
        firstLoad();
    });

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
        });
    }

    socket.on("create-folder", (res, newData) => {
        if (res === "OK") {
            alert("Le dossier a été créé !");
            $("#folder-add-input").val("");
            feedData = newData;
            loadFoldersAndBlogs(getListFromPath(path));
        } else {
            alert("Une erreur s'est produite :\n\n" + res);
        }
    });

    function loadBlogEditor(data) {
        $("article")
            .empty()
            .append("<h1>Admin Pannel</h1>")
            .append("<hr>")
            .append("<br id='last-br'>");

        const editorForm = $("<form id='editor-form'>");
        const lastBr = $("#last-br");
        lastBr.before(editorForm);

        const titleInput = $(`<h1><label for="title-input">Titre : </label><input style="width: calc(100% - 15px)" type="text" id="title-input" value="${data.title}" required></h1>`);
        editorForm.append(titleInput);

        const textInput = $("<div id='editor'></div><br>");
        const textAreaCss = {"height": "auto", "min-height": "250px"};
        textInput.css(textAreaCss);
        editorForm.append(textInput);

        const authorInput = $(`<label for="author-input">Auteur : </label><input type="text" id="author-input" value="${data.author}"><br><br>`);
        editorForm.append(authorInput);

        const saveInput = $("<input type='submit' value='Sauvgarder'>");
        editorForm.append(saveInput);

        const quill = new Quill("#editor", {
            modules: {
                toolbar: [
                    [{"header": [1, 2, 3, false]}],
                    ["bold", "italic", "strike"],
                    ["blockquote", "code-block"],
                    [{"list": "ordered"}, {"list": "bullet"}],
                    [{"indent": "-1"}, {"indent": "+1"}],
                    ["link", "image"]
                ]
            },
            theme: 'snow'
        });

        $(textInput.children()[0]).css(textAreaCss);

        quill.setContents(quill.clipboard.convert(converter.makeHtml(data.content)), "silent");

        editorForm.on("submit", (e) => {
           e.preventDefault();
           const title = $("#title-input").val();
           const content = quill.root.innerHTML;
           const author = $("#author-input").val();
        });
    }

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
            if (i === 0)
                data = data[pathList[0]];
            else
                data = data[pathList[i]].content;
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
                path = path.split(".").slice(0, path.split(".").length-1).join(".");
                loadFoldersAndBlogs(getListFromPath(path));
            });

            for (const dataPath of Object.keys(list)) {
                const data = list[dataPath];
                const titleLength = 55;
                let title = data.title;
                if (title.length >= titleLength) {
                    title = title.slice(0, titleLength-1) + "...";
                }
                if (data.type === "folder") {
                    foldersGrid.append(`<div id="${dataPath}" class="admin-grid-item" >
                                        <span>${title}</span>
                                        <div>
                                            <button id="${dataPath}-edit-button">Modifier</button>
                                            <button id="${dataPath}-delete-button">Supprimer</button>
                                        </div>
                                    </div>`);
                    $(`#${dataPath}`).on("click", (e) => {
                        e.preventDefault();
                        // EDIT FOLDER
                        if ($(`#${dataPath}-edit-button:hover`)[0] === $(`#${dataPath}-edit-button`)[0]) {
                            const newName = window.prompt("Entrez un nouveau nom", data.title);
                            if (!newName) {
                                alert("Votre modification n'a pas été prise en compte");
                            } else {
                                socket.emit("edit-folder", token, path + "." + dataPath, newName);
                            }
                        // DELETE FOLDER
                        } else if ($(`#${dataPath}-delete-button:hover`)[0] === $(`#${dataPath}-delete-button`)[0]) {
                            const result = window.confirm(`Vous confirmez la suppression du dossier "${data.title}"`);
                            if (result) {
                                socket.emit("delete-folder", token, path + "." + dataPath);
                            }
                        // GOTO FOLDER
                        } else {
                            path += "." + dataPath;
                            loadFoldersAndBlogs(getListFromPath(path));
                        }
                    });
                    $(`#${dataPath}-edit-button`).on("click", (e) => {
                       e.preventDefault();

                    });
                } else {
                    blogsGrid.append(`<div id="${data.path}" class="admin-grid-item" >
                                      <span>${title}</span>
                                      <div>
                                          <button>Modifier</button>
                                          <button>Supprimer</button>
                                       </div>
                                  </div>`);
                }
            }
        } else {
            firstLoad();
        }
    }

    function afterManaging(res, data) {
        if (res === "OK") {
            feedData = data;
            loadFoldersAndBlogs(getListFromPath(path));
        } else {
            alert("Une erreur est apparu :\n\n" + res);
        }
    }

    socket.on("edit-folder", afterManaging);
    socket.on("delete-folder", afterManaging);
});