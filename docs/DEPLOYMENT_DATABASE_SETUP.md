# Database Setup Instructions

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your Neon Database:**
   - Go to [https://neon.tech](https://neon.tech) and create a free account
   - Create a new project
   - Copy your connection string (it looks like: `postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require`)
   - Update the `VITE_DATABASE_URL` in your `.env` file

3. **Start the application:**
   ```bash
   npm run dev
   ```

The database schema will be automatically created when you first start the application.

## Database Schema

The application will automatically create two tables:

### `projects` table
- Stores all your music visualization projects
- Includes metadata like name, creation date, last opened date
- Stores thumbnail URLs for project previews
- Tracks autosave status

### `project_versions` table
- Stores version history for each project
- Supports both manual saves and autosaves
- Enables version restore functionality
- Automatically cleans up old autosaves (keeps last 20)

## Features Enabled by Database

✅ **Project Management**
- Save and load projects
- Search, sort, and filter projects
- Rename and duplicate projects
- Delete projects

✅ **Version History**
- View all versions of a project
- Restore any previous version
- Automatic backup before restore
- Visual distinction between manual saves and autosaves

✅ **Autosave**
- Automatic saving every 3 minutes
- Activity tracking (pauses when idle)
- Change detection (only saves when modified)
- Automatic cleanup of old versions

## Troubleshooting

**"Database is not configured" error:**
- Make sure you've created a `.env` file in the project root
- Verify your `VITE_DATABASE_URL` is set correctly
- Restart the dev server after updating `.env`

**Connection errors:**
- Check that your Neon database is running
- Verify your connection string is correct
- Ensure `?sslmode=require` is at the end of the connection string

**Schema errors:**
- The app will automatically create tables on first run
- If you need to reset: drop the tables in Neon console and restart the app
- Tables: `projects`, `project_versions`

## Without Database

The application works without a database, but you'll lose:
- Project persistence (projects are lost on page refresh)
- Version history
- Autosave functionality
- Projects gallery page

You can still:
- Create visualizations
- Export videos
- Use all editing features
- Work with audio files
