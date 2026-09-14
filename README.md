# ATTI GOLD — Starter Platform

A clean starter for a legitimate income/wallet-style web app.

## Included
- Register / Login UI
- Dashboard
- Wallet and transactions
- Plans UI
- Referral UI
- Withdrawal request UI
- Admin panel UI
- SQLite database schema
- Express API starter
- Password hashing with bcrypt
- JWT authentication

## Important
This is a starter/demo platform. Do not advertise guaranteed returns or use it to mislead users.
Before accepting real money, add legal/compliance review, payment-provider verification, KYC/AML where applicable, audit logging, rate limiting, HTTPS, secrets management, and proper financial controls.

## Run
1. Install Node.js 20+
2. `npm install`
3. Copy `.env.example` to `.env` and set a strong JWT secret.
4. `npm run init-db`
5. `npm run dev`
6. Open `http://localhost:3000`

Demo admin is created by the seed script only if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are supplied.
