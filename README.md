# Smart Shopping Website Portal

**Subject:** Web Technology 1 (AD124PE507.1) | **CCE-5:** Unit V – SPA Concepts & Mini Project
**Student:** Sagarika Bhad | **Roll No:** 31 | **Batch:** WT A2 (T.Y. AI&DS)
**College:** D. Y. Patil College of Engineering, Akurdi, Pune – Dept. of AI & DS

## 1. Problem Statement
Small shops and students often lack a simple, fast online storefront. Customers want to browse products, compare prices, keep items in a cart and place an order without waiting for pages to reload.

**Smart Shopping Website Portal** is a responsive front-end e-commerce Single Page Application (SPA). It is used by online shoppers (customers) to browse products by category, search and sort them, add items to a cart and complete checkout.

## 2. Features
- **SPA navigation** – only the content area changes; the page never reloads
- **Simulated client-side routing** using the URL hash (`#/home`, `#/products`, `#/product/5`, `#/cart`, `#/checkout`, `#/success`, `#/about`)
- **Dynamic data loading** – 16 products loaded from `products.json` using `fetch()`
- **Product listing** with category filter, live search and sorting (price, rating, name)
- **Product detail page** with price, discount, rating and stock
- **Shopping cart** stored in `localStorage` (survives refresh) – add, increase/decrease, remove, clear
- **Coupons** – `SAVE10` (10%) and `STUDENT20` (20%); free shipping above ₹999
- **Checkout with client-side validation** – name, email, 10-digit mobile, 6-digit pincode, city, address, payment method
- **Order confirmation page** with order ID
- **Responsive UI** – mobile hamburger menu, flexible grid (CSS Grid / Flexbox / media queries)
- Page components: **Header, Navigation, Product listing, Cart, Footer**

## 3. Technologies Used
HTML5, CSS3 (Grid, Flexbox, media queries), JavaScript (ES6, fetch/async-await, localStorage, hash routing), Git & GitHub

## 4. Project Structure
```
WT_CCE5_31_SmartShoppingPortal/
├── index.html      # page shell: header, navigation, #app container, footer
├── style.css       # all styles + responsive rules
├── app.js          # router, views, cart logic, validation
├── products.json   # product data
├── data.js         # backup copy of the data (used only if fetch() is blocked on file://)
├── README.md
└── screenshots/    # add your screenshots here
```

## 5. How to Run
1. Download or clone the repository.
2. Open the folder in **VS Code**.
3. Install the **Live Server** extension.
4. Right-click `index.html` → **Open with Live Server**.
5. The site opens at `http://127.0.0.1:5500/`.

> Do not open `index.html` by double-clicking. `fetch()` is blocked on `file://`, so the products will not load. A local server is needed.

## 6. Routes
| Route | View |
|-------|------|
| `#/home` | Home with hero, categories, top-rated products |
| `#/products` | Product listing with filter/search/sort |
| `#/product/:id` | Product detail |
| `#/cart` | Shopping cart and order summary |
| `#/checkout` | Checkout form with validation |
| `#/success` | Order confirmation |
| `#/about` | About the project |

## 7. Testing Done
| Test | Result |
|------|--------|
| Navigation between all pages without reload | Pass |
| Products load from JSON | Pass |
| Category filter / search / sort | Pass |
| Add / remove / change quantity in cart | Pass |
| Cart persists after browser refresh | Pass |
| Invalid coupon, valid coupon | Pass |
| Checkout validation (empty & wrong values) | Pass |
| Responsive at 1200px, 768px, 400px widths | Pass |

## 8. Screenshots
Add screenshots in the `screenshots/` folder and link them here:

![Home](screenshots/home.png)
![Products](screenshots/products.png)
![Cart](screenshots/cart.png)
![Checkout](screenshots/checkout.png)
![Mobile view](screenshots/mobile.png)

## 9. Future Scope
Back-end with database, user login, real payment gateway, order history, product reviews.
