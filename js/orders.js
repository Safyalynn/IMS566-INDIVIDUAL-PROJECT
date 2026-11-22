const orderBody = document.getElementById("orders-table");
const orderModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("order-modal"));
const ORDER_STATUSES = ["Pending", "Preparing", "Completed", "Cancelled"];

const orderNumber = order => Number(String(order.id).split("-")[1]) || 0;
const formatOrderDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });


// Only products that still have stock can be ordered.
function renderOrderProductOptions() {
  const select = document.getElementById("order-product");
  const available = Bakery.getProducts().filter(p => p.stock > 0);
  select.innerHTML = available.length
    ? available.map(p => `<option value="${p.id}">${Bakery.escapeHTML(p.name)} - ${Bakery.money(p.price)} (${p.stock} available)</option>`).join("")
    : '<option value="">No available stock</option>';
  updatePreview();
}

// Shows the total for the chosen product
function updatePreview() {
  const product = Bakery.getProducts().find(p => p.id === Number(document.getElementById("order-product").value));
  const quantity = Number(document.getElementById("order-quantity").value) || 0;
  document.getElementById("order-total-preview").textContent = Bakery.money(product ? product.price * quantity : 0);
}

/* ---------- Orders table ---------- */
function renderOrders() {
  const all = Bakery.getOrders();
  const query = document.getElementById("order-search").value.toLowerCase();
  const status = document.getElementById("status-filter").value;
  const rows = all.filter(o =>
    (o.id.toLowerCase().includes(query) || o.customer.toLowerCase().includes(query)) &&
    (status === "all" || o.status === status)
  );

  document.getElementById("orders-all").textContent = all.length;
  document.getElementById("orders-pending").textContent = all.filter(o => ["Pending", "Preparing"].includes(o.status)).length;
  document.getElementById("orders-completed").textContent = all.filter(o => o.status === "Completed").length;
  document.getElementById("order-results").textContent = `Showing ${rows.length} of ${all.length} orders`;

  // Newest first
  rows.sort((a, b) => b.date.localeCompare(a.date) || orderNumber(b) - orderNumber(a));

  orderBody.innerHTML = rows.length
    ? rows.map(o => `<tr>
        <td><strong>${Bakery.escapeHTML(o.id)}</strong></td>
        <td>${Bakery.escapeHTML(o.customer)}</td>
        <td>${o.quantity} × ${Bakery.escapeHTML(o.product)}</td>
        <td>${formatOrderDate(o.date)}</td>
        <td>${Bakery.money(o.total)}</td>
        <td><span class="status-pill ${Bakery.statusClass(o.status)}">${Bakery.escapeHTML(o.status)}</span></td>
        <td class="text-end">
          <select class="form-select form-select-sm d-inline-block" style="width:125px" aria-label="Update order status ${Bakery.escapeHTML(o.id)}" onchange="changeOrderStatus('${o.id}', this.value)">
            ${ORDER_STATUSES.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="7" class="empty-state">No orders match your search.</td></tr>';
}


window.changeOrderStatus = function (id, status) {
  const all = Bakery.getOrders();
  const order = all.find(o => o.id === id);
  if (!order) return;
  order.status = status;
  Bakery.saveOrders(all);
  renderOrders();
};

/* ---------- Save new order ---------- */
document.getElementById("order-form").addEventListener("submit", e => {
  e.preventDefault();
  const products = Bakery.getProducts();
  const product = products.find(p => p.id === Number(document.getElementById("order-product").value));
  const quantity = Number(document.getElementById("order-quantity").value);
  if (!product || quantity < 1 || quantity > product.stock) {
    alert("Please select an available product and enter a quantity within the current stock.");
    return;
  }

  const customerName = document.getElementById("customer-name").value.trim();
  const orders = Bakery.getOrders();
  const nextNumber = orders.reduce((max, o) => Math.max(max, orderNumber(o), 1000), 1000) + 1;
  orders.push({
    id: "CC-" + nextNumber,
    customer: customerName,
    product: product.name,
    quantity,
    total: product.price * quantity,
    date: new Date().toISOString().slice(0, 10),
    status: document.getElementById("order-status").value
  });
  product.stock -= quantity;
  Bakery.saveProducts(products);
  Bakery.saveOrders(orders);

  const customers = Bakery.getCustomers();
  if (!customers.some(c => c.name.toLowerCase() === customerName.toLowerCase())) {
    customers.push({ id: Bakery.nextId(customers), name: customerName, email: "Not provided", phone: "Not provided" });
    Bakery.saveCustomers(customers);
  }

  orderModal.hide();
  document.getElementById("order-form").reset();
  renderOrderProductOptions();
  renderOrders();
});

document.getElementById("order-product").addEventListener("change", updatePreview);
document.getElementById("order-quantity").addEventListener("input", updatePreview);
document.getElementById("order-search").addEventListener("input", renderOrders);
document.getElementById("status-filter").addEventListener("change", renderOrders);
document.getElementById("order-modal").addEventListener("show.bs.modal", renderOrderProductOptions);
renderOrderProductOptions();
renderOrders();
