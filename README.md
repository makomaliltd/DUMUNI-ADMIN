# DUMUNI Admin Dashboard

This is a full-stack web application based on Express + Vite + TypeScript + Tailwind CSS, created by Coze Programming CLI.

**Core Features:**
- 🚀 Frontend: Vite + TypeScript + Tailwind CSS
- 🔧 Backend: Express + TypeScript, providing RESTful API
- 🔥 Dev Mode: Vite HMR + Express API, single process startup
- 📦 Production Mode: Express static serving + API, high-performance deployment

## Quick Start

### Start the Development Server

```bash
pnpm dev
```

After starting, open [http://localhost:5000](http://localhost:5000) in your browser to view the application.

The dev server supports Hot Module Replacement (HMR) — the page will auto-refresh when you modify code.

> **⚠️ Windows Note:** The `pnpm dev` command uses `bash` internally. If bash is not available on your Windows system, use this alternative command instead:
> ```bash
> pnpm tsx watch server/server.ts
> ```

### Build for Production

```bash
pnpm build
```

The build output is located in the `dist/` directory and can be deployed directly to static hosting services.

### Preview Production Build

```bash
pnpm start
```

Starts a local static server to preview the production build.

## Project Structure

```
├── server/                # Backend server directory
│   ├── server.ts          # Express server entry point
│   ├── routes/            # API routes directory
│   │   └── index.ts       # Route definitions
│   └── vite.ts            # Vite integration logic
├── src/                   # Frontend source directory
│   ├── index.tsx          # Frontend application entry (initialization)
│   ├── main.ts            # Frontend main logic file
│   └── index.css          # Global styles (includes Tailwind directives)
├── index.html            # HTML entry file
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

**Directory Description:**

- **`server/`** - Backend server code
  - `server.ts` - Main server entry, responsible for creating and starting the Express app
  - `routes/` - API route modules, supports splitting routes by feature
  - `vite.ts` - Vite dev server and static file serving integration

- **`src/`** - Frontend application code
  - All frontend-related code lives here

**How It Works:**

- **Development Mode** (`pnpm dev`):
  - Runs `server/server.ts` to start the Express server
  - Vite is integrated into Express in middleware mode
  - Frontend supports HMR (Hot Module Replacement)
  - Backend API and frontend run in the same process, port 5000

- **Production Mode** (`pnpm start`):
  - `pnpm build` builds the frontend → `dist/` directory
  - `pnpm build` builds the backend → `dist-server/index.js` (CommonJS format)
  - Run `dist-server/index.js` to start the production server
  - Express serves static files + API routes
  - Single Node.js process, lightweight and efficient

## Core Development Guidelines

### 1. Backend API Development

**Adding New API Routes**

Add routes in `server/routes/index.ts`:

```typescript
// GET request example
router.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  });
});

// POST request example
router.post('/api/users', (req, res) => {
  const userData = req.body;
  // Process business logic
  res.json({
    success: true,
    user: userData,
  });
});

// Dynamic route parameters
router.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    id: userId,
    name: 'User ' + userId,
  });
});
```

**Splitting Route Modules** (Recommended)

When routes grow, you can split them by feature:

```typescript
// server/routes/users.ts
import { Router } from 'express';

const router = Router();

router.get('/api/users', (req, res) => {
  // User list logic
  res.json({ users: [] });
});

router.post('/api/users', (req, res) => {
  // Create user logic
  res.json({ success: true });
});

export default router;
```

Then register in `server/server.ts`:

```typescript
import usersRouter from './routes/users';

// Register routes
app.use(usersRouter);
```

**Calling the API from the Frontend**

```typescript
// GET request
async function getUsers() {
  const response = await fetch('/api/users');
  const data = await response.json();
  console.log(data);
}

