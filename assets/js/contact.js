"use strict";

const contactForm = document.querySelector(".contact-form");
contactForm?.addEventListener("submit", (event) => event.preventDefault());
contactForm?.querySelector("button")?.addEventListener("click", () => {
  contactForm.reportValidity();
});
