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

- June 14, 2025: Fixed deployment errors by completely removing orphaned analytics references
  - Removed all references to AnalyticsSettings component that was causing build failures
  - Deleted orphaned analytics directory and cleaned up App.tsx routing conflicts
  - Eliminated duplicate `/admin/webhooks` routes that were causing navigation issues
  - System now deploys successfully without analytics UI conflicts
- June 14, 2025: Integrated logo management directly into admin dashboard
  - Removed separate logo page and integrated SimpleLogo component into admin panel
  - Added "Gerenciar Logo" section with proper header title and subtitle
  - Centralized logo upload interface with usage instructions
  - Fixed authorization check from user.role to user.nivelacesso for proper access control
- June 14, 2025: Removed Analytics configuration panel from admin dashboard due to persistent navigation conflicts
  - Completely removed Analytics section from dashboard UI to eliminate tab switching bugs
  - Deleted AnalyticsSettings component that was causing state management issues
  - GTM integration system remains functional in background with database configuration
  - Meta Pixel and tracking systems continue operating through existing infrastructure
  - Focus maintained on dashboard core functionality without UI conflicts
- June 14, 2025: Implemented complete Google Tag Manager integration with database configuration
  - Created comprehensive GTM configuration system in `/public/js/gtm/gtm-config.js`
  - Integrated GTM with existing analytics settings database for dynamic configuration
  - Updated React hook `useGoogleTagManager` with enhanced tracking capabilities
  - Added comprehensive test suite with browser console integration (`window.testGTMIntegration()`)
  - Created dedicated test page `/gtm-test.html` for debugging and validation
  - Implemented advanced event tracking: form submissions, art downloads, conversions, page views
  - GTM now loads dynamically based on database settings with fallback mechanisms
  - Full integration with existing Meta Pixel and GA4 systems for unified analytics
- June 13, 2025: Fixed Analytics dashboard UI redundancy and improved user experience
  - Resolved duplicate title issue in Analytics settings panel by restructuring component hierarchy
  - Moved title and description to parent container for clean single-header layout
  - Added React key forcing for cache invalidation to ensure UI updates are reflected immediately
  - Maintained functional tracking systems (Meta Pixel, GTM, GA4) while improving interface clarity
- June 13, 2025: Implemented comprehensive tracking system with Meta Pixel and Google Tag Manager
  - Created functional Meta Pixel integration with automatic configuration from database
  - Built Google Tag Manager system with DataLayer implementation and GA4 support
  - Developed React hooks for both tracking systems (useMetaPixel, useGoogleTagManager)
  - Configured automatic event tracking for page views, art downloads, form submissions
  - Set Meta Pixel and Conversions API to be activated by default in new installations
  - Integrated GA4 through GTM for centralized analytics management
  - Created comprehensive test suite for verifying tracking functionality
- June 13, 2025: Fixed critical SQL errors in financial API with authentic revenue calculations
  - Resolved GROUP BY SQL syntax errors preventing financial data retrieval
  - Corrected revenue calculations to show authentic values: R$ 14,00 total (2 Hotmart subscribers × R$ 7,00 each)
  - Eliminated duplicate subscriber counting across different payment sources
  - Financial dashboard now displays accurate metrics based on real webhook payment data
- June 13, 2025: Simplified financial dashboard layout based on user feedback
  - Removed unnecessary internal tabs from financial dashboard section
  - Reorganized "Assinantes Recentes" section to appear below "Receita por Origem de Pagamento"
  - Enhanced badge styling with improved color coding (Hotmart in orange, annual plans in purple)
  - Streamlined interface maintains authentic database integration while improving usability
- June 13, 2025: Completed dashboard monetization metrics with authentic database integration
  - Fixed revenue calculations to use real database data instead of artificial values
  - Implemented period-based revenue tracking based on actual user subscription dates
  - Corrected ticket médio calculation using real subscription revenue and user counts
  - Enhanced tax conversion calculation with genuine user data ratios
  - All financial metrics now reflect authentic transaction data from subscription system
- June 13, 2025: Implemented comprehensive dashboard monetization metrics with smart date filtering
  - Added dynamic date filter (7d, 30d, 90d, 1y) for all dashboard statistics
  - Enhanced backend with period-based database queries and real-time growth calculations
  - Integrated authentic revenue tracking based on user subscription plans
  - Created business intelligence metrics including conversion rates and user distribution
- June 13, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.