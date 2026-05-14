const header = document.querySelector(".site-header");
const modal = document.querySelector("#inquiry-modal");
const inquiryForm = document.querySelector("#inquiry-form");
const firstInput = document.querySelector("#inquiry-name");
const formNote = document.querySelector("#form-note");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

function openInquiry() {
  modal.hidden = false;
  document.body.classList.add("modal-open");
  window.setTimeout(() => firstInput?.focus(), 0);
}

function closeInquiry() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-open-inquiry]").forEach((button) => {
  button.addEventListener("click", openInquiry);
});

document.querySelectorAll("[data-close-inquiry]").forEach((button) => {
  button.addEventListener("click", closeInquiry);
});

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeInquiry();
});

inquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(inquiryForm);
  const fields = {
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") || "Nije navedeno",
    location: formData.get("location") || "Nije navedeno",
    stage: formData.get("stage"),
    message: formData.get("message")
  };

  const body = [
    `Ime i prezime: ${fields.name}`,
    `E-mail: ${fields.email}`,
    `Tvrtka: ${fields.company}`,
    `Lokacija projekta: ${fields.location}`,
    `Faza projekta: ${fields.stage}`,
    "",
    "Detalji projekta:",
    fields.message
  ].join("\n");

  formNote.textContent = "Otvaramo vaš e-mail klijent s pripremljenim upitom.";
  window.location.href = `mailto:info@stratik.hr?subject=${encodeURIComponent("Upit za Stratik d.o.o.")}&body=${encodeURIComponent(body)}`;
});

updateHeader();
