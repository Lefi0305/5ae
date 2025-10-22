// ---- Simple router between sections ----
const sections = {
  home: document.getElementById("screen-home"),
  booking: document.getElementById("screen-booking"),
  ticket: document.getElementById("screen-ticket"),
};

function setActiveScreen(key){
  // panels
  Object.values(sections).forEach(s => s.classList.remove("active"));
  sections[key].classList.add("active");

  // nav
  document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("is-active"));
  const nav = document.querySelector(`.nav-link[data-goto="${key}"]`);
  if (nav) nav.classList.add("is-active");

  // stepper
  document.querySelectorAll(".step").forEach((s,i) => {
    s.classList.toggle("is-active", i === (["home","booking","ticket"].indexOf(key)));
  });
  // lines color (optional) – could be extended
}

document.addEventListener("click", (e) => {
  const anchor = e.target.closest("[data-goto]");
  if (!anchor) return;
  e.preventDefault();

  const id = anchor.getAttribute("data-goto");
  if (id === "screen-booking") setActiveScreen("booking");
  else if (id === "screen-ticket") setActiveScreen("ticket");
  else if (id === "screen-home" || id === "home") setActiveScreen("home");
  else if (id === "booking") setActiveScreen("booking");
  else if (id === "ticket") setActiveScreen("ticket");
});

// ---- Select a trip and update total ----
const list = document.querySelector(".list");
if (list){
  list.addEventListener("click", (e) => {
    const item = e.target.closest(".trip");
    if (!item) return;
    document.querySelectorAll(".trip").forEach(li => li.classList.remove("selected"));
    item.classList.add("selected");

    const price = item.querySelector(".price")?.textContent?.replace("$","").trim() || "10";
    const totalEl = document.querySelector(".total strong");
    if (totalEl) totalEl.textContent = price;
  });
}

// default screen
setActiveScreen("home");
