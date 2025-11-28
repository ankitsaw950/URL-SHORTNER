
---

# 📄 **URL Shortener – Project Documentation (Till Redis Caching)**

This document explains the entire development process of the URL Shortener backend up to implementing Redis caching. It covers folder setup, controller design, adding custom slugs, identifying race conditions, optimizing MongoDB usage, improving query performance with `.lean()`, and integrating Redis for high-speed redirects.

---

#  **1. Project Setup**

## **Folder Structure**

We follow a clean modular structure:

```
project/
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   └── utils/
│
├── server.js
└── package.json
```

### **Key Files**

* `controllers/url.controller.js` → Create + Redirect logic
* `models/url.model.js` → URL schema
* `routes/url.routes.js` → Routing
* `config/db.js` → MongoDB connection
* `config/redis.js` → Redis caching

---

# 🔧 **2. Basic URL Controller Setup**

We start by creating two main controllers:

## ✔ **createUrl**

* Accepts long URL from request body.
* Generates a short code.
* Stores mapping in MongoDB.

## ✔ **redirectUrl**

* Looks up the short code.
* Redirects user to original URL.

---

# 🔤 **3. Adding Feature: Custom Slug**

Users should be able to specify their own custom code instead of a randomly generated one.

### **Naive Implementation (Problematic)**

```js
if (customCode) {
  const existingUrl = await URL.findOne({ short_url: customCode });
  if (existingUrl) {
    return res.status(400).json({ message: "Custom code already exists" });
  }
}
```

### ❌ **Why This Approach is Bad**

This creates a **race condition**:

### ⚠ Scenario:

Two users send the **same** custom slug at the **same time**.

1. **Both run `findOne()`**
2. Both get: *"slug does not exist"*
3. Both run `URL.create()`
4. One succeeds, one fails → inconsistent behavior

### ❌ Additional Issues

* Performs **one extra DB read every time** user sends a custom code
  → Slows down API
* Does not trust MongoDB’s **unique index**
* Not scalable when multiple server instances run

---

# 🔒 **4. Solution: Use Unique Index + Catch Duplicate Error**

MongoDB ensures uniqueness.
We **remove manual checking** and **let DB enforce uniqueness**.

### New approach:

* Try inserting directly.
* If slug already exists → Mongo throws error code: `11000`
* Catch and handle cleanly.

This avoids race conditions and eliminates unnecessary DB reads.

---

# 🌐 **5. Validating URL Format**

Earlier, no format validations were present.

Now we add:

```js
try {
  const normalizedUrl = new URL(url).href;
} catch {
  return res.status(400).json({ message: "Invalid URL" });
}
```

### Why is this important?

* Ensures only valid URLs (http/https) are stored
* Prevents storing invalid or malicious URLs
* Normalizes URL
  Example: removes unnecessary characters and ensures consistent format

---

# ⚙ **6. Redirect Logic Optimization with `.lean()`**

Initial redirect logic:

```js
const url = await URL.findOne({ short_url: code });
```

### ❌ Problem:

Returns a **full Mongoose document**, which includes:

* internal metadata
* getters/setters
* prototype chain
* virtuals

This is unnecessary for a simple redirect.

---

### ✔ Optimized version:

```js
const url = await URL.findOne({ short_url: code }).lean();
```

### Benefits of `.lean()`:

* Returns **plain JS object**
* **3x to 10x faster**
* Less memory usage
* Perfect for high-frequency redirect endpoint

---

# 🚀 **7. Adding Redis Caching (Major Optimization)**

Redirect route is the **most frequently hit** part of any URL shortener.

To handle thousands/millions of redirects efficiently, we add **Redis caching**.

---

# ⚡ **Caching Strategy (Cache-Aside Pattern)**

### **Flow:**

```
1️⃣ Check Redis cache using short code
    ↓
2️⃣ If found → redirect immediately (<2ms)
    ↓
3️⃣ If NOT found → query MongoDB
    ↓
4️⃣ Save result to Redis for future use
    ↓
5️⃣ Redirect user to original URL
```

### Why this is important?

* Removes 80–95% of DB load
* Makes redirect almost instantaneous
* Scales well across multiple servers
* Boosts performance dramatically

---

# 🟢 **Redis-Powered Redirect Code**

```js
// STEP 1 : Check the redis cache first
const cachekey = `short:${code}`;
const cachedUrl = await redisClient.get(cachekey);

if (cachedUrl) {
  console.log("🟢 Redis cache hit");
  return res.redirect(cachedUrl);
}

console.log("🟠 Redis cache miss");

// STEP 2 : Check the DB
const url = await UrlModel.findOne(
  { short_url: code },
  { full_url: 1, _id: 0 }
)
  .lean()
  .exec();

if (!url) return res.status(404).json({ message: "URL not found" });

// STEP 3 : Add to the redis cache
await redisClient.set(cachekey, url.full_url, { EX: 60 * 60 });

return res.redirect(url.full_url);
```

---

# 📈 **Redis Cache Hit / Miss Behavior**

### First request:

```
🟠 Redis cache miss
```

* MongoDB is queried
* Redis is updated
* Redirect happens

### Next requests:

```
🟢 Redis cache hit
```

* Served instantly from Redis
* No database query

---

