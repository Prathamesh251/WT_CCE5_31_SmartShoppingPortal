/* =====================================================
   Smart Shopping Portal - app.js
   Concepts used (Unit V - SPA):
   1. SPA navigation  : only #app content changes, page never reloads
   2. Client routing  : hash based router (#/home, #/products ...)
   3. Dynamic data    : products loaded with fetch() from products.json
   4. Cart            : stored in localStorage (survives refresh)
   5. Validation      : checkout form validated on the client side
   ===================================================== */

const CART_KEY = "smartshop_cart";
const ORDER_KEY = "smartshop_last_order";
const SHIPPING_FREE_ABOVE = 999;
const SHIPPING_FEE = 49;
const COUPONS = { SAVE10: 10, STUDENT20: 20 }; // percent off

let products = [];
let categories = [];
let cart = loadCart();                       // { productId: quantity }
let appliedCoupon = null;                    // e.g. "SAVE10"
const filters = { category: "All", search: "", sort: "default" };

const app = document.getElementById("app");

/* ------------------ Helpers ------------------ */
const money = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const findProduct = (id) => products.find((p) => p.id === Number(id));
const discountPct = (p) => Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ------------------ Cart (localStorage) ------------------ */
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function updateCartBadge() {
  document.getElementById("cartBadge").textContent = cartCount();
}

function addToCart(id) {
  const p = findProduct(id);
  if (!p) return;
  const current = cart[id] || 0;
  if (current >= p.stock) {
    showToast("Only " + p.stock + " in stock");
    return;
  }
  cart[id] = current + 1;
  saveCart();
  showToast(p.name + " added to cart");
}

