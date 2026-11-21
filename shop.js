/* CUSTOMER STOREFRONT */
const session = Bakery.getSession();

if (session && session.role === "customer") {

  const grid = document.getElementById("shop-grid");

  const buyModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("buy-modal"));

  const alertBox = document.getElementById("shop-alert");

  const icon = c => c === "Bread" ? "bi-basket" : c === "Cake" ? "bi-cake2" : c === "Drinks" ? "bi-cup-straw" : "bi-cookie";

  document.getElementById("shop-name").textContent = session.name;

  document.getElementById("shop-avatar").textContent = session.name.charAt(0).toUpperCase();

  document.getElementById("shop-greeting").textContent = "Hello, " + session.name.split(" ")[0] + ".";

  document.getElementById("shop-logout").addEventListener("click", Bakery.signOut);

  document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());

  function flash(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 4000);
  }


  const isMine = o => o.username ? o.username === session.username : o.customer.toLowerCase() === session.name.toLowerCase();

  // PRODUCT DISPLAY

  function renderProducts() {

    const all = Bakery.getProducts(),
      q = document.getElementById("shop-search").value.toLowerCase(),
      cat = document.getElementById("shop-category").value;


    const rows = all.filter(p =>
      (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
      (cat === "all" || p.category === cat)
    );

    document.getElementById("shop-results").textContent = `Showing ${rows.length} of ${all.length} products`;

    grid.innerHTML = rows.length ? rows.map(p => {

      const out = p.stock <= 0, low = p.stock > 0 && p.stock <= 5;

      return `<div class="col-12 col-sm-6 col-lg-4"><article class="shop-card">

        <div class="shop-thumb"><i class="bi ${icon(p.category)}"></i></div>

        <div class="shop-card-body">
          <span class="subtle-tag">${Bakery.escapeHTML(p.category)}</span>

          <h3>${Bakery.escapeHTML(p.name)}</h3>

          <div class="shop-card-foot">
            <strong>${Bakery.money(p.price)}</strong>

            <span class="status-pill ${out ? "status-cancelled" : low ? "status-pending" : "status-completed"}">
              ${out ? "Sold out" : low ? "Only " + p.stock + " left" : "In stock"}
            </span>
          </div>

          <!-- Butang untuk membuka borang pesanan -->
          <button class="btn btn-dark w-100 mt-3" ${out ? "disabled" : ""} onclick="openBuy(${p.id})">
            <i class="bi bi-bag-plus me-2"></i>Order
          </button>

        </div>
      </article></div>`;

    }).join("") : '<div class="col-12"><div class="empty-state"><i class="bi bi-basket"></i>No products match your search.</div></div>';
  }

  // PAPARAN PESANAN PELANGGAN
  function renderMyOrders() {

    const mine = Bakery.getOrders()
      .filter(isMine)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    document.getElementById("my-orders-table").innerHTML = mine.length ? mine.map(o => `<tr>

      <td><strong>${Bakery.escapeHTML(o.id)}</strong></td>
      <td>${o.quantity} × ${Bakery.escapeHTML(o.product)}</td>

      <td>${new Date(o.date + "T00:00:00").toLocaleDateString("en-MY", {
        day:"2-digit", month:"short", year:"numeric"
      })}</td>

      <td>${Bakery.money(o.total)}</td>

      <td>
        <span class="status-pill ${Bakery.statusClass(o.status)}">
          ${Bakery.escapeHTML(o.status)}
        </span>
      </td>

      <td class="text-end">
        ${o.status === "Pending" ? `<button class="action-btn danger" onclick="cancelMyOrder('${Bakery.escapeHTML(o.id)}')">Cancel</button>` : ""}
      </td>

    </tr>`).join("")

    : '<tr><td colspan="6" class="empty-state"><i class="bi bi-receipt"></i>You have not placed any orders yet.</td></tr>';
  }

  // CREATE ORDERS
  window.openBuy = function (id) {

    const p = Bakery.getProducts().find(x => x.id === id);

    if (!p) return;

    document.getElementById("buy-id").value = p.id;
    document.getElementById("buy-title").textContent = p.name;

    document.getElementById("buy-meta").textContent = `${Bakery.money(p.price)} each · ${p.stock} available`;

    const qty = document.getElementById("buy-qty");
    qty.max = p.stock;
    qty.value = 1;

    updateTotal();
    buyModal.show();
  };

  function updateTotal() {

    const p = Bakery.getProducts().find(x => x.id === Number(document.getElementById("buy-id").value));

    document.getElementById("buy-total").textContent =
      Bakery.money(p ? p.price * (Number(document.getElementById("buy-qty").value) || 0) : 0);
  }

  document.getElementById("buy-qty").addEventListener("input", updateTotal);

  document.getElementById("buy-form").addEventListener("submit", e => {

    e.preventDefault();

    const products = Bakery.getProducts(),
      p = products.find(x => x.id === Number(document.getElementById("buy-id").value));

    const qty = Number(document.getElementById("buy-qty").value);

    if (!p || !Number.isInteger(qty) || qty < 1 || qty > p.stock) {
      alert("Please enter a quantity within the available stock.");
      return;
    }

    const orders = Bakery.getOrders();

    const next = orders.reduce((m, o) => Math.max(m, Number(o.id.split("-")[1]) || 1000), 1000) + 1;

    orders.push({
      id: "CC-" + next,
      customer: session.name,
      username: session.username,
      product: p.name,
      quantity: qty,
      total: p.price * qty,
      date: new Date().toISOString().slice(0, 10),
      status: "Pending"
    });

    p.stock -= qty;

    Bakery.saveProducts(products);
    Bakery.saveOrders(orders);

    buyModal.hide();
    flash(`Order CC-${next} placed: ${qty} × ${p.name}. Thank you!`);

    renderProducts();
    renderMyOrders();
  });

  // CANCEL ORDER
  window.cancelMyOrder = function (id) {

    const orders = Bakery.getOrders(),
      o = orders.find(x => x.id === id);

    if (!o || !isMine(o) || o.status !== "Pending") return;

    if (!confirm(`Cancel order ${o.id}?`)) return;

    o.status = "Cancelled";

    const products = Bakery.getProducts(),
      p = products.find(x => x.name === o.product);

    if (p) {
      p.stock += Number(o.quantity);
      Bakery.saveProducts(products);
    }

    Bakery.saveOrders(orders);

    flash(`Order ${o.id} cancelled.`);
    renderProducts();
    renderMyOrders();
  };

  document.getElementById("shop-search").addEventListener("input", renderProducts);

  document.getElementById("shop-category").addEventListener("change", renderProducts);

  // CUSTOMERS PROFILE
  function loadProfile() {

    const user = Bakery.getUsers().find(u => u.username === session.username);

    if (!user) return;

    document.getElementById("profile-username").textContent = "@" + user.username;
    document.getElementById("pf-name").value = user.name;
    document.getElementById("pf-email").value = user.email || "";

    document.getElementById("pf-phone").value =
      user.phone && user.phone !== "Not provided" ? user.phone : "";
  }

  function profileMsg(type, text) {

    const box = document.getElementById("profile-alert");

    box.className = "alert alert-" + type;
    box.textContent = text;
  }

  document.getElementById("profile-form").addEventListener("submit", e => {

    e.preventDefault();

    const name = document.getElementById("pf-name").value.trim();
    const email = document.getElementById("pf-email").value.trim();
    const phone = document.getElementById("pf-phone").value.trim() || "Not provided";

    const current = document.getElementById("pf-current").value;
    const next = document.getElementById("pf-new").value;
    const confirmPw = document.getElementById("pf-confirm").value;

    if (!name || !email) return profileMsg("danger", "Name and email are required.");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return profileMsg("danger", "Please enter a valid email address.");

    const users = Bakery.getUsers(),
      user = users.find(u => u.username === session.username);

    if (!user) return profileMsg("danger", "Account not found. Please sign in again.");

    const customers = Bakery.getCustomers();

    const oldEmail = (user.email || "").toLowerCase(),
      oldName = user.name;

    const lower = email.toLowerCase();

    if (
      users.some(u => u !== user && (u.email || "").toLowerCase() === lower) ||
      customers.some(c => c.email.toLowerCase() === lower && c.email.toLowerCase() !== oldEmail)
    )
      return profileMsg("danger", "That email address is already used by another account.");

    if (current || next || confirmPw) {

      if (current !== user.password)
        return profileMsg("danger", "Your current password is incorrect.");

      if (next.length < 6)
        return profileMsg("danger", "New password must be at least 6 characters.");

      if (next !== confirmPw)
        return profileMsg("danger", "New passwords do not match.");

      user.password = next;
    }

    // MENGEMAS KINI REKOD PESANAN
    const orders = Bakery.getOrders();

    orders.forEach(o => {
      if (isMine(o)) {
        o.username = session.username;
        o.customer = name;
      }
    });

    Bakery.saveOrders(orders);

    // MENGEMAS KINI REKOD PELANGGAN
    let record =
      customers.find(c => c.email.toLowerCase() === oldEmail) ||
      customers.find(c => c.name.toLowerCase() === oldName.toLowerCase());

    if (record) {
      record.name = name;
      record.email = email;
      record.phone = phone;
    }

    else {
      customers.push({
        id: Bakery.nextId(customers),
        name,
        email,
        phone
      });
    }

    // simpan rekod customer
    Bakery.saveCustomers(customers);

    // MENGEMAS KINI AKAUN PENGGUNA
    user.name = name;
    user.email = email;
    user.phone = phone;

    Bakery.saveUsers(users);

    session.name = name;
    Bakery.write(Bakery.keys.session, session);

    // Mengemas kini nama dan avatar pada halaman kedai
    document.getElementById("shop-name").textContent = name;
    document.getElementById("shop-avatar").textContent = name.charAt(0).toUpperCase();
    document.getElementById("shop-greeting").textContent = "Hello, " + name.split(" ")[0] + ".";

    ["pf-current", "pf-new", "pf-confirm"].forEach(id =>
      document.getElementById(id).value = ""
    );

    profileMsg("success", "Your profile has been updated.");

    renderMyOrders();
  });

  loadProfile();

  renderProducts();
  renderMyOrders();

}