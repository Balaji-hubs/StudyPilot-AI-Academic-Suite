# AI Study Planner
> **“Plan Smart. Study Better. Achieve More.”**

An intelligent, full-stack student productivity and academic planning platform designed for college and university students. AI Study Planner centralizes curriculum subjects, syllabus topics, assignment deadlines, examination countdowns, weekly lecture timetables, class attendance metrics, and Pomodoro study sessions into a unified, AI-driven environment.

---

## 🌟 Key Features

### 1. 🤖 AI-Powered Study Planner
- **Daily Action Plan:** Automatically breaks down your day into morning, afternoon, and evening deep work blocks based on your available study hours and peak focus times.
- **7-Day Balanced Schedule:** Distributes registered subjects evenly throughout the week to maintain consistent progress and prevent burnout.
- **Exam Preparation Roadmap:** Detects upcoming examinations, analyzes remaining vs. completed syllabus topics, prioritizes weak areas, and builds multi-phase revision schedules.
- **Regenerate & Save:** Customize your goals, regenerate plans on the fly, and accept them directly into your active dashboard.

### 2. 💬 StudyPilot AI Assistant
- Conversational academic advisor equipped with context over your actual courses, upcoming tests, weak topics, and daily study hours.
- Prompt suggestions for instant guidance: *"What should I study today?"*, *"How should I prepare for my upcoming exams?"*, *"Create a 3-hour study plan for tonight"*.
- Strict data boundaries: Answers only from your real academic records, never fabricating dates or exam requirements.

### 3. ⏱️ Interactive Study Timer & Pomodoro Tracker
- Built-in **Pomodoro (25m focus / 5m break)** and continuous **Stopwatch** modes.
- Persistent across page navigations with sound chimes and celebration confetti on completion.
- Tag sessions with subjects, topics, and study modes (*Focus, Revision, Practice, Reading, Assignment*).
- Sessions are automatically persisted into the relational database.

### 4. 🔥 Daily Study Streak Engine
- Consecutive daily activity (completing tasks or logging study sessions) increases your streak.
- Real-time current streak and personal best streak counters displayed prominently in the top navigation and dashboard.

### 5. 🛡️ Attendance Safety Guard
- Subject-wise attendance calculation: $\text{Attendance } \% = \left(\frac{\text{Attended Classes}}{\text{Total Classes}}\right) \times 100$.
- Automatic warning triggers whenever attendance drops below your target threshold (e.g. 75%).
- Recovery calculator indicates the exact number of consecutive upcoming classes you must attend to restore eligibility.

### 6. 📅 Interactive Weekly & Daily Timetable
- Multi-day schedule grid (Monday to Sunday) with start/end time slots, classrooms, and slot types.
- Automatic **time conflict detection** alerts you before double-booking study or class slots.

### 7. 🎓 Exam Planner & Live Countdowns
- Tracks Semester, Midterm, Internal, Practical, and Viva examinations.
- Live countdown indicators (*"DBMS Semester Exam — 12 days remaining"*) with color-coded urgency badges.

### 8. 📋 Coursework & Task Management
- Filter by views: **All, Due Today, Upcoming, Overdue, and Completed**.
- Priorities: *Urgent, High, Medium, Low*.
- Search by keyword, filter by subject, and sort by urgency or deadline.

### 9. 📊 Deep Learning Analytics (Recharts)
- Weekly study duration bar charts.
- 4-week monthly consistency area graphs.
- Subject time investment donut charts.
- Coursework completion and attendance comparison benchmarks.

### 10. 🎨 Premium UI & Dark Mode
- Full support for both **Dark** and **Light** themes with instant local and profile persistence.
- Glassmorphism design system built with custom CSS tokens, modern typography (*Plus Jakarta Sans*, *Outfit*), and micro-animations.
- Fully responsive on mobile phones, tablets, laptops, and wide desktop screens.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Lucide React, Recharts, Axios, Canvas Confetti |
| **Styling** | Vanilla CSS Design System with CSS Custom Properties, HSL color tokens, Glassmorphism |
| **Backend** | Node.js, Express.js, REST Architecture, Rate Limiting, CORS |
| **Database** | Relational SQLite via `better-sqlite3` with foreign keys enabled (`PRAGMA foreign_keys = ON`), WAL mode |
| **Authentication** | JWT (JSON Web Tokens), `bcryptjs` password hashing, protected middleware |
| **AI Integration** | Server-side AI engine supporting Gemini / OpenAI APIs with intelligent deterministic fallback |

