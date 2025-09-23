# GitHub Copilot Instructions for Hu-Tracker

These instructions define the rules Copilot must follow when assisting in code reviews and code suggestions for this repository.

---

## ✅ General Code Quality
- Enforce **React best practices**: 
  - Use functional components with hooks instead of class components.
  - Prefer `useEffect` and `useState` over legacy lifecycle methods.
  - Ensure proper dependency arrays in hooks (no missing or extra deps).
- Write clean, modular code:
  - Keep functions < 50 lines.
  - One responsibility per function/component.
  - Use descriptive names for variables, functions, and components.
- Ensure consistent formatting with **Prettier + ESLint** rules.
- Require **TypeScript types** (or JSDoc if using JS) for function parameters and return values.

---

## 🔐 Security Rules
- Never hardcode secrets (Supabase keys, JWT tokens, API keys).
- Always use environment variables via `import.meta.env.*`.
- Validate and sanitize all user inputs before sending to Supabase.
- Avoid use of `eval`, `new Function`, or insecure string concatenation in queries.
- Use HTTPS-only endpoints.
- Enforce secure authentication with Supabase Auth, never roll your own.

---

## 📊 Supabase-Specific Guidelines
- Prefer **Row Level Security (RLS)** policies in Supabase.
- Only query columns needed (`select("id, name")` not `select("*")`).
- Handle errors explicitly using `try/catch` with logging.
- Avoid storing sensitive user data locally (e.g., JWT in `localStorage`).
  - Prefer `secure cookies` or in-memory storage.

---

## 🧪 Testing & Validation
- Each new component must include **unit tests** with React Testing Library.
- Critical Supabase queries require integration tests.
- Validate **null/undefined checks** before rendering or API usage.
- Avoid unused imports and variables (Copilot should flag them).

---

## 🚀 Performance
- Use **React.lazy + Suspense** for code splitting large components.
- Implement **pagination or infinite scroll** instead of fetching large datasets.
- Use **TanStack Query (React Query)** or SWR for caching and data consistency.
- Avoid unnecessary re-renders (memoize expensive calculations and components).

---

## ⚠️ Pull Request Checks
Copilot should comment if:
- Functions are too long (>50 lines).
- Any direct secrets are found.
- API calls don’t handle errors.
- Any Supabase call uses `select("*")`.
- There are missing types or unsafe `any` usage.
- Tests are missing for new features.

---

## 🛡️ Dependency Security
- Warn if vulnerable packages are used.
- Ensure dependencies are the latest stable version.
- Avoid unnecessary polyfills or large libraries for small tasks.

---

## 📘 Documentation
- Require JSDoc (or TypeScript docstrings) for complex functions.
- Ensure README updates if major functionality changes.
- Components must include inline comments for non-obvious logic.

---
