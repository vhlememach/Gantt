# Overview

Palmyra Project Gantt Chart is a modern web application for managing internal projects with visual timeline representation. The application provides a comprehensive Gantt chart interface with group organization, customizable styling, and minimal design. Built as a full-stack solution with a React frontend and Express backend, it enables teams to track projects across different groups with drag-and-drop functionality, visual customization options, real-time updates, and high-quality export capabilities. The application supports extended timelines up to 2026+ with proper quarter calculations, accurate week counting up to 24 weeks, improved text rendering in exports with higher resolution scaling, and a reorganized Team Checklist with 2-column layout separating project tasks from evergreen content.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development tooling
- **UI Library**: Shadcn/UI components built on Radix UI primitives for consistent design system
- **Styling**: Tailwind CSS with CSS custom properties for dynamic theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation schemas
- **Component Structure**: Modular component architecture with shared UI components and feature-specific components

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Data Storage**: In-memory storage with interface abstraction for future database integration
- **Validation**: Shared Zod schemas between frontend and backend for type safety
- **Build System**: ESBuild for production bundling with platform-specific optimizations

## Data Management
- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations (MIGRATED FROM IN-MEMORY)
- **Schema**: Complete entities - Release Groups, Releases, App Settings, Checklist Tasks, Evergreen Boxes, Waterfall Cycles, Content Format Assignments, and Task Social Media
- **Storage Interface**: DatabaseStorage implementation with full PostgreSQL persistence
- **Type Safety**: Full TypeScript integration with generated types from database schema
- **Data Persistence**: All user data now permanently stored in PostgreSQL database

## Development Environment
- **Monorepo Structure**: Client, server, and shared code in organized directories
- **Hot Reload**: Vite HMR for frontend development with Express middleware integration
- **Path Aliases**: Configured import aliases for clean module resolution
- **Error Handling**: Runtime error overlay for development debugging

## UI/UX Design System
- **Design Tokens**: CSS custom properties for consistent theming and customization
- **Component Library**: Comprehensive set of accessible UI components
- **Responsive Design**: Mobile-first approach with breakpoint-based responsive behavior
- **Visual Hierarchy**: Clear information architecture with grouped content and visual separators

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18 with TypeScript, React DOM, and development tools
- **Build Tools**: Vite for development server and build process, ESBuild for production bundling
- **Backend Framework**: Express.js for REST API server with middleware support

## UI and Styling
- **Component System**: Radix UI primitives for accessible component foundation
- **Styling Framework**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography, Font Awesome for additional icons
- **Fonts**: Google Fonts integration (Inter, Roboto, Open Sans, Poppins)

## Database and ORM
- **Database**: PostgreSQL as primary data store
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Session Storage**: PostgreSQL session store for Express sessions

## State Management and Data Fetching
- **Server State**: TanStack Query for caching, synchronization, and server state management
- **Form Management**: React Hook Form with Hookform resolvers for validation integration
- **Validation**: Zod for runtime type checking and schema validation

## Development and Deployment
- **Development Environment**: Replit-specific plugins for cartographer and runtime error handling
- **Type Checking**: TypeScript with strict configuration for type safety
- **Code Quality**: Tailwind CSS with PostCSS for CSS processing
- **Build Output**: Optimized production builds with code splitting and asset optimization