function changeQty(id, delta) {
  const p = findProduct(id);
  const newQty = (cart[id] || 0) + delta;
  if (newQty <= 0) {
    delete cart[id];
  } else if (newQty > p.stock) {
    showToast("Only " + p.stock + " in stock");
    return;
  } else {
    cart[id] = newQty;
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

function cartTotals() {
  let subtotal = 0;
  Object.entries(cart).forEach(([id, qty]) => {
    const p = findProduct(id);
    if (p) subtotal += p.price * qty;
  });
  const discount = appliedCoupon ? (subtotal * COUPONS[appliedCoupon]) / 100 : 0;
  const afterDiscount = subtotal - discount;
  const shipping = subtotal === 0 || afterDiscount >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FEE;
  return { subtotal, discount, shipping, total: afterDiscount + shipping };
}

/* ------------------ Router (simulated client-side routing) ------------------ */
const routes = {
  home: renderHome,
  products: renderProducts,
  product: renderProductDetail,
  cart: renderCart,
  checkout: renderCheckout,
  success: renderSuccess,
  about: renderAbout,
};

function router() {
  // URL looks like  index.html#/product/5  ->  base = "product", param = "5"
  const hash = location.hash.slice(1) || "/home";
  const parts = hash.split("/");
  const base = parts[1] || "home";
  const param = parts[2];

  const handler = routes[base] || renderNotFound;
  handler(param);

  // highlight active nav link
  const activeKey = base === "product" ? "products" : base === "checkout" || base === "success" ? "cart" : base;
  document.querySelectorAll(".main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === activeKey);
  });

  // close mobile menu + scroll to top
  document.getElementById("mainNav").classList.remove("open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", router);

/* ------------------ Views ------------------ */
function productCard(p) {
  return `
    <article class="product-card">
      <div class="product-img" aria-hidden="true">${p.emoji}</div>
      <div class="product-body">
        <span class="cat-tag">${escapeHTML(p.category)}</span>
        <h3><a href="#/product/${p.id}">${escapeHTML(p.name)}</a></h3>
        <span class="rating">${stars(p.rating)} <small>(${p.rating})</small></span>
        <div>
          <span class="price">${money(p.price)}</span>
          <span class="old-price">${money(p.oldPrice)}</span>
          <span class="discount">${discountPct(p)}% off</span>
        </div>
        <div class="product-actions">
          <a class="btn btn-outline btn-sm" href="#/product/${p.id}">Details</a>
          <button class="btn btn-sm" data-add="${p.id}">Add to Cart</button>
        </div>
      </div>
    </article>`;
}

/* ---- Home ---- */
function renderHome() {
  const catEmoji = { Electronics: "💻", Fashion: "👗", "Home & Kitchen": "🏠", Books: "📚" };
  const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);

  app.innerHTML = `
    <section class="hero">
      <h1>Smart Shopping, Simplified 🛍️</h1>
      <p>Browse trending products, add them to your cart and checkout in seconds – all without a single page reload.</p>
      <a class="btn" href="#/products">Shop Now</a>
    </section>

    <h2 class="section-title">Shop by Category</h2>
    <div class="category-grid">
      ${categories
        .map(
          (c) => `<a class="category-card" href="#/products" data-cat="${escapeHTML(c)}">
            <span class="cat-emoji">${catEmoji[c] || "🛒"}</span>${escapeHTML(c)}</a>`
        )
        .join("")}
    </div>

    <h2 class="section-title">Top Rated Products</h2>
    <div class="product-grid">${featured.map(productCard).join("")}</div>

    <h2 class="section-title">Why SmartShop?</h2>
    <div class="feature-grid">
      <div class="feature"><h3>🚚 Free Delivery</h3><p>Free shipping on orders above ${money(SHIPPING_FREE_ABOVE)}.</p></div>
      <div class="feature"><h3>🏷️ Coupons</h3><p>Try <b>SAVE10</b> or <b>STUDENT20</b> in your cart.</p></div>
      <div class="feature"><h3>💾 Saved Cart</h3><p>Your cart is saved in the browser, even after refresh.</p></div>
    </div>`;
}

/* ---- Products (listing with category filter, search, sort) ---- */
function renderProducts() {
  app.innerHTML = `
    <h1 class="section-title" style="margin-top:0">All Products</h1>
    <div class="toolbar">
      <input type="search" id="searchBox" placeholder="Search products..." value="${escapeHTML(filters.search)}" aria-label="Search products" />
      <select id="sortBox" aria-label="Sort products">
        <option value="default">Sort: Featured</option>
        <option value="low">Price: Low to High</option>
        <option value="high">Price: High to Low</option>
        <option value="rating">Rating: High to Low</option>
        <option value="name">Name: A to Z</option>
      </select>
    </div>
    <div class="chips" id="chips"></div>
    <p class="result-count" id="resultCount"></p>
    <div class="product-grid" id="productGrid"></div>`;

  document.getElementById("sortBox").value = filters.sort;
  document.getElementById("searchBox").addEventListener("input", (e) => {
    filters.search = e.target.value;
    updateProductGrid();
  });
  document.getElementById("sortBox").addEventListener("change", (e) => {
    filters.sort = e.target.value;
    updateProductGrid();
  });
  updateProductGrid();
}

function updateProductGrid() {
  // category chips
  const chipsEl = document.getElementById("chips");
  chipsEl.innerHTML = ["All", ...categories]
    .map((c) => `<button class="chip ${filters.category === c ? "active" : ""}" data-chip="${escapeHTML(c)}">${escapeHTML(c)}</button>`)
    .join("");

  // filter
  const q = filters.search.trim().toLowerCase();
  let list = products.filter(
    (p) =>
      (filters.category === "All" || p.category === filters.category) &&
      (q === "" || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );

  // sort
  switch (filters.sort) {
    case "low": list.sort((a, b) => a.price - b.price); break;
    case "high": list.sort((a, b) => b.price - a.price); break;
    case "rating": list.sort((a, b) => b.rating - a.rating); break;
    case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
  }

  document.getElementById("resultCount").textContent = list.length + " product(s) found";
  document.getElementById("productGrid").innerHTML =
    list.length > 0
      ? list.map(productCard).join("")
      : `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div><h3>No products found</h3><p>Try a different search or category.</p></div>`;
}

/* ---- Product detail ---- */
function renderProductDetail(id) {
  const p = findProduct(id);
  if (!p) return renderNotFound();
  app.innerHTML = `
    <a class="back-link" href="#/products">← Back to products</a>
    <section class="detail">
      <div class="product-img" aria-hidden="true">${p.emoji}</div>
      <div class="detail-info">
        <span class="cat-tag">${escapeHTML(p.category)}</span>
        <h1>${escapeHTML(p.name)}</h1>
        <span class="rating">${stars(p.rating)} <small>(${p.rating} / 5)</small></span>
        <div>
          <span class="price" style="font-size:1.8rem">${money(p.price)}</span>
          <span class="old-price">${money(p.oldPrice)}</span>
          <span class="discount">${discountPct(p)}% off</span>
        </div>
        <p>${escapeHTML(p.description)}</p>
        <p><b>Availability:</b> ${p.stock > 0 ? p.stock + " in stock" : "Out of stock"}</p>
        <div class="product-actions" style="max-width:360px">
          <button class="btn" data-add="${p.id}">Add to Cart</button>
          <button class="btn btn-outline" data-buy="${p.id}">Buy Now</button>
        </div>
      </div>
    </section>`;
}

/* ---- Cart ---- */
function renderCart() {
  const ids = Object.keys(cart).filter((id) => findProduct(id));
  if (ids.length === 0) {
    app.innerHTML = `
      <div class="empty">
        <div class="big">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p><br />
        <a class="btn" href="#/products">Start Shopping</a>
      </div>`;
    return;
  }

  const t = cartTotals();
  app.innerHTML = `
    <h1 class="section-title" style="margin-top:0">Shopping Cart (${cartCount()} items)</h1>
    <div class="cart-layout">
      <div>
        ${ids
          .map((id) => {
            const p = findProduct(id);
            const qty = cart[id];
            return `
            <div class="cart-item">
              <div class="thumb">${p.emoji}</div>
              <div>
                <a href="#/product/${p.id}"><b>${escapeHTML(p.name)}</b></a><br />
                <small>${money(p.price)} each</small>
                <div class="qty">
                  <button data-dec="${p.id}" aria-label="Decrease quantity">−</button>
                  <b>${qty}</b>
                  <button data-inc="${p.id}" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div class="line-total">
                ${money(p.price * qty)}<br />
                <button class="btn btn-danger btn-sm" data-remove="${p.id}" style="margin-top:8px">Remove</button>
              </div>
            </div>`;
          })
          .join("")}
        <button class="btn btn-outline btn-sm" id="clearCart">Clear Cart</button>
      </div>

      <aside class="summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="summary-row"><span>Discount${appliedCoupon ? " (" + appliedCoupon + ")" : ""}</span><span>- ${money(t.discount)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${t.shipping === 0 ? "FREE" : money(t.shipping)}</span></div>
        <div class="coupon">
          <input type="text" id="couponInput" placeholder="Coupon code" value="${appliedCoupon || ""}" aria-label="Coupon code" />
          <button class="btn btn-sm" id="applyCoupon">Apply</button>
        </div>
        <div class="summary-row total"><span>Total</span><span>${money(t.total)}</span></div><br />
        <a class="btn btn-block" href="#/checkout" style="text-align:center">Proceed to Checkout</a>
      </aside>
    </div>`;
}

/* ---- Checkout (with client-side validation) ---- */
const validators = {
  fullName: (v) => (/^[A-Za-z ]{3,}$/.test(v.trim()) ? "" : "Enter your full name (letters only, min 3 characters)."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
  phone: (v) => (/^[6-9]\d{9}$/.test(v.trim()) ? "" : "Enter a valid 10-digit mobile number."),
  pincode: (v) => (/^\d{6}$/.test(v.trim()) ? "" : "Pincode must be exactly 6 digits."),
  city: (v) => (/^[A-Za-z ]{2,}$/.test(v.trim()) ? "" : "Enter a valid city name."),
  address: (v) => (v.trim().length >= 10 ? "" : "Address must be at least 10 characters."),
  payment: (v) => (v ? "" : "Please select a payment method."),
};

function renderCheckout() {
  if (cartCount() === 0) {
    location.hash = "#/cart";
    return;
  }
  const t = cartTotals();
  app.innerHTML = `
    <h1 class="section-title" style="margin-top:0">Checkout</h1>
    <div class="cart-layout">
      <form class="form-card" id="checkoutForm" novalidate>
        <div class="form-grid">
          <div class="form-group"><label for="fullName">Full Name</label>
            <input id="fullName" name="fullName" type="text" placeholder="e.g. Rahul Sharma" /><span class="error-msg"></span></div>
          <div class="form-group"><label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" /><span class="error-msg"></span></div>
          <div class="form-group"><label for="phone">Mobile Number</label>
            <input id="phone" name="phone" type="tel" maxlength="10" placeholder="10-digit number" /><span class="error-msg"></span></div>
          <div class="form-group"><label for="pincode">Pincode</label>
            <input id="pincode" name="pincode" type="text" maxlength="6" placeholder="411044" /><span class="error-msg"></span></div>
          <div class="form-group"><label for="city">City</label>
            <input id="city" name="city" type="text" placeholder="Pune" /><span class="error-msg"></span></div>
          <div class="form-group full"><label for="address">Delivery Address</label>
            <textarea id="address" name="address" rows="3" placeholder="House no, street, area"></textarea><span class="error-msg"></span></div>
          <div class="form-group full" id="paymentGroup"><label>Payment Method</label>
            <div class="radio-row">
              <label><input type="radio" name="payment" value="COD" /> Cash on Delivery</label>
              <label><input type="radio" name="payment" value="UPI" /> UPI</label>
              <label><input type="radio" name="payment" value="Card" /> Debit/Credit Card</label>
            </div><span class="error-msg"></span></div>
        </div>
        <br /><button type="submit" class="btn btn-block">Place Order (${money(t.total)})</button>
      </form>

      <aside class="summary">
        <h3>Your Order</h3>
        ${Object.keys(cart)
          .filter((id) => findProduct(id))
          .map((id) => {
            const p = findProduct(id);
            return `<div class="summary-row"><span>${p.emoji} ${escapeHTML(p.name)} × ${cart[id]}</span><span>${money(p.price * cart[id])}</span></div>`;
          })
          .join("")}
        <div class="summary-row"><span>Discount</span><span>- ${money(t.discount)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${t.shipping === 0 ? "FREE" : money(t.shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(t.total)}</span></div>
      </aside>
    </div>`;

  const form = document.getElementById("checkoutForm");

  // live validation when the user leaves a field
  form.querySelectorAll("input[type=text],input[type=email],input[type=tel],textarea").forEach((el) => {
    el.addEventListener("blur", () => validateField(el.name, el.value));
  });
  form.querySelectorAll("input[name=payment]").forEach((r) =>
    r.addEventListener("change", () => validateField("payment", r.value))
  );
  form.querySelector("#phone").addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "")));
  form.querySelector("#pincode").addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let ok = true;
    Object.keys(validators).forEach((name) => {
      if (!validateField(name, data.get(name) || "")) ok = false;
    });
    if (!ok) {
      showToast("Please fix the errors in the form");
      const firstBad = form.querySelector(".invalid input, .invalid textarea");
      if (firstBad) firstBad.focus();
      return;
    }
    placeOrder(Object.fromEntries(data.entries()));
  });
}

