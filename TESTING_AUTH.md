# Stack Auth Integration - Testing Guide

## Overview

This document provides step-by-step instructions for testing the newly implemented Stack Auth integration in Canvas Visualizer.

## Prerequisites

Before testing, you need to:

1. **Set up Stack Auth Project**
   - Go to [Stack Auth Dashboard](https://app.stack-auth.com/projects)
   - Create a new project
   - Note down the following credentials:
     - Project ID
     - Publishable Client Key
     - Secret Server Key (if needed)

2. **Set up Neon PostgreSQL Database**
   - Create a project at [Neon.tech](https://neon.tech)
   - Get your connection string
   - The database will be automatically initialized on first use

3. **Configure Environment Variables**
   - Create a `.env` file in the project root (copy from `.env.example`)
   - Add your credentials:
     ```env
     VITE_DATABASE_URL=your_neon_connection_string
     VITE_STACK_PROJECT_ID=your_stack_project_id
     VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
     VITE_STACK_SECRET_SERVER_KEY=your_secret_key
     ```

## Testing Checklist

### 1. Authentication Flow

#### Sign-Up Test
- [ ] Navigate to the application
- [ ] Should be redirected to `/auth` page
- [ ] Click "Sign up" toggle
- [ ] Enter a valid email and password
- [ ] Click sign up button
- [ ] Verify successful account creation
- [ ] Should be redirected to home dashboard (`/`)

#### Sign-In Test
- [ ] Sign out from the application
- [ ] Should be redirected to `/auth` page
- [ ] Enter your credentials
- [ ] Click sign in button
- [ ] Verify successful authentication
- [ ] Should be redirected to home dashboard (`/`)

#### Sign-Out Test
- [ ] From the home dashboard, click "Account Settings"
- [ ] Click "Sign Out" button
- [ ] Verify you're signed out
- [ ] Should be redirected to `/auth` page

### 2. Protected Routes

#### Unauthenticated Access Test
- [ ] Sign out from the application
- [ ] Try to navigate directly to `/` (home)
  - Should redirect to `/auth`
- [ ] Try to navigate to `/editor`
  - Should redirect to `/auth`
- [ ] Try to navigate to `/software`
  - Should redirect to `/auth`
- [ ] Try to navigate to `/account`
  - Should redirect to `/auth`

#### Authenticated Access Test
- [ ] Sign in to the application
- [ ] Navigate to `/` (home dashboard)
  - Should load successfully
- [ ] Navigate to `/account`
  - Should load successfully
- [ ] Navigate to `/editor`
  - Should load project modal, then editor
- [ ] Navigate to `/software`
  - Should load software mode

### 3. Project Storage with User Context

#### Save Project Test (Editor Mode)
- [ ] Sign in and navigate to Editor mode
- [ ] Create a project with some configuration
- [ ] Click "Save" button
- [ ] Verify project is saved successfully
- [ ] Note the project name

#### Save Project Test (Software Mode)
- [ ] Sign in and navigate to Software mode
- [ ] Configure some settings
- [ ] Click "Save" button
- [ ] Verify project is saved successfully
- [ ] Note the project name

#### Load Project Test
- [ ] Click "Load" button
- [ ] Should see only your own projects in the list
- [ ] Select one of your saved projects
- [ ] Verify project loads correctly with all settings

#### Multi-User Test (if possible)
- [ ] Create a second user account
- [ ] Sign in with the second account
- [ ] Click "Load" button
- [ ] Verify you DON'T see the first user's projects
- [ ] Create and save a project with the second user
- [ ] Sign in again with the first user
- [ ] Verify you DON'T see the second user's projects

#### Delete Project Test
- [ ] Sign in and click "Load" button
- [ ] Select a project and click delete
- [ ] Confirm deletion
- [ ] Verify project is removed from the list
- [ ] Verify other user's projects (if any) are not affected

### 4. Account Management

#### Profile Display Test
- [ ] Sign in and go to home dashboard
- [ ] Verify your profile information is displayed correctly:
  - Email address
  - Display name (if set)
  - User avatar/initials

#### Account Settings Test
- [ ] Navigate to `/account`
- [ ] Verify account information is displayed:
  - Profile section with email and name
  - Account settings component from Stack Auth
- [ ] Test any available account settings (password change, etc.)

#### Session Management Test
- [ ] Navigate to account settings
- [ ] Look for session management features
- [ ] Verify you can view active sessions
- [ ] Test session revocation if available

### 5. Error Handling

#### Database Connection Error Test
- [ ] Temporarily set an invalid `VITE_DATABASE_URL`
- [ ] Restart the dev server
- [ ] Try to save a project
- [ ] Verify appropriate error message is shown

#### Auth Error Test
- [ ] Try to sign in with invalid credentials
- [ ] Verify error message is displayed
- [ ] Try to sign up with an existing email
- [ ] Verify appropriate error handling

#### Unauthorized Access Test
- [ ] If you can get another user's project ID somehow
- [ ] Try to load it directly (might need browser console)
- [ ] Verify you get an error or null result

### 6. Navigation and User Experience

#### React Router Navigation Test
- [ ] Sign in and navigate between pages
- [ ] Use browser back/forward buttons
- [ ] Verify navigation works smoothly without full page reloads
- [ ] Verify URL updates correctly

#### Loading States Test
- [ ] Observe loading states when:
  - Initial page load (checking authentication)
  - Loading projects list
  - Saving a project
  - Loading a project

#### Responsive Design Test
- [ ] Test authentication pages on different screen sizes
- [ ] Verify UI remains usable on mobile devices

## Expected Results

### Successful Implementation Should:
✅ Require authentication to access Editor and Software modes
✅ Show user profile information on home dashboard
✅ Save projects with user ownership
✅ Only show user's own projects in the load list
✅ Prevent users from accessing other users' projects
✅ Provide smooth navigation without page reloads
✅ Show appropriate error messages for failures
✅ Allow account management through Settings page

### Common Issues and Solutions

**Issue: Redirected to auth page immediately after sign-in**
- Solution: Check that Stack Auth credentials are correctly configured
- Solution: Verify no browser console errors

**Issue: Projects not saving**
- Solution: Check Neon database connection string
- Solution: Verify database is accessible and not suspended
- Solution: Check browser console for database errors

**Issue: Can't see saved projects**
- Solution: Verify you're signed in with the same account that created them
- Solution: Check that user_id column exists in projects table

**Issue: Build errors with Stack Auth**
- Solution: Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Solution: Ensure using Node.js 18+

## Performance Testing

Optional performance checks:

- [ ] Measure initial page load time
- [ ] Check authentication verification speed
- [ ] Test with multiple saved projects (10+)
- [ ] Verify no memory leaks during navigation
- [ ] Test video export functionality still works with auth

## Security Verification

Additional security checks:

- [ ] Verify .env file is not in git
- [ ] Check that user IDs are passed to all database operations
- [ ] Verify error messages don't expose sensitive information
- [ ] Test that expired sessions redirect to login
- [ ] Confirm HTTPS is used in production

## Reporting Issues

If you encounter any issues during testing:

1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify environment variables are correctly set
4. Create an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS information
   - Console error messages (if any)

## Next Steps After Testing

Once testing is complete and successful:

1. Update any remaining documentation
2. Create production deployment plan
3. Set up monitoring for auth-related errors
4. Configure database backups
5. Plan user migration strategy (if applicable)
6. Consider adding more authentication features:
   - OAuth providers (Google, GitHub, etc.)
   - Two-factor authentication
   - Password reset functionality
   - Email verification
