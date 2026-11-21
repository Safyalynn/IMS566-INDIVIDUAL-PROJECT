const form = document.getElementById("register-form");

const alertBox = document.getElementById("register-alert");

document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());

const existing = Bakery.getSession();

if (existing) location.replace(existing.role === "admin" ? "index.html" : "shop.html");

function showError(message) {
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");

  alertBox.scrollIntoView({block:"nearest"});
}

form.addEventListener("submit", function (event) {

  event.preventDefault();

  alertBox.classList.add("d-none");

  const name = document.getElementById("reg-name").value.trim();

  const email = document.getElementById("reg-email").value.trim();

  const phone = document.getElementById("reg-phone").value.trim() || "Not provided";

  const username = document.getElementById("reg-username").value.trim();

  const password = document.getElementById("reg-password").value;

  const confirm = document.getElementById("reg-confirm").value;

  if (!name || !email || !username || !password) return showError("Please fill in all required fields.");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("Please enter a valid email address.");

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return showError("Username must be 3 to 20 characters: letters, numbers or underscore.");

  // make sure password atleast 6 characters
  if (password.length < 6) return showError("Password must be at least 6 characters.");

  if (password !== confirm) return showError("Passwords do not match.");

  const users = Bakery.getUsers(), customers = Bakery.getCustomers();

  if (username.toLowerCase() === Bakery.adminAccount.username || users.some(u => u.username.toLowerCase() === username.toLowerCase())) return showError("That username is already taken. Please choose another.");

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase()) ) return showError("An account with this email already exists. Try signing in instead.");

  users.push({username, password, role: "customer", name, email, phone});

  Bakery.saveUsers(users);

  if (!customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {

    customers.push({id: Bakery.nextId(customers), name, email, phone});

    Bakery.saveCustomers(customers);
  }

  location.href = "login.html?registered=1";
});