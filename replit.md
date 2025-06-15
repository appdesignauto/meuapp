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

- June 15, 2025: Updated pricing structure to new values: R$47 monthly, R$97 semi-annual, R$147 annual
  - Mensal: R$47 (unchanged)
  - Semestral: R$16,17/mês (R$97,00 à vista) with R$185 discount
  - Anual: R$12,25/mês (R$147,00 à vista) with R$417 discount
  - Updated both PricingSection.tsx and PlanosPage.tsx with consistent pricing
  - Updated guarantee from 7 days to 30 days in trust section
  - Maintained free plan and R$997 lifetime plan in PlanosPage as requested
  - Maintained mobile-only layout optimizations with gap-10 spacing preventing badge overlap
  - Desktop layout preserved at original gap-6 spacing as requested by user
- June 15, 2025: Enhanced pricing section typography and visual hierarchy for improved readability
  - Increased main price size from text-4xl to text-5xl across all three pricing cards for better prominence
  - Upgraded description text from text-sm to text-base for enhanced legibility and professional appearance
  - Optimized spacing between benefit items from space-y-3 to space-y-4 for better visual breathing room
  - Adjusted icon+text block padding from px-4 to px-6 creating harmonious centered grouping while maintaining left text alignment
  - Applied consistent typography improvements across Monthly, Annual, and Semi-annual plans for unified user experience
- June 15, 2025: Optimized mobile pricing cards layout with professional height standardization
  - Implemented min-h-[520px] to prevent card overlap and ensure uniform height across all plans
  - Enhanced content distribution with flex layout: fixed header, flexible center section, fixed footer button
  - Improved description layout with px-4 spacing creating harmonious left-aligned but visually centered grouping
  - Added consistent vertical centering of benefits list using flex-1 flex flex-col justify-center
  - All three cards now maintain professional spacing and prevent content overlap on mobile devices
- June 15, 2025: Implemented authentication restriction for "Top 6 - Artes em Alta" section
  - Added useAuth verification in TrendingPopular component to match "Seus designs" behavior
  - Section now visible only for logged-in users, encouraging visitor registration
  - Enhanced user experience differentiation between authenticated and guest users
- June 15, 2025: Enhanced pricing section with professional branding and optimized mobile responsiveness
  - Added "PLANOS" green label above main title for clear section identification  
  - Included decorative green line below title for visual appeal and brand consistency
  - Maintained "Seu crescimento começa aqui" messaging with harmonized typography
  - Created sophisticated visual hierarchy: label → title → decorative line → description
  - Applied green color scheme (green-600) that reinforces growth messaging and creates strong visual identity
  - Optimized mobile layout: increased card spacing (gap-8), responsive padding (p-4 md:p-6), single-column grid
  - Enhanced trust section with mobile-first spacing and improved visual flow
- June 15, 2025: Added trust guarantees section below pricing with 30-day guarantee, premium support, and weekly updates
  - Implemented harmonious design with colored icons and clean layout matching provided reference
  - Enhanced pricing section credibility with professional trust indicators
- June 15, 2025: Enhanced user experience by connecting "Ver Demonstração" button to arts showcase section
  - Modified Hero component button to scroll smoothly to arts gallery instead of separate demo page
  - Added arts-showcase ID to ArtGallery component for proper scroll targeting
  - Improved homepage flow by keeping users engaged with immediate content preview
- June 14, 2025: Finalized pricing section design with optimized color hierarchy and badge sizing
  - Applied unified blue color scheme: blue-600 for prices/buttons, blue-500 for "Mais Popular" badge
  - Implemented green-500 for "Melhor Valor" badge and discount badges creating clear value messaging
  - Reduced discount badge sizes (text-xs, px-2 py-0.5) for cleaner proportions while maintaining original text
  - Achieved complete visual harmony connecting pricing section to main title branding
- June 14, 2025: Applied unified blue-600 color scheme across entire pricing section connecting to title branding
  - Updated all pricing amounts (R$47, R$36,70, R$29,70) to use blue-600 matching "ARTES AUTOMOTIVAS" title
  - Applied blue-600 to all button text and borders across all three plans for complete visual consistency
  - Annual plan uses blue-600 background with blue-800 badge for proper contrast
  - Monthly and semi-annual plans use blue-600 for prices and button styling
  - Added green outlined borders to discount values with rounded pill styling
  - Maintained orange accents only for "Mais Popular" badges while discount highlights use green borders
  - Created cohesive visual identity connecting pricing section directly with main title gradient color
- June 14, 2025: Updated pricing section with specific feature list and layout reorganization
  - Applied user's exact feature specifications: "Acesso a todas as artes", "Edições ilimitadas", "Atualizações semanais", "Aplicativo exclusivo", "Suporte prioritário", "Sem compromisso"
  - Reorganized plan layout: Mensal → Anual (highlighted center) → Semestral
  - Enhanced visual hierarchy with Anual plan prominently displayed in center with green highlight and "Melhor Valor" badge
- June 14, 2025: Implemented clean pricing section following user's exact design specifications
  - Created simplified layout with "Escolha seu plano" title and clear value proposition
  - Implemented orange-highlighted pricing: Mensal (R$47), Semestral (R$36,70/mês), Anual (R$29,70/mês)
  - Added distinctive badges: "Mais Popular" (orange) for semestral, "Melhor Valor" (green) for annual
  - Built fully responsive 3-column grid with mobile-first approach and proper spacing
  - Standardized feature lists across all plans with consistent "Começar Agora" CTAs
  - Applied clean gray-50 background with white cards and orange accent highlights
