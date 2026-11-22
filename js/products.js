const productBody = document.getElementById("products-table");
const productModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("product-modal"));

const categoryIcon = category =>
  category === "Bread" ? "bi-basket" : category === "Cake" ? "bi-cake2" : category === "Drinks" ? "bi-cup-straw" : "bi-cookie";

function renderProducts() {
  const all = Bakery.getProducts();
  const query = document.getElementById("product-search").value.toLowerCase();
  const category = document.getElementById("category-filter").value;
  const rows = all.filter(p =>
    (p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) &&
    (category === "all" || p.category === category)
  );

  document.getElementById("products-total").textContent = all.length;
  document.getElementById("products-available").textContent = all.filter(p => p.stock > 0).length;
  document.getElementById("products-low").textContent = all.filter(p => p.stock <= 5).length;
  document.getElementById("product-results").textContent = `Showing ${rows.length} of ${all.length} products`;

  productBody.innerHTML = rows.length
    ? rows.map(p => {
        const statusLabel = p.stock === 0 ? "Out of stock" : p.stock <= 5 ? "Low stock" : "Available";
        const statusStyle = p.stock === 0 ? "status-cancelled" : p.stock <= 5 ? "status-pending" : "status-completed";
        return `<tr>
          <td><div class="product-cell"><span class="product-thumb"><i class="bi ${categoryIcon(p.category)}"></i></span>${Bakery.escapeHTML(p.name)}</div></td>
          <td>${Bakery.escapeHTML(p.category)}</td>
          <td>${Bakery.money(p.price)}</td>
          <td>${p.stock}</td>
          <td><span class="status-pill ${statusStyle}">${statusLabel}</span></td>
          <td class="text-end">
            <button class="action-btn me-1" aria-label="Edit ${Bakery.escapeHTML(p.name)}" onclick="editProduct(${p.id})"><i class="bi bi-pencil"></i></button>
            <button class="action-btn danger" aria-label="Delete ${Bakery.escapeHTML(p.name)}" onclick="deleteProduct(${p.id})"><i class="bi bi-trash3"></i></button>
          </td>
        </tr>`;
      }).join("")
    : '<tr><td colspan="6" class="empty-state"><i class="bi bi-basket"></i>No products match your search.</td></tr>';
}

window.editProduct = function (id) {
  const product = Bakery.getProducts().find(p => p.id === id);
  if (!product) return;
  document.getElementById("product-id").value = product.id;
  document.getElementById("product-name").value = product.name;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-stock").value = product.stock;
  document.getElementById("product-modal-title").textContent = "Edit product";
  productModal.show();
};

window.deleteProduct = function (id) {
  const product = Bakery.getProducts().find(p => p.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}" from the product catalogue?`)) return;
  Bakery.saveProducts(Bakery.getProducts().filter(p => p.id !== id));
  renderProducts();
};

// Add product opens an empty form
document.getElementById("add-product-btn").addEventListener("click", () => {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-modal-title").textContent = "Add product";
});

// Save product
document.getElementById("product-form").addEventListener("submit", e => {
  e.preventDefault();
  const all = Bakery.getProducts();
  const id = document.getElementById("product-id").value;
  const product = {
    id: id ? Number(id) : Bakery.nextId(all),
    name: document.getElementById("product-name").value.trim(),
    category: document.getElementById("product-category").value,
    price: Number(document.getElementById("product-price").value),
    stock: Number(document.getElementById("product-stock").value)
  };
  if (!product.name || product.price <= 0 || product.stock < 0) return;
  const index = all.findIndex(p => p.id === product.id);
  if (index >= 0) all[index] = product; else all.push(product);
  Bakery.saveProducts(all);
  productModal.hide();
  renderProducts();
});

document.getElementById("product-search").addEventListener("input", renderProducts);
document.getElementById("category-filter").addEventListener("change", renderProducts);
renderProducts();
