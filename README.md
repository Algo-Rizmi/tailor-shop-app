# Tailor Shop Receipt App

A receipt system for tailor shops: sign up (email/password or Google), pick "New Receipt," it
shows the next sequential number automatically, you record customer and garment details, and save.
Every shop that signs up gets its own private, isolated data — this is a real multi-tenant product,
not a single-shop tool.

## How it works

- **`backend/`** — ASP.NET Core Web API (C#) + PostgreSQL. Owns all accounts and every shop's data.
  - **Accounts**: email/password (hashed with `PasswordHasher<T>`) or "Continue with Google"
    (verified server-side against your Google OAuth Client ID). Every account belongs to exactly
    one shop, created automatically on signup.
  - **Auth**: a JWT is issued on login/signup and sent as `Authorization: Bearer <token>` on every
    request; it carries the shop's ID so every query is automatically scoped to just that shop's
    data — one shop can never see or modify another's.
  - **The receipt counter** is an atomic `UPDATE ... RETURNING` inside a transaction, so two devices
    in the same shop tapping "New Receipt" at the same instant can never receive the same number.
  - **Volumes** ("chapters"): a shop picks its own starting number whenever it wants and receipts
    count up from there; starting a new volume closes the last one for good.
- **`mobile/`** — Expo (React Native + TypeScript) Android app. Login/Sign Up screens, then the
  same receipt list/detail/new-receipt/settings screens as before.

Creating a *new* receipt requires the phone to reach the backend (Wi-Fi or mobile data), because
the number has to come from the shared server-side counter. Previously-created receipts can still
be viewed if the last list fetch succeeded, but new receipts can't be assigned offline — that's the
tradeoff for guaranteeing no two devices ever hand out the same number.

## Local development

### 1. Backend + database

Requires Docker Desktop running.

```bash
cd backend
docker compose up -d
```

This starts Postgres and the API (on `http://localhost:8080`) and applies EF Core migrations
automatically. The dev JWT signing secret is set in `docker-compose.yml` — fine for local testing,
**must** be replaced with a real secret in production (see [DEPLOY.md](DEPLOY.md)).

If you'd rather run the API directly with `dotnet run` (e.g. Docker isn't available), install
PostgreSQL locally, create a `tailor` database/role matching `appsettings.Development.json`'s
connection string, then:

```bash
cd backend/Tailor.Api
dotnet run
```

### 2. Try the API directly (optional)

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123","shopName":"My Shop"}'
```

Returns a JWT — use it as `Authorization: Bearer <token>` on any other endpoint.

### 3. Mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on an Android phone (same Wi-Fi network as your
computer). The app ships with a default server address in `src/config.ts` — update
`DEFAULT_API_BASE_URL` to your computer's LAN IP for local testing (not `localhost` — that means
the phone itself). A "Show advanced settings" toggle on the Settings screen lets you override it
per-device without rebuilding, handy while developing.

"Continue with Google" needs real OAuth Client IDs before it will work — see
[DEPLOY.md](DEPLOY.md). Email/password sign-up works immediately with no extra setup.

## Deploying for real, public use

See [DEPLOY.md](DEPLOY.md) for putting the backend + database in the cloud, setting up Google
Sign-In, and the Play Store submission checklist.

## Not built yet (let me know if you want these)

- Printing/exporting receipts as PDF, or sharing via WhatsApp/SMS.
- Push notifications (e.g. "garment ready" alert to the customer).
- Multiple employee logins per shop (v1 is one account = one shop).
- Password reset / email verification flows.
