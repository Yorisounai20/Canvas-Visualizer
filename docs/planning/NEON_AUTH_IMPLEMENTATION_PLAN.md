# Neon Auth Integration Implementation Plan

## Overview
This document outlines the implementation plan for integrating Neon Auth API into the Canvas Visualizer application for user authentication and management.

## Issue Title
**Add Neon Auth Integration for User Authentication**

## Description
Implement Neon Auth API to provide user authentication, authorization, and account management features for the Canvas Visualizer application. This will enable users to:
- Sign up and sign in securely
- Manage their accounts and sessions
- Save and load projects associated with their user accounts
- Reset passwords and manage profile settings

## Prerequisites
- Neon project created at https://neon.tech
- Stack Auth project configured (Project ID: `32b73443-df4e-48ab-8a92-2b75e806d0b9`)
- JWKS endpoint: `https://api.stack-auth.com/api/v1/projects/32b73443-df4e-48ab-8a92-2b75e806d0b9/.well-known/jwks.json`
- Neon REST API endpoint: `https://ep-spring-mode-a4c0oovk.apirest.us-east-1.aws.neon.tech/neondb/rest/v1`

## Implementation Steps

### 1. Install Dependencies
```bash
npm install @neondatabase/neon-js react-router-dom
```

**Required packages:**
- `@neondatabase/neon-js` - Unified client for Neon authentication
- `react-router-dom` - React routing library for navigation

### 2. Environment Configuration

**Update `.env` file:**
```env
# Existing database configuration
VITE_DATABASE_URL=postgresql://neondb_owner:npg_yLcHTP5q1whp@ep-spring-mode-a4c0oovk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# New auth configuration
VITE_NEON_AUTH_URL=https://api.stack-auth.com/api/v1/projects/32b73443-df4e-48ab-8a92-2b75e806d0b9
VITE_NEON_REST_API=https://ep-spring-mode-a4c0oovk.apirest.us-east-1.aws.neon.tech/neondb/rest/v1
```

### 3. Create Authentication Client

**Create file: `src/lib/auth.ts`**
```typescript
import { createNeonAuthClient } from '@neondatabase/neon-js';

export const authClient = createNeonAuthClient({
  authUrl: import.meta.env.VITE_NEON_AUTH_URL,
  apiUrl: import.meta.env.VITE_NEON_REST_API,
});

export default authClient;
```

### 4. Update Application Layout

**Modify `src/main.tsx`:**
- Wrap the app with `NeonAuthUIProvider`
- Configure the auth context for all components
- Import and configure React Router

**Key changes:**
```typescript
import { NeonAuthUIProvider } from '@neondatabase/neon-js/react';
import { BrowserRouter } from 'react-router-dom';
import authClient from './lib/auth';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NeonAuthUIProvider client={authClient}>
        <App />
      </NeonAuthUIProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 5. Create Authentication Pages

**Create directory structure:**
```
src/pages/
├── Home.tsx          - Main landing page for authenticated users
├── Auth.tsx          - Authentication page (sign-in/sign-up)
└── Account.tsx       - Account management page
```

**Pages to implement:**

#### `src/pages/Auth.tsx`
- Sign-in form with email/password
- Sign-up form with validation
- Toggle between sign-in and sign-up views
- Password reset functionality
- OAuth provider buttons (if needed)
- Error handling and validation messages

#### `src/pages/Home.tsx`
- Protected route (requires authentication)
- User dashboard
- Access to Canvas Visualizer modes (Editor/Software)
- Quick access to saved projects
- User profile summary

#### `src/pages/Account.tsx`
- User profile management
- Password change functionality
- Session management (view/revoke active sessions)
- Account deletion option
- Display user metadata

### 6. Update App Routing

**Modify `src/App.tsx`:**
- Implement protected routes
- Add routing for auth pages
- Handle authentication state
- Redirect logic for authenticated/unauthenticated users

**Route structure:**
```
/ → Home (protected)
/auth → Auth page (public)
/account → Account management (protected)
/editor → Visualizer Editor (protected)
/software → Visualizer Software (protected)
```

### 7. Integration with Existing Features

**Update database operations in `src/lib/database.ts`:**
- Associate saved projects with user IDs
- Filter projects by authenticated user
- Add user context to database queries
- Update `saveProject()` to include user ID from auth session
- Update `listProjects()` to filter by current user

**Modify existing components:**
- `src/components/Modals/ProjectsModal.tsx` - Show user-specific projects
- `src/VisualizerEditor.tsx` - Check auth state before save/load
- `src/visualizer-software.tsx` - Check auth state before save/load
- `src/components/Dashboard/MainDashboard.tsx` - Add user profile section

### 8. Protected Route Component

**Create `src/components/Auth/ProtectedRoute.tsx`:**
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@neondatabase/neon-js/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
```

## File Changes Summary

### New Files
- [ ] `src/lib/auth.ts` - Auth client configuration
- [ ] `src/pages/Home.tsx` - Home page
- [ ] `src/pages/Auth.tsx` - Authentication page
- [ ] `src/pages/Account.tsx` - Account management
- [ ] `src/components/Auth/ProtectedRoute.tsx` - Route protection HOC

