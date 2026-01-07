# Vercel NOT_FOUND Error - Fix Documentation

## 🎯 The Issue

When deploying this React Single Page Application (SPA) to Vercel, users encountered **404 NOT_FOUND errors** when:
- Directly accessing routes like `/editor` or `/software`
- Refreshing the page on any route other than the root `/`
- Sharing links to specific routes

## ✅ The Solution

**Created `vercel.json` with SPA rewrite configuration:**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel to serve `index.html` for **all routes**, allowing React Router to handle navigation on the client side.

---

## 📚 Detailed Explanation

### 1. **Root Cause - What Was Actually Happening?**

**The Code's Behavior:**
- This app uses **React Router** for client-side routing with routes defined in `src/App.tsx`:
  ```tsx
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/editor" element={<EditorMode />} />
    <Route path="/software" element={<SoftwareMode />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  ```

- React Router operates **entirely in the browser**—it intercepts link clicks and updates the URL without making server requests

**The Problem:**
- When Vite builds the app (`npm run build`), it creates a `dist/` folder with:
  - `dist/index.html` - The single HTML file
  - `dist/assets/*` - JavaScript bundles, CSS, images, etc.
  - **NO** `dist/editor.html` or `dist/software.html`

- When users visit `https://your-app.vercel.app/editor`:
  1. Vercel receives the request for `/editor`
  2. Vercel looks for `dist/editor.html` or `dist/editor/index.html`
  3. **File not found!** → Returns **404 NOT_FOUND error**
  4. React Router never gets a chance to run because the HTML was never served

**What It Needed to Do:**
- Serve `index.html` for **all routes** so React Router can load
- React Router then looks at the URL (`/editor`) and renders the appropriate component

### 2. **Why This Error Exists - The Protection**

**Server-Side vs Client-Side Routing:**

**Traditional Multi-Page Apps (Server-Side):**
```
/                 → Serves index.html
/about            → Serves about.html
/contact          → Serves contact.html
/missing-page     → 404 error (correct!)
```

**Single Page Apps (Client-Side):**
```
/                 → Serves index.html → React Router handles "/"
/editor           → Should serve index.html → React Router handles "/editor"
/software         → Should serve index.html → React Router handles "/software"
/invalid-route    → Serves index.html → React Router redirects to "/"
```

**Why Vercel Returns 404 by Default:**
- Vercel assumes traditional server-side routing unless told otherwise
- This protects against serving incorrect content for truly missing pages
- Without configuration, Vercel correctly reports "file not found" for `/editor`

**The Error Is Protecting You From:**
- Accidentally serving the wrong content
- Hiding legitimate 404 errors for static assets
- Performance issues from misconfigured servers

### 3. **The Correct Mental Model**

**Think of It This Way:**

1. **Browser makes request** → `GET /editor`

2. **Vercel (the server)** needs to decide:
   - "Do I have a file at `/editor`?" 
   - Without `vercel.json`: "No file found → 404 error"
   - With `vercel.json`: "Rewrite to `/index.html` → serve that"

3. **Browser receives** `index.html` with JavaScript bundles

4. **React Router (client-side)** wakes up:
   - "The URL says `/editor`"
   - "I have a route for that!"
   - "Render `<EditorMode />` component"

**Key Insight:**
- **Server's job:** Serve the HTML file (just one file for SPAs)
- **React Router's job:** Read the URL and show the right component
- **Problem:** They both need to know their roles!

**Framework Integration:**
- In Next.js: File-based routing is server-side (no need for rewrites)
- In Create React App: Includes similar configuration automatically
- In Vite (this project): You must configure the deployment platform manually
- In Remix/Gatsby: Handles both server and client routing automatically

### 4. **Warning Signs - How to Recognize This Pattern**

**🚨 You Might Face This Issue If:**

1. **Direct URL Access Fails:**
   - Navigation works fine when clicking links in the app
   - Typing URL directly or refreshing causes 404
   - → **Sign:** Routes work client-side but not server-side

2. **Deployment vs Local Development:**
   - `npm run dev` works perfectly
   - Deployed version shows 404 errors
   - → **Sign:** Dev server (Vite) handles SPA routing, production server doesn't

3. **Using React Router (or similar):**
   - You're using `react-router-dom`, `@reach/router`, `wouter`, etc.
   - Routes are defined in JavaScript/TypeScript, not as separate HTML files
   - → **Sign:** Client-side routing needs server configuration

4. **Browser DevTools Clues:**
   - Network tab shows `404` status for route URLs
   - Console shows "Cannot GET /your-route"
   - HTML response is an error page, not your app
   - → **Sign:** Server isn't serving your SPA

**📋 Checklist Before Deploying SPAs:**
- [ ] Is this a Single Page Application?
- [ ] Does it use client-side routing (React Router, Vue Router, etc.)?
- [ ] Have I configured the hosting platform for SPA routing?
- [ ] Do I have a catch-all route configuration (`vercel.json`, `_redirects`, etc.)?

### 5. **Alternative Approaches & Trade-offs**

#### **Option 1: Catch-All Rewrites (Current Solution) ✅**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Pros:**
- ✅ Simple and minimal
- ✅ Works for all routes automatically
- ✅ No code changes needed
- ✅ Industry standard for SPAs