---

## 🏛️ Project Architecture

```
ai_study-planner-antigravity/
├── client/                     # Frontend React (Vite) Application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable Layout & Study components
│   │   │   ├── layout/         # Navbar, Sidebar, MobileNav, Layout
│   │   │   └── study/          # StudyTimerModal (Pomodoro & Stopwatch)
│   │   ├── context/            # AuthContext, ThemeContext, TimerContext, NotificationContext
│   │   ├── pages/              # 13 Complete Application Pages
│   │   ├── services/           # Axios API Client with JWT interceptors
│   │   ├── styles/             # Complete CSS design system (index.css)
│   │   ├── App.jsx             # React Router route definitions
│   │   └── main.jsx            # Application entrypoint
│   ├── index.html              # HTML with Google Fonts & SEO tags
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite config with backend proxy (/api -> :5000)
│
├── server/                     # Backend Node.js / Express REST API
│   ├── config/                 # Environment variables & constants
│   ├── database/               # Relational Database Layer
│   │   ├── db.js               # SQLite connection & WAL pragma
│   │   └── schema.sql          # 15 Relational Tables with Foreign Keys & Indexes
│   ├── middleware/             # JWT auth middleware & error handler
│   ├── routes/                 # 12 Modular REST Route Controllers
│   │   ├── authRoutes.js       # Register, Login, Logout, Forgot/Reset Password
│   │   ├── profileRoutes.js    # Academic details & password updates
│   │   ├── subjectRoutes.js    # Enriched subject metrics & CRUD
│   │   ├── topicRoutes.js      # Syllabus concepts, difficulty & weak tags
│   │   ├── taskRoutes.js       # Views, priorities, and status updates
│   │   ├── examRoutes.js       # Countdowns & exam types
│   │   ├── timetableRoutes.js  # Day/Week schedule & conflict detection
│   │   ├── attendanceRoutes.js # Percentage tracking & warnings
│   │   ├── studySessionRoutes.js # Duration aggregations & timer logging
│   │   ├── streakRoutes.js     # Daily study streak calculation
│   │   ├── analyticsRoutes.js  # Aggregated metrics for Recharts
│   │   ├── aiRoutes.js         # Study plan, recommendations, StudyPilot chat
│   │   ├── notificationRoutes.js # Automated alerts & reminders
│   │   └── settingsRoutes.js   # Preferences, JSON/CSV exports, deletion
│   ├── services/               # Business Logic & AI Services
│   │   ├── aiService.js        # Server-side AI engine & heuristic planner
│   │   ├── streakService.js    # Multi-activity streak algorithm
│   │   └── notificationService.js # Exam & attendance auto-sync
│   ├── package.json            # Server dependencies
│   └── server.js               # Express application entrypoint
│
├── data/                       # Database storage directory (auto-created)
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Root convenience scripts
└── README.md                   # Full documentation
```

---

## 🗄️ Database Schema (15 Relational Tables)

1. `users`: Core account authentication (`id`, `email`, `password_hash`, `full_name`, `reset_token`, `reset_token_expiry`).
2. `profiles`: Academic profile (`user_id`, `avatar_url`, `college`, `course`, `branch`, `year`, `semester`, `bio`).
3. `user_settings`: User preferences (`theme`, `enable_reminders`, `exam_reminders`, `task_reminders`, `study_reminders`, `daily_study_target_minutes`, `preferred_study_time`, `pomodoro_focus_min`, `attendance_target_pct`).
4. `subjects`: Courses (`user_id`, `name`, `code`, `teacher`, `target_percentage`, `color`, `icon`, `description`).
5. `topics`: Syllabus topics (`user_id`, `subject_id`, `name`, `difficulty`, `importance`, `is_completed`, `is_weak`, `notes`, `estimated_minutes`).
6. `tasks`: Coursework assignments (`user_id`, `subject_id`, `topic_id`, `title`, `description`, `priority`, `status`, `due_date`, `estimated_minutes`, `is_completed`).
7. `exams`: Tests & finals (`user_id`, `subject_id`, `name`, `exam_date`, `exam_time`, `exam_type`, `priority`, `notes`).
8. `timetable_entries`: Class schedule (`user_id`, `subject_id`, `topic_id`, `day_of_week`, `start_time`, `end_time`, `room`, `type`, `notes`).
9. `attendance_records`: Class logs (`user_id`, `subject_id`, `date`, `status` [present/absent], `notes`).
10. `study_sessions`: Deep work logs (`user_id`, `subject_id`, `topic_id`, `start_time`, `end_time`, `duration_minutes`, `mode`, `notes`, `date`).
11. `ai_plans`: Saved AI schedules (`user_id`, `plan_type`, `title`, `content_json`, `status`).
12. `ai_recommendations`: Personalized insights (`user_id`, `type`, `title`, `message`, `priority`, `action_link`).
13. `notifications`: Alert notifications (`user_id`, `type`, `title`, `message`, `link`, `is_read`).
14. `chat_sessions`: StudyPilot conversations (`user_id`, `title`).
15. `chat_messages`: Conversation transcript (`user_id`, `session_id`, `role`, `content`).

