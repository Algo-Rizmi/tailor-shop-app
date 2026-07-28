# Deploying for Real, Public Use

This app is meant to be used by any tailor shop that signs up — so it needs a real, always-on
backend (not your home PC), real Google OAuth credentials for "Continue with Google," and a Play
Store listing. Every step below that creates an account or spends money is something **you** do —
I can't create accounts or agree to terms on your behalf. I've marked those clearly.

## 1. Create the database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account/project. **(your account)**
2. Create a database named `tailor`.
3. Copy the connection string it gives you — it looks like:
   `postgresql://user:password@ep-xxxx.neon.tech/tailor?sslmode=require`
4. Convert it to the .NET/Npgsql format:
   `Host=ep-xxxx.neon.tech;Port=5432;Database=tailor;Username=user;Password=password;SSL Mode=Require;Trust Server Certificate=true`

## 2. Create Google OAuth credentials (for "Continue with Google")

**(your Google account — I can't create this project for you)**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project.
2. Go to **APIs & Services → OAuth consent screen**. Choose **External**, fill in the app name,
   your email, and (once you have one) the privacy policy URL from step 6. Add the scopes
   `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**:
   - Create one of type **Web application** — this is your `GOOGLE_WEB_CLIENT_ID`. No redirect URI
     is needed for the flow this app uses.
   - Create a second of type **Android** — you'll need your app's **package name** (from
     `mobile/app.json`, currently `mobile`/adjust as needed) and its **SHA-1 fingerprint**. Get the
     SHA-1 from EAS after your first build:
     ```bash
     cd mobile && npx eas credentials
     ```
     (select Android → view your keystore). This is your `GOOGLE_ANDROID_CLIENT_ID`.
4. Put both values in:
   - `mobile/src/config.ts` → `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`
   - The backend's `GoogleAuth:ClientId` setting (the **Web** client ID — that's what the backend
     verifies incoming Google ID tokens against) — set via the `GoogleAuth__ClientId` environment
     variable in step 3 below.
5. While your OAuth consent screen is in "Testing" mode, only email addresses you explicitly add
   as test users can sign in with Google. Submit it for verification (Google's own review process)
   once you're ready for the general public — this can take a few days.

## 3. Deploy the API (Render)

1. Push this project to a GitHub repository (Render deploys from a repo). **(your GitHub account)**
2. On [render.com](https://render.com), create a new **Web Service**. **(your account)**, pointing
   at the repo, with root directory `backend/Tailor.Api` and the existing `Dockerfile`.
3. Under **Environment**, add:
   - `ConnectionStrings__Default` = the Npgsql connection string from step 1
   - `Jwt__Secret` = a long random string, generated yourself and kept secret — this signs every
     login token, so treat it like a master password:
     ```bash
     openssl rand -base64 48
     ```
   - `GoogleAuth__ClientId` = the **Web** Client ID from step 2
   - `ASPNETCORE_ENVIRONMENT` = `Production`
4. Deploy. Render gives you a public URL like `https://tailor-api.onrender.com`.
5. In Production, migrations are **not** auto-applied on startup (that only happens in
   Development, so a bad migration can't take down a live server on deploy). Apply them once
   after the first deploy:
   ```bash
   cd backend/Tailor.Api
   dotnet ef database update --connection "<the Npgsql connection string from step 1>"
   ```

## 4. Point the app at production

Update `mobile/src/config.ts`:
```ts
export const DEFAULT_API_BASE_URL = 'https://tailor-api.onrender.com';
```
This is what ships to every user — nobody signing up from the Play Store should ever need to type
in a server address.

## 5. Build an installable app (EAS)

**(your free Expo account — `npx eas login`)**

```bash
cd mobile
npx eas build --platform android --profile production
```

This produces a signed `.aab` (Android App Bundle) — the format the Play Store requires. The first
build also generates the signing keystore you need for the Android OAuth Client ID in step 2.

## 6. Write and host a privacy policy

**Required** by Play Store policy since this app collects emails and account data. A draft:

> This app collects your email address to create and secure your account, and stores the receipts,
> volumes, and clothing items you enter to provide the service. Data is stored securely and is not
> sold or shared with third parties. If you sign in with Google, we receive your email address and
> Google account ID to identify your account — we do not receive your Google password. Contact
> [your email] to request account deletion.

Host this anywhere public — even a single static HTML page works — and link it from both the OAuth
consent screen (step 2) and the Play Console listing (step 7).

## 7. Submit to the Google Play Store

**(your Google Play Developer account, one-time $25 fee — this is you, not me)**

1. Create an account at [play.google.com/console](https://play.google.com/console/signup).
2. Create a new app, upload the `.aab` from step 5.
3. Fill in the **Store listing**: title, short/full description, screenshots (take a few from Expo
   Go or the built app), app icon (already in `mobile/assets/`).
4. Complete the **Content rating questionnaire** and the **Data safety** form — since the app
   collects email addresses and account data, declare that accurately; link your privacy policy
   from step 6.
5. Submit for review. Google's review typically takes a few days for a new app.

## Notes on the free tiers

- Render's free web service tier sleeps after 15 minutes of inactivity and takes ~30s to wake up
  on the next request — fine while testing, but a public app should move to a paid tier (~$7/mo)
  before launch so new users don't hit a slow first load.
- Neon's free tier includes automatic backups and point-in-time restore for the last 7 days.
- Google's OAuth consent screen review (step 2.5) and Play Store review (step 7.5) are the two
  steps most likely to introduce delay — start those early.
