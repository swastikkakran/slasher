# Backend PRD — URL Shortener with Auth

**Version:** 1.0  
**Stack:** Node.js · Express · MongoDB · JWT  
**Scope:** Backend only (REST API)

---

## 1. Overview

A URL shortener service with user authentication. Authenticated users can shorten URLs, manage their links, and view click analytics. Unauthenticated users can only resolve short URLs (redirect).

---

## 2. Data Models

### User

```js
{
  _id: ObjectId,
  username: String,         // unique, lowercase, trimmed
  email: String,            // unique, lowercase
  password: String,         // bcrypt hashed, never returned in responses
  createdAt: Date,
  updatedAt: Date
}
```

### URL

```js
{
  _id: ObjectId,
  originalUrl: String,      // full destination URL (must be valid http/https)
  shortCode: String,        // unique ~6-char alphanumeric slug (e.g. "aB3xZ9")
  owner: ObjectId,          // ref: User
  clicks: Number,           // default 0, incremented on each redirect
  isActive: Boolean,        // default true; false = redirect returns 404
  expiresAt: Date,          // optional; null = never expires
  createdAt: Date,
  updatedAt: Date
}
```

### RefreshToken

```js
{
  _id: ObjectId,
  token: String,            // hashed refresh token stored here, not raw
  userId: ObjectId,         // ref: User
  expiresAt: Date,
  createdAt: Date
}
```

---

## 3. Auth Strategy

- **Access Token:** JWT, short-lived (15 min), signed with `ACCESS_TOKEN_SECRET`
- **Refresh Token:** JWT, long-lived (7 days), signed with `REFRESH_TOKEN_SECRET`, hashed copy stored in `RefreshToken` collection for revocation
- Tokens delivered in response body (not cookies — simpler for API clients)
- Protected routes require `Authorization: Bearer <accessToken>` header

---

## 4. API Endpoints

### 4.1 Auth

#### `POST /api/v1/auth/register`

Register a new user.

**Request body:**
```json
{
  "username": "kakran",
  "email": "kakran@example.com",
  "password": "StrongPass@123"
}
```

**Validations:**
- `username`: required, 3–20 chars, alphanumeric + underscores only
- `email`: required, valid email format
- `password`: required, min 8 chars, at least 1 uppercase + 1 number

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "...",
    "username": "kakran",
    "email": "kakran@example.com"
  }
}
```

**Errors:**
- `400` — validation failure
- `409` — email or username already taken

---

#### `POST /api/v1/auth/login`

Authenticate and receive tokens.

**Request body:**
```json
{
  "email": "kakran@example.com",
  "password": "StrongPass@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "user": {
      "userId": "...",
      "username": "kakran",
      "email": "kakran@example.com"
    }
  }
}
```

**Errors:**
- `400` — missing fields
- `401` — invalid credentials

---

#### `POST /api/v1/auth/refresh`

Exchange a valid refresh token for a new access token.

**Request body:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "<new jwt>"
  }
}
```

**Errors:**
- `401` — token missing, invalid, expired, or revoked

---

#### `POST /api/v1/auth/logout`

🔒 Protected. Revoke the refresh token (delete from DB).

**Request body:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4.2 URL Shortening

#### `POST /api/v1/shorten`

🔒 Protected. Create a short URL.

**Request body:**
```json
{
  "originalUrl": "https://example.com/some/very/long/path",
  "customCode": "mylink",   // optional; auto-generated if omitted
  "expiresAt": "2025-12-31T00:00:00Z"  // optional
}
```

**Logic:**
- Validate `originalUrl` is a valid http/https URL
- If `customCode` provided: check uniqueness; error if taken
- If not: generate a unique 6-char alphanumeric slug (retry on collision, max 5 attempts)
- Associate with `req.user._id`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "shortUrl": "https://yourdomain.com/aB3xZ9",
    "shortCode": "aB3xZ9",
    "originalUrl": "https://example.com/...",
    "expiresAt": null,
    "createdAt": "..."
  }
}
```

**Errors:**
- `400` — invalid URL, invalid custom code format
- `409` — custom code already taken

---

#### `GET /api/v1/urls`

🔒 Protected. Get all URLs created by the authenticated user.

**Query params:**
- `page` (default: 1)
- `limit` (default: 10, max: 50)
- `sort` — `createdAt` | `clicks` (default: `createdAt`)
- `order` — `asc` | `desc` (default: `desc`)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "shortCode": "aB3xZ9",
        "shortUrl": "https://yourdomain.com/aB3xZ9",
        "originalUrl": "https://...",
        "clicks": 42,
        "isActive": true,
        "expiresAt": null,
        "createdAt": "..."
      }
    ],
    "pagination": {
      "total": 35,
      "page": 1,
      "limit": 10,
      "totalPages": 4
    }
  }
}
```

