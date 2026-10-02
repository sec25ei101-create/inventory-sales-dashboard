const form = document.querySelector("#product-form");
const nameInput = document.querySelector("#product-name");
const categoryInput = document.querySelector("#category");
const priceInput = document.querySelector("#price");
const stockInput = document.querySelector("#stock");
const tableBody = document.querySelector("#products-table-body");
const productCount = document.querySelector("#product-count");
const inventoryValue = document.querySelector("#inventory-value");
const lowStockCount = document.querySelector("#low-stock-count");
const emptyMessage = document.querySelector("#empty-message");
const searchInput = document.querySelector("#search");
const categoryFilter = document.querySelector("#category-filter");
const exportButton = document.querySelector("#export-button");

const storageKey = "inventory-dashboard-products";
let products = JSON.parse(localStorage.getItem(storageKey) || "[]");

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});

function saveProducts() {
  localStorage.setItem(storageKey, JSON.stringify(products));
}

function renderProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const visibleProducts = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;

    return matchesName && matchesCategory;
  });

  tableBody.replaceChildren();

  for (const product of visibleProducts) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    const categoryCell = document.createElement("td");
    categoryCell.textContent = product.category;

    const priceCell = document.createElement("td");
    priceCell.textContent = money.format(product.price);

    const stockCell = document.createElement("td");
    stockCell.textContent = product.stock;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = product.stock <= 5 ? "status status-low" : "status status-ok";
    status.textContent = product.stock === 0
      ? "Out of stock"
      : product.stock <= 5
        ? "Low stock"
        : "In stock";
    statusCell.append(status);

    const actionsCell = document.createElement("td");

    const saleButton = document.createElement("button");
    saleButton.type = "button";
    saleButton.className = "action-button";
    saleButton.textContent = "Record sale";
    saleButton.disabled = product.stock === 0;
    saleButton.addEventListener("click", () => {
      product.stock -= 1;
      saveProducts();
      renderProducts();
    });
    const restockButton = document.createElement("button");
restockButton.type = "button";
restockButton.className = "action-button";
restockButton.textContent = "Restock";

restockButton.addEventListener("click", () => {
  const quantity = Number(prompt("How many units should be added?"));

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return;
  }

  product.stock += quantity;
  saveProducts();
  renderProducts();
});

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      products = products.filter((item) => item.id !== product.id);
      saveProducts();
      renderProducts();
    });

    actionsCell.append(saleButton, deleteButton);
    row.append(nameCell, categoryCell, priceCell, stockCell, statusCell, actionsCell);
    tableBody.append(row);
  }

  const totalValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0
  );

  productCount.textContent = products.length;
  inventoryValue.textContent = money.format(totalValue);
  lowStockCount.textContent = products.filter(
    (product) => product.stock <= 5
  ).length;

  if (products.length === 0) {
    emptyMessage.textContent = "No products yet. Add a product above to get started.";
    emptyMessage.hidden = false;
  } else if (visibleProducts.length === 0) {
    emptyMessage.textContent = "No products match your search or category.";
    emptyMessage.hidden = false;
  } else {
    emptyMessage.hidden = true;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);

  if (!name || !categoryInput.value || price <= 0 || stock < 0) {
    return;
  }

  products.unshift({
    id: Date.now().toString() + Math.random(),
    name,
    category: categoryInput.value,
    price,
    stock
  });

  saveProducts();
  renderProducts();
  form.reset();
  nameInput.focus();
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

exportButton.addEventListener("click", () => {
  const rows = [
    ["Product", "Category", "Price", "Stock", "Inventory value"],
    ...products.map((product) => [
      product.name,
      product.category,
      product.price,
      product.stock,
      (product.price * product.stock).toFixed(2)
    ])
  ];

  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "inventory-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

renderProducts();
