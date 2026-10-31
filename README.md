# Rameshwar Namkeen — E-Commerce & Wholesale B2B/B2C Platform

Rameshwar Namkeen is a comprehensive full-stack MERN (MongoDB, Express, React, Node.js) web application developed as an MCA final-year project. It delivers an enterprise-ready dual retail (B2C) and wholesale (B2B) ecosystem for authentic Gujarati namkeen and snacks, complete with role-based authentication, dynamic tiered catalog pricing, live inventory management, order status tracking, automated invoicing, customer reviews, payment breakdown reporting, and an administrative control suite with audit logging.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, JavaScript (JSX), Tailwind CSS, React Router DOM v6, Axios
* **Backend**: Node.js, Express.js (ES Modules), Mongoose (ODM)
* **Database**: MongoDB (Local or Atlas)
* **Authentication & Security**: JSON Web Tokens (JWT), bcryptjs password hashing, role-based access control (`customer`, `wholesaler`, `admin`), atomic stock reservation guards
* **Reporting & Exports**: PDF invoice generation (PDFKit), div-based lightweight CSS data visualization

---

## 📁 Folder Structure Overview

```text
NamkeenMart/
├── client/                     # Frontend Vite + React SPA
│   ├── public/                 # Static assets (favicon, SVG icons)
│   ├── src/
│   │   ├── api/                # Axios API services (catalog, orders, wholesale, admin, reviews, reports)
│   │   ├── components/         # Shared UI components (StatusBadge, EmptyState, Loader, ErrorBoundary, etc.)
│   │   ├── context/            # AuthContext, CartContext, WholesaleCartContext
│   │   ├── hooks/              # Custom hooks (e.g. useDocumentTitle)
│   │   ├── layouts/            # CustomerLayout, WholesalerLayout, AdminLayout
│   │   ├── pages/              # Portal views grouped by auth, customer, wholesaler, admin
│   │   └── routes/             # AppRoutes, ProtectedRoute
│   ├── index.html              # HTML5 entry with meta tags and favicon
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # DB connection, environment variables
│   │   ├── controllers/        # Route controllers (auth, cart, order, admin user/category/product/stock)
│   │   ├── middleware/         # auth (JWT), role authorization, validation handler
│   │   ├── models/             # Mongoose schemas (User, Product, Variant, Stock, Order, WholesaleOrder, etc.)
│   │   ├── routes/             # Modular Express routers
│   │   ├── seed/               # Database seeder (seed.js)
│   │   ├── services/           # Business logic (order processing, stock atomic updates)
│   │   ├── utils/              # PDF generator, audit logger, token generator
│   │   └── validators/         # Input validators
│   └── package.json
│
├── README.md                   # Project documentation
```

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)
* **MongoDB** installed and running locally on `localhost:27017` (or MongoDB Atlas connection URI)

### 2. Clone and Install Dependencies

Open a terminal at the project root:

```powershell
# 1. Install Backend Dependencies
cd server
npm install

# 2. Install Frontend Dependencies
cd ../client
npm install
```

### 3. Environment Variables Configuration

Create the `.env` configuration files for both server and client:

#### **Backend (`server/.env`):**
Create `server/.env` using `server/.env.example` as a template:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rameshwar_namkeen
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

#### **Frontend (`client/.env`):**
Create `client/.env` using `client/.env.example` as a template:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Seeding

Run the seed script to populate initial sample categories, products, multiple variant sizes (200g, 500g, 1kg), stock inventory counts, and pre-configured test users across all three roles:

```powershell
cd server
npm run seed
```

### 5. Running the Development Servers

Open two terminal windows:

**Terminal 1 (Backend API Server):**
```powershell
cd server
npm run dev
```
*Backend runs on: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)*

**Terminal 2 (Frontend Client):**
```powershell
cd client
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 🔑 Default Seed Credentials (For Testing Only)

> [!NOTE]
> **DEVELOPMENT SEED DATA - for testing only**
> These accounts are populated automatically by `npm run seed`:

| Role | Email | Password | Access & Status |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rameshwar.com` | `Admin@123` | Full access to Admin Portal |
| **Customer** | `customer@rameshwar.com` | `Customer@123` | Full access to Retail Storefront |
| **Wholesaler** | `wholesaler@rameshwar.com` | `Wholesale@123` | Pre-approved B2B Wholesaler |

---

## 🌟 Key Features by Portal

### 🛒 1. Customer Portal (B2C Retail)
* **Storefront & Catalog**: Category-based browsing, instant search, price/weight/rating filtering, responsive filter drawer on mobile.
* **Product Detail**: Multi-pack selection (200g, 500g, 1kg), ingredient information, stock availability badge.
* **Wishlist & Cart**: Persistent shopping cart, real-time quantity updates, subtotal and delivery charge calculation.
* **Checkout & Address Book**: Multi-step checkout, saved delivery addresses with default selection, simulated payment methods (UPI, Card, Net Banking, COD).
* **Order Management & Tracking**: Visual step-by-step order tracking timeline (`placed` ➔ `confirmed` ➔ `processing` ➔ `packed` ➔ `shipped` ➔ `out_for_delivery` ➔ `delivered`), downloadable order invoices.

### 🏢 2. Wholesaler Portal (B2B Bulk)
* **Approval Gating**: Status-gated access (`pending`, `approved`, `rejected`) preventing unauthorized bulk trading.
* **Tiered Wholesale Pricing**: Automatic discount calculation (20% off retail pricing) with minimum order quantity (MOQ) validation.
* **Dedicated Bulk Cart**: Instant bulk pack validation with warnings for items below MOQ.
* **Wholesale Orders & Credit Payments**: Order tracking timeline tailored for freight delivery, payment ledger summary (`Total Purchases`, `Paid Amount`, `Pending Balance`).
* **Wholesale Invoicing & Reports**: PDF invoice downloads and purchase analytics.

### 🛡️ 3. Admin Portal (Management & Governance)
* **Dashboard**: Key metrics overview (total customers, wholesalers, products, pending orders, monthly revenue, low stock alerts).
* **User & Wholesaler Management**: Customer, Wholesaler, and Admin tabs; activation/deactivation toggles with self-deactivation protection; wholesaler approval workflow (`Approve`, `Reject`, `Set Inactive`).
* **Category & Product Catalog**: Hierarchical category creation, product variant CRUD with automated SKU generation and image support.
* **Live Stock Inventory**: Available quantity adjustments, threshold alerts, atomic stock reservation, and automatic stock restoration upon order cancellation.
* **Customer & Wholesale Orders**: Searchable, filterable order tables with sequential order lifecycle progression via `OrderStatusUpdater`.
* **Reviews Moderation**: Approve, hide, and delete customer reviews.
* **Financial & Business Reports**: 8 analytical tabs (`sales`, `orders`, `products`, `stock`, `customers`, `wholesalers`, `payments`, `revenue`) featuring lightweight CSS div-based bar charts.
* **System Audit Trail**: Searchable, immutable logging of administrative actions across all system modules (`Users`, `Categories`, `Products`, `Stock`, `Orders`, `Reviews`).

---

## 🛡️ Error Handling & Reliability

* **Global React Error Boundary**: Catches unhandled runtime render crashes and presents a clean, user-friendly recovery view.
* **Unified Network Error Handling**: Intercepts server connection failures to display descriptive connection guidance instead of raw technical exceptions.
* **Safe State Handling**: All data-driven views include explicit loading skeletons/spinners, empty result screens, and error retry states.
* **Double-Submission Prevention**: Form action buttons disable and display active in-flight spinners during API requests.
