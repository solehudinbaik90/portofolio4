/* ==========================================
   custom contact js
   ========================================== */

// --- Animated Tab Title ---
(function () {
    const baseTitle = "MSOLEH | KONTAK";
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

// --- FORM PESAN --- //

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz5gL60I9g-fwaQY0Mu3BdErdW-nVaRJBiRBY4sP8MsZYsm7S4xjLH3ZW70Xpi6oJE/exec";

  document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const btn = document.getElementById("submitBtn");
    const status = document.getElementById("formStatus");

    btn.disabled = true;
    btn.textContent = "Mengirim...";
    status.textContent = "";

    const formData = new FormData(form);

    fetch(SCRIPT_URL, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result === "success") {
          status.style.color = "green";
          status.textContent = "✅ Pesan berhasil dikirim! Terima kasih.";
          form.reset();
        } else {
          throw new Error(data.error || "Terjadi kesalahan.");
        }
      })
      .catch((err) => {
        status.style.color = "red";
        status.textContent = "❌ Gagal mengirim: " + err.message;
      })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "Kirim Pesan";
      });
  });
