const API_URL = "http://127.0.0.1:5000";

let productsData = [];
let categoriesData = [];
let suppliersData = [];


/* =========================
   NAVIGATION
========================= */

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", function(e) {

        e.preventDefault();

        const page = this.dataset.page;

        showPage(page);

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});


function showPage(page) {

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active-page");
    });

    document.getElementById(page).classList.add("active-page");

    const titles = {
        "dashboard": ["Dashboard", "Overview of your inventory"],
        "products": ["Products", "Manage your inventory products"],
        "categories": ["Categories", "Manage product categories"],
        "suppliers": ["Suppliers", "Manage your suppliers"],
        "purchases": ["Purchases", "Record and view purchases"],
        "sales": ["Sales", "Record and view sales"],
        "low-stock": ["Low Stock", "Products requiring attention"]
    };

    document.getElementById("page-title").textContent =
        titles[page][0];

    document.getElementById("page-subtitle").textContent =
        titles[page][1];

    if (page === "dashboard") loadDashboard();
    if (page === "products") loadProducts();
    if (page === "categories") loadCategories();
    if (page === "suppliers") loadSuppliers();

    if (page === "purchases") {
        loadPurchaseData();
    }

    if (page === "sales") {
        loadSalesData();
    }

    if (page === "low-stock") {
        loadLowStock();
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {

    try {

        const response = await fetch(`${API_URL}/dashboard`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load dashboard");
        }

        document.getElementById("total-products").textContent =
            data.total_products;

        document.getElementById("total-stock").textContent =
            data.total_stock;

        document.getElementById("total-purchases").textContent =
            `₹${Number(data.total_purchases).toFixed(2)}`;

        document.getElementById("total-sales").textContent =
            `₹${Number(data.total_sales).toFixed(2)}`;

        document.getElementById("low-stock-count").textContent =
            data.low_stock_count;

        await loadDashboardProducts();
        await loadDashboardLowStock();

    } catch (error) {

        console.error(error);
        showToast("Cannot connect to backend. Make sure Flask is running.", "error");
    }
}


async function loadDashboardProducts() {

    try {

        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        const table = document.getElementById("dashboard-products");

        table.innerHTML = "";

        products.slice(0, 5).forEach(product => {

            table.innerHTML += `
                <tr>
                    <td>${product.product_id}</td>
                    <td>${product.product_name}</td>
                    <td>₹${Number(product.price).toFixed(2)}</td>
                    <td>${product.quantity}</td>
                </tr>
            `;
        });

        if (products.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-row">
                        No products available
                    </td>
                </tr>
            `;
        }

    } catch (error) {
        console.error(error);
    }
}


async function loadDashboardLowStock() {

    try {

        const response = await fetch(`${API_URL}/products/low-stock`);
        const products = await response.json();

        const container =
            document.getElementById("dashboard-low-stock");

        container.innerHTML = "";

        if (products.length === 0) {

            container.innerHTML =
                `<p class="empty-row">All products have sufficient stock.</p>`;

            return;
        }

        products.slice(0, 5).forEach(product => {

            container.innerHTML += `
                <div class="low-stock-item">
                    <strong>${product.product_name}</strong>
                    <p>
                        Current Stock: ${product.quantity}
                        | Minimum: ${product.minimum_stock}
                    </p>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
    }
}


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

    try {

        const response = await fetch(`${API_URL}/products`);
        productsData = await response.json();

        displayProducts(productsData);

    } catch (error) {

        console.error(error);
        showToast("Failed to load products", "error");
    }
}


function displayProducts(products) {

    const table = document.getElementById("products-table");

    table.innerHTML = "";

    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    No products found
                </td>
            </tr>
        `;

        return;
    }

    products.forEach(product => {

        table.innerHTML += `
            <tr>
                <td>${product.product_id}</td>
                <td>${product.product_name}</td>
                <td>${product.category_id ?? "-"}</td>
                <td>${product.supplier_id ?? "-"}</td>
                <td>₹${Number(product.price).toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td>${product.minimum_stock}</td>

                <td>
                    <button class="edit-btn"
                        onclick="editProduct(${product.product_id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button class="delete-btn"
                        onclick="deleteProduct(${product.product_id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}


function searchProducts() {

    const search =
        document.getElementById("product-search")
        .value
        .toLowerCase();

    const filtered = productsData.filter(product =>
        product.product_name.toLowerCase().includes(search)
    );

    displayProducts(filtered);
}


/* =========================
   PRODUCT MODAL
========================= */

async function openProductModal(product = null) {

    await loadProductDropdowns();

    const modal =
        document.getElementById("product-modal");

    const form =
        document.getElementById("product-form");

    form.reset();

    document.getElementById("product-id").value = "";

    if (product) {

        document.getElementById("product-modal-title").textContent =
            "Edit Product";

        document.getElementById("product-id").value =
            product.product_id;

        document.getElementById("product-name").value =
            product.product_name;

        document.getElementById("product-category").value =
            product.category_id ?? "";

        document.getElementById("product-supplier").value =
            product.supplier_id ?? "";

        document.getElementById("product-price").value =
            product.price;

        document.getElementById("product-quantity").value =
            product.quantity;

        document.getElementById("product-minimum-stock").value =
            product.minimum_stock;

    } else {

        document.getElementById("product-modal-title").textContent =
            "Add Product";
    }

    modal.classList.add("show");
}


async function loadProductDropdowns() {

    await Promise.all([
        loadCategoriesData(),
        loadSuppliersData()
    ]);

    const categorySelect =
        document.getElementById("product-category");

    const supplierSelect =
        document.getElementById("product-supplier");

    categorySelect.innerHTML =
        `<option value="">Select Category</option>`;

    supplierSelect.innerHTML =
        `<option value="">Select Supplier</option>`;

    categoriesData.forEach(category => {

        categorySelect.innerHTML += `
            <option value="${category.category_id}">
                ${category.category_name}
            </option>
        `;
    });

    suppliersData.forEach(supplier => {

        supplierSelect.innerHTML += `
            <option value="${supplier.supplier_id}">
                ${supplier.supplier_name}
            </option>
        `;
    });
}


async function editProduct(id) {

    const product =
        productsData.find(item => item.product_id === id);

    if (product) {
        openProductModal(product);
    }
}


document.getElementById("product-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const id =
        document.getElementById("product-id").value;

    const data = {

        product_name:
            document.getElementById("product-name").value,

        category_id:
            document.getElementById("product-category").value || null,

        supplier_id:
            document.getElementById("product-supplier").value || null,

        price:
            Number(document.getElementById("product-price").value),

        quantity:
            Number(document.getElementById("product-quantity").value),

        minimum_stock:
            Number(document.getElementById("product-minimum-stock").value)
    };

    try {

        const url = id
            ? `${API_URL}/products/${id}`
            : `${API_URL}/products`;

        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        closeModal("product-modal");

        loadProducts();
        loadDashboard();

    } catch (error) {

        showToast(error.message, "error");
    }
});


async function deleteProduct(id) {

    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/products/${id}`,
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        loadProducts();
        loadDashboard();

    } catch (error) {

        showToast(error.message, "error");
    }
}


/* =========================
   CATEGORIES
========================= */

async function loadCategoriesData() {

    const response =
        await fetch(`${API_URL}/categories`);

    categoriesData =
        await response.json();
}


async function loadCategories() {

    try {

        await loadCategoriesData();

        const table =
            document.getElementById("categories-table");

        table.innerHTML = "";

        categoriesData.forEach(category => {

            table.innerHTML += `
                <tr>
                    <td>${category.category_id}</td>
                    <td>${category.category_name}</td>

                    <td>
                        <button class="edit-btn"
                            onclick="editCategory(${category.category_id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="delete-btn"
                            onclick="deleteCategory(${category.category_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        if (categoriesData.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-row">
                        No categories found
                    </td>
                </tr>
            `;
        }

    } catch (error) {

        showToast("Failed to load categories", "error");
    }
}


function openCategoryModal(category = null) {

    document.getElementById("category-form").reset();

    document.getElementById("category-id").value = "";

    if (category) {

        document.getElementById("category-modal-title").textContent =
            "Edit Category";

        document.getElementById("category-id").value =
            category.category_id;

        document.getElementById("category-name").value =
            category.category_name;

    } else {

        document.getElementById("category-modal-title").textContent =
            "Add Category";
    }

    document.getElementById("category-modal")
        .classList.add("show");
}


function editCategory(id) {

    const category =
        categoriesData.find(item =>
            item.category_id === id
        );

    openCategoryModal(category);
}


document.getElementById("category-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const id =
        document.getElementById("category-id").value;

    const data = {
        category_name:
            document.getElementById("category-name").value
    };

    try {

        const response = await fetch(
            id
                ? `${API_URL}/categories/${id}`
                : `${API_URL}/categories`,
            {
                method: id ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        closeModal("category-modal");

        loadCategories();

    } catch (error) {

        showToast(error.message, "error");
    }
});


async function deleteCategory(id) {

    if (!confirm("Delete this category?")) return;

    try {

        const response = await fetch(
            `${API_URL}/categories/${id}`,
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        loadCategories();

    } catch (error) {

        showToast(error.message, "error");
    }
}


/* =========================
   SUPPLIERS
========================= */

async function loadSuppliersData() {

    const response =
        await fetch(`${API_URL}/suppliers`);

    suppliersData =
        await response.json();
}


async function loadSuppliers() {

    try {

        await loadSuppliersData();

        const table =
            document.getElementById("suppliers-table");

        table.innerHTML = "";

        suppliersData.forEach(supplier => {

            table.innerHTML += `
                <tr>
                    <td>${supplier.supplier_id}</td>
                    <td>${supplier.supplier_name}</td>
                    <td>${supplier.phone ?? "-"}</td>
                    <td>${supplier.email ?? "-"}</td>
                    <td>${supplier.address ?? "-"}</td>

                    <td>
                        <button class="edit-btn"
                            onclick="editSupplier(${supplier.supplier_id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="delete-btn"
                            onclick="deleteSupplier(${supplier.supplier_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        if (suppliersData.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        No suppliers found
                    </td>
                </tr>
            `;
        }

    } catch (error) {

        showToast("Failed to load suppliers", "error");
    }
}


function openSupplierModal(supplier = null) {

    document.getElementById("supplier-form").reset();

    document.getElementById("supplier-id").value = "";

    if (supplier) {

        document.getElementById("supplier-modal-title").textContent =
            "Edit Supplier";

        document.getElementById("supplier-id").value =
            supplier.supplier_id;

        document.getElementById("supplier-name").value =
            supplier.supplier_name;

        document.getElementById("supplier-phone").value =
            supplier.phone || "";

        document.getElementById("supplier-email").value =
            supplier.email || "";

        document.getElementById("supplier-address").value =
            supplier.address || "";

    } else {

        document.getElementById("supplier-modal-title").textContent =
            "Add Supplier";
    }

    document.getElementById("supplier-modal")
        .classList.add("show");
}


function editSupplier(id) {

    const supplier =
        suppliersData.find(item =>
            item.supplier_id === id
        );

    openSupplierModal(supplier);
}


document.getElementById("supplier-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const id =
        document.getElementById("supplier-id").value;

    const data = {

        supplier_name:
            document.getElementById("supplier-name").value,

        phone:
            document.getElementById("supplier-phone").value || null,

        email:
            document.getElementById("supplier-email").value || null,

        address:
            document.getElementById("supplier-address").value || null
    };

    try {

        const response = await fetch(
            id
                ? `${API_URL}/suppliers/${id}`
                : `${API_URL}/suppliers`,
            {
                method: id ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        closeModal("supplier-modal");

        loadSuppliers();

    } catch (error) {

        showToast(error.message, "error");
    }
});


async function deleteSupplier(id) {

    if (!confirm("Delete this supplier?")) return;

    try {

        const response = await fetch(
            `${API_URL}/suppliers/${id}`,
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        loadSuppliers();

    } catch (error) {

        showToast(error.message, "error");
    }
}


/* =========================
   PURCHASES
========================= */

async function loadPurchaseData() {

    await Promise.all([
        loadProducts(),
        loadSuppliersData(),
        loadPurchases()
    ]);

    const supplierSelect =
        document.getElementById("purchase-supplier");

    const productSelect =
        document.getElementById("purchase-product");

    supplierSelect.innerHTML =
        `<option value="">Select Supplier</option>`;

    productSelect.innerHTML =
        `<option value="">Select Product</option>`;

    suppliersData.forEach(supplier => {

        supplierSelect.innerHTML += `
            <option value="${supplier.supplier_id}">
                ${supplier.supplier_name}
            </option>
        `;
    });

    productsData.forEach(product => {

        productSelect.innerHTML += `
            <option value="${product.product_id}">
                ${product.product_name}
            </option>
        `;
    });
}


document.getElementById("purchase-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const data = {

        supplier_id:
            Number(document.getElementById("purchase-supplier").value),

        product_id:
            Number(document.getElementById("purchase-product").value),

        quantity:
            Number(document.getElementById("purchase-quantity").value),

        unit_price:
            Number(document.getElementById("purchase-price").value)
    };

    try {

        const response = await fetch(`${API_URL}/purchases`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        showToast(result.message, "success");

        document.getElementById("purchase-form").reset();

        loadPurchaseData();
        loadDashboard();

    } catch (error) {

        showToast(error.message, "error");
    }
});


async function loadPurchases() {

    try {

        const response =
            await fetch(`${API_URL}/purchases`);

        const purchases =
            await response.json();

        const table =
            document.getElementById("purchases-table");

        table.innerHTML = "";

        purchases.forEach(purchase => {

            table.innerHTML += `
                <tr>
                    <td>${purchase.purchase_id}</td>
                    <td>${purchase.supplier_id}</td>
                    <td>${purchase.product_id ?? "-"}</td>
                    <td>${purchase.quantity ?? "-"}</td>
                    <td>₹${Number(purchase.total_amount).toFixed(2)}</td>
                </tr>
            `;
        });

        if (purchases.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No purchase records found
                    </td>
                </tr>
            `;
        }

    } catch (error) {

        console.error(error);
    }
}


