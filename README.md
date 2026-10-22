# ScholarTrack 🎓

> **Scholarship & Fellowship Deadline Observatory**  
> Real-time portal monitoring, idempotent scraping, timezone normalization, and deadline change detection with an authentic Apple Daylight & Obsidian Liquid Glass interface.

---

## ✨ Features

- **Automated Upstream Ingestion**: Idempotent scrapers with SHA-256 content hashing to avoid redundant writes and detect subtle portal revisions.
- **Deadline Timeline & Diff Modal**: Full historical timeline tracking for deadline extensions, ministerial notifications, and date changes.
- **Precision Timezone Normalization**: Real-time conversion across Indian Standard Time (IST), UTC, EST, PST, GMT, JST, and AEDT.
- **Health & Outage Monitoring**: Live source monitoring with simulated outage toggles, latency tracking, and resilience testing.
- **Liquid Glass Interface**: High-contrast Apple Daylight (light) and Obsidian Crystal (dark) design system with frosted glass cards, dynamic navigation dock, and tactile spring physics.
- **Comprehensive Filtering**: Filter scholarships by level (Undergraduate, Master's, PhD, Postdoc), discipline (STEM, Medical, Humanities), region, and confirmed deadlines.

---

## 🛠️ Architecture & Tech Stack

```
ScholarTrack/
├── backend/                  # FastAPI Python Service
│   ├── adapters/             # Official portal scrapers (NSP, PMRF, AICTE, etc.)
│   ├── fixtures/             # Mock HTML portal fixtures for tests & simulation
│   ├── migrations/           # SQLite schema migrations
│   ├── tests/                # Acceptance & integration test suite
│   ├── database.py           # SQLite connection pool & query helpers
│   ├── main.py               # REST API endpoints & CORS middleware
│   ├── services.py           # Ingestion orchestrator & timezone utilities
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Vite + React + Tailwind CSS Web App
│   ├── src/
│   │   ├── components/       # BentoMetrics, NoticeCard, DiffModal, AlertDrawer, etc.
│   │   ├── utils/            # Timezone formatters and helpers
│   │   ├── App.jsx           # Root application state & layout
│   │   └── index.css         # Liquid glass design system & typography tokens
│   ├── index.html            # Entry HTML & SVG chromatic dispersion filters
│   └── package.json          # Node dependencies & build scripts
├── start.bat                 # Unified launcher for Windows
├── stop.bat                  # Service stopper for ports 8000 & 5173
├── .gitignore                # Environment, database, and build ignore rules
└── README.md                 # Project documentation
```

### Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLite, BeautifulSoup4, HTTPX, Pydantic |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Design** | Liquid Glass (Specular insets, chromatic dispersion, Apple Daylight & Obsidian Dark) |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (with `npm`)
- **Git**: Installed and configured

---

### Option 1: Automatic Launcher (Windows)

Simply double-click `start.bat` or run from PowerShell / Command Prompt:

```bat
.\start.bat
```

This script automatically:
1. Verifies Python & Node.js environments
2. Installs backend dependencies from `backend/requirements.txt`
3. Applies SQLite database migrations
4. Installs frontend dependencies (`npm install`)
5. Launches FastAPI on `http://127.0.0.1:8000` and Vite on `http://127.0.0.1:5173`

To stop services:
```bat
.\stop.bat
```

---

### Option 2: Manual Start

#### 1. Backend Service
```bash
cd backend
python -m pip install -r requirements.txt
python migrations/run_migrations.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Swagger docs at `/docs`).

#### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://127.0.0.1:5173/`.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notices` | Query scholarship notices with filtering & search |
| `GET` | `/api/notices/{id}/history` | Retrieve full revision history & audit timeline |
| `GET` | `/api/sources` | Fetch all registered scraping sources & health status |
| `POST` | `/api/sources/{id}/refresh` | Trigger on-demand sync of an official portal |
| `GET` | `/api/metrics` | Ingestion metrics, closing soon count, and active notices |
| `GET` | `/api/alerts` | Detected deadline modifications & extension log |
| `POST` | `/api/mentor-challenge/revise-deadline` | Simulate an official deadline revision |
| `POST` | `/api/mentor-challenge/simulate-outage` | Simulate portal 503 gateway timeout |
| `POST` | `/api/mentor-challenge/reset` | Restore test fixtures & database to initial seed |

---

## 🧪 Testing

Run backend tests using pytest:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
