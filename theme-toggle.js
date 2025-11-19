if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

const btn = document.createElement("button");
btn.className = "theme-toggle-btn";
btn.innerText = document.body.classList.contains("dark-mode")
  ? "☀ Light Mode"
  : "🌙 Dark Mode";

document.body.appendChild(btn);

btn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");
  btn.innerText = isDark ? "☀ Light Mode" : "🌙 Dark Mode";

  localStorage.setItem("theme", isDark ? "dark" : "light");
});
