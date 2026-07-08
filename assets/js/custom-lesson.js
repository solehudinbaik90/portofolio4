/* ==========================================
   custom lesson js
   ========================================== */

// --- Animated Tab Title ---
(function () {
    const baseTitle = "MSOLEH | TUTOR";
    const loader = ["🕛","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚"];
    let i = 0;
    setInterval(() => {
        document.title = loader[i] + " " + baseTitle;
        i = (i + 1) % loader.length;
    }, 200);
})();

// --- Home Link Handler ---
(function () {
    const homeLink = document.getElementById("homeLink");
    if (!homeLink) return;

    let clickTimer = null;

    homeLink.addEventListener("click", function (e) {
        if (clickTimer === null) {
            clickTimer = setTimeout(() => {
                window.location.href = "index.html";
                clickTimer = null;
            }, 300);
        } else {
            e.preventDefault();
            clearTimeout(clickTimer);
            clickTimer = null;
            window.open("admin", "_blank");
        }
    });
})();

// --- Video Card: Replace thumbnail with embedded YouTube player ---
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".video-card").forEach(card => {
        card.addEventListener("click", function () {
            const videoId = this.dataset.video;
            const iframe = document.createElement("iframe");
             iframe.src = "https://www.youtube.com/embed/"+videoId+"?autoplay=1";
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.style.width = "100%";
            iframe.style.height = "250px";
            iframe.style.borderRadius = "10px";
            this.innerHTML = "";
            this.appendChild(iframe);
        });
    });
});
