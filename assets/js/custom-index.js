/* ==========================================
   custom index js
   ========================================== */

// --- Animated Tab Title ---
(function () {
    const baseTitle = "MSOLEH | HOME";
    const loader = ["🕛","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚"];
    let i = 0;
    setInterval(() => {
        document.title = loader[i] + " " + baseTitle;
        i = (i + 1) % loader.length;
    }, 200);
})();

// --- Home Link: Single click = navigate, Double click = open admin ---
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

// --- Typed.js Initialization ---
document.addEventListener("DOMContentLoaded", function () {
    const titles = [
        "Sang Pendidik",
        "Sang Petani",
        "Desainer Web",
        "Desainer Grafis",
        "Pecinta Alam"
    ];

    new Typed("#typed-text", {
        strings: titles,
        typeSpeed: 80,
        backSpeed: 40,
        backDelay: 1500,
        startDelay: 300,
        loop: true,
        showCursor: true
    });
});