function validateField(name, value) {
  const msg = validators[name](value);
  const el = document.querySelector(`[name="${name}"]`);
  const group = el.closest(".form-group");
  group.classList.toggle("invalid", msg !== "");
  group.querySelector(".error-msg").textContent = msg;
  return msg === "";
}

function placeOrder(customer) {
  const t = cartTotals();
  const items = Object.keys(cart)
    .filter((id) => findProduct(id))
    .map((id) => ({ name: findProduct(id).name, qty: cart[id], price: findProduct(id).price }));
  const order = {
    id: "SS" + Date.now().toString().slice(-8),
    customer,
    items,
    total: t.total,
    date: new Date().toLocaleString("en-IN"),
  };
  sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  cart = {};
  appliedCoupon = null;
  saveCart();
  location.hash = "#/success";
}

/* ---- Order success ---- */
function renderSuccess() {
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem(ORDER_KEY)); } catch (e) {}
  if (!order) {
    location.hash = "#/home";
    return;
  }
  app.innerHTML = `
    <div class="success-box">
      <div class="big">✅</div>
      <h1>Order Placed Successfully!</h1>
      <div class="order-id">Order ID: ${escapeHTML(order.id)}</div>
      <p>Thank you, <b>${escapeHTML(order.customer.fullName)}</b>. A confirmation will be sent to ${escapeHTML(order.customer.email)}.</p>
      <p>Items: ${order.items.map((i) => escapeHTML(i.name) + " × " + i.qty).join(", ")}</p>
      <p>Paid via <b>${escapeHTML(order.customer.payment)}</b> | Total: <b>${money(order.total)}</b></p>
      <p><small>${escapeHTML(order.date)}</small></p><br />
      <a class="btn" href="#/products">Continue Shopping</a>
    </div>`;
}