// POST request
async function createUser(name: string) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await response.json();
  console.log(data);
}
```

**API Best Practices**

- ✅ All API routes start with `/api` to avoid conflicts with frontend routes
- ✅ Use RESTful design: GET for queries, POST for creation, PUT for updates, DELETE for deletion
- ✅ Return a unified response format: `{ success: boolean, data?: any, error?: string }`
- ✅ Add error handling and parameter validation

### 2. Styling Development

**Using Tailwind CSS**

This project uses Tailwind CSS for styling, with automatic light/dark mode switching.

```typescript
// Using Tailwind utility classes
app.innerHTML = `
  <div class="flex items-center justify-center min-h-screen bg-white dark:bg-black">
    <h1 class="text-4xl font-bold text-black dark:text-white">
      Hello World
    </h1>
  </div>
`;
```

**Theme Variables**

Theme variables are defined in `src/index.css`, with automatic system theme adaptation:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Common Tailwind Class Names**

- Layout: `flex`, `grid`, `container`, `mx-auto`
- Spacing: `p-4`, `m-4`, `gap-4`, `space-x-4`
- Colors: `bg-white`, `text-black`, `dark:bg-black`, `dark:text-white`
- Typography: `text-lg`, `font-bold`, `leading-8`, `tracking-tight`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`

### 3. Dependency Management

**Must use pnpm to manage dependencies**

```bash
# ✅ Install dependencies
pnpm install

# ✅ Add a new dependency
pnpm add package-name

# ✅ Add a dev dependency
pnpm add -D package-name

# ❌ Do NOT use npm or yarn
# npm install  # Wrong!
# yarn add     # Wrong!
```

The project has a `preinstall` script configured — using other package managers will cause an error.

### 4. TypeScript Development

**Type Safety**

Leverage TypeScript's type system to ensure code quality:

```typescript
// Define interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Use types
function createUser(data: User): void {
  console.log(`Creating user: ${data.name}`);
}

// DOM operation type inference
const button = document.querySelector<HTMLButtonElement>('#my-button');
if (button) {
  button.addEventListener('click', () => {
    console.log('Button clicked');
  });
}
```

**Avoid the `any` Type**

Avoid using `any`; use `unknown` or specific types instead:

```typescript
// ❌ Not recommended
function process(data: any) { }

// ✅ Recommended
function process(data: unknown) {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

## Common Development Scenarios

### Adding New Pages

This project is a Single Page Application (SPA). For multiple pages:

1. Create a new `.ts` file under `src/`
2. Configure multiple entries in `vite.config.ts`
3. Create the corresponding `.html` file

### DOM Operations

```typescript
// Get element
const app = document.getElementById('app');
const button = document.querySelector<HTMLButtonElement>('.my-button');

// Dynamically create element
const div = document.createElement('div');
div.className = 'flex items-center gap-4';
div.textContent = 'Hello World';
app?.appendChild(div);

// Event listener
button?.addEventListener('click', (e) => {
  console.log('Clicked', e);
});
```

### Data Fetching

```typescript
// Fetch API
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

// Use data
fetchData().then(data => {
  console.log(data);
});
```

### Environment Variables

Define environment variables in the `.env` file (must start with `VITE_`):

```bash
VITE_API_URL=https://api.example.com
```

Use in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl); // https://api.example.com
```

## Tech Stack

**Frontend:**
- **Build Tool**: Vite 7.x
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x

**Backend:**
- **Framework**: Express 4.x
- **Built-in Middleware**: express.json(), express.urlencoded(), express.static()

**Tools:**
- **Package Manager**: pnpm 9+
- **Runtime**: Node.js 18+
- **Dev Tool**: tsx (TypeScript executor)

## Reference Documentation

**Frontend:**
- [Vite Official Docs](https://vitejs.dev/)
- [TypeScript Official Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

**Backend:**
- [Express Official Docs](https://expressjs.com/)

## Important Notes

1. **Must use pnpm** as the package manager
2. **Use TypeScript** for type-safe development, avoid using `any`
3. **Use Tailwind CSS** for styling, supports responsive and dark mode
4. **Environment variables must start with `VITE_`** to be accessible in client-side code
5. **Use `pnpm dev` for development**, supports HMR and fast refresh
6. **API routes start with `/api`**, to avoid conflicts with frontend routes
7. **Single-process architecture**: Both dev and production run frontend and backend in the same process

## FAQ

**Q: How to separate frontend and backend ports?**

If you need separate deployment:
- Frontend: Use `npx vite` to start separately (default port 5173)
- Backend: Modify `server.ts`, remove Vite middleware, start separately

**Q: How to add a database?**

```bash
# Install database client (PostgreSQL example)
pnpm add pg
pnpm add -D @types/pg

# Use in server.ts
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Q: How to deploy?**

1. Run `pnpm build` to build frontend and backend
2. Upload the entire project to the server
3. Run `pnpm install --prod`
4. Run `pnpm start` to start the service
