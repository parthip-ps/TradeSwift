# TradeSwift — Full Deployment Guide
## Backend on Render · Frontend on Vercel

---

## 🗂️ STEP 0 — What you need before starting

| Tool | Why |
|------|-----|
| [GitHub account](https://github.com) | To host the code (free) |
| [Render account](https://render.com) | To run the Python backend (free tier) |
| [Vercel account](https://vercel.com) | To host the React frontend (free tier) |
| Git installed on your computer | To push code |

---

## 📁 STEP 1 — Set up two GitHub repositories

You need **two separate repos** — one for backend, one for frontend.

### Create Repo 1: Backend

```bash
cd stock-predictor/backend
git init
git add .
git commit -m "TradeSwift backend - initial commit"
```

Go to github.com → New repository → name it **tradeswift-backend** → Create  
Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tradeswift-backend.git
git branch -M main
git push -u origin main
```

### Create Repo 2: Frontend

```bash
cd ../frontend
git init
git add .
git commit -m "TradeSwift frontend - initial commit"
```

Go to github.com → New repository → name it **tradeswift-frontend** → Create  
Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tradeswift-frontend.git
git branch -M main
git push -u origin main
```

---

## 🟢 STEP 2 — Deploy Backend on Render (Python API)

### 2a. Create a PostgreSQL Database

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Settings:
   - **Name:** `tradeswift-db`
   - **Plan:** Free
4. Click **Create Database**
5. Wait ~1 min until it shows **Available**
6. Copy the **Internal Database URL** — you'll need it in the next step

### 2b. Create the Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub account if prompted
3. Select the **tradeswift-backend** repository
4. Configure:

| Field | Value |
|-------|-------|
| **Name** | `tradeswift-api` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| **Plan** | Free |

5. Scroll down to **Environment Variables** → Add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the Internal Database URL from Step 2a |
| `JWT_SECRET_KEY` | Any long random string (e.g. `Tr@d3Sw1ft#Secret2024!`) |

6. Click **Create Web Service**
7. Wait 3–5 minutes for the first deploy to finish
8. ✅ Your backend URL will be: `https://tradeswift-api.onrender.com`

> **Important:** Copy this URL — you'll paste it into Vercel in the next step.

---

## ⚡ STEP 3 — Deploy Frontend on Vercel (React App)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Click **Continue with GitHub** → Select **tradeswift-frontend** repo
3. Vercel auto-detects Create React App ✅
4. Before clicking Deploy, expand **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://tradeswift-api.onrender.com` (your Render URL) |

5. Click **Deploy**
6. Wait ~2 minutes
7. ✅ Your live app URL: `https://tradeswift-frontend.vercel.app`

---

## ✅ STEP 4 — Test your live app

Open your Vercel URL and check:

| Test | Expected |
|------|---------|
| `/register` | Sign-up form works, creates account |
| `/login` | Logs in, **risk warning modal** appears with checkbox |
| Dashboard | Can enter AAPL + amount + date, shows top-5 sell days |
| `/admin` | Login as `LEOMESSI10` / `Bottle@123` → see all users & predictions |

---

## 🔄 STEP 5 — How to update your code later

### Update backend:
```bash
cd backend
# make your changes...
git add .
git commit -m "update: describe what you changed"
git push
# Render auto-redeploys within 2–3 minutes
```

### Update frontend:
```bash
cd frontend
# make your changes...
git add .
git commit -m "update: describe what you changed"
git push
# Vercel auto-redeploys within ~1 minute
```

---

## 🔐 Admin Credentials

```
Username : LEOMESSI10   (or leomessi10 — login is case-insensitive)
Password : Bottle@123
```

Access the admin panel at: `https://your-vercel-url.vercel.app/admin`

---

## ⚠️ Render Free Tier — Important Note

Render's free web services **spin down after 15 minutes of inactivity**.  
The first request after a sleep takes **~30 seconds** to wake up.  
This is normal. Subsequent requests are fast.

To avoid this, upgrade to Render's Starter plan ($7/month).

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|---------|
| "CORS error" in browser console | Check `REACT_APP_API_URL` in Vercel matches your Render URL exactly (no trailing slash) |
| "Invalid ticker" error | For Indian stocks add `.NS` (NSE) or `.BO` (BSE): e.g. `RELIANCE.NS` |
| Render deploy fails | Check the Render logs — usually a missing package. Run `pip install -r requirements.txt` locally to verify |
| Blank page on Vercel | Check browser console. Usually `REACT_APP_API_URL` is not set or wrong |
| Admin can't log in | Username is stored lowercase. Use `leomessi10` or `LEOMESSI10` — both work |
| yfinance timeout | Some stocks on yfinance are slow. Wait 30s and try again |

---

## 📞 Support

For deployment issues:
- **Render docs:** https://render.com/docs
- **Vercel docs:** https://vercel.com/docs
- **yfinance issues:** https://github.com/ranaroussi/yfinance
