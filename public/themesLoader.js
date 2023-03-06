function redirect(path) {
    const href = document.location.href;
    return href + (href[href.length-1] == "/" ? "" : "/") + path
}

function splitPath(path) {
    const r = path.split("/");
    r.shift();
    r.shift();
    if (r[0] == "") return []
    return r
}

function getInfos(list, path) {
    for (j = 0; j < list.length; j++) {
        if (list[j].path == path)
            return list[j].infos
    }
}

function load(type) {
    $.getJSON("/feed.json", (data) => {
        let themes = data[type];
        const path = splitPath(document.location.pathname);
        let beforeThemes;

        for (i = 0; i < path.length; i++) {
            if (i+1 == path.length)
                beforeThemes = themes;
            themes = getInfos(themes, path[i]);
        }

        let actualTheme;

        if (beforeThemes != undefined) {
            for (i = 0; i < beforeThemes.length; i++) {
                if (beforeThemes[i].path == path[path.length-1]) {
                    actualTheme = beforeThemes[i];
                    const icon = $("<img id='go-back-icon' src='https://api.iconify.design/ri:arrow-go-back-fill.svg'>")
                    $("article").append(icon);
                    $("#title").text(actualTheme.title);
                    icon.on("click", () => {
                        const customPath = splitPath(document.location.pathname);
                        customPath.pop();
                        let customPathString = document.location.origin + "/themes";
                        if (customPath.length > 0) customPath.forEach(e => customPathString += "/" + e);
                        document.location.href = customPathString;
                    });
                }
            }
        }

        for (i = 0; i < themes.length; i++) {
            const theme = themes[i];

            (theme.type == "folder" ? $("#grid-list") : $("#grid-blog")).append(`<a id="${theme.path}" class="${theme.type}-grid-case" href="${redirect(theme.path)}">${theme.title}</a>`);
            if (theme.type == "blog") {
                $(`#${theme.path}`).append(`<p class="blog-date">${new Date(theme.infos.date).toLocaleDateString()}</p>`);
            }

        }

        if (document.getElementById("grid-list").children.length == 0) {
            $("#list-hr").remove();
            $("#grid-list").remove();
        }
        if (document.getElementById("grid-blog").children.length == 0) {
            $("#blog-hr").remove();
            $("#grid-blog").remove();
        }

        if (actualTheme == undefined) return;

        if (actualTheme.type == "blog") {
            $("article").append("<hr>");
            $("article").append(`<div id="article">${actualTheme.infos.article}</div>`);
            $("#article").append(`<p class="credit">Publié le ${new Date(actualTheme.infos.date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} par ${actualTheme.infos.author}.</p>`)
        }
    });
}