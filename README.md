# LeadScope AI

A web app that helps digital marketing agencies find local businesses that need help online, score how good a lead each one is, and keep track of outreach.

**Live:** https://leadscope-ai-eosin.vercel.app
(The backend runs on a free Render plan, so the first request after a while can take up to a minute while the server wakes up.)

This was our MCA major project at Chandigarh University (2026), built by a team of three. I led the team and worked on the backend, the database and the deployment.

## Why this project

Before my MCA I worked in digital marketing for a year. Finding new clients was mostly manual work: searching Google Maps, opening each business to see if it had a website, checking reviews, and then writing messages one by one. I wanted to build something that does the searching and checking part, so the time goes into actually talking to clients.

## Features

- **Accounts**: sign up and log in with JWT. Passwords are hashed with BCrypt, and an email gets locked for 15 minutes after 5 wrong passwords.
- **Find Leads**: search businesses by city and category (data from Geoapify / OpenStreetMap).
- **Lead score (0–100)**: every result gets a score and a High / Medium / Low priority, with a breakdown of why.
- **My Leads**: save leads and move them through statuses (New, Contacted, Follow-up, Interested, Won, Not interested), add notes and an expected deal value. Each user only sees their own leads.
- **Write Message**: drafts an outreach message for WhatsApp, email or LinkedIn using the Gemini API.
- **Other tools**: review sentiment check, website checker, nearby competitors, dashboard and insights, Excel/PDF export.

## How the lead score works

A lead gets points for each "digital gap" it has:

| Rule | Points |
|---|---|
| No website | 30 |
| Profile incomplete (no phone or no opening hours) | 15 |
| Rating below 3.5 | 15 |
| Fewer than 20 reviews | 10 |

`score = points earned / points possible × 100`

70 and above is High, 40–69 is Medium, below 40 is Low.

I divide by the points *possible* instead of a fixed 70 because OpenStreetMap often has no rating or review data. If that data is missing, those two rules are skipped, so the business is not unfairly scored lower. The code is in `LeadScoringService.java`.

## Tech stack

| Part | Technology |
|---|---|
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA (Hibernate) |
| Database | MySQL 8 |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Leaflet |
| External APIs | Geoapify (business data), Google Gemini (messages and summaries) |
| Deployment | Backend on Render (Docker), frontend on Vercel, database on Aiven MySQL |

## How the parts connect

```
React app (Vercel)
      |
      |  HTTP requests with JSON, plus "Authorization: Bearer <JWT>"
      v
Spring Boot REST API (Render)
      |                     \
      v                      v
MySQL database (Aiven)    Geoapify / Gemini APIs
```

After login, the backend sends back a JWT. The frontend stores it and sends it with every request. A filter on the backend (`JwtAuthFilter`) checks the token before the request reaches any controller.

## Project structure

```
backend/
  controller/   REST endpoints (auth, leads, search, dashboard, ...)
  service/      business logic (scoring, search, Gemini calls, ...)
  entity/       JPA classes mapped to MySQL tables (User, Lead)
  repository/   Spring Data JPA interfaces for database queries
  security/     JWT creation and the JWT filter
  config/       Spring Security and CORS setup
  dto/          request/response classes for the API

frontend/src/
  features/     one folder per page/feature (auth, leads, dashboard, ...)
  services/     functions that call the backend API
  components/   shared layout and UI pieces
```

## Main API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in and get a JWT |
| GET | `/api/auth/me` | Get the logged-in user |
| POST | `/api/search` | Search businesses by city and category |
| GET | `/api/leads` | List my saved leads |
| POST | `/api/leads` | Save a lead |
| PUT | `/api/leads/{id}/status` | Change a lead's status |
| DELETE | `/api/leads/{id}` | Delete a lead |
| POST | `/api/leads/{id}/message` | Generate an outreach message |
| GET | `/api/dashboard/summary` | Numbers for the dashboard |

Everything except signup, login and `/api/health` needs a valid JWT.

## Running it locally

You need Java 21, Node 18+ and MySQL 8.

**Backend**

1. Create a database: `CREATE DATABASE leadscope;`
2. Create `backend/src/main/resources/application-secret.properties` (this file is in `.gitignore`):
   ```
   spring.datasource.password=your_mysql_password
   jwt.secret=any_long_random_text_of_at_least_32_characters
   geoapify.key=your_geoapify_key
   gemini.key=your_gemini_key
   ```
3. Run it:
   ```
   cd backend
   ./mvnw spring-boot:run
   ```
   The API starts on http://localhost:8080. Tables are created automatically by Hibernate.

**Frontend**

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

## Known limitations

- OpenStreetMap data is incomplete, so a business marked "no website" might actually have one.
- No ratings or reviews come from OpenStreetMap, so review sentiment works on reviews pasted in by the user.
- Messages are generated, but sending them is still manual.
- The free Render plan sleeps when idle, which causes the slow first load.
- The login lock is kept in memory, so it resets if the server restarts.

## Team

- Kanak Kohli: team lead, backend, database, deployment
- Shivani Verma
- Megha Sharma

Guided by Dr. Akshay Awasthi.
