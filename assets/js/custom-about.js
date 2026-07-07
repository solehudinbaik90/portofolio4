/* ==========================================
   custom about js
   ========================================== */

// --- Animated Tab Title ---
(function () {
    const baseTitle = "MSOLEH | ABOUT";
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

// --- Skill Info Popup ---
function showInfo(box) {
    // Close all open popups first
    document.querySelectorAll(".skill-info").forEach(item => {
        item.style.display = "none";
    });

    const info = box.querySelector(".skill-info");
    if (info) {
        info.style.display = "block";
        document.getElementById("overlay").style.display = "block";
    }
}

function closeAllPopups() {
    document.getElementById("overlay").style.display = "none";
    document.querySelectorAll(".skill-info").forEach(item => {
        item.style.display = "none";
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Close on overlay click
    const overlay = document.getElementById("overlay");
    if (overlay) {
        overlay.addEventListener("click", closeAllPopups);
    }

    // Close on ESC key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAllPopups();
    });

    // Animate progress bars
    document.querySelectorAll(".progress span").forEach(bar => {
        const width = bar.dataset.width;
        setTimeout(() => {
            bar.style.width = width + "%";
        }, 300);
    });
});