/* =========================
   SALES
========================= */

async function loadSalesData() {

    await Promise.all([
        loadProducts(),
        loadSales()
    ]);

    const productSelect =
        document.getElementById("sale-product");

    productSelect.innerHTML =
        `<option value="">Select Product</option>`;

    productsData.forEach(product => {

        productSelect.innerHTML += `
            <option value="${product.product_id}">
                ${product.product_name}
                (Stock: ${product.quantity})
            </option>
        `;
    });
}


document.getElementById("sale-form")
.addEventListener("submit", async function(e) {

    e.preventDefault();

    const data = {

        customer_name:
            document.getElementById("customer-name").value ||
            "Walk-in Customer",

        product_id:
            Number(document.getElementById("sale-product").value),

        quantity:
            Number(document.getElementById("sale-quantity").value),

        unit_price:
            Number(document.getElementById("sale-price").value)
    };

    try {

        const response = await fetch(`${API_URL}/sales`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Failed to complete sale"
            );
        }

        showToast(result.message, "success");

        document.getElementById("sale-form").reset();

        loadSalesData();
        loadDashboard();

    } catch (error) {

        showToast(error.message, "error");
    }
});


async function loadSales() {

    try {

        const response =
            await fetch(`${API_URL}/sales`);

        const sales =
            await response.json();

        const table =
            document.getElementById("sales-table");

        table.innerHTML = "";

        sales.forEach(sale => {

            table.innerHTML += `
                <tr>
                    <td>${sale.sale_id}</td>
                    <td>${sale.customer_name}</td>
                    <td>${sale.product_id ?? "-"}</td>
                    <td>${sale.quantity ?? "-"}</td>
                    <td>₹${Number(sale.total_amount).toFixed(2)}</td>
                </tr>
            `;
        });

        if (sales.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No sales records found
                    </td>
                </tr>
            `;
        }

    } catch (error) {

        console.error(error);
    }
}


/* =========================
   LOW STOCK
========================= */

async function loadLowStock() {

    try {

        const response =
            await fetch(`${API_URL}/products/low-stock`);

        const products =
            await response.json();

        const table =
            document.getElementById("low-stock-table");

        table.innerHTML = "";

        products.forEach(product => {

            table.innerHTML += `
                <tr>
                    <td>${product.product_id}</td>
                    <td>${product.product_name}</td>
                    <td>${product.quantity}</td>
                    <td>${product.minimum_stock}</td>

                    <td>
                        <span class="status-low">
                            Low Stock
                        </span>
                    </td>
                </tr>
            `;
        });

        if (products.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No low-stock products. Inventory is healthy!
                    </td>
                </tr>
            `;
        }

    } catch (error) {

        showToast("Failed to load low-stock products", "error");
    }
}


/* =========================
   MODAL FUNCTIONS
========================= */

function closeModal(id) {

    document.getElementById(id)
        .classList.remove("show");
}


/* =========================
   TOAST
========================= */

function showToast(message, type = "success") {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.className = type;

    setTimeout(() => {

        toast.className = "";

    }, 3000);
}


/* =========================
   INITIAL LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});
function logout() {

    localStorage.removeItem("inventoryUser");

    window.location.href = "login.html";
}
