# 🛒 Store API — E-Commerce REST API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white)
![Paymob](https://img.shields.io/badge/Paymob-0070E0?style=flat-square&logoColor=white)

A professional **E-Commerce Backend REST API** built with **Node.js** and **Express.js**, following a clean, modular architecture.

---

## 🚀 Key Features

- **JWT Authentication** — Stateless auth, bcrypt password hashing, OTP activation & password reset
- **Role-Based Access Control** — Admin vs. User middleware on all protected routes
- **Payment Gateway** — Full order flow with **Paymob**, including webhook support
- **Email Service** — Transactional emails via **Nodemailer** (SMTP)
- **File Uploads** — Multi-image product uploads via **Multer**
- **Rate Limiting** — Brute-force protection on sensitive endpoints
- **Input Validation** — Request validation via **express-validator**
- **Database Seeding** — Auto-creates admin account on first run

---

## 🏗️ Project Structure

```
StoreApi/
├── controllers/   # Business logic
├── middlewares/   # Auth, validation, rate limiter, upload
├── models/        # Mongoose schemas
├── routes/        # Express routers
├── services/      # Email & file services
├── seed.js        # Seeds default admin account
└── index.js       # Entry point
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the project and add the following variables:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN_MINUTES=10

OTP_EXPIRES_IN_SECONDS=300

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=Store API

ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_PASSWORD=your_admin_password

PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_PUBLIC_KEY=your_paymob_public_key
PAYMOB_HMAC_SECRET=your_paymob_hmac_secret
PAYMOB_INTEGRATION_ID=your_paymob_integration_id
PAYMOB_BASE_URL=https://accept.paymob.com

BASE_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN_MINUTES` | Token lifetime in minutes |
| `OTP_EXPIRES_IN_SECONDS` | OTP expiry duration |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASSWORD` | SMTP App Password |
| `ADMIN_EMAIL` | Seeded admin email |
| `ADMIN_PASSWORD` | Seeded admin password |
| `PAYMOB_SECRET_KEY` | Paymob secret key |
| `PAYMOB_PUBLIC_KEY` | Paymob public key |
| `PAYMOB_HMAC_SECRET` | Paymob webhook HMAC secret |
| `PAYMOB_INTEGRATION_ID` | Paymob integration ID |
| `PAYMOB_BASE_URL` | `https://accept.paymob.com` |
| `BASE_URL` | Your API's public URL |

---

## 🚦 Getting Started

```bash
git clone https://github.com/ziad-ahmed-abdulrahman/Store-API.git
cd Store-API
npm install
# configure your .env
npm run dev
```

> On first run, the admin account is auto-created from `ADMIN_EMAIL` & `ADMIN_PASSWORD` in `.env`.

---

## 🧪 Testing with Postman

Two files are included in the `/postman` folder:

- `StoreAPI_node.postman_collection.json` — all API requests organized by resource
- `StoreAPI_node_shared.postman_environment.json` — environment variables

**How to use:**

1. Open **Postman** → click **Import** → select both files from the `/postman` folder
2. From the top-right environment dropdown, select **StoreAPI_node_shared**
3. Fill in these environment variables before running any request:

| Variable | Description |
|---|---|
| `baseurl` | Your local or hosted API URL (e.g. `http://localhost:3000`) |
| `test_user_email` | Email for a test user account |
| `test_user_pass` | Password for the test user |
| `test_admin_email` | Email for the admin account (from `.env`) |
| `test_admin_pass` | Password for the admin account (from `.env`) |
| `token` | **Leave empty** — auto-filled after login |
| `test_user_new_pass` | Used only for the reset-password flow |

> After calling **Login**, the `token` variable is set automatically and used in all subsequent requests.

---

## 📡 Available Routes

| Prefix | Resource |
|---|---|
| `/api/auth` | Register, Login, OTP Activation, Password Reset |
| `/api/users` | User profile management |
| `/api/products` | Product listing, creation, update, delete |
| `/api/categories` | Category management |
| `/api/cart` | Cart operations |
| `/api/orders` | Order creation, payment, cancellation, admin controls |

---

## 👨‍💻 Author

**Ziad Ahmed Abdulrahman**
