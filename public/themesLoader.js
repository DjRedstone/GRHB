
function redirect(path) {
    const href = document.location.href;
    return href + (href[href.length-1] === "/" ? "" : "/") + path
}

function splitPath(path) {
    const r = path.split("/");
    r.shift();
    r.shift();
    if (r[0] === "") return []
    return r
}

function load(type) {
    $.getJSON("/feed.json", (data) => {
        let themes = data[type];
        let beforeThemes;
        const path = splitPath(document.location.pathname);

        for (i = 0; i < path.length; i++) {
            if (i+1 === path.length)
                beforeThemes = themes;
            themes = themes[path[i]].content;
        }

        if (beforeThemes !== undefined) {
            const icon = $("<img id='go-back-icon' src='https://api.iconify.design/ri:arrow-go-back-fill.svg'>");
            $("article").append(icon);
            const actualTheme = beforeThemes[path[path.length-1]];
            $("#title").text(actualTheme.title);
            $("title").text("GRHB | " + actualTheme.title);
            icon.on("click", () => {
                const customPath = splitPath(document.location.pathname);
                customPath.pop();
                let customPathString = document.location.origin + "/" + document.location.pathname.split("/")[1];
                if (customPath.length > 0) customPath.forEach(e => customPathString += "/" + e);
                document.location.href = customPathString;
            });
        }

        if (typeof themes === "string") {
            $("article").append(`<hr><div id="article">${themes}</div>`);
            const images = $("#article img");
            for (let i = 0; i < images.length; i++) {
                const image = $(images[i]);
                image.attr("class", "table-img");
                image.attr("id", `table-img-${i}`);
                image.attr("onclick", `zoomInOnImage("${i}")`);
                if (image.parent().parent().attr("id") === "article") image.css("width", "100%");
            }
            const article = beforeThemes[path[path.length-1]];
            $("#article").append(`<p class="credit">Publié le ${new Date(article.date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} par ${article.author}.</p>`);
        } else {
            const themesPaths = Object.keys(themes);
            themesPaths.sort((a, b) => {
                return ((themes[a].date !== undefined && themes[b].date !== undefined) ? themes[b].date.localeCompare(themes[a].date) : 0)
            });
            for (const themePath of themesPaths) {
                const theme = themes[themePath];

                const titleLength = 50;
                let title = theme.title;
                if (title.length >= titleLength)
                    title = title.slice(0, titleLength-1) + "...";

                (theme.type === "folder" ? $("#grid-list") : $("#grid-blog")).append(
                    `<a id="${themePath}" class="${theme.type}-grid-case" href="${redirect(themePath)}">${title}</a>`
                );

                if (theme.type === "blog")
                    $(`#${themePath}`).append(`<p class="blog-date">${new Date(theme.date).toLocaleDateString()}</p>`);
            }
        }

        if (document.getElementById("grid-list").children.length === 0) {
            $("#list-hr").remove();
            $("#grid-list").remove();
        }
        if (document.getElementById("grid-blog").children.length === 0) {
            $("#blog-hr").remove();
            $("#grid-blog").remove();
        }
    });
}