- June 14, 2025: Updated marketing copy across entire platform from "+300 Artes Exclusivas" to "Milhares de Artes Exclusivas"
  - Modified Hero component badge display
  - Updated FeatureStats component text
  - Enhanced PremiumFeatures component description  
  - Revised PainelInicio premium benefits section
  - Updated auth-page-backup promotional content
  - Ensured consistent messaging throughout all user-facing components
- June 14, 2025: Completed phone number capture implementation for both payment platform webhooks
  - Enhanced Hotmart webhook processor to extract phone from buyer.phone, buyer.address.phone, or customer.phone fields
  - Verified Doppus webhook processor already captures customer.phone correctly
  - Implemented comprehensive testing for all phone capture scenarios
  - Both systems now update existing users' phone numbers when available in webhook payloads
  - Phone data capture resolves WhatsApp validation errors in user management interface
  - Final WhatsApp message template: "Olá, [nome], sou do suporte do App Design Auto, esta ai?"
- June 14, 2025: Implemented WhatsApp communication integration in user management interface
  - Added WhatsApp icon column in user management table for direct communication
  - Integrated React Icons FaWhatsapp component for better compatibility and visibility
  - Positioned WhatsApp button before actions column for easy access
  - Implemented automatic message generation with user name personalization
  - Enhanced user management workflow with instant communication capabilities
- June 14, 2025: Performance de Conteúdo dashboard completely reset for fresh authentic tracking
  - Fixed SQL column reference errors in content performance endpoint by replacing raw SQL with Drizzle ORM
  - Resolved downloads table structure issues: added auto-increment ID and default timestamp for createdAt
  - Eliminated all Math.random() calls causing metric oscillations in conversion rates and view counts
  - Implemented database transactions and deterministic ordering to ensure consistent results
  - Complete reset: all viewcount fields = 0 and downloads table cleared for fresh monitoring
  - System ready for 100% authentic user engagement tracking from zero baseline
  - Content performance analytics configured to track genuine user interactions from current date
  - All metrics (views, downloads, conversion rates) now start from clean slate
- June 14, 2025: Completed Microsoft Clarity configuration and optimized dashboard interface
  - Implemented Microsoft Clarity with Project ID "rz84poylxv" using official integration patterns
  - Added advanced user segmentation: device type, screen resolution, traffic source categorization, time segments
  - Created automatic element masking for sensitive data (passwords, emails, personal fields) for LGPD compliance
  - Implemented scroll depth tracking (25%, 50%, 75%, 100% milestones) and time-on-page analytics
  - Built comprehensive event tracking API for art views, downloads, searches, subscriptions, and errors
  - Added A/B testing support and conversion tracking capabilities for marketing optimization
  - Integrated LGPD consent management with automatic initialization in development environment
  - Cleaned up dashboard interface: removed duplicate "Dashboard" title and redundant period filter
- June 14, 2025: Optimized Google Analytics 4 configuration following official best practices
  - Implemented GA4 script loading with proper timing and error handling
  - Added SPA navigation tracking for single-page application routing
  - Enhanced LGPD compliance with anonymize_ip and ad personalization controls
  - Created comprehensive event tracking API following GA4 documentation standards
  - All analytics platforms (GA4, Meta Pixel, Microsoft Clarity) now working seamlessly together
- June 14, 2025: Completely resolved analytics configuration persistence with timestamp validation fix
  - Fixed critical timestamp error preventing analytics settings saves by removing manual updatedAt handling
  - Corrected API route conflicts between main analytics router and settings endpoint
  - Successfully verified all analytics configurations now persist correctly: GA4, Meta Pixel, and GTM values
  - Analytics settings interface fully functional with individual save functionality for each platform
  - Modern 4-tab structure (Meta & Facebook, Google, Analytics, Advanced) working seamlessly
- June 14, 2025: Modernized analytics configuration interface with clean, organized layout
  - Completely redesigned analytics settings page with modern card-based layout
  - Implemented clean 4-tab structure: Meta & Facebook, Google, Analytics, Advanced
  - Replaced checkboxes with modern toggle switches for better UX
  - Added visual status badges and improved spacing for better readability
  - Streamlined interface focuses only on essential configuration fields
  - Enhanced Google Ads integration with conversion tracking fields
  - Improved overall user experience with cleaner, more professional design
- June 14, 2025: Completed comprehensive popup analytics system with session-based deduplication
  - Implemented authentic database tracking with real-time view and click metrics
  - Added 5-minute session deduplication to prevent spam while maintaining accuracy
  - System provides genuine conversion rates and marketing campaign performance data
  - Automated cache management with 30-minute cleanup cycles for optimal performance
  - Reset counters for fresh analytics monitoring - system ready for production use
- June 14, 2025: Completed popup analytics system with authentic database tracking
  - Implemented real-time popup view and click tracking using dedicated database columns
  - Removed session-based deduplication to ensure all popup impressions are counted accurately
  - Connected frontend popup component to proper tracking endpoints for automatic metrics collection
  - System now displays genuine analytics: individual popup statistics, conversion rates, and user interaction data
  - All popup metrics (views, clicks, conversion rates) now reflect authentic user interactions from PostgreSQL database
  - Every popup display generates a view count, providing true impression metrics for marketing campaigns
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
WhatsApp message template: Uses informal, direct format - "Olá, [nome], sou do suporte do App Design Auto, esta ai?"