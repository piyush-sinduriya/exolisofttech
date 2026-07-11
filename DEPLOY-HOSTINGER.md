# 🚀 Hostinger Premium pe Deploy karne ka Complete Guide

Ye guide aapki Explisoft Technology website ko **Hostinger Premium Web Hosting**
(Node.js support wale plan) pe deploy karne ke liye hai.

---

## ✅ Prerequisites (Ye check kar lo)

- Hostinger Premium/Business Web Hosting plan (Node.js support ke saath)
- Domain configured on Hostinger (e.g., `yourdomain.com`)
- hPanel access
- SSH access enabled (hPanel → Advanced → SSH Access)

---

## 📋 Overview

Deployment 4 phases me hoga:

1. **Local machine pe** — config change + code prepare karo
2. **GitHub** — code push karo
3. **Hostinger hPanel** — subdomain + Node.js app setup
4. **SSH via terminal** — install + build + start

---

## 🔷 PHASE 1: Local Machine Setup

### Step 1.1 — GitHub se code clone karo

Lovable me top-right pe **GitHub** icon click karo → Connect → repo create karo.
Phir apne local machine pe:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Step 1.2 — `vite.config.ts` update karo (IMPORTANT!)

Default config **Cloudflare Workers** ke liye hai. Hostinger Node.js ke liye
`node-server` preset chahiye. File replace karo:

```ts
// vite.config.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Nitro ko Node.js server preset pe switch karo Hostinger ke liye
  vite: {
    build: {
      // Nitro config Node.js server target ke liye
    },
  },
  nitro: {
    preset: "node-server",
  },
});
```

> ⚠️ **Note:** Agar upar wala config error de, to alternative:
> Environment variable set karo build ke waqt:
> ```bash
> NITRO_PRESET=node-server bun run build
> ```

### Step 1.3 — `package.json` me start script add karo

`scripts` section me ye add karo:

```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "preview": "vite preview",
  "start": "node .output/server/index.mjs",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

### Step 1.4 — Locally test karo

```bash
bun install
NITRO_PRESET=node-server bun run build
bun run start
```

`http://localhost:3000` pe site chalni chahiye. Confirm karne ke baad aage badho.

### Step 1.5 — Commit + push karo

```bash
git add .
git commit -m "Configure for Hostinger Node.js deployment"
git push origin main
```

---

## 🔷 PHASE 2: Hostinger hPanel Setup

### Step 2.1 — Subdomain banao (optional but recommended)

Agar aap chahte ho **main WordPress site untouched rahe** aur ye React app
`app.yourdomain.com` pe chale:

1. hPanel → **Domains → Subdomains**
2. Subdomain: `app`
3. Document root: `/public_html/app` (auto)
4. Create

Ya agar poori site replace karni hai, subdomain skip karke `public_html/` use karo.

### Step 2.2 — Node.js App create karo

1. hPanel → **Advanced → Node.js**
2. **Create Application** click karo
3. Settings:
   - **Node.js version:** `20.x` (latest LTS)
   - **Application mode:** `Production`
   - **Application root:** `public_html/app` (ya jo path ho)
   - **Application URL:** `app.yourdomain.com`
   - **Application startup file:** `.output/server/index.mjs`
4. **Create** click karo
5. hPanel me app dikhegi with a status (initially "Stopped")

### Step 2.3 — Environment variables set karo (agar zarurat ho)

Same Node.js app screen me **Environment Variables** section me add karo:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Hostinger auto assign kar sakta hai) |

Future me jab CF7 wire karoge:

| Variable | Value |
|---|---|
| `CF7_ENDPOINT_URL` | `https://yourdomain.com/wp-json/contact-form-7/v1/contact-forms/123/feedback` |

---

## 🔷 PHASE 3: Code Upload (Git via SSH)

### Step 3.1 — SSH enable karo

1. hPanel → **Advanced → SSH Access**
2. **Enable** karo
3. IP, port, username note karo (jaise `u123456789@srv123.hostinger.io -p 65002`)

### Step 3.2 — SSH se connect karo

