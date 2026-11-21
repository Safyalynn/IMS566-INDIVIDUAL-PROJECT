
const customerBody = document.getElementById("customers-table");
const customerModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("customer-modal"));

const customerOrderNumber = order => Number(String(order.id).split("-")[1]) || 0;

function renderCustomers() {
  const all = Bakery.getCustomers();
  const orders = Bakery.getOrders();
  const query = document.getElementById("customer-search").value.toLowerCase();

  const ordersOf = customer => orders.filter(o => o.customer.toLowerCase() === customer.name.toLowerCase());
  // The newest order of a customer: latest date, then highest order number.
  const newestOrder = customer => ordersOf(customer).sort((a, b) => b.date.localeCompare(a.date) || customerOrderNumber(b) - customerOrderNumber(a))[0];

  const rows = all
    .filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
    .sort((a, b) => {
      const newestA = newestOrder(a), newestB = newestOrder(b);
      if (newestA && newestB) return newestB.date.localeCompare(newestA.date) || customerOrderNumber(newestB) - customerOrderNumber(newestA);
      if (newestA) return -1; 
      if (newestB) return 1;
      return b.id - a.id;  
    });

  // Summary counters
  document.getElementById("customers-total").textContent = all.length;
  document.getElementById("customers-repeat").textContent = all.filter(c => ordersOf(c).length > 1).length;
  document.getElementById("customers-orders").textContent = orders.length;
  document.getElementById("customer-results").textContent = `Showing ${rows.length} of ${all.length} customers`;

  customerBody.innerHTML = rows.length
    ? rows.map(c => `<tr>
        <td><div class="product-cell"><span class="avatar">${Bakery.escapeHTML(c.name.charAt(0).toUpperCase())}</span>${Bakery.escapeHTML(c.name)}</div></td>
        <td>${Bakery.escapeHTML(c.email)}</td>
        <td>${Bakery.escapeHTML(c.phone)}</td>
        <td>${ordersOf(c).length}</td>
        <td class="text-end"><button class="action-btn danger" aria-label="Delete ${Bakery.escapeHTML(c.name)}" onclick="deleteCustomer(${c.id})"><i class="bi bi-trash3"></i></button></td>
      </tr>`).join("")
    : '<tr><td colspan="5" class="empty-state">No customers match your search.</td></tr>';
}

// Called from the delete button in each row.
window.deleteCustomer = function (id) {
  const customer = Bakery.getCustomers().find(c => c.id === id);
  if (!customer) return;
  if (!confirm(`Delete customer "${customer.name}"? Existing order records will remain.`)) return;
  Bakery.saveCustomers(Bakery.getCustomers().filter(c => c.id !== id));
  renderCustomers();
};

// Add a customer
document.getElementById("customer-form").addEventListener("submit", e => {
  e.preventDefault();
  const all = Bakery.getCustomers();
  const name = document.getElementById("customer-fullname").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  if (all.some(c => c.email.toLowerCase() === email.toLowerCase())) {
    alert("A customer with this email address already exists.");
    return;
  }
  all.push({ id: Bakery.nextId(all), name, email, phone: document.getElementById("customer-phone").value.trim() });
  Bakery.saveCustomers(all);
  customerModal.hide();
  e.target.reset();
  renderCustomers();
});

document.getElementById("customer-search").addEventListener("input", renderCustomers);
renderCustomers();
