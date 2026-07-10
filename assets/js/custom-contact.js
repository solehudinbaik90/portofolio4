/* ==========================================
   custom contact js
   ========================================== */

// --- Animated Tab Title --- //
(function () {
    const baseTitle = "MSOLEH | KONTAK";
    const loader = ["🕛","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚"];
    let i = 0;
    setInterval(() => {
        document.title = loader[i] + " " + baseTitle;
        i = (i + 1) % loader.length;
    }, 200);
})();

// --- Home Link Handler ---//
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

// --- FORMULIR PESAN --- //

  const SCRIPT_URL         = "https://script.google.com/macros/s/AKfycbzJXq9ebaUbVXVgNUt1V7CAZqI4AOzYDv-mGyTmGYtPwv3PzRMzI904eOAIJMxIQ0FZ/exec";
const RECAPTCHA_SITE_KEY  = "6LfZUkwtAAAAAJ40Yg2QOJJI_7WfAatRayNrrfAt";

const form      = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const status    = document.getElementById("formStatus");

function setStatus(message, isSuccess) {
  status.style.color = isSuccess ? "green" : "red";
  status.textContent = message;
}

function setLoading(isLoading) {
  submitBtn.disabled    = isLoading;
  submitBtn.textContent = isLoading ? "Mengirim..." : "Kirim Pesan";
}

grecaptcha.ready(function () {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setLoading(true);
    setStatus("", true);

    try {
      const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "submit" });

      const formData = new FormData(form);
      formData.append("recaptchaToken", token);

      const res  = await fetch(SCRIPT_URL, { method: "POST", body: formData });
      const data = await res.json();

      if (data.result === "success") {
        setStatus("✅ Pesan berhasil dikirim! Terima kasih.", true);
        form.reset();
      } else {
        throw new Error(data.error || "Terjadi kesalahan pada server.");
      }

    } catch (err) {
      setStatus("❌ Gagal mengirim: " + err.message, false);
    } finally {
      setLoading(false);
    }
  });
});
