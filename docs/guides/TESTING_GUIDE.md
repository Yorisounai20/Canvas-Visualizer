# Database Persistence Testing Guide

This document outlines how to test the save/load functionality for Canvas Visualizer.

## Prerequisites

1. **Set up Neon Database:**
   - Create a Neon account at https://neon.tech
   - Create a new project and database
   - Copy the connection string

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Neon connection string
   ```

3. **Start the Application:**
   ```bash
   npm install
   npm run dev
   ```

## Test Cases

### Editor Mode Tests

#### Test 1: Save a New Project
1. Launch the app and select **Editor Mode**
2. Create a new project with test settings
3. Add some sections with different animations
4. Adjust colors (bass, mids, highs)
5. Add camera keyframes
6. Click **Save** button or press `Ctrl+S`
7. ✅ Verify: Success message appears
8. ✅ Verify: Project appears in database

#### Test 2: Load an Existing Project
1. Click **Open** button or press `Ctrl+O`
2. ✅ Verify: Projects modal appears with list of saved projects
3. Select a project and click **Load**
4. ✅ Verify: All sections are restored correctly
5. ✅ Verify: Colors match saved values
6. ✅ Verify: Camera settings are restored
7. ✅ Verify: Project name displays correctly

#### Test 3: Update an Existing Project
1. Load a saved project
2. Make some changes (add section, change colors, etc.)
3. Click **Save** or press `Ctrl+S`
4. ✅ Verify: Updated timestamp changes
5. Reload the project
6. ✅ Verify: Changes are persisted

#### Test 4: Delete a Project
1. Click **Open** button
2. Click the delete (trash) icon on a project
3. Confirm deletion
4. ✅ Verify: Project is removed from list
5. ✅ Verify: Project is deleted from database

### Software Mode Tests

#### Test 5: Save from Software Mode
1. Launch the app and select **Software Mode**
2. Adjust camera settings
3. Change colors (bass, mids, highs)
4. Configure effects (letterbox, border, etc.)
5. Click **Save** or press `Ctrl+S`
6. ✅ Verify: Success message appears
7. ✅ Verify: Project is saved

#### Test 6: Load in Software Mode
1. Click **Open** or press `Ctrl+O`
2. Select a previously saved Software mode project
3. Click **Load**
4. ✅ Verify: Camera settings are restored
5. ✅ Verify: Colors are correct
6. ✅ Verify: Effects settings are restored

### Error Handling Tests

#### Test 7: No Database Configuration
1. Remove or comment out `VITE_DATABASE_URL` from `.env`
2. Restart the app
3. Try to save a project
4. ✅ Verify: Appropriate error message appears
5. ✅ Verify: App continues to function normally

#### Test 8: Invalid Database Connection
1. Set `VITE_DATABASE_URL` to an invalid connection string
2. Restart the app
3. Try to save a project
4. ✅ Verify: Error is handled gracefully
5. ✅ Verify: User sees helpful error message

#### Test 9: Load Non-Existent Project
1. Manually delete a project from database
2. Try to load it from the UI
3. ✅ Verify: Error message appears
4. ✅ Verify: UI recovers gracefully

### Keyboard Shortcut Tests

#### Test 10: Keyboard Shortcuts
1. In either mode, press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
2. ✅ Verify: Save dialog/action triggers
3. Press `Ctrl+O` / `Cmd+O`
4. ✅ Verify: Open projects modal appears
5. With modal open, press `Esc`
6. ✅ Verify: Modal closes

### Data Integrity Tests

#### Test 11: Complex Project State
1. Create a complex project with:
   - 5+ sections
   - Multiple camera keyframes
   - Text keyframes
   - Custom colors
   - Various effects
2. Save the project
3. Reload the page
4. Load the project
5. ✅ Verify: All data matches exactly
6. ✅ Verify: No data loss or corruption

#### Test 12: Special Characters
1. Create a project with special characters in the name: `Test "Project" & <Special> 'Chars'`
2. Save the project
3. Load the project
4. ✅ Verify: Name is preserved correctly
5. ✅ Verify: No SQL injection or escaping issues

## Known Limitations

1. **Audio files are NOT saved** - Users must re-upload audio when loading a project
2. **Database must be configured** - Save/load features are disabled if no database is configured
3. **No user authentication** - All projects are accessible to anyone with database access
4. **No version control** - Saving over an existing project replaces it completely

## Success Criteria

- ✅ All test cases pass without errors
- ✅ Data persists correctly across save/load cycles
- ✅ UI provides clear feedback for all operations
- ✅ Error handling is graceful and informative
- ✅ Keyboard shortcuts work as expected
- ✅ Both Editor and Software modes work correctly
- ✅ App degrades gracefully without database configuration

## Troubleshooting

**Save fails with "Database not configured":**
- Check that `.env` file exists
- Verify `VITE_DATABASE_URL` is set correctly
- Restart dev server after changing `.env`

**Connection errors:**
- Verify Neon connection string is correct
- Check if Neon database is running
- Ensure connection string includes `?sslmode=require`

**Data not persisting:**
- Check browser console for errors
- Verify database table was created correctly
- Check Neon dashboard for database activity

**Projects not appearing in list:**
- Verify save was successful
- Check database directly in Neon dashboard
- Ensure no filters are applied
