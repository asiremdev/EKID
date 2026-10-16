# Deploy WLIDI backend to VPS + test builds

**VPS:** `37.59.205.25`  
**API subdomain:** `https://wlidi.jour.one`  
**API base (app):** `https://wlidi.jour.one/api/v1`

The database stays on **Neon PostgreSQL** (already configured). The VPS only runs the NestJS API.

---

## 1. DNS (jour.one panel)

Add an **A record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `wlidi` | `37.59.205.25` | 300 |

Wait a few minutes, then check:

```bash
ping wlidi.jour.one
```

---

## 2. VPS first-time setup (SSH as root)

```bash
ssh root@37.59.205.25
```

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 3. Deploy the backend

```bash
mkdir -p /var/www && cd /var/www
git clone <YOUR_REPO_URL> wlidi
cd wlidi/backend
```

Create production env (copy from local `.env`, **never commit this file**):

```bash
nano .env
```

Minimum production values:

```env
NODE_ENV=production
PORT=4100
API_PREFIX=api
CORS_ORIGINS=*

DATABASE_URL=postgresql://...your-neon-pooled-url...
DIRECT_URL=postgresql://...your-neon-direct-url...

JWT_ACCESS_SECRET=<long-random-string-32+>
JWT_REFRESH_SECRET=<another-long-random-string-32+>
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=30d

COOKIE_DOMAIN=wlidi.jour.one
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

Install, migrate, build, start:

```bash
npm ci
npx prisma generate
npm run db:push
npm run build
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Check locally on the VPS:

```bash
curl http://127.0.0.1:4100/api/v1/health
```

---

## 4. Nginx + HTTPS

```bash
sudo cp /var/www/wlidi/backend/deploy/nginx-wlidi.conf /etc/nginx/sites-available/wlidi.jour.one
sudo ln -sf /etc/nginx/sites-available/wlidi.jour.one /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL certificate (follow prompts)
sudo certbot --nginx -d wlidi.jour.one
```

Test from your PC:

```bash
curl https://wlidi.jour.one/api/v1/health
```

Swagger (optional): `https://wlidi.jour.one/api/docs`

---

## 5. Connect the mobile app

`app.json` is set to:

```json
"extra": {
  "apiUrl": "https://wlidi.jour.one/api/v1"
}
```

Or override at build time:

```bash
set EXPO_PUBLIC_API_URL=https://wlidi.jour.one/api/v1
```

**Important:** Use **HTTPS** on real devices. Plain `http://37.59.205.25` is blocked by Android for API calls.

---

## 6. Build APK for testers

### Option A — Local release APK (fastest for Android testers)

```bash
cd c:\Projects\Kiddy
npm install
npx expo prebuild --platform android --clean

cd android
.\gradlew.bat assembleRelease
```

APK path:

```
android\app\build\outputs\apk\release\app-release.apk
```

Share that file (Google Drive, Telegram, etc.). Testers enable “Install unknown apps” and install.

You need a signing key for Play Store later; for internal testing, debug APK works too:

```bash
npx expo run:android --variant release
```

### Option B — EAS Build (recommended for a team)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

EAS gives a download link you can send to testers.

---

## 7. Update deployment after code changes

On the VPS:

```bash
cd /var/www/wlidi
git pull
cd backend
npm ci
npm run build
pm2 restart wlidi-api
```

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| App can’t reach API | Confirm `curl https://wlidi.jour.one/api/v1/health` works; check phone has internet |
| 502 Bad Gateway | `pm2 logs wlidi-api` — API not running or wrong PORT |
| DB errors | Neon allows connections from anywhere; verify `DATABASE_URL` on VPS |
| CORS | Set `CORS_ORIGINS=*` or list your origins in `.env` |
| SSL fails | DNS must point to VPS before `certbot` |

---

## Quick checklist

- [ ] DNS A record `wlidi` → `37.59.205.25`
- [ ] Backend running on VPS (`pm2 status`)
- [ ] `https://wlidi.jour.one/api/v1/health` returns OK
- [ ] `app.json` `apiUrl` = `https://wlidi.jour.one/api/v1`
- [ ] Rebuild APK and share with testers