Terminal (Mac/Linux) ya PowerShell (Windows) me:

```bash
ssh -p 65002 u123456789@your-server-ip
```

Password enter karo (hPanel me set kiya hua).

### Step 3.3 — Repo clone karo

```bash
cd public_html/app
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

> `.` (dot) at the end matlab current folder me clone. Isse `app/` ke andar
> extra folder nahi banega.

### Step 3.4 — Dependencies install + build

```bash
# Node version check
node -v   # Should be 20.x

# Install
npm install

# Build (Node preset ke saath)
NITRO_PRESET=node-server npm run build
```

Build 2-3 minute lega. Successful hone pe `.output/` folder ban jayega.

---

## 🔷 PHASE 4: App Start karo

### Step 4.1 — hPanel se app restart karo

1. hPanel → **Node.js** → aapki app → **Restart** button
2. Status **"Running"** ho jani chahiye

### Step 4.2 — SSL enable karo (free HTTPS)

1. hPanel → **Security → SSL**
2. Domain/subdomain select: `app.yourdomain.com`
3. **Install SSL** (Let's Encrypt free)
4. 2-5 minute me active ho jayega

### Step 4.3 — Test karo

Browser me open karo: `https://app.yourdomain.com`

Site live honi chahiye ✅

---

## 🔄 Future Updates Deploy karna

Jab bhi Lovable me kuch change karo:

1. Lovable auto GitHub pe push karega (agar connected hai)
2. SSH karo Hostinger pe:
   ```bash
   cd public_html/app
   git pull
   npm install         # sirf agar new packages add hue ho
   NITRO_PRESET=node-server npm run build
   ```
3. hPanel → Node.js → **Restart**

**Automated deploy** ke liye Hostinger ka **Git Auto-Deploy** feature use kar sakte ho:
hPanel → Advanced → Git → Repository add karo, "Auto-Deployment" enable karo.

---

## 🛠 Troubleshooting

### App "Stopped" dikha rahi hai
- hPanel → Node.js → **Logs** dekho
- Common issue: `.output/server/index.mjs` file nahi mili → build fail hua
- Solution: SSH me `NITRO_PRESET=node-server npm run build` re-run karo

### 502 Bad Gateway
- Node app crash ho gayi
- Logs check karo, error fix karo, restart karo

### Build memory error (out of memory)
- Shared hosting me memory limited hoti hai
- SSH me try karo: `NODE_OPTIONS="--max-old-space-size=1024" npm run build`

### Port already in use
- Hostinger apne aap port assign karta hai
- `.env` me `PORT` set mat karo, ya Hostinger ke assigned port use karo

### Cloudflare preset error during build
- `vite.config.ts` me `nitro.preset: "node-server"` add karna bhool gaye
- Ya build command me `NITRO_PRESET=node-server` prefix laga do

### CSS/images 404
- `.output/public/` folder upload nahi hua
- Full `.output/` folder present hona chahiye after build

---

## 📞 Server Functions Note

Aapki site me **2 server functions** hain (`submitContact`, `subscribeNewsletter`)
`src/lib/contact.functions.ts` me. Ye Node.js pe automatically chalengi.

Abhi ye sirf **server console pe log** karti hain — form data kahin save nahi hota.
Agar aap chahte ho ki submissions email pe aayen ya WordPress me save hon,
CF7 integration setup karo (alag guide ke liye poochho).

---

## ✅ Deployment Checklist

- [ ] GitHub repo connected + code pushed
- [ ] `vite.config.ts` me `nitro.preset: "node-server"` set
- [ ] `package.json` me `start` script added
- [ ] Local build + start successful
- [ ] Hostinger subdomain created
- [ ] Hostinger Node.js app created (with correct startup file path)
- [ ] SSH enabled + tested
- [ ] Code cloned in `public_html/app`
- [ ] `npm install` successful
- [ ] `npm run build` successful (`.output/` created)
- [ ] App status "Running" in hPanel
- [ ] SSL installed
- [ ] Site opens in browser with HTTPS

---

**Any step pe stuck ho? Screenshot bhejo main help kar dunga.**