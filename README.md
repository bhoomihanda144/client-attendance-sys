# 🎓 Secure QR-Based Smart Attendance System

A full-stack attendance management system for DRAIT using QR codes, built with React, Node.js, and MongoDB.

---

## ✨ Features

- **Role-based authentication** — Teacher & Student roles via email
- **QR code session management** — Teachers generate sessions; students scan to mark attendance
- **Live attendance feed** — Real-time polling every 3 seconds
- **Duplicate prevention** — Unique constraint per student+session
- **Attendance analytics** — Percentage, history, 85% threshold warning
- **Session expiry** — Sessions auto-expire after 2 hours
- **Premium dark UI** — Glassmorphism, Framer Motion animations, Syne font

---

## 🗂 Project Structure

```
attendance-system/
├── server/              # Node.js + Express backend
│   ├── src/
│   │   ├── models/      # Mongoose schemas (User, Session, Attendance)
│   │   ├── routes/      # API route handlers
│   │   └── index.js     # Entry point
│   ├── .env.example
│   └── package.json
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── pages/       # LoginPage, TeacherDashboard, StudentDashboard, ScannerPage
│   │   ├── components/  # Navbar, UI, ProtectedRoute
│   │   ├── context/     # AuthContext
│   │   └── utils/       # api.js
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd attendance-system

# Install all dependencies
npm install
npm run install:all
```

### 2. Configure Server Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/attendance_system
PORT=5000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

### 3. Configure Client Environment

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run Development Servers

```bash
# From root — runs both server and client
npm run dev

# OR separately:
npm run dev:server   # Backend on :5000
npm run dev:client   # Frontend on :5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Credentials

| Role    | Email                      |
|---------|---------------------------|
| Teacher | `teacher@drait.edu.in`    |
| Student | `1da23cs031@drait.edu.in` |

Student email pattern: `<roll_number>@drait.edu.in`

---

## 🌐 Deployment

### Backend → Render

1. Push `server/` to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `FRONTEND_URL` — your Netlify URL (e.g. `https://myapp.netlify.app`)
   - `BACKEND_URL` — your Render URL (e.g. `https://myapi.onrender.com`)
   - `PORT` — `10000`
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend → Netlify

1. Push `client/` to a GitHub repo
2. Create a new site on [netlify.com](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment variable:
   - `VITE_API_URL` — your Render backend URL
5. The `netlify.toml` handles SPA redirects automatically

> ⚠️ **HTTPS required** for camera access on mobile. Both Render and Netlify provide HTTPS by default.

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with email |
| POST | `/api/sessions/create-session` | Create new session (teacher) |
| GET | `/api/sessions/generate-qr/:sessionId` | Get QR code for session |
| GET | `/api/sessions/session-attendance/:sessionId` | Live attendance for session |
| GET | `/api/sessions/teacher-sessions/:teacherId` | All teacher sessions |
| PUT | `/api/sessions/end-session/:sessionId` | End a session |
| POST | `/api/attendance/mark` | Mark attendance (API) |
| GET | `/api/attendance/mark?session=ID` | Mark via QR redirect |
| GET | `/api/attendance/student/:studentId` | Student attendance stats |

---

## 🗃 Database Schema

**Users**
```js
{ name, email (unique), role: 'teacher'|'student', timestamps }
```

**Sessions**
```js
{ sessionId (unique), createdBy (ref User), subject, isActive, expiresAt, timestamps }
```

**Attendance**
```js
{ studentId (ref User), sessionId, markedAt }
// Unique index: { studentId, sessionId }
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| QR Code | `qrcode` (generation) |
| QR Scanner | `html5-qrcode` (camera) |
| Fonts | Syne (Google Fonts) |
| Deployment | Render (backend) + Netlify (frontend) |

---

## 📱 How It Works

1. **Teacher** logs in → starts a session with subject name → QR code appears on screen
2. **Student** logs in on mobile → taps "Scan QR" → points camera at teacher's screen
3. App extracts session ID from QR URL → sends mark request to backend
4. Backend validates session, checks duplicates → saves attendance
5. Teacher's live feed updates every 3 seconds with new entries
6. Student dashboard shows running percentage and history

---

## 🛡 Security Notes

- Email domain restricted to `@drait.edu.in`
- Sessions expire after 2 hours (configurable)
- Duplicate attendance prevented at DB level with unique compound index
- CORS configured for specific frontend origins

---

## 📄 License

MIT — Free to use and modify for educational purposes.
