const imgZoomEle = $("#img-zoom-in-div");
const imgZoomBgEle = $("#img-zoom-in-bg");

function zoomInOnImage(idImage) {
    imgZoomEle.empty();
    imgZoomEle.append(`<img src="${$("#table-img-" + idImage).attr("src")}" id="img-zoom-in">`);

    imgZoomBgEle.css("display", "flex");
    setTimeout(() => {
        imgZoomBgEle.css("opacity", 1);
        imgZoomEle.css("transform", "scale(1)");

        $.getJSON("./imgs/data.json", (data) => {
            const imageName = $("#img-zoom-in").attr("src").replace("imgs/", "");
            if (data.hasOwnProperty(imageName)) {
                const imageData = data[imageName];
                for (let i = 0; i < imageData.length; i++) {
                    const faceData = imageData[i];
                    imgZoomEle.append(
                        `<div style="transform: translate(${faceData.x}px, ${faceData.y}px); width: ${faceData.size}px; height: ${faceData.size}px;" class="faces" id="face-${i}">
                            <span class="tooltiptext">${faceData.name}</span>
                        </div>
                        `);
                }
            }
        });
    }, 1);
}

imgZoomBgEle.click(() => {
    imgZoomBgEle.css("opacity", 0);
    imgZoomEle.css("transform", "scale(0)");
    setTimeout(() => {
        imgZoomBgEle.css("display", "none");
    }, 500);
});