*All queries enforce strict multi-tenant isolation with `WHERE user_id = ?`.*

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 1. Installation
Clone the repository and install dependencies in both `server/` and `client/`:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `.env` inside `server/` (or copy from `.env.example`):

```bash
# In server/.env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-random-secret-key
DATABASE_PATH=../data/study_planner.db
AI_API_KEY=               # Optional: Gemini or OpenAI API Key
AI_PROVIDER=gemini        # 'gemini' | 'openai'
APP_URL=http://localhost:5000
```

*Note: If `AI_API_KEY` is not provided, the application runs out-of-the-box using the built-in intelligent heuristic academic engine with 100% functionality.*

### 3. Running Locally

#### Development Mode (Concurrent)
Start the backend server on port 5000:
```bash
cd server
npm start
```

In a separate terminal, start the frontend client on port 3000:
```bash
cd client
npm run dev
```
Open **http://localhost:3000** in your browser.

#### Production Build & Serve
Build the client and serve everything from the single Express server:
```bash
# Build the React application
cd client
npm run build

# Start production server
cd ../server
node server.js
```
Open **http://localhost:5000** in your browser.

---

## 🧪 Testing & Verification Checklist

- [x] **Authentication:** Signup with validation, secure bcrypt password hashing, login token persistence, logout, forgot/reset password flow.
- [x] **Onboarding:** Wizard records student university, major, year, semester, and daily study target.
- [x] **Dashboard:** Real-time stat cards, today's action plan with checkbox completion, countdowns, streaks, and AI recommendation card.
- [x] **Tasks:** Filter by All / Today / Upcoming / Completed / Overdue, priority badges, search, and edit modal.
- [x] **Subjects:** Syllabus progress bars, topic counts, study hours, attendance rates, and exam links.
- [x] **Topics:** Difficulty & importance indicators, weak topic flags, and syllabus checkboxes.
- [x] **Exams:** Real-time countdowns (*"X days remaining"*), category badges, and past exam archives.
- [x] **Timetable:** Weekly Mon-Sun grid, daily view, and conflict overlap detection.
- [x] **Attendance:** Percentage formulas, threshold alerts, and classes needed recovery calculator.
- [x] **Study Sessions:** Interactive Pomodoro & Stopwatch modal with subject linking and sound chimes.
- [x] **Analytics:** Recharts bar, area, and donut charts powered by actual database records.
- [x] **AI Planner:** Generates Daily, Weekly, and Exam Preparation schedules with save actions.
- [x] **AI Assistant:** StudyPilot AI chatbot with suggested prompts and contextual responses.
- [x] **Settings & Privacy:** Dark/light mode switcher, notification toggles, JSON and CSV data exports, and account deletion.

---

## 🔒 Data Privacy & Security

1. **Password Protection:** All user passwords are encrypted using `bcryptjs` with salt factor 10.
2. **Session Security:** REST endpoints are protected with JSON Web Tokens and verified per-request.
3. **Multi-Tenant Isolation:** Database foreign key constraints and user ID filters ensure no student can ever view another student's records.
4. **Data Ownership:** One-click full export of your planner data in standard JSON or CSV formats.

---

## 📄 License
ISC License. Built for students striving for academic excellence.
