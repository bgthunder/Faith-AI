## Faith — Mood‑Aware AI Companion

Faith is an experimental prototype: a lightweight, mood‑aware conversational agent that asks a daily check‑in, personalizes replies based on mood context, offers short wellness suggestions, detects crisis language, and exposes simple mood analytics. This repository contains a React + Vite frontend and a Node.js + Express backend (in‑memory stores by default). The system is intended for research/demonstration and is not production‑ready.
## Table of contents
- About
- Features
- Architecture
- Tech stack
- Getting started (local)
	- Prerequisites
	- Backend
	- Frontend
- Configuration / Environment
- API (examples)
- Developer notes
- UX & safety design decisions
- Data, privacy & ethics
- Roadmap
- Contributing
- License
- Contact

---

## About
Faith is designed to provide low‑friction, supportive conversational interaction with:
- a daily "How are you feeling today?" check‑in
- mood‑aware replies and wellness suggestions (only for emotional moods)
- client + server crisis detection with safe guidance (e.g., US 988)
- an Analytics panel for mood history and trends
- a community feed prototype for sharing mood‑tagged posts

This project is intended for research, prototyping, and user studies. It is not a substitute for clinical care.

---

## Features
- Daily check‑in modal that persists one check‑in per day in `localStorage`
- Mood‑aware prompts: mood context is sent to the backend and injected into prompts
- Typing indicator + simulated thinking delay for more natural pacing
- Crisis keyword detection (client & server) with safe, immediate responses and hotline guidance
- Mood‑triggered wellness suggestions for selected moods (stressed, sad, tired, lonely)
- In‑memory analytics with `GET /analytics` and a frontend `AnalyticsPanel`
- Community feed: create and filter posts by mood (in‑memory)
- Simple, extensible codebase for evaluation and extension

---

## Architecture (high level)
- Frontend (React + Vite): UI components, daily check‑in, chat composer, analytics modal and charts. See `frontend/src/`.
- Backend (Node + Express): API routes, mood detection, analytics, memory store, community posts, health/safety logic. See `backend/`.
- AI generation: local Ollama instance (or substitute) called from the backend for conversational reply generation.

Simple flow:
User → Frontend (mood + message) → Backend `/chat` → (mood detector, memory) → Ollama (generate) → Backend records analytics → Frontend displays reply + wellness card.

---

## Tech stack
- Frontend: React, Vite, Framer Motion, Lucide React
- Backend: Node.js, Express, Axios
- Local LLM: Ollama (optional local service at `http://localhost:11434/api/generate`)
- Persistence (prototype): in‑memory objects + `localStorage` (no DB by default)
- Dev tools: npm, Vite hot reload

---

## Getting started (local)

Important: This README assumes the repo root contains `frontend/` and `backend/` folders.

### Prerequisites
- Node.js (v18+ recommended)
- npm
- (Optional) Ollama or another model endpoint if you want generated replies — otherwise the server returns deterministic fallback text

### 1) Install dependencies
```bash
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

### 2) Start backend (default port 5000)
```bash
cd backend
npm run start
# or: node server.js
```

### 3) Start frontend (Vite, default port 5173)
```bash
cd frontend
npm run dev
# open http://localhost:5173
```

If you use a different backend URL, set the frontend env var before starting:
```bash
# Windows PowerShell
$env:VITE_API_URL="http://localhost:5000"
npm run dev

# Linux / macOS
VITE_API_URL="http://localhost:5000" npm run dev
```

---

## Configuration / Environment variables

Backend
- `PORT` — port for the Express server (defaults to `5000` in code)
- `OLLAMA_URL` — (optional) override Ollama API URL used by the backend (default used in server code: `http://localhost:11434/api/generate`)

Frontend
- `VITE_API_URL` — optional base API URL (defaults to `http://localhost:5000` in the UI). If set, the frontend will use `${VITE_API_URL}/analytics`, `${VITE_API_URL}/chat`, etc.

---

## API (selected endpoints & examples)

