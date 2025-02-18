
# StackTracker Admin Dashboard Development Guidelines

## Overview
This document outlines the development guidelines for the StackTracker Admin Dashboard, which serves as a separate administrative interface for the main StackTracker application.

## Architecture

### Applications
1. Main Application (StackTracker)
2. Admin Dashboard (This application)

### Database
- Shared NeonDB instance
- Admin has elevated database privileges
- Common schema for both applications

## Implementation Phases

### Phase 1: Core Setup
1. Environment Configuration
2. CORS Setup
3. Authentication Implementation
4. Database Connection

### Phase 2: Feature Implementation
1. Blog Management
   - CRUD Operations
   - Rich Text Editor
   - Media Management
   - SEO Tools

2. Supplement Reference Management
   - CRUD Operations
   - Batch Operations
   - Version Control
   - Scientific References

3. User Management
   - Role Management
   - Access Control
   - Activity Monitoring

4. Analytics Dashboard
   - Performance Metrics
   - Health Monitoring
   - Export Features

## Security Requirements

### Authentication
- JWT-based authentication
- HTTP-only cookies
- CSRF protection
- Rate limiting

### Access Control
- IP whitelisting
- Audit logging
- Regular security scans
- Automated backups

## Environment Variables

### Required Variables
```env
MAIN_APP_URL=https://your-main-repl.repl.co
DATABASE_URL=postgresql://admin:pass@neon.db/database
ADMIN_SESSION_SECRET=your-admin-session-secret
JWT_SECRET=your-jwt-secret
```

## Performance Considerations
- Implement data caching
- Database connection pooling
- Request queue management
- Regular performance monitoring

## Implementation Steps
1. Configure environment and CORS
2. Implement authentication system
3. Set up database connections
4. Implement core CRUD operations
5. Add advanced features incrementally
6. Implement monitoring and analytics
7. Deploy and test cross-communication

This document serves as a living guide and should be updated as the implementation progresses.
