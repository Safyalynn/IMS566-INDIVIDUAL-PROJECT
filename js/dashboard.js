const products = Bakery.getProducts();
const orders = Bakery.getOrders();
const activeOrders = orders.filter(o => o.status !== "Cancelled"); // cancelled orders do not count as sales

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const idNumber = order => Number(String(order.id).split("-")[1]) || 0;
const isoDay = daysAgo => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const formatDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });

/* ---------- Summary cards ---------- */
const today = isoDay(0);
document.getElementById("today-date").textContent = new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
document.getElementById("sales-total").textContent = Bakery.money(activeOrders.reduce((sum, o) => sum + Number(o.total), 0));
document.getElementById("orders-today").textContent = orders.filter(o => o.date === today).length;
document.getElementById("product-count").textContent = products.length;
document.getElementById("pending-count").textContent = orders.filter(o => ["Pending", "Preparing"].includes(o.status)).length;

/* ---------- Recent orders  ---------- */
const recent = [...orders].sort((a, b) => b.date.localeCompare(a.date) || idNumber(b) - idNumber(a)).slice(0, 5);
document.getElementById("recent-orders").innerHTML = recent.length
  ? recent.map(o => `<tr>
      <td><strong>${Bakery.escapeHTML(o.id)}</strong></td>
      <td>${Bakery.escapeHTML(o.customer)}</td>
      <td>${formatDate(o.date)}</td>
      <td>${Bakery.money(o.total)}</td>
      <td><span class="status-pill ${Bakery.statusClass(o.status)}">${Bakery.escapeHTML(o.status)}</span></td>
    </tr>`).join("")
  : '<tr><td colspan="5" class="empty-state">No orders have been recorded.</td></tr>';

/* ---------- Low-stock list ---------- */
const lowStock = [...products].filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
document.getElementById("low-stock").innerHTML = lowStock.length
  ? lowStock.map(p => `<li>
      <span><strong>${Bakery.escapeHTML(p.name)}</strong><small>${Bakery.escapeHTML(p.category)}</small></span>
      <span class="status-pill ${p.stock === 0 ? "status-cancelled" : "status-pending"}">${p.stock === 0 ? "Out of stock" : p.stock + " left"}</span>
    </li>`).join("")
  : '<li class="muted">All products are well stocked.</li>';

/* ---------- Charts ---------- */
if (typeof Chart !== "undefined") {
  let metric = "sales"; 
  let range = "months";   


  function buildSeries() {
    const buckets = new Map(); 
    if (range === "months") {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = d.toISOString().slice(0, 7);
        const showYear = i === 5 || d.getUTCMonth() === 0;
        buckets.set(key, SHORT_MONTHS[d.getUTCMonth()] + (showYear ? " " + d.getUTCFullYear() : ""));
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const key = isoDay(i);
        const d = new Date(key + "T00:00:00");
        buckets.set(key, d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric" }));
      }
    }
    const totals = new Map([...buckets.keys()].map(k => [k, 0]));
    activeOrders.forEach(o => {
      const key = range === "months" ? o.date.slice(0, 7) : o.date;
      if (totals.has(key)) totals.set(key, totals.get(key) + (metric === "sales" ? Number(o.total) : 1));
    });
    return { labels: [...buckets.values()], values: [...totals.values()] };
  }

  const trendChart = new Chart(document.getElementById("salesChart"), {
    type: "bar",
    data: { labels: [], datasets: [{ label: "", data: [], backgroundColor: "#d79a78", borderRadius: 6, maxBarThickness: 34 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => " " + (metric === "sales" ? Bakery.money(c.raw) : c.raw + " orders") } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#918b83", font: { size: 10 } } },
        y: { beginAtZero: true, grid: { color: "#f0ede8" }, ticks: { color: "#918b83", font: { size: 10 }, precision: 0, callback: v => (metric === "sales" ? "RM " : "") + v } }
      }
    }
  });

  function updateTrendChart() {
    const series = buildSeries();
    const dataset = trendChart.data.datasets[0];
    trendChart.data.labels = series.labels;
    dataset.data = series.values;
    dataset.label = metric === "sales" ? "Sales (RM)" : "Orders";
    dataset.backgroundColor = metric === "sales" ? "#d79a78" : "#8b9d83";
    trendChart.update();
    document.getElementById("chart-title").textContent = metric === "sales" ? "Sales performance" : "Order volume";
    document.getElementById("chart-subtitle").textContent =
      (metric === "sales" ? "Recorded order value" : "Number of orders") + (range === "months" ? " by month (last 6 months)" : " by day (last 7 days)");
  }


  document.querySelectorAll("[data-metric], [data-range]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.metric) metric = btn.dataset.metric;
      if (btn.dataset.range) range = btn.dataset.range;
      btn.parentElement.querySelectorAll(".seg-btn").forEach(b => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      updateTrendChart();
    });
  });
  updateTrendChart();

  // Best-selling products
  const unitsByProduct = {};
  activeOrders.forEach(o => { unitsByProduct[o.product] = (unitsByProduct[o.product] || 0) + Number(o.quantity); });
  const best = Object.entries(unitsByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const colors = ["#c98765", "#e5b69a", "#8b9d83", "#d9c58c", "#aaa0bf"];
  new Chart(document.getElementById("productChart"), {
    type: "doughnut",
    data: { labels: best.map(x => x[0]), datasets: [{ data: best.map(x => x[1]), backgroundColor: colors, borderWidth: 3, borderColor: "#fff", hoverOffset: 5 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw} sold` } } }
    }
  });
  document.getElementById("product-legend").innerHTML = best.map((x, i) =>
    `<div class="legend-item"><span class="legend-dot" style="background:${colors[i]}"></span>${Bakery.escapeHTML(x[0])} (${x[1]})</div>`
  ).join("") || '<span class="muted small">No sales data yet.</span>';
}
