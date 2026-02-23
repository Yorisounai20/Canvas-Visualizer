# Visual Guide: Understanding the Vercel NOT_FOUND Fix

## The Problem: Without vercel.json

```
User Types URL: https://your-app.vercel.app/editor
              │
              ▼
      ┌───────────────┐
      │  Vercel Server │
      └───────────────┘
              │
              ▼
      Looking for file: /editor.html
              │
              ▼
      ❌ File not found!
              │
              ▼
      Returns: 404 NOT_FOUND Error
              │
              ▼
      🚫 User sees error page
```

**What happened:**
1. User requests `/editor`
2. Vercel looks for a physical file at that path
3. No file exists (only `index.html` exists)
4. Server returns 404 error
5. React Router never loads

---

## The Solution: With vercel.json

```
User Types URL: https://your-app.vercel.app/editor
              │
              ▼
      ┌───────────────┐
      │  Vercel Server │
      │                │
      │  vercel.json   │ ← Checks rewrite rules
      └───────────────┘
              │
              ▼
      Rewrite: /editor → /index.html
              │
              ▼
      ✅ Serves: index.html
              │
              ▼
      Browser receives HTML + JavaScript
              │
              ▼
      ┌────────────────┐
      │ React Router   │ ← Loads and reads URL
      └────────────────┘
              │
              ▼
      URL says "/editor"
              │
              ▼
      Renders: <EditorMode /> component
              │
              ▼
      ✅ User sees Editor interface
```

**What happens now:**
1. User requests `/editor`
2. Vercel checks `vercel.json` rewrite rules
3. Rewrites internally to serve `index.html`
4. Browser receives the HTML and JavaScript bundles
5. React Router loads and reads the URL
6. React Router renders the correct component for `/editor`

---

## Key Concept: Two Types of Routing

### Server-Side Routing (Traditional)
```
┌─────────────┐
│   Browser   │ Request: /about
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Server    │ Finds: about.html
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Browser   │ Shows: About page
└─────────────┘
```

**Each route = A different HTML file on the server**

---

### Client-Side Routing (Single Page App)
```
┌─────────────┐
│   Browser   │ Request: /editor
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Server    │ Serves: index.html (always!)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Browser   │ React Router: "I'll handle /editor"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ JavaScript  │ Renders: <EditorMode />
└─────────────┘
```

**All routes = Same HTML file + JavaScript decides what to show**

---

## The vercel.json Configuration

```json
{
  "rewrites": [
    {
      "source": "/(.*)",      ← Match: Any URL path
      "destination": "/index.html"  ← Serve: Always index.html
    }
  ]
}
```

### What Each Part Means:

**`"rewrites"`** - Tells Vercel to transform URLs internally
- Different from redirects (which change the browser URL)
- Happens server-side, invisible to the user

**`"source": "/(.*)""`** - Regex pattern meaning "match everything"
- `/` = Start of path
- `(.*)` = Any characters (0 or more)
- Examples: `/`, `/editor`, `/software`, `/any/nested/path`

**`"destination": "/index.html"`** - What to serve instead
- No matter what URL is requested
- Always serve the main `index.html` file
- React Router then takes over

---

## Real-World Example Flow

### Scenario: User shares link to `/editor`

**1. User clicks: `https://canvas-viz.vercel.app/editor`**

```
Browser → "GET /editor" → Vercel
```

**2. Vercel checks vercel.json:**

```javascript
// Pseudo-code of what Vercel does:
if (requestPath matches "/(.*)" ) {  // ✅ Matches!
  serve("/index.html")               // Serve index.html
  statusCode = 200                   // Return success
}
```

**3. Browser receives index.html:**

```html
<!doctype html>
<html>
  <head>...</head>
  <body>
    <div id="root"></div>
    <script src="/assets/index-BlTsqL20.js"></script>
  </body>
</html>
```

**4. JavaScript bundle loads and runs:**

```javascript
// React Router starts
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/editor" element={<EditorMode />} />  ← Matches!
    <Route path="/software" element={<SoftwareMode />} />
  </Routes>
</BrowserRouter>
```

**5. User sees Editor interface ✅**

---

## Comparison: With vs Without vercel.json

| Scenario | Without Config | With Config |
|----------|----------------|-------------|
| Visit `/` | ✅ Works | ✅ Works |
| Visit `/editor` | ❌ 404 Error | ✅ Works |
| Visit `/software` | ❌ 404 Error | ✅ Works |
| Refresh on `/editor` | ❌ 404 Error | ✅ Works |
| Share link to `/editor` | ❌ 404 Error | ✅ Works |
| Click internal links | ✅ Works (client-side) | ✅ Works (client-side) |

---

## Common Misconceptions

### ❌ Misconception #1: "React Router handles everything"
**Reality:** React Router only works AFTER the JavaScript loads. If the server returns 404, JavaScript never loads.

### ❌ Misconception #2: "Vite handles routing automatically"
**Reality:** Vite's dev server (`npm run dev`) handles SPA routing, but production deployments need separate configuration.

### ❌ Misconception #3: "This is a Vercel-specific issue"
**Reality:** All SPAs need server configuration—Vercel, Netlify, Apache, Nginx, etc. Each platform has different config syntax.

### ❌ Misconception #4: "The build creates files for each route"
**Reality:** Vite builds ONE `index.html` file. Routes only exist in JavaScript, not as separate files.

---

## Debugging Checklist

If routes still don't work after adding `vercel.json`:

- [ ] Is `vercel.json` in the repository root? (Not in `src/` or `public/`)
- [ ] Did you commit and push `vercel.json` to GitHub?
- [ ] Did Vercel redeploy after the config was added?
- [ ] Check deployment logs for config errors
- [ ] Try clearing Vercel's cache (Deployments → ⋯ → Redeploy)
- [ ] Verify `vercel.json` syntax is valid JSON

---

## Related Resources

**This Project:**
- [QUICK_FIX_SUMMARY.md](QUICK_FIX_SUMMARY.md) - Quick reference
- [VERCEL_DEPLOYMENT_FIX.md](VERCEL_DEPLOYMENT_FIX.md) - Comprehensive guide
- [README.md](README.md) - Deployment instructions

**External:**
- [Vercel Rewrites Documentation](https://vercel.com/docs/project-configuration#rewrites)
- [React Router: Configuring Your Server](https://reactrouter.com/en/main/guides/spa)
- [Understanding SPAs](https://developer.mozilla.org/en-US/docs/Glossary/SPA)

---

**Created:** January 7, 2026  
**Purpose:** Visual explanation of Vercel NOT_FOUND fix
