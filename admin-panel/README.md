# UPSC Prep Admin Panel

A unified Next.js application that serves both the **Admin Dashboard** and **API endpoints** for the UPSC Prep mobile application.

## Features

- 📊 **Dashboard** - Overview of users, articles, maps
- 👥 **User Management** - CRUD operations for users
- 🗺️ **Maps Management** - Upload and manage map images
- 📝 **Articles** - Scrape web articles or write manually
- 🔐 **Authentication** - JWT-based admin auth

## Quick Start

### 1. Install Dependencies

```bash
cd admin-panel
npm install
```

### 2. Setup Environment

Create `.env` file:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/upsc_app
JWT_SECRET=your-secret-key
```

### 3. Run Development Server

```bash
npm run dev
```

The server runs at `http://localhost:3000`

### 4. Login

- **Username:** `admin`
- **Password:** `123`

## API Endpoints

### Admin (requires auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Admin login |
| `/api/dashboard/stats` | GET | Dashboard stats |
| `/api/users` | GET/POST | List/Create users |
| `/api/articles` | GET/POST | List/Create articles |
| `/api/articles/scrape` | POST | Scrape article from URL |
| `/api/maps` | GET/POST | List/Upload maps |

### Mobile (public)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/articles` | GET | Published articles |
| `/api/mobile/articles/:id` | GET | Article details |
| `/api/health` | GET | Health check |

## Project Structure

```
admin-panel/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   ├── articles/
│   │   │   ├── maps/
│   │   │   ├── users/
│   │   │   └── mobile/       # Mobile app endpoints
│   │   └── dashboard/        # Admin UI pages
│   ├── lib/
│   │   ├── db/               # Database schema & connection
│   │   ├── auth.ts           # JWT auth utilities
│   │   └── activity.ts       # Activity logging
│   └── components/           # Shared components
├── public/
│   └── uploads/              # Uploaded files
└── package.json
```

## For Mobile App

Update `my-app/src/config/api.js`:

```javascript
// For development with ngrok
const NGROK_URL = 'https://your-ngrok-url.ngrok-free.app';

// For local testing (Android emulator)
// Uses 10.0.2.2 which maps to host machine's localhost
```

## Production Build

```bash
npm run build
npm start
```