All examples assume backend at `http://localhost:5000`.

### POST /chat
- Send a chat message. You can optionally include `mood` or `dailyMood` (preferred).
```bash
curl -X POST http://localhost:5000/chat \
	-H "Content-Type: application/json" \
	-d '{"message":"I feel stressed today","mood":"stressed"}'
```
Response (example):
```json
{
	"mood": "stressed",
	"reply": "Hey there! It's okay to feel stressed sometimes...",
	"wellnessActivity": {
		"key":"breathing",
		"title":"Breathing reset",
		"description":"Try 4 slow breaths in, 4 hold, 6 out...",
		"icon":"🌿"
	}
}
```

### POST /daily-checkin
- Record today's mood:
```bash
curl -X POST http://localhost:5000/daily-checkin \
	-H "Content-Type: application/json" \
	-d '{"mood":"stressed","note":"Long day at work"}'
```

### GET /analytics
- Return mood events summary and simple trend metrics:
```bash
curl http://localhost:5000/analytics
```

Community endpoints (prototype)
- `POST /posts`, `GET /posts` — simple in‑memory posts with mood tags (see code under `backend/communityPosts.js`).

---

## Developer notes
- Frontend entry: `frontend/src/App.jsx` (main UI logic — chat composer, analytics fetch, daily check‑in)
- Analytics panel component: `frontend/src/components/AnalyticsPanel.jsx`
- Backend server: `backend/server.js`
- Mood detection: `backend/moodDetector.js` (simple keyword / rule‑based)
- Analytics: `backend/emotionalAnalytics.js` (in‑memory store and summarizer)
- Wellness mapping: `backend/wellnessActivities.js` (maps mood → suggestion)

Design decisions:
- Greeting detection is handled server‑side to keep front end simple.
- Wellness suggestions are only shown for emotional moods to avoid noisy tips.
- In-memory storage simplifies prototyping; swap to a DB for persistence.

---

## UX & safety design
- Crisis detection: both client and server scan messages for high‑priority crisis keywords; when detected the app returns a safe, empathetic reply and recommends immediate resources (US 988 included). This is NOT a replacement for emergency services.
- Wellness suggestions are intentionally small, nonclinical actions (breathing, short walk, hydration).
- Daily check‑in is a simple single choice + optional note to reduce friction.
- Accessibility: dialogs include `role="dialog"` and ARIA attributes where applicable.

---

## Data, privacy & ethics
- Current prototype stores analytics, memory, and posts in server memory; daily check‑in uses `localStorage`. Data is ephemeral and lost on server restart.
- If you run the demo with real people or plan a study:
	- Obtain IRB/ethics approval where required.
	- Provide informed consent and clear crisis disclaimers.
	- Anonymize or do NOT collect personal identifiers.
	- Implement secure transport (HTTPS) and storage (encrypted).
	- Retention policy and deletion mechanism should be in place.

---

## Roadmap / Next steps
- Add persistent storage (SQLite/Postgres) and per‑user authentication
- Add robust safety pipelines (human escalation, logging)
- Pilot user study (N=30–100) and formal evaluation instruments
- Add model fallback (hosted LLMs) and rate limits
- Improve mood detection with ML classifier trained on labeled data

---

## Contributing
Contributions are welcome. Suggested workflow:
1. Fork the repo and create a feature branch
2. Open a pull request with a clear description and test instructions
3. For research/experiments, include dataset/IRB information where applicable

Please follow the code style already used in the repo and add tests for nontrivial logic.

---

## License
Add a license to the repository before public release. Suggested: MIT for maximum openness, or choose a license consistent with institutional policies. (License file not included in prototype by default.)

---

## Contact
If you want to collaborate, run a pilot, or report an issue:
- Open an issue on GitHub
- Or contact the project owner in the repo (add your preferred email or profile link)

---

If you’d like, I can also add `CONTRIBUTING.md`, `SECURITY.md`, and a `LICENSE` file. Let me know which one to create next.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
