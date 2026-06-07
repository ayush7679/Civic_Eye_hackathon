# CivicEye — AI Road Damage Reporting Platform

A modern, production-quality frontend for AI-powered civic road damage reporting.

## Tech Stack

- **React 18** + **Vite** — fast development & build
- **Tailwind CSS** — utility-first styling with custom design system
- **React Router v6** — client-side routing
- **Axios** — API requests with interceptors
- **Leaflet + OpenStreetMap** — interactive mapping
- **Lucide React** — consistent iconography
- **Google Fonts**: Syne (display) + DM Sans (body) + JetBrains Mono

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx        # Hero, stats, recent reports, how-it-works
│   ├── Report.jsx      # Image upload, GPS, AI analysis results
│   ├── Map.jsx         # Interactive Leaflet map with severity markers
│   └── Admin.jsx       # Searchable/sortable reports dashboard
├── components/
│   ├── Navbar.jsx      # Responsive top navigation
│   ├── StatsCard.jsx   # Animated metric cards
│   ├── ReportCard.jsx  # Report preview card with severity
│   └── SeverityBadge.jsx  # Badge, bar, dot, color utilities
├── services/
│   └── api.js          # Axios instance + all API calls
├── App.jsx             # Router setup
├── main.jsx            # React entry point
└── index.css           # Tailwind + global styles
```

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend

# Start development server
npm run dev

# Build for production
npm run build
```

## Backend API Expected

| Endpoint | Method | Description |
|---|---|---|
| `/database` | GET | Returns all reports array |
| `/upload` | POST | Accepts `{ image: base64 }`, returns `{ path }` |
| `/analyze` | POST | Accepts `{ filePath, gpsX, gpsY }`, returns report data |
| `/updateVerification` | POST | Accepts `{ reportId, verificationStatus }` |
| `/updateStatus` | POST | Accepts `{ reportId, status }` |

## Report Data Shape

```json
{
  "id": 1,
  "severity_scale": 8,
  "estimated_time": "5 weeks",
  "image_type": "Real",
  "damage_type": "Pothole",
  "image_path": "imageUploads/captured.png",
  "gps_x": 27.7,
  "gps_y": 85.3,
  "description": "Deep pothole requiring urgent repair",
  "status": "broken",
  "verification": "unverified",
  "createdAt": "2026-06-06"
}
```

## Design System

| Color | Meaning |
|---|---|
| 🟢 Green | Low severity (1–3) |
| 🟡 Yellow/Amber | Moderate severity (4–7) |
| 🔴 Red | Critical severity (8–10) |
| 🔵 Blue | Primary UI / Admin actions |

## Features

- **Dark government-tech aesthetic** with navy/blue color palette
- **Animated UI** with staggered fade-up reveals, skeleton loaders
- **Custom map tiles** filtered to match dark theme
- **GPS auto-detection** with manual coordinate fallback
- **Optimistic UI updates** — admin actions reflect instantly
- **Searchable + sortable** admin table with multi-filter support
- **Mobile-responsive** — works on all screen sizes
- **Error handling** — graceful degradation on API failures
