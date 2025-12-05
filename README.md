# CampusConnect Pro – Event Management System

A centralized, web-based platform designed to streamline event management within a university setting.

## Project Info

**Live URL**: https://campus-event-hub-weld.vercel.app  
**Lovable Project**: https://lovable.dev/projects/d9a29deb-85b7-434c-9ac0-af1e71c2bc6a

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Lucide React** - Icons

### Backend (Lovable Cloud / Supabase)
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database (hosted on Supabase)
- **Supabase Auth** - Email/password authentication
- **Row Level Security (RLS)** - Database security policies

### Deployment
- **Frontend**: Vercel
- **Backend/Database**: Lovable Cloud (Supabase)

## Features

### User Roles
- **Admin** - Full system access, approve/reject events, manage resources
- **Organizer** - Create events, book resources, view registrations
- **Student** - View approved events, register for events

### Core Functionality
- Event submission with validation
- Multi-step approval workflow
- Resource booking (rooms, A/V equipment)
- Real-time availability checking
- Event registration system
- Role-based access control

## Environment Variables

For Vercel deployment, set these environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Authentication

The system uses Supabase Auth with email/password authentication. Email auto-confirm is enabled for streamlined testing.

### Test Credentials
- **Admin**: admin1@gmail.com / admin123

## Database Schema

Key tables:
- `profiles` - User profile information
- `user_roles` - Role assignments (admin, organizer, student)
- `events` - Event details and status
- `resources` - Rooms and equipment
- `bookings` - Resource reservations
- `event_registrations` - Student event registrations
- `approvals` - Event approval workflow

## Group C-13 Members

1. OLUWATUNMIBI FAVOUR OYINDAMOLA - 22/0215
2. OZOH COLLINS EBELE - 22/2735
3. OLUWATUKESI DANIEL OLUWADARASIMI - 22/0220
4. OLUKOYA TOLUWANI WISDOM - 22/0077
5. OMONIGHO-OKORO OGHENEFEJIRO - 22/0261
6. OLUWATADE ARAOLUWA DAVID - 22/0136
