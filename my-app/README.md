# UPSC Prep Admin Panel

Complete admin panel solution for managing the UPSC Prep mobile application with PostgreSQL database and modern React frontend.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Import existing data
npm run migrate:data

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Admin Panel Setup

```bash
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install

# Start development server
npm run dev
```

Admin panel will run on `http://localhost:5173`

### 3. Login to Admin Panel

Open `http://localhost:5173` and login with:
- **Email**: admin@upscprep.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password after first login!

## 📁 Project Structure

```
my-app/
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── db/             # Database schema and connection
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   └── scripts/        # Data migration scripts
│   └── drizzle/            # Database migrations
│
├── admin-panel/            # React admin panel
│   ├── src/
│   │   ├── pages/          # Dashboard, Users, Roadmap, References
│   │   ├── components/     # Reusable components
│   │   └── services/       # API client
│   └── public/
│
└── src/                    # Mobile app (existing)
```

## 🎯 Features

### Backend API
- ✅ RESTful API with Express.js
- ✅ PostgreSQL database with Drizzle ORM
- ✅ JWT authentication for admin users
- ✅ CRUD operations for users, roadmap, and references
- ✅ Data migration from existing files
- ✅ Public API endpoints for mobile app

### Admin Panel
- ✅ Modern React UI with TailwindCSS
- ✅ Dashboard with statistics
- ✅ User management (view, delete)
- ✅ Roadmap management (topics, subtopics, sources)
- ✅ Visual references management (history, geography, etc.)
- ✅ Responsive design
- ✅ Real-time data updates with React Query

## 📚 API Endpoints

### Admin Routes (Requires Authentication)
```
POST   /api/auth/login              # Admin login
GET    /api/auth/me                 # Get current admin

GET    /api/users                   # List users (paginated)
GET    /api/users/:id               # Get user details
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user

GET    /api/roadmap/topics          # Get all topics
POST   /api/roadmap/topics          # Create topic
PUT    /api/roadmap/topics/:id      # Update topic
DELETE /api/roadmap/topics/:id      # Delete topic

GET    /api/references/:category    # Get references
POST   /api/references              # Create reference
PUT    /api/references/:id          # Update reference
DELETE /api/references/:id          # Delete reference
```

### Mobile App Routes (Public)
```
GET    /api/mobile/roadmap          # Get roadmap data
GET    /api/mobile/references/:cat  # Get visual references
POST   /api/mobile/users/sync       # Sync user data
POST   /api/mobile/progress         # Update progress
```

## 🔧 Development

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run migrate:data # Import existing data
```

### Admin Panel Scripts
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## 🔐 Security Notes

1. **Change Default Password**: The default admin password is `admin123`. Change it immediately after first login.

2. **Environment Variables**: Never commit `.env` files. Use `.env.example` as a template.

3. **JWT Secret**: Change the JWT_SECRET in production to a strong, random value.

4. **Database**: Ensure your PostgreSQL database is properly secured.

## 🎨 Customization

### Adding New Admin Users
Use the admin panel or API:
```bash
POST /api/auth/register
{
  "email": "newadmin@example.com",
  "password": "securepassword",
  "name": "New Admin"
}
```

### Modifying Database Schema
1. Edit `backend/src/db/schema.ts`
2. Run `npm run db:generate`
3. Run `npm run db:migrate`

## 📱 Mobile App Integration

The mobile app will need to be updated to fetch data from the backend API instead of local files. See the implementation plan for details on integrating the API.

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Run `npm run db:migrate`

### Admin panel won't connect to backend
- Ensure backend is running on port 3000
- Check VITE_API_URL in admin panel

### Data migration fails
- Ensure all reference files exist in the mobile app directory
- Check file paths in migration script

## 📄 License

This project is part of the UPSC Prep application.
