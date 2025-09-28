# Overview

This is an Emergency Response AI system designed for Pakistan's emergency services. The application provides intelligent triage, service guidance, appointment booking, and follow-up capabilities for emergency cases. It operates as a full-stack TypeScript application with a React frontend and Express backend, featuring multi-agent AI processing, multilingual support (English and Urdu), degraded mode functionality for poor connectivity, and real-time case management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Geolocation**: Custom hook for browser geolocation API integration

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **AI Processing**: Multi-agent system with four specialized agents:
  - Triage Agent: Emergency assessment and priority classification
  - Guidance Agent: Hospital matching and service recommendations
  - Booking Agent: Appointment scheduling and confirmation
  - Follow-up Agent: Status updates and communication
- **Session Management**: In-memory storage with planned PostgreSQL persistence
- **API Design**: RESTful endpoints with comprehensive error handling

## Database Schema
- **Users**: Role-based access (citizen, frontline_worker, admin)
- **Emergency Cases**: Complete case lifecycle tracking with multilingual support
- **Case Updates**: Audit trail for all agent actions and status changes
- **Hospitals**: Comprehensive hospital database with specialties and resources

## Multi-Agent Processing Pipeline
The system processes emergency cases through a sequential pipeline:
1. **Triage**: AI-powered priority assessment using Gemini API
2. **Guidance**: Intelligent hospital matching based on location and specialty
3. **Booking**: Automated appointment scheduling with confirmation
4. **Follow-up**: Status updates and degraded mode fallbacks

## Internationalization
- Dual language support (English/Urdu) at the application level
- Database-level multilingual content storage
- Language-aware AI responses and SMS communications

## Degraded Mode Operations
- Offline-capable SMS fallback system
- Essential emergency contact distribution
- Simplified interface for low-bandwidth scenarios
- Graceful degradation of AI services

# External Dependencies

## AI Services
- **Google Gemini API**: Powers intelligent triage assessment, service recommendations, and natural language processing for emergency case analysis

## Database
- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect

## Communication Services
- **SMS Gateway**: Planned integration with Twilio or local SMS providers for degraded mode operations and emergency notifications
- **SendGrid**: Email service integration for notifications and case updates

## External APIs
- **Geolocation Services**: Browser-based geolocation with fallback support
- **Hospital Data**: CSV-based hospital database with plans for real-time API integration

## Development Tools
- **Replit Integration**: Runtime error modal, cartographer, and dev banner plugins
- **Build Tools**: Vite for frontend, esbuild for backend bundling
- **Type Safety**: TypeScript across the entire stack with strict mode enabled