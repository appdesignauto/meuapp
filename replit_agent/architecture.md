# Architecture Overview

## Overview

This repository contains a web application called "Design Auto", which appears to be a platform for automotive design templates and courses. The application follows a client-server architecture with a React frontend and Node.js/Express backend. It uses Drizzle ORM for database operations with a PostgreSQL database hosted on Neon.

The platform has features including user authentication, file uploads to Supabase Storage and Cloudflare R2, premium subscriptions via Hotmart integration, and course/educational content management.

## System Architecture

### High-Level Architecture

The application follows a modern web application architecture with:

1. **Client-side**: React-based SPA (Single Page Application) using Vite as the build tool
2. **Server-side**: Node.js/Express API server
3. **Database**: PostgreSQL via Neon's serverless offering
4. **Storage**: Supabase Storage (primary) with Cloudflare R2 as fallback
5. **Authentication**: Custom session-based authentication with Passport.js, with Supabase Auth integration

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Browser   │───────│   Express   │───────│PostgreSQL DB│
│  React SPA  │       │   Server    │       │  (Neon)     │
└─────────────┘       └─────────────┘       └─────────────┘
                            │
                            │
                      ┌─────┴─────┐
                      │           │
                 ┌────▼───┐  ┌────▼───┐
                 │Supabase│  │ R2      │
                 │Storage │  │ Storage │
                 └────────┘  └────────┘
```

### Client Architecture

- Built with React using a component-based architecture
- Leverages Shadcn UI components (with Radix UI primitives)
- Uses React Router for navigation
- State management via React Query (TanStack Query) and form state with React Hook Form
- Validation with Zod

### Server Architecture

- Express.js-based RESTful API
- Uses TypeScript for type safety
- Modular routing system with dedicated route files
- Service-oriented architecture with dedicated service classes

## Key Components

### Frontend Components

The frontend appears to use a combination of standard React components and UI libraries:

1. **UI Components**: Based on Shadcn UI with Radix UI primitives
2. **Form Handling**: React Hook Form with Zod validation
3. **Data Fetching**: React Query for data fetching, caching, and state management
4. **Routing**: React Router

### Backend Components

The backend is organized in a modular fashion:

1. **Routes**: Express routes in dedicated files
   - User management routes
   - Authentication routes
   - File upload routes
   - Course management routes

2. **Services**: Business logic encapsulated in service classes
   - `EmailService`: Handles email sending via Brevo
   - `SupabaseStorageService`: Manages file storage with Supabase
   - `R2StorageService`: Alternative storage with Cloudflare R2
   - `SubscriptionService`: Manages user subscriptions
   - `HotmartService`: Integration with Hotmart payment platform
   - `PasswordResetService`: Handles password reset flows
   - `EmailVerificationService`: Manages email verification

3. **Auth System**: Custom authentication with Passport.js
   - Session-based authentication
   - Flexible authentication fallbacks
   - Integration with Supabase Auth

4. **Database Layer**: Drizzle ORM for database operations
   - Strongly typed schema
   - Query building

### Database Schema

Key database entities include:

1. **users**: User accounts with authentication and profile information
2. **categories**: Categories for design templates
3. **arts**: Design templates/assets
4. **courses**, **courseModules**, **courseLessons**: Course-related entities
5. **subscriptions**: User subscription information
6. **testimonials**: User testimonials
7. **favorites**, **downloads**, **views**: User interactions with design templates

### Storage System

The application uses a multi-tiered storage approach:

1. **Primary Storage**: Supabase Storage
2. **Fallback Storage**: Cloudflare R2
3. **Local Storage**: Temporary file storage during processing

## Data Flow

### Authentication Flow

1. User credentials are validated against the database
2. On successful login, a session is created
3. Session is stored in the PostgreSQL database via `connect-pg-simple`
4. Client receives a session cookie for subsequent authenticated requests

### File Upload Flow

1. Files are uploaded to the server using multer
2. Server processes the file (optimizes images with Sharp)
3. Server attempts upload to Supabase Storage
4. If Supabase fails, falls back to Cloudflare R2
5. File URL is stored in the database
6. Client receives file URL for display

### Subscription Flow

1. User purchases a subscription via Hotmart
2. Hotmart webhook notifies the server
3. Server validates the webhook and updates user subscription status
4. User gains access to premium content

## External Dependencies

### Cloud Services

1. **Neon**: Serverless PostgreSQL database
2. **Supabase**: 
   - Storage for files/images
   - Authentication services
3. **Cloudflare R2**: Alternative file storage
4. **Brevo**: Email service provider
5. **Hotmart**: Payment processing and subscription management

### Key Libraries

1. **Frontend**:
   - React
   - TanStack Query (React Query)
   - React Hook Form
   - Zod
   - Radix UI / Shadcn UI
   - Lucide React (icons)

2. **Backend**:
   - Express
   - Passport.js
   - Drizzle ORM
   - Multer
   - Sharp
   - AWS SDK (for R2)
   - Supabase JS client

## Deployment Strategy

The application appears to be deployed on Replit, as indicated by the `.replit` configuration file. The deployment process includes:

1. **Build Step**: `npm run build` 
   - Vite builds the frontend into static assets
   - esbuild compiles the backend TypeScript

2. **Run Step**: `npm run start`
   - Runs the compiled server code which serves both the API and static frontend assets

3. **Environment Configuration**:
   - Environment variables for all external services and database connections

4. **Database Migrations**:
   - Drizzle ORM handles database schema migrations
   - Migration scripts for adding new tables or columns

## Security Considerations

The application implements several security measures:

1. **Authentication**:
   - Password hashing with scrypt or bcrypt
   - Session-based authentication
   - Email verification

2. **Authorization**:
   - Role-based access control via user levels 
   - Premium content restrictions

3. **Storage Security**:
   - Secure file uploads with type checking and size limits
   - Third-party storage providers with access controls

4. **API Security**:
   - CORS configuration for allowed domains
   - Input validation with Zod

## Challenges and Solutions

The repository contains several emergency fix scripts that address production issues:

1. **Authentication Problems**: 
   - Implemented flexible authentication with fallback mechanisms
   - Created bypass solutions for critical paths

2. **Image Upload Issues**:
   - Multi-tiered storage approach with fallbacks
   - Dedicated direct upload routes

3. **Timezone Issues**:
   - Custom date utilities for Brazil timezone
   - Database timezone configuration

These patches suggest an evolving architecture that has been adapted to solve real-world production challenges.