/* ---- About ---- */
function renderAbout() {
  app.innerHTML = `
    <div class="about-card">
      <h1>About This Project</h1>
      <p><b>Smart Shopping Website Portal</b> is a responsive e-commerce front-end built as the Unit V mini project of Web Technology 1 (CCE-5).</p>
      <ul>
        <li>Single Page Application – navigation without page reload</li>
        <li>Client-side routing using the URL hash (#/products, #/cart ...)</li>
        <li>Product data loaded dynamically from <code>products.json</code> using fetch()</li>
        <li>Shopping cart saved in <code>localStorage</code></li>
        <li>Checkout form with client-side validation</li>
        <li>Responsive layout for mobile, tablet and desktop</li>
      </ul>
      <p>Built with HTML5, CSS3 and vanilla JavaScript (no frameworks).</p>
    </div>`;
}

function renderNotFound() {
  app.innerHTML = `<div class="empty"><div class="big">😕</div><h2>404 – Page not found</h2><br /><a class="btn" href="#/home">Go Home</a></div>`;
}

/* ------------------ Global event handling (event delegation) ------------------ */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;

  if (t.dataset.add) addToCart(t.dataset.add);

  if (t.dataset.buy) {
    addToCart(t.dataset.buy);
    location.hash = "#/cart";
  }
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  if (t.dataset.remove) removeFromCart(t.dataset.remove);

  if (t.dataset.chip) {
    filters.category = t.dataset.chip;
    updateProductGrid();
  }
  if (t.dataset.cat) filters.category = t.dataset.cat; // home category card (link then navigates)

  if (t.id === "clearCart") {
    cart = {};
    appliedCoupon = null;
    saveCart();
    renderCart();
  }
  if (t.id === "applyCoupon") {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();
    if (code === "") {
      appliedCoupon = null;
    } else if (COUPONS[code]) {
      appliedCoupon = code;
      showToast("Coupon applied: " + COUPONS[code] + "% off");
    } else {
      appliedCoupon = null;
      showToast("Invalid coupon code");
    }
    renderCart();
  }
});

document.getElementById("menuToggle").addEventListener("click", (e) => {
  const nav = document.getElementById("mainNav");
  const open = nav.classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", open);
});

/* ------------------ Start: load JSON, then start router ------------------ */
async function init() {
  updateCartBadge();
  try {
    let data;
    try {
      const res = await fetch("products.json");   // normal way (Live Server / hosted)
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (fetchErr) {
      // fetch() is blocked when opened as file:// -> use backup copy from data.js
      if (!window.PRODUCTS_FALLBACK) throw fetchErr;
      console.warn("fetch() failed, using data.js fallback:", fetchErr.message);
      data = window.PRODUCTS_FALLBACK;
    }
    products = data.products;
    categories = data.categories;
    router();
  } catch (err) {
    app.innerHTML = `
      <div class="error-box">
        <h2>Could not load products</h2>
        <p>${escapeHTML(err.message)}</p>
        <p>Please run this project using <b>Live Server</b> (VS Code) or any local web server.
        Opening index.html directly (file://) blocks fetch().</p>
      </div>`;
  }
}
init();
