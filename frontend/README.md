# LeadScope AI

**Find. Analyze. Connect. Grow.**
AI-powered lead intelligence and outreach platform for digital marketing agencies.

🔗 **Live demo:** https://leadscope-ai-eosin.vercel.app
*(Backend is on a free server: the first request may take ~50 seconds to wake up.)*

---

## 📌 Problem
Digital marketing agencies waste hours manually searching for local businesses, checking
their websites and reviews, and writing cold messages one by one.

## 💡 Solution
LeadScope AI finds local businesses, scores their **digital gaps** (no website, low rating,
few reviews, incomplete Google profile), explains **why** each one is a good lead, writes
**AI-personalised outreach**, and tracks every lead in a simple CRM.

---

## ✨ Features
- 🔐 **Secure accounts**: signup/login with JWT, BCrypt-hashed passwords, login attempt limit
- 🔎 **Find Leads**: search by city + business type (Google Places API, with demo mode)
- 📊 **Lead Scoring (0–100)**: rule-based score + High / Medium / Low priority
- 💬 **"Why this lead?"**: shows the exact opportunities found
- ✍️ **Write Message**: Email / WhatsApp / LinkedIn messages using **Google Gemini AI** (template fallback)
- 📋 **My Leads (CRM)**: status pipeline, notes, delete, search & filters
- 📈 **Dashboard**: totals, high-priority leads, no-website count, leads by city chart
- 🛡️ **Privacy**: every user sees only their own leads
- 💰 **Cost protection**: 10 searches per user per day

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Java 21, Spring Boot, Spring Security (JWT), Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| AI & APIs | Google Gemini API, Google Places API (New) |
| Deployment | Vercel (frontend), Render + Docker (backend), Aiven (MySQL) |
| Tools | Git & GitHub, IntelliJ IDEA, VS Code, Postman |

---

## 🏗️ Architecture
```
Browser ──> React (Vercel) ──REST + JWT──> Spring Boot (Render, Docker) ──> MySQL (Aiven)
                                                     │
                                                     ├──> Google Places API
                                                     └──> Google Gemini API
```

## 🧮 Lead Scoring Rules
| Gap found | Points |
|---|---|
| No website | +30 |
| Incomplete Google profile (no phone / opening hours) | +15 |
| Rating below 3.5 ★ | +15 |
| Fewer than 20 reviews | +10 |

Score is scaled to **0–100** → **High (≥70)**, **Medium (≥40)**, **Low (<40)**.

---

## 🔒 Security
- Passwords hashed with **BCrypt**; stateless **JWT** authentication
- **5 failed logins → 15-minute lock** (protects against brute-force attacks)
- Same error for wrong email or password (no account enumeration)
- **CORS** restricted to the frontend domain
- All secrets kept in **environment variables**, never committed to Git

---

## 🚀 Run Locally

**Backend** (`/backend`)
1. Create MySQL database `leadscope`
2. Create `src/main/resources/application-secret.properties` (git-ignored):
```
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   jwt.secret=ANY_LONG_RANDOM_TEXT_32+_CHARS
   google.places.key=        # optional (empty = demo mode)
   gemini.key=               # optional (empty = template mode)
```
3. Run `BackendApplication` → http://localhost:8080

**Frontend** (`/frontend`)
```bash
npm install
npm run dev     # http://localhost:3000
```

**Environment variables used in production:** `DB_URL`, `DB_USER`, `SPRING_DATASOURCE_PASSWORD`,
`JWT_SECRET`, `JWT_EXPIRATIONMS`, `CORS_ORIGINS`, `GEMINI_KEY`, `GOOGLE_PLACES_KEY`, `SHOW_SQL`, `TZ`,
and `VITE_API_BASE_URL` (frontend).

---

## 🔭 Future Scope
- Real-time Google Places data for all users
- Analytics & exportable reports (CSV / PDF)
- AI chat assistant and saved searches
- Send emails directly from the app

---

## 👩‍💻 Team
MCA Major Project, **Chandigarh University**
- **Kanak Kohli** (Team Lead): Backend, Database, Scoring, AI prompts, Deployment, Integration
- **Shivani Verma**
- **Megha Sharma**

**Guide:** Dr. Akshay Awasthi