function zoomInOnImage(idImage) {
    $("#img-zoom-in-div").empty();
    $("#img-zoom-in-div").append(`<img src="${$("#table-img-" + idImage).attr("src")}" id="img-zoom-in">`);

    $("#img-zoom-in-bg").css("display", "flex");
    setTimeout(() => {
        $("#img-zoom-in-bg").css("opacity", 1);
        $("#img-zoom-in-div").css("transform", "scale(1)");
        $.getJSON("./imgs/data.json", (data) => {
            const imageName = $("#img-zoom-in").attr("src").replace("imgs/", "");
            if (data.hasOwnProperty(imageName)) {
                const imageData = data[imageName];
                for (i = 0; i < imageData.length; i++) {
                    const faceData = imageData[i];
                    $("#img-zoom-in-div").append(
                        `<div style="transform: translate(${faceData.x}px, ${faceData.y}px); width: ${faceData.size}px; height: ${faceData.size}px;" class="faces" id="face-${i}">
                            <span class="tooltiptext">${faceData.name}</span>
                        </div>
                        `);
                }
            }
        });
    }, 1);
}
$("#img-zoom-in-bg").click(() => {
    $("#img-zoom-in-bg").css("opacity", 0);
    $("#img-zoom-in-div").css("transform", "scale(0)");
    setTimeout(() => {
        $("#img-zoom-in-bg").css("display", "none");
    }, 500);
});