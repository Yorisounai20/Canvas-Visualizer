# Quick Start Guide - Authentication Setup

## What You Need to Do (Simple Steps)

### Step 1: Create Your Environment File

Copy the example file to create your own `.env` file:

```bash
cp .env.example .env
```

**That's it!** The `.env.example` file already has your Stack Auth credentials in it.

### Step 2: Add Your Database Connection (Optional for now)

If you want to save projects, you'll need to add your Neon database URL to the `.env` file. 

You can skip this for now and just test the authentication first.

### Step 3: Start the App

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`

## What Will Happen

1. **First Visit**: You'll see a sign-up/sign-in page
2. **Sign Up**: Create an account with any email and password
3. **After Sign In**: You'll see the home dashboard with two modes:
   - **Editor Mode** - Advanced music video editor
   - **Software Mode** - Simple visualizer

## Authentication is Working When...

✅ You can create an account  
✅ You can sign in with your credentials  
✅ You see your email in the top-right corner  
✅ You can access Editor and Software modes  
✅ You can click "Account Settings" to manage your account  

## If Something's Not Working

### "Authentication will not work properly" error in console
- Make sure you copied `.env.example` to `.env`
- Check that the `.env` file has your Stack Auth credentials

### Can't sign up or sign in
- Check your internet connection (Stack Auth needs to connect to their servers)
- Open browser console (F12) and check for error messages

### "Database is not configured" when saving projects
- You need to add your Neon database URL to `.env`
- For now, you can still test the authentication without saving projects

## Your Stack Auth Credentials

These are already in `.env.example`:

```
Project ID: f3429b2a-50d0-4ea5-9f1b-9bd97ced0fd0
Publishable Key: pck_3a2zb1p8y6x8rs0741nsf4a3pgysw3m7yjn897yfpgyng
```

**Note**: The Secret Server Key is not used in this client-side application.

## Need Help?

1. Make sure Node.js is installed (version 18 or higher)
2. Run `npm install` to install dependencies
3. Check that `.env` file exists in the project root
4. Look at browser console (F12) for error messages

## What I Did (Technical Summary)

For your reference, here's what the authentication system does:

- Uses Stack Auth for user management
- Stores auth tokens in secure cookies
- Protects Editor and Software modes (requires login)
- Saves projects with user ownership (when database is configured)
- All auth setup is in `src/lib/auth.ts`
- Protected routes are in `src/App.tsx`

You don't need to understand all of this to use it - just follow Steps 1-3 above!
