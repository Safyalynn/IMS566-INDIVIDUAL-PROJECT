
(function () {
  "use strict";

  const KEYS = {
    products: "crumb_products",
    orders: "crumb_orders",
    customers: "crumb_customers",
    session: "crumb_session",
    users: "crumb_users",
    seedVersion: "crumb_seed_version"
  };

  const SEED_VERSION = "2";

  const ADMIN_ACCOUNT = { username: "admin", password: "admin1122", role: "admin", name: "Bakery Admin" };

  /*  Sample data  */
  const initialUsers = [
    { username: "aisha", password: "aisha000", role: "customer", name: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "012-345 6789" }
  ];
  const initialProducts = [
    { id: 1, name: "Butter Croissant", category: "Pastry", price: 7.5, stock: 32 },
    { id: 2, name: "Sourdough Loaf", category: "Bread", price: 14, stock: 18 },
    { id: 3, name: "Chocolate Fudge Cake", category: "Cake", price: 95, stock: 7 },
    { id: 4, name: "Almond Danish", category: "Pastry", price: 8.5, stock: 24 },
    { id: 5, name: "Sea Salt Cookies", category: "Cookies", price: 5, stock: 4 },
    { id: 6, name: "Iced Latte", category: "Drinks", price: 11, stock: 40 }
  ];
  const initialCustomers = [
    { id: 1, name: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "012-345 6789" },
    { id: 2, name: "Daniel Lee", email: "daniel.lee@example.com", phone: "013-456 7890" },
    { id: 3, name: "Nur Iman", email: "nur.iman@example.com", phone: "014-567 8901" },
    { id: 4, name: "Jason Tan", email: "jason.tan@example.com", phone: "016-678 9012" }
  ];

  // date today".
  const dateOffset = days => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const initialOrders = [
    { id: "CC-1001", customer: "Aisha Rahman", product: "Butter Croissant", quantity: 4, total: 30, date: dateOffset(0), status: "Completed" },
    { id: "CC-1002", customer: "Daniel Lee", product: "Chocolate Fudge Cake", quantity: 1, total: 95, date: dateOffset(0), status: "Pending" },
    { id: "CC-1003", customer: "Nur Iman", product: "Sourdough Loaf", quantity: 2, total: 28, date: dateOffset(1), status: "Preparing" },
    { id: "CC-1004", customer: "Jason Tan", product: "Iced Latte", quantity: 3, total: 33, date: dateOffset(2), status: "Completed" },
    { id: "CC-1005", customer: "Aisha Rahman", product: "Almond Danish", quantity: 5, total: 42.5, date: dateOffset(3), status: "Completed" }
  ];


  function buildHistoricalOrders() {
    const orders = [];
    const now = new Date();
    const dayPattern = [2, 4, 6, 9, 11, 13, 16, 18, 20, 22, 24, 26, 27, 28];

    const productMix = [0, 5, 1, 3, 0, 4, 5, 1, 3, 0, 5, 4, 1, 2];
    let counter = 100;
    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      let days = dayPattern;
      let count = 6 + (5 - monthsAgo) * 2;
      if (monthsAgo === 0) {

        days = dayPattern.filter(d => d <= now.getUTCDate() - 4);
        count = Math.min(days.length, 8);
      }
      for (let i = 0; i < count; i++) {
        const product = initialProducts[productMix[i % productMix.length]];
        const customer = initialCustomers[(i + monthsAgo) % initialCustomers.length];
        const quantity = 1 + (i % 3);
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, days[i % days.length]));
        counter++;
        orders.push({
          id: "CC-" + String(counter).padStart(4, "0"),
          customer: customer.name,
          product: product.name,
          quantity,
          total: product.price * quantity,
          date: date.toISOString().slice(0, 10),
          status: counter % 23 === 0 ? "Cancelled" : "Completed"
        });
      }
    }
    return orders;
  }

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function seed() {
    if (!localStorage.getItem(KEYS.products)) write(KEYS.products, initialProducts);
    if (!localStorage.getItem(KEYS.orders)) write(KEYS.orders, initialOrders);
    if (!localStorage.getItem(KEYS.customers)) write(KEYS.customers, initialCustomers);
    if (!localStorage.getItem(KEYS.users)) write(KEYS.users, initialUsers);
    migrateDemoCustomer();
    addHistoricalOrders();
  }

  function addHistoricalOrders() {
    if (localStorage.getItem(KEYS.seedVersion) === SEED_VERSION) return;
    const orders = read(KEYS.orders, []);
    const known = new Set(orders.map(o => o.id));
    buildHistoricalOrders().forEach(o => { if (!known.has(o.id)) orders.push(o); });
    write(KEYS.orders, orders);
    write(KEYS.seedVersion, SEED_VERSION);
  }

  function migrateDemoCustomer() {
    const users = read(KEYS.users, []);
    const legacy = users.find(u => u.username === "customer" && u.password === "customer123");
    if (!legacy || users.some(u => u.username.toLowerCase() === "aisha")) return;
    legacy.username = "aisha";
    legacy.password = "aisha000";
    write(KEYS.users, users);
    const orders = read(KEYS.orders, []);
    orders.forEach(o => { if (o.username === "customer") o.username = "aisha"; });
    write(KEYS.orders, orders);
    const session = read(KEYS.session, null);
    if (session && session.username === "customer") {
      session.username = "aisha";
      write(KEYS.session, session);
    }
  }

  function money(value) {
    return "RM " + Number(value || 0).toFixed(2);
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function statusClass(status) {
    return "status-" + String(status).toLowerCase();
  }


  function getSession() {
    const session = read(KEYS.session, null);
    if (session && (session.role === "admin" || session.role === "customer")) return session;
    if (session) localStorage.removeItem(KEYS.session);
    return null;
  }

  function requireAuth(requiredRole) {
    const session = getSession();
    if (!session) {
      location.replace("login.html");
      return false;
    }
    if (session.role !== requiredRole) {
      location.replace(session.role === "admin" ? "index.html" : "shop.html");
      return false;
    }
    return true;
  }
  function signOut() {
    localStorage.removeItem(KEYS.session);
    location.href = "login.html";
  }

  function renderShell() {
    const host = document.getElementById("app-shell");
    if (!host) return;
    const page = document.body.dataset.page;
    const session = getSession();
    const links = [
      ["dashboard", "index.html", "bi-grid-1x2", "Dashboard"],
      ["products", "products.html", "bi-basket2", "Products"],
      ["orders", "orders.html", "bi-receipt", "Orders"],
      ["customers", "customers.html", "bi-people", "Customers"]
    ];
    const navLinks = links.map(([id, url, icon, label]) =>
      `<a href="${url}" class="${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""}><i class="bi ${icon}"></i>${label}</a>`
    ).join("");
    const displayName = session && session.name || "Bakery Admin";

    host.innerHTML = `<aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <a href="index.html" class="brand brand-light text-decoration-none"><span class="brand-mark"><i class="bi bi-cake2"></i></span><span>crumb <b>& co.</b></span></a>
        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="sidebar-menu"><i class="bi bi-list"></i></button>
      </div>
      <div class="sidebar-menu" id="sidebar-menu">
        <p class="side-label">WORKSPACE</p>
        <nav class="side-nav" aria-label="Main navigation">${navLinks}</nav>
        <div class="sidebar-bottom">
          <div class="profile-row"><div class="avatar">${escapeHTML(displayName.charAt(0).toUpperCase())}</div><div><div class="profile-name">${escapeHTML(displayName)}</div><div class="profile-role">Admin / Staff</div></div></div>
          <button class="logout-link" id="logout-btn" type="button"><i class="bi bi-box-arrow-left me-2"></i>Sign out</button>
        </div>
      </div>
    </aside>`;

    document.getElementById("logout-btn").addEventListener("click", signOut);
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("nav-toggle");
    toggle.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
    });
  }

  function setYears() {
    document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());
  }

  /* ---------- Start-up ---------- */
  seed();
  if (document.body.dataset.page) {
    if (requireAuth("admin")) renderShell();
  } else if (document.body.dataset.role === "customer") {
    requireAuth("customer");
  }
  setYears();

  /* ---------- Public API ---------- */
  window.Bakery = {
    keys: KEYS,
    adminAccount: ADMIN_ACCOUNT,
    signOut, read, write, money, escapeHTML, statusClass, getSession,
    getProducts: () => read(KEYS.products, []),
    saveProducts: value => write(KEYS.products, value),
    getOrders: () => read(KEYS.orders, []),
    saveOrders: value => write(KEYS.orders, value),
    getUsers: () => read(KEYS.users, []),
    saveUsers: value => write(KEYS.users, value),
    getCustomers: () => read(KEYS.customers, []),
    saveCustomers: value => write(KEYS.customers, value),
    nextId: items => items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  };
})();