### Modified Files
- [ ] `src/main.tsx` - Add auth provider and router
- [ ] `src/App.tsx` - Implement routing
- [ ] `src/lib/database.ts` - Add user context to operations
- [ ] `src/components/Modals/ProjectsModal.tsx` - Filter by user
- [ ] `src/VisualizerEditor.tsx` - Add auth checks
- [ ] `src/visualizer-software.tsx` - Add auth checks
- [ ] `package.json` - Add new dependencies
- [ ] `.env` - Add auth environment variables

### Configuration Files
- [ ] `.env.example` - Document new env variables

## Testing Checklist

### Authentication Flow
- [ ] User can sign up with email/password
- [ ] User can sign in with credentials
- [ ] User can sign out
- [ ] Unauthenticated users redirected to `/auth`
- [ ] Authentication state persists across page refreshes
- [ ] Invalid credentials show appropriate error messages

### Account Management
- [ ] User can view their profile
- [ ] User can change password
- [ ] User can view active sessions
- [ ] User can revoke sessions
- [ ] Account deletion works correctly

### Protected Routes
- [ ] Unauthenticated users cannot access protected routes
- [ ] Authenticated users can access all features
- [ ] Proper redirects after login/logout

### Database Integration
- [ ] Projects are saved with user ID
- [ ] Users only see their own projects
- [ ] Project loading filters by authenticated user
- [ ] Database operations handle auth errors gracefully

### UI/UX
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Forms have proper validation
- [ ] Responsive design on all pages
- [ ] Navigation is intuitive

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` file with actual credentials
   - Keep `.env.example` updated with variable names only
   - Validate all environment variables on startup

2. **Client-Side Security**
   - Implement CSRF protection
   - Sanitize user inputs
   - Use HTTPS in production
   - Implement rate limiting for auth endpoints

3. **Session Management**
   - Implement secure session storage
   - Auto-logout on token expiration
   - Refresh tokens appropriately

4. **Data Privacy**
   - Users can only access their own data
   - Implement proper authorization checks
   - Log security-related events

## Migration Strategy

### Phase 1: Setup (Week 1)
- Install dependencies
- Configure environment variables
- Create auth client
- Update app layout with providers

### Phase 2: Authentication Pages (Week 1-2)
- Build auth page (sign-in/sign-up)
- Implement account management page
- Create protected route component
- Test authentication flows

### Phase 3: Integration (Week 2-3)
- Update existing components with auth
- Modify database operations for user context
- Test save/load functionality with users
- Update navigation and routing

### Phase 4: Testing & Polish (Week 3-4)
- Comprehensive testing of all features
- Fix bugs and edge cases
- Improve error handling
- UI/UX polish
- Documentation updates

## Dependencies

```json
{
  "dependencies": {
    "@neondatabase/neon-js": "^1.0.0",
    "react-router-dom": "^6.0.0"
  }
}
```

## Environment Variables Reference

```env
# Database Connection (existing)
VITE_DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require

# Neon Auth Configuration (new)
VITE_NEON_AUTH_URL=https://api.stack-auth.com/api/v1/projects/[PROJECT_ID]
VITE_NEON_REST_API=https://[endpoint].apirest.[region].aws.neon.tech/[database]/rest/v1
```

## API Endpoints

### Stack Auth API
- **JWKS**: `https://api.stack-auth.com/api/v1/projects/32b73443-df4e-48ab-8a92-2b75e806d0b9/.well-known/jwks.json`
- **Auth Base**: `https://api.stack-auth.com/api/v1/projects/32b73443-df4e-48ab-8a92-2b75e806d0b9`

### Neon REST API
- **Base URL**: `https://ep-spring-mode-a4c0oovk.apirest.us-east-1.aws.neon.tech/neondb/rest/v1`

## Documentation Updates Needed

- [ ] Update README.md with authentication setup instructions
- [ ] Create user guide for authentication features
- [ ] Document environment variable configuration
- [ ] Add troubleshooting section for auth issues
- [ ] Update architecture diagrams

## Success Criteria

✅ Users can sign up and sign in securely
✅ Protected routes work correctly
✅ Projects are saved per-user
✅ Account management features functional
✅ No breaking changes to existing features
✅ All tests passing
✅ Documentation complete

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon.js SDK Documentation](https://github.com/neondatabase/neon-js)
- [React Router Documentation](https://reactrouter.com/)
- [Stack Auth Documentation](https://docs.stack-auth.com/)

## Issue Labels

- `feature` - New feature implementation
- `authentication` - Related to auth/security
- `database` - Database integration changes
- `breaking-change` - May affect existing functionality
- `enhancement` - Improves existing features

## Estimated Effort

- **Development Time**: 3-4 weeks
- **Testing Time**: 1 week
- **Documentation**: 3-5 days
- **Total**: 4-6 weeks

## Notes

- This is a major feature addition that will change the app architecture
- Requires careful testing to ensure no data loss
- Consider implementing feature flags for gradual rollout
- May need database migration for user_id column in projects table
- Should be backward compatible during transition period
