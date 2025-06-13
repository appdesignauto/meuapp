# replit.md

## Overview

DesignAuto is a comprehensive digital platform for automotive design professionals and enthusiasts. The application provides design resources, educational content through video courses, community features, and subscription management with external payment integration. The platform serves both free and premium users with different access levels to content and features.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build processes
- **State Management**: React Query for server state management
- **Styling**: CSS with utility classes and responsive design
- **Authentication**: Session-based authentication with user roles

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Storage**: Multiple storage solutions including Supabase and R2 bucket storage
- **Authentication**: Passport.js for session management

### Database Schema
The system uses PostgreSQL with the following key entities:
- **Users**: Core user management with role-based access control
- **Arts**: Design resources with premium/free tiers
- **Courses**: Educational video content with modules and lessons
- **Community**: Posts, comments, and user interactions
- **Subscriptions**: Premium access management with webhook integration
- **Webhook Logs**: Audit trail for external payment processing

## Key Components

### Authentication & Authorization
- **Multi-tier access levels**: admin, designer_adm, designer, premium, free
- **Session-based authentication** with role verification middleware
- **Automatic user creation** via webhook integration for premium purchases

### Content Management
- **Design Gallery**: Filterable and searchable design resources
- **Course System**: Video lessons organized by modules with progress tracking
- **Community Platform**: User-generated content with moderation features
- **File Upload System**: Multi-provider file storage with automatic fallbacks

### Payment Integration
- **Hotmart Integration**: Webhook processing for subscription management
- **Doppus Integration**: Alternative payment processor support
- **Automatic User Promotion**: Webhook-triggered premium access granting

### Administrative Features
- **User Management**: Role assignment and subscription control
- **Content Moderation**: Community post approval and report handling
- **Analytics Dashboard**: User metrics and subscription statistics
- **Configuration Management**: Site settings and integration parameters

## Data Flow

### User Registration Flow
1. User registers with basic account (free tier)
2. Email verification and account activation
3. Optional premium upgrade through external payment
4. Webhook processing for automatic premium access

### Content Access Flow
1. User authentication and role verification
2. Content filtering based on user access level
3. Premium content restriction for free users
4. Dynamic content serving with caching

### Webhook Processing Flow
1. External payment processor sends webhook
2. Webhook validation and logging
3. User lookup or creation with standard password
4. Subscription activation and role assignment
5. Audit logging and confirmation response

## External Dependencies

### Core Dependencies
- **Express.js**: Web framework and routing
- **Drizzle ORM**: Database abstraction and type safety
- **PostgreSQL**: Primary data storage
- **React Query**: Frontend state management
- **Multer**: File upload handling

### Storage Solutions
- **R2 Bucket**: Primary file storage for images
- **Supabase Storage**: Alternative storage provider
- **Local Storage**: Fallback for file uploads

### Payment Integrations
- **Hotmart**: Primary subscription management
- **Doppus**: Secondary payment processor
- Both use standardized webhook processing with `auto@123` default password

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Frontend build tooling
- **ESLint**: Code quality enforcement

## Deployment Strategy

### Environment Configuration
- **Development**: Local PostgreSQL with sandbox payment processing
- **Production**: Managed PostgreSQL with live payment webhooks
- **Environment Variables**: Secure configuration for API keys and database connections

### Build Process
1. TypeScript compilation for backend
2. Vite production build for frontend
3. Static asset optimization and caching
4. Database migration execution

### Hosting Architecture
- **Replit Deployment**: Autoscale deployment target
- **Port Configuration**: Multiple ports for different services
- **Process Management**: Parallel workflow execution

## Changelog

- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.