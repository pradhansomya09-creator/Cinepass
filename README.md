# 🎬 CinePass — Enterprise Movie Ticket Booking System

A full-fledged, production-style Movie Ticket Booking Platform (BookMyShow-style) built with **React, TypeScript, Tailwind CSS, Vite, Node.js, Express, PostgreSQL 16, and Prisma ORM**.

---

## 🌟 Key Features

### 1. Movie Discovery & Catalog
* **Hero Premiere Carousel**: Cinematic high-impact carousel featuring top premieres, ratings, and embedded YouTube trailers.
* **Now Showing & Coming Soon**: Instant tab filtering by release status.
* **City-Based Availability**: Instant city switching (Mumbai, Bengaluru, Delhi-NCR, Hyderabad, Chennai, Kolkata, Pune) filtering real-time shows.
* **Genre & Language Chips**: Instant filtering by Action, Sci-Fi, Drama, Thriller, Adventure, Animation, and languages.
* **Catalog Search & Sorting**: Search by title or director; sort by popularity, rating, or release date.

### 2. Theaters & Auditoriums
* Multi-city multiplex management with facility badges (IMAX 4K Laser, Dolby Atmos 7.1, Recliner Loungers, Valet Parking).
* Auditoriums with sound type and screen classification.

### 3. Interactive Seat Selection & Concurrency Engine
* **Curved Screen Perspective**: Visual screen indicator with atmospheric projection glow.
* **Tiered Seat Categories**:
  * 👑 **Recliner Class**: Luxury lounger rows.
  * ⭐ **Premium Class**: Optimal middle tiers.
  * 🎟️ **Regular Class**: Classic front tiers.
* **Visual States**: Available, Selected, Held by others, Booked.
* **Concurrency Lock & Automatic TTL Expiry**:
  * Temporary seat holds (8-minute duration).
  * Sweeper background worker automatically releases expired holds back to the pool.
  * Composite unique constraints (`@@unique([showId, seatId])`) and database transactions (`$transaction`) prevent double-booking at the PostgreSQL engine level.

### 4. Checkout, Coupons & Razorpay Payments
* **Live Price Calculation**: Computed strictly on the server to prevent client-side tampering.
* **Coupon & Discount Engine**: Percentage discounts with maximum caps, flat discounts, minimum booking thresholds, and per-user redemption limits (`CINE20`, `FLAT100`, `VIP50`).
* **Razorpay Payment Gateway**:
  * Indian payments integration (UPI, QR, Cards, NetBanking).
  * Cryptographic HMAC-SHA256 signature verification.
  * Verified webhook processing for asynchronous confirmation.
  * Zero-credential **Payment Sandbox Simulation Mode** for local development.

### 5. Electronic Tickets & Cinema Staff Validation
* **Digital E-Tickets**:
  * Anti-counterfeit QR code containing an opaque token.
  * Movie poster, auditorium, showtime, seat labels, category, and payment reference.
  * Printable view and Save PDF support.
* **Staff Admission Scanner**:
  * Dedicated QR scan verification console for cinema staff.
  * Single-use admission enforcement (prevents duplicate admissions).

### 6. User Account & Booking History
* Profile management (name, phone, change password).
* Categorized booking history: **Upcoming**, **Past**, and **Cancelled**.
* Self-service cancellation policy (cancellations permitted up to 2 hours before showtime with automated refund processing).

### 7. Administrative Master Dashboard
* Real-time metrics: Gross Booking Value, Verified Payments, Total Refunds, Net Revenue, Occupancy Rate (%).
* Charts: Daily confirmed bookings & revenue trend (last 7 days), Most popular movies.
* Catalog Management: Add new movies with poster/banner URLs, manage show schedules, delete movies.
* Staff Admission Tool: Built-in QR token admission validator.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query, React Hook Form, Zod, Lucide React, Framer Motion, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, RESTful API architecture (/api/v1), Zod validation, JWT HttpOnly Cookies, bcryptjs |
| **Database** | PostgreSQL 16 with Prisma ORM (ACID transactions, unique constraints, cascade rules, indexing) |
| **Payments** | Razorpay Test Mode with HMAC-SHA256 signature verification & Sandbox Mock Provider |
| **Notifications**| Nodemailer with HTML templates and test console logger |
| **Testing** | Vitest, Supertest |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18 or higher (v24 tested)
* **PostgreSQL**: v14+ (Local service or Docker)

### 1. Database Setup
The application connects to PostgreSQL using the connection string in `.env`.
Default local connection string:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/movie_ticket_booking?schema=public
```

*(Optional: If you use Docker, run `docker compose up -d`)*

### 2. Installation
```bash
# From the repository root:
npm install
```

### 3. Build Shared Library & Push Database Schema
```bash
# Build shared types & validation package
npm run build --workspace=packages/shared

# Apply Prisma schema to PostgreSQL
npm run db:push

# Seed realistic demonstration data (408 seats, 96 shows, 6 movies, coupons, users)
npm run db:seed
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:api

# Terminal 2: Frontend Web App (port 5173)
npm run dev:web
```

---

## 🔑 Demo User Credentials

The database is pre-seeded with tested accounts:

| Role | Email | Password | Access / Permissions |
|---|---|---|---|
| **Administrator** | `admin@cinepass.com` | `AdminPassword@123` | Full Admin Dashboard, Movie CRUD, Showtime schedules, Staff QR Scanner |
| **Registered User** | `ashish@example.com` | `UserPassword@123` | Seat selection, checkout, payment, booking history, tickets, cancellations |
| **Registered User** | `priya@example.com` | `UserPassword@123` | Standard customer bookings & profile |

*(Note: The login page includes 1-Click Demo Login buttons for instant access)*

---

## 🎟️ Active Demo Coupons

| Coupon Code | Discount | Minimum Booking | Maximum Discount |
|---|---|---|---|
| `CINE20` | 20% OFF | ₹300 | ₹150 |
| `FLAT100` | Flat ₹100 OFF | ₹500 | ₹100 |
| `VIP50` | 50% OFF | ₹600 | ₹250 |

---

## 📡 API Endpoints Overview

All REST endpoints are versioned under `/api/v1`:

### Authentication (`/api/v1/auth`)
* `POST /register` — Register user & set HttpOnly cookies
* `POST /login` — Authenticate user
* `POST /logout` — Clear session cookies
* `GET /me` — Get current profile
* `POST /forgot-password` — Send reset token
* `POST /reset-password` — Apply new password

### Movies (`/api/v1/movies`)
* `GET /` — List movies with search, genre, language, city, and status filters
* `GET /:id` — Detailed movie information with upcoming shows & cinemas
* `POST /` — Create movie *(Admin only)*
* `DELETE /:id` — Delete movie *(Admin only)*

### Cinemas & Shows (`/api/v1/cinemas`, `/api/v1/shows`)
* `GET /cinemas/cities` — List all cities
* `GET /cinemas` — List cinemas with facilities and screens
* `GET /shows` — List shows with filters
* `GET /shows/:id/seats` — Real-time seat inventory and layout map
* `POST /shows` — Schedule show with conflict overlap detection *(Admin only)*

### Seats & Concurrency (`/api/v1/seats`)
* `POST /holds` — Atomically hold selected seats with 8-minute TTL
* `GET /holds/:id` — Get hold status and remaining seconds
* `DELETE /holds/:id` — Release hold back to pool

### Bookings & Payments (`/api/v1/bookings`, `/api/v1/payments`)
* `POST /bookings` — Create pending booking from active hold
* `GET /bookings` — User booking history
* `POST /bookings/:id/cancel` — Cancel booking & initiate refund (>= 2h policy)
* `POST /payments/verify` — Verify cryptographic HMAC-SHA256 signature & confirm seats permanently
* `POST /payments/webhook` — Razorpay webhook event handler

### Tickets (`/api/v1/tickets`)
* `GET /:id` — Electronic ticket with QR code Data URL
* `POST /validate` — Cinema staff QR ticket admission scan *(Admin/Staff)*

### Admin Dashboard (`/api/v1/admin`)
* `GET /dashboard` — Metrics, charts, revenue, and occupancy analytics
* `GET /bookings` — Master booking search and filters
* `GET /users` — User management and role assignment
* `GET /payments` — Financial ledger

---

## 🧪 Automated Testing

Run the automated integration test suite:

```bash
# Run backend API tests with Vitest & Supertest
npx vitest run --root apps/api
```

Test coverage includes:
- Health check verification
- Seeded admin & user login
- Invalid credentials rejection (401)
- Movie pagination, search, and filtering
- Showtime retrieval and real-time seat inventory
- RBAC authorization protection (401/403)
- Coupon validation and discount computation
- End-to-end booking, payment verification, and ticket admission flow