**Cons:**
- ❌ All 404s become 200 status codes (can affect SEO)
- ❌ True missing pages won't return proper 404s
- ❌ May serve HTML for asset requests if misconfigured

**Best For:** Most SPAs, especially those without server-side rendering

---

#### **Option 2: Selective Rewrites with Exclusions**
```json
{
  "rewrites": [
    { 
      "source": "/((?!api|assets|_next|favicon\\.ico).*)", 
      "destination": "/index.html" 
    }
  ]
}
```

**Pros:**
- ✅ Protects API routes and static assets from rewrites
- ✅ More precise control
- ✅ Better for apps with API endpoints

**Cons:**
- ❌ More complex regex pattern
- ❌ Need to maintain exclusion list
- ❌ Can miss edge cases

**Best For:** SPAs with backend API routes on the same domain

---

#### **Option 3: Redirects (Not Recommended for SPAs)**
```json
{
  "redirects": [
    { "source": "/(.*)", "destination": "/", "permanent": false }
  ]
}
```

**Pros:**
- ✅ Simple to understand

**Cons:**
- ❌ Changes browser URL (loses the intended route)
- ❌ Breaks bookmarks and shared links
- ❌ Poor user experience
- ❌ Not suitable for SPAs

**Best For:** Redirecting old URLs to new ones, not for SPA routing

---

#### **Option 4: Framework with SSR/SSG**
Switch to Next.js, Remix, or Gatsby for server-side rendering.

**Pros:**
- ✅ Better SEO (pages rendered server-side)
- ✅ Faster initial page load
- ✅ Automatic routing configuration
- ✅ Can mix static and dynamic routes

**Cons:**
- ❌ Major refactor required
- ❌ More complex setup and deployment
- ❌ Overkill for simple visualizer apps
- ❌ Different mental model and API

**Best For:** Content-heavy sites, e-commerce, blogs needing SEO

---

#### **Option 5: Hash-Based Routing**
Use `HashRouter` instead of `BrowserRouter` in React Router.

```tsx
// Change from:
<BrowserRouter>
  <App />
</BrowserRouter>

// To:
<HashRouter>
  <App />
</HashRouter>
```

URLs become: `https://your-app.vercel.app/#/editor`

**Pros:**
- ✅ No server configuration needed
- ✅ Works everywhere (even file:// protocol)
- ✅ Simple fallback solution

**Cons:**
- ❌ URLs look unprofessional (`/#/editor`)
- ❌ Harder to share and bookmark
- ❌ Poor SEO (search engines may ignore hash fragments)
- ❌ Can break analytics tracking

**Best For:** Internal tools, prototypes, offline apps

---

### **Why We Chose Option 1 (Catch-All Rewrites)**

For **Canvas Visualizer**, the catch-all rewrite is ideal because:

1. **It's a visualizer/editor tool, not a content site**
   - SEO isn't critical (users won't Google search for specific editor routes)
   - No blog posts or articles to index

2. **Clean URLs matter for UX**
   - Sharing links like `/editor` or `/software` is user-friendly
   - Professional appearance

3. **No API routes to protect**
   - Uses Stack Auth and Neon externally
   - No backend routes on the same domain

4. **Simple maintenance**
   - One config file, no ongoing updates needed
   - Works with any new routes added via React Router

5. **Standard practice**
   - Most SPA deployment guides use this approach
   - Well-documented and widely supported

---

## 🔍 Similar Scenarios & Platforms

### **Other Hosting Platforms:**

**Netlify:**
Create `_redirects` file:
```
/*    /index.html   200
```

**Cloudflare Pages:**
Create `_redirects` file:
```
/*    /index.html   200
```

**Firebase Hosting:**
In `firebase.json`:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**AWS S3 + CloudFront:**
Configure CloudFront to return `/index.html` for 404 errors

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🎓 Learning Resources

**Official Documentation:**
- [Vercel SPA Routing](https://vercel.com/docs/project-configuration#rewrites)
- [React Router - Web Server Configuration](https://reactrouter.com/en/main/guides/spa)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

**Related Concepts:**
- Client-side routing vs server-side routing
- HTTP status codes (200 OK vs 404 Not Found)
- URL rewriting vs redirects
- Progressive Web Apps (PWAs) and service workers

---

## ✅ Testing Your Fix

After deploying with `vercel.json`, verify:

1. **Root path works:** `https://your-app.vercel.app/` → ✅
2. **Direct route access:** `https://your-app.vercel.app/editor` → ✅
3. **Refresh on route:** Visit `/software`, press F5 → ✅
4. **Invalid routes redirect:** `https://your-app.vercel.app/invalid` → Should redirect to `/` ✅
5. **Assets load correctly:** Check images, fonts, CSS → ✅

**DevTools Checks:**
- Network tab: All route requests return `200` status
- Console: No 404 errors for the main app routes
- Application tab: Service worker (if any) registers correctly

---

## 🚀 Summary

**The Issue:** Vercel returned 404 for React Router routes like `/editor` and `/software`

**The Fix:** Created `vercel.json` with catch-all rewrite to serve `index.html` for all routes

**The Lesson:** SPAs need server configuration to handle client-side routing

**Key Takeaway:** When building SPAs, always configure your hosting platform to serve the main HTML file for all routes, allowing your client-side router to take over.

---

**Date:** January 7, 2026  
**Status:** ✅ Resolved  
**Files Modified:** `vercel.json` (created)