---

#### `GET /api/v1/urls/:shortCode`

🔒 Protected. Get details of a single URL (must be owner).

**Response `200`:** Single URL object (same shape as above)

**Errors:**
- `403` — not the owner
- `404` — short code not found

---

#### `PATCH /api/v1/urls/:shortCode`

🔒 Protected. Update URL settings (must be owner).

**Request body (all optional):**
```json
{
  "isActive": false,
  "expiresAt": "2025-06-01T00:00:00Z"
}
```

**Note:** `originalUrl` and `shortCode` are NOT updatable — immutable after creation.

**Response `200`:** Updated URL object

---

#### `DELETE /api/v1/urls/:shortCode`

🔒 Protected. Delete a URL permanently (must be owner).

**Response `200`:**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

---

### 4.3 Redirect

#### `GET /:shortCode`

Public. Resolve and redirect to the original URL.

**Logic:**
1. Look up `shortCode` in DB
2. If not found → `404`
3. If `isActive: false` → `410 Gone`
4. If `expiresAt` is set and in the past → `410 Gone`
5. Increment `clicks` by 1 (async, don't block redirect)
6. `302` redirect to `originalUrl`

**This route lives at root level, not under `/api/v1`.**

---

### 4.4 Health Check

#### `GET /healthcheck`

Public. Returns server status.

**Response `200`:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "uptime": 3600.5
}
```

---

## 5. Middleware

| Middleware | Purpose |
|---|---|
| `verifyJWT` | Verifies access token, attaches `req.user` |
| `validateRequest` | Zod/Joi schema validation on req.body |
| `errorHandler` | Global error handler, formats all error responses consistently |
| `rateLimiter` | Applied on `/api/v1/auth/*` — 10 req/15 min per IP |
| `morgan` | HTTP request logging (dev: `dev`, prod: `combined`) |

---

## 6. Error Response Format

All errors must follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": []  // optional array of field-level validation errors
}
```

Never leak stack traces or internal error messages in production.

---

## 7. Environment Variables

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/urlshortener
ACCESS_TOKEN_SECRET=<random 256-bit secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<different random 256-bit secret>
REFRESH_TOKEN_EXPIRY=7d
BASE_URL=https://yourdomain.com   # used to construct shortUrl in responses
NODE_ENV=development
```

---

## 8. Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── auth.controller.js
│   └── url.controller.js
├── middlewares/
│   ├── auth.middleware.js      # verifyJWT
│   ├── error.middleware.js
│   ├── rateLimiter.middleware.js
│   └── validate.middleware.js
├── models/
│   ├── user.model.js
│   ├── url.model.js
│   └── refreshToken.model.js
├── routes/
│   ├── auth.routes.js
│   ├── url.routes.js
│   └── redirect.routes.js
├── utils/
│   ├── asyncHandler.js
│   ├── ApiError.js            # custom error class
│   ├── ApiResponse.js         # consistent response wrapper
│   └── generateShortCode.js
├── validators/
│   ├── auth.validator.js
│   └── url.validator.js
├── app.js                     # express setup, middleware registration
└── index.js                   # entry point, DB connect, server start
```

---

## 9. Implementation Order

Build in this sequence — each step is independently testable before moving on:

1. **Project scaffolding** — ESM setup, `app.js`, `index.js`, DB connection, healthcheck route
2. **User model + auth routes** — register, login (no tokens yet, just bcrypt)
3. **JWT layer** — access token + refresh token issuance on login, `verifyJWT` middleware
4. **Refresh + logout** — refresh token rotation, DB-based revocation
5. **URL model + `/shorten`** — slug generation, creation endpoint
6. **URL CRUD** — list, get, update, delete (with ownership checks)
7. **Redirect route** — `GET /:shortCode` with click tracking
8. **Validation + error handling** — schema validation, global error handler, rate limiting
9. **Cleanup** — env validation on startup, production logging, index checks on MongoDB

---

## 10. MongoDB Indexes

```js
// User
{ email: 1 }        // unique
{ username: 1 }     // unique

// URL
{ shortCode: 1 }    // unique
{ owner: 1 }        // for listing user's URLs efficiently
{ expiresAt: 1 }    // TTL index optional (auto-delete expired docs)

// RefreshToken
{ token: 1 }        // for lookup on refresh/logout
{ expiresAt: 1 }    // TTL index — MongoDB auto-deletes expired tokens
```

---

## 11. Out of Scope (for now)

- Click analytics breakdown (by country, device, referrer)
- QR code generation
- URL preview / safe browsing check
- Team/org-level URL management
- Custom domain support
- Frontend / UI
