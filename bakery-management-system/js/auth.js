
const loginForm = document.getElementById("login-form");


const alertBox = document.getElementById("login-alert");


const registered = new URLSearchParams(location.search).get("registered");

// Jika login succeed, paparkan mesej pengesahan pada halaman login
if (registered) {
  const ok = document.getElementById("login-success");
  if (ok) ok.classList.remove("d-none");
}

// Memaparkan tahun semasa automatically
document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());


const existing = Bakery.getSession();


if (existing) location.replace(existing.role === "admin" ? "index.html" : "shop.html");

// Fungsi untuk memaparkan atau menyembunyikan password
document.getElementById("toggle-password").addEventListener("click", function () {


  const input = document.getElementById("password");

  const visible = input.type === "password";

  input.type = visible ? "text" : "password";

  this.innerHTML = visible ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';

  this.setAttribute("aria-label", visible ? "Hide password" : "Show password");
});

function showError(message) {
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

loginForm.addEventListener("submit", function (event) {

  event.preventDefault();

  alertBox.classList.add("d-none");

  const username = document.getElementById("username").value.trim();

  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("Please enter both your username and password.");
    return;
  }

  const accounts = [Bakery.adminAccount, ...Bakery.getUsers()];

  const account = accounts.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);

  if (!account) {
    showError("Invalid username or password. Please check your details and try again.");
    return;
  }

  Bakery.write(Bakery.keys.session, {
    username: account.username,
    name: account.name,
    role: account.role,
    signedInAt: new Date().toISOString()
  });

  location.href = account.role === "admin" ? "index.html" : "shop.html";
});