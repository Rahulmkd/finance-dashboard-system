# Finance Dashboard Backend API

A role-based finance data management system built with **Node.js**, **Express**, and **MongoDB**. This backend powers a multi-user finance dashboard where different roles interact with financial records through controlled access.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Role & Permission Model](#role--permission-model)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Transactions](#transactions)
  - [Dashboard](#dashboard)
- [Filtering & Pagination](#filtering--pagination)
- [Error Handling](#error-handling)
- [Design Decisions](#design-decisions)
- [Assumptions](#assumptions)

---

## Tech Stack

| Layer            | Technology                |
| ---------------- | ------------------------- |
| Runtime          | Node.js (ES Modules)      |
| Framework        | Express.js                |
| Database         | MongoDB with Mongoose ODM |
| Auth             | JWT (jsonwebtoken)        |
| Password Hashing | bcryptjs                  |
| Validation       | express-validator         |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── constants/
│   │   └── roles.js               # Role definitions and permission groups
│   ├── controllers/
│   │   ├── auth.controller.js     # Register, login, getMe
│   │   ├── user.controller.js     # User CRUD + change password
│   │   ├── transaction.controller.js  # Transaction CRUD + filtering
│   │   └── dashboard.controller.js    # Aggregation endpoints
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT protect + blockSelfAction + guardLastAdmin
│   │   ├── rbac.middleware.js     # authorize(...roles) guard
│   │   ├── validate.middleware.js # express-validator rules
│   │   └── error.middleware.js    # Global error handler
│   ├── models/
│   │   ├── user.model.js          # User schema with password hashing
│   │   └── transaction.model.js   # Transaction schema with soft delete
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── transaction.routes.js
│   │   └── dashboard.routes.js
│   └── app.js                     # Express app setup, route mounting
├── .env
├── server.js                      # Entry point
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18 or above
- MongoDB running locally or a MongoDB Atlas connection string

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Rahulmkd/finance-dashboard-system
cd finance-dashboard-system

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Fill in your values (see Environment Variables section)

# 4. Start the development server
npm run dev
```

The server starts at `http://localhost:5000`

Verify it is running:

```
GET http://localhost:5000
→ { "status": "Finance API is running" }
```

### Scripts

| Command       | Description                                 |
| ------------- | ------------------------------------------- |
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start`   | Start production server                     |

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

| Variable         | Description                 | Required           |
| ---------------- | --------------------------- | ------------------ |
| `PORT`           | Port the server runs on     | No (default: 5000) |
| `MONGO_URI`      | MongoDB connection string   | Yes                |
| `JWT_SECRET`     | Secret key for signing JWTs | Yes                |
| `JWT_EXPIRES_IN` | Token expiry duration       | No (default: 7d)   |

---

## Role & Permission Model

The system supports three roles with clearly scoped permissions:

| Action                              | Viewer | Analyst | Admin |
| ----------------------------------- | ------ | ------- | ----- |
| Login / View own profile            | ✅     | ✅      | ✅    |
| Change own password                 | ✅     | ✅      | ✅    |
| View transactions                   | ✅     | ✅      | ✅    |
| View dashboard summary              | ✅     | ✅      | ✅    |
| View recent transactions            | ✅     | ✅      | ✅    |
| Access category breakdown           | ❌     | ✅      | ✅    |
| Access monthly trends               | ❌     | ✅      | ✅    |
| Create / Edit / Delete transactions | ❌     | ❌      | ✅    |
| Manage users                        | ❌     | ❌      | ✅    |

### How RBAC is Enforced

Access control is implemented as a composable middleware chain on every route:

```
Request → protect (verify JWT) → authorize(...roles) → Controller
```

- `protect` — Verifies the Bearer token, loads the user from DB, and rejects deactivated accounts
- `authorize(...roles)` — Checks `req.user.role` against the allowed roles array; returns `403` if unauthorized

**Additional Guards (Admin routes):**

- `blockSelfAction` — Prevents an Admin from modifying their own account via `/api/users/:id`
- `guardLastAdmin` — Prevents demotion or deactivation of the last remaining active Admin, avoiding system lockout

---

## API Reference

All protected routes require:

```
Authorization: Bearer <token>
```

### Auth

#### Register

```
POST /api/auth/register
```

Body:

```json
{
  "name": "Rahul Dev",
  "email": "rahul@example.com",
  "password": "secret123",
  "role": "admin"
}
```

Response `201`:

```json
{
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Rahul Dev", "email": "...", "role": "admin" }
}
```

---

#### Login

```
POST /api/auth/login
```

Body:

```json
{
  "email": "rahul@example.com",
  "password": "secret123"
}
```

Response `200`:

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Rahul Dev", "email": "...", "role": "admin" }
}
```

---

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

Response `200`: Returns logged-in user's profile (no password).

---

#### Change Own Password

```
PATCH /api/auth/change-password
Authorization: Bearer <token>
```

Body:

```json
{
  "currentPassword": "secret123",
  "newPassword": "newpass456"
}
```

Response `200`: `{ "message": "Password updated successfully" }`

---

### Users

> All user management endpoints require **Admin** role.

#### Get All Users

```
GET /api/users
GET /api/users?role=viewer&isActive=true&page=1&limit=10
```

| Query Param | Type    | Description                             |
| ----------- | ------- | --------------------------------------- |
| `role`      | string  | Filter by role: viewer, analyst, admin  |
| `isActive`  | boolean | Filter by active status                 |
| `page`      | number  | Page number (default: 1)                |
| `limit`     | number  | Results per page (default: 10, max: 50) |

Response `200`:

```json
{
  "total": 12,
  "page": 1,
  "totalPages": 2,
  "users": [ ... ]
}
```

---

#### Get User by ID

```
GET /api/users/:id
```

Response `200`: Returns a single user object.
Response `404`: User not found.
Response `400`: Invalid MongoDB ID format.

---

#### Create User

```
POST /api/users
```

Body:

```json
{
  "name": "Jane Analyst",
  "email": "jane@example.com",
  "password": "pass1234",
  "role": "analyst"
}
```

Response `201`: Returns created user (no password).

---

#### Update User

```
PATCH /api/users/:id
```

Updatable fields: `name`, `role`, `isActive`

> Emails and passwords cannot be updated here. Email is immutable; use `/api/auth/change-password` for passwords.

Body:

```json
{
  "role": "analyst",
  "isActive": false
}
```

Response `200`: Returns updated user.

**Protected edge cases:**

- `403` if Admin tries to update themselves (use `/api/auth/me`)
- `400` if this action would leave zero active Admins

---

#### Deactivate User

```
DELETE /api/users/:id
```

Performs a **soft deactivate** (sets `isActive: false`). User is not removed from DB.

Response `200`: `{ "message": "User Jane Analyst has been deactivated" }`

**Protected edge cases:**

- `403` if Admin tries to deactivate themselves
- `400` if this would leave zero active Admins

---

### Transactions

#### Get All Transactions

```
GET /api/transactions
Authorization: Bearer <any-role-token>
```

| Query Param | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| `type`      | string   | `income` or `expense`                    |
| `category`  | string   | Any valid category (see below)           |
| `startDate` | ISO date | Filter from this date                    |
| `endDate`   | ISO date | Filter until this date                   |
| `page`      | number   | Page number (default: 1)                 |
| `limit`     | number   | Results per page (default: 10, max: 100) |
| `sortBy`    | string   | Field to sort by (default: `date`)       |
| `order`     | string   | `asc` or `desc` (default: `desc`)        |

**Valid categories:** `salary`, `freelance`, `investment`, `food`, `transport`, `utilities`, `health`, `entertainment`, `education`, `other`

Response `200`:

```json
{
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "transactions": [ ... ]
}
```

---

#### Get Transaction by ID

```
GET /api/transactions/:id
Authorization: Bearer <any-role-token>
```

---

#### Create Transaction

```
POST /api/transactions
Authorization: Bearer <admin-token>
```

Body:

```json
{
  "title": "Freelance Project Payment",
  "amount": 15000,
  "type": "income",
  "category": "freelance",
  "date": "2024-04-01",
  "notes": "React dashboard project for client"
}
```

Response `201`: Returns created transaction.

---

#### Update Transaction

```
PATCH /api/transactions/:id
Authorization: Bearer <admin-token>
```

Only provided fields are updated (partial update). All fields are optional.

Body:

```json
{
  "amount": 18000,
  "notes": "Revised after scope change"
}
```

Response `200`: Returns updated transaction.

---

#### Delete Transaction

```
DELETE /api/transactions/:id
Authorization: Bearer <admin-token>
```

Performs a **soft delete** (sets `isDeleted: true`). Record is excluded from all queries but retained in DB.

Response `200`: `{ "message": "Transaction deleted successfully" }`

---

### Dashboard

#### Overall Summary

```
GET /api/dashboard/summary
GET /api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <any-role-token>
```

Response `200`:

```json
{
  "summary": {
    "totalIncome": 115000,
    "totalExpenses": 8649,
    "incomeCount": 3,
    "expenseCount": 5,
    "avgIncome": 38333.33,
    "avgExpense": 1729.8,
    "netBalance": 106351
  }
}
```

---

#### Recent Transactions

```
GET /api/dashboard/recent?limit=5
Authorization: Bearer <any-role-token>
```

Returns the most recently created transactions. `limit` is capped at 20.

---

#### Category Breakdown

```
GET /api/dashboard/by-category
GET /api/dashboard/by-category?type=expense&startDate=2024-03-01
Authorization: Bearer <analyst-or-admin-token>
```

Response `200`:

```json
{
  "count": 5,
  "breakdown": [
    {
      "category": "salary",
      "type": "income",
      "total": 100000,
      "count": 2,
      "avgAmount": 50000
    },
    {
      "category": "food",
      "type": "expense",
      "total": 3200,
      "count": 1,
      "avgAmount": 3200
    }
  ]
}
```

Results are sorted by total descending.

---

#### Monthly Trends

```
GET /api/dashboard/trends?year=2024
Authorization: Bearer <analyst-or-admin-token>
```

Response `200`:

```json
{
  "year": 2024,
  "yearSummary": {
    "totalIncome": 115000,
    "totalExpenses": 8649,
    "netBalance": 106351
  },
  "trends": [
    {
      "month": "Jan",
      "monthNumber": 1,
      "income": 0,
      "incomeCount": 0,
      "expenses": 0,
      "expenseCount": 0,
      "net": 0
    },
    {
      "month": "Mar",
      "monthNumber": 3,
      "income": 65000,
      "incomeCount": 2,
      "expenses": 5500,
      "expenseCount": 3,
      "net": 59500
    }
  ]
}
```

Always returns all 12 months. Months with no data show zeros (important for consistent frontend charting).

---

## Filtering & Pagination

All list endpoints follow the same pagination response shape:

```json
{
  "total": 45,
  "page": 2,
  "limit": 10,
  "totalPages": 5,
  "data": [ ... ]
}
```

Date filtering uses ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`

---

## Error Handling

The API uses a centralized error handler (`src/middleware/error.middleware.js`) that intercepts all errors passed via `next(err)`.

### Standard Error Response Shape

```json
{
  "message": "Human-readable error description"
}
```

### Validation Error Shape

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "type", "message": "Type must be income or expense" }
  ]
}
```

### HTTP Status Codes Used

| Code  | Meaning                                    |
| ----- | ------------------------------------------ |
| `200` | Success                                    |
| `201` | Created                                    |
| `400` | Bad request / validation error             |
| `401` | Unauthenticated (missing or invalid token) |
| `403` | Forbidden (authenticated but unauthorized) |
| `404` | Resource not found                         |
| `409` | Conflict (e.g. duplicate email)            |
| `500` | Unexpected server error                    |

### Automatically Handled Error Types

| Error                           | Response                                |
| ------------------------------- | --------------------------------------- |
| Mongoose `ValidationError`      | `400` with field-level messages         |
| MongoDB duplicate key (`11000`) | `409` with field name                   |
| `JsonWebTokenError`             | `401` Invalid token                     |
| `TokenExpiredError`             | `401` Token expired                     |
| Invalid MongoDB ObjectId        | `400` via express-validator param check |

---

## Design Decisions

### 1. ES Modules over CommonJS

Used `"type": "module"` in package.json for cleaner `import/export` syntax consistent with modern JavaScript standards.

### 2. Soft Delete for Both Users and Transactions

Rather than permanently removing records, both users (`isActive: false`) and transactions (`isDeleted: true`) are soft deleted. This preserves audit history, prevents data loss from accidental deletion, and mirrors how real finance systems behave.

### 3. Controller → Service-style Separation

Business logic lives in controllers with a clear single responsibility. The global error handler keeps controllers clean — they only need to `next(err)` rather than duplicate `catch` logic.

### 4. Centralized Role Constants

`src/constants/roles.js` exports both individual role strings and permission group arrays (`CAN_VIEW`, `CAN_ANALYZE`, `CAN_MANAGE`). Routes compose these groups rather than hardcoding strings, making future role changes a single-file edit.

### 5. MongoDB Aggregation Pipelines for Dashboard

Dashboard APIs use `$group`, `$match`, and `$project` pipeline stages rather than fetching all records and computing in JavaScript. This is significantly more efficient at scale and shows proper use of MongoDB's capabilities.

### 6. Compound Indexes on Transactions

```js
transactionSchema.index({ type: 1, category: 1, date: -1 });
transactionSchema.index({ createdBy: 1 });
```

These indexes directly support the most common query patterns (filtered listing and creator lookups) without over-indexing.

### 7. `select: false` on Password Field

The password field is excluded from all queries by default at the schema level. It must be explicitly opted in with `.select('+password')` only where needed (login, change-password). This prevents accidental password leakage in API responses.

### 8. Pagination Cap

`limit` is capped at 100 for transactions and 50 for users to prevent accidental full-collection fetches.

---

## Assumptions

1. **Registration is open** — Any role including `admin` can be set at registration. In a production system, public registration would default to `viewer` and only an existing Admin could elevate roles.

2. **Single-tenant system** — All users share the same transaction pool. Transactions are not scoped per user (any viewer can see all transactions). The `createdBy` field tracks authorship but does not restrict visibility.

3. **Date field is user-supplied** — The `date` on a transaction represents the real-world date of the financial event, not the creation timestamp. This allows backdating entries, which is standard in accounting.

4. **Soft delete is final via API** — There is no restore endpoint. Soft-deleted records can be recovered directly in the database but not via API (by design, to keep the scope clean).

5. **No email verification** — User registration immediately activates the account. A production system would send a verification email before activation.

---
