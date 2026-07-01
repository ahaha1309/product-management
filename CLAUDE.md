# CLAUDE.md

> Project Instructions for AI Coding Assistants
>
> These instructions define how AI assistants should reason, modify, and improve this project.
> The goal is production-quality code suitable for an Excellent Graduation Thesis.
>
> If any instruction conflicts with the user's request, or a decision would affect business logic, schema, or architecture, ask for clarification instead of guessing. For small implementation details already covered by existing project conventions, follow the convention without stopping to ask.

---

# 0. Project Context

* **Project:** NVH Mall — full-stack ecommerce platform (Node.js/Express + MongoDB), graduation thesis project.

* **Backend stack:**
  - Core: Node.js, Express.js
  - Database: MongoDB with Mongoose (ODM) — schema-based, not raw driver queries
  - Auth: Passport.js (Google & Facebook OAuth) + JWT + Bcrypt for password hashing
  - Sessions: express-session (SESSION_SECRET)
  - 3rd-party services: Cloudinary (image upload), Twilio (SMS/OTP), Nodemailer (transactional email)
  - Realtime: Socket.io (customer chat support, realtime order notifications)

* **Frontend stack:**
  - Template engine: Pug (server-rendered views)
  - Styling: Tailwind CSS + Bootstrap 5 + Autoprefixer (Tailwind build step runs via npm start)
  - Interactivity: Vanilla JS + Socket.io client
  - Rich text editor: TinyMCE (product descriptions)

* **Folder convention** (do not deviate without reason):
  ```
  config/        → DB connection (MongoDB)
  controller/    → request handlers, split by client vs admin
  helper/        → utilities (sendMail, OTP generation, Cloudinary upload, etc.)
  middleware/    → auth, security, file upload
  models/        → Mongoose schemas
  public/        → static assets (compiled Tailwind CSS, JS, images, uploads)
  routes/        → route definitions (web + API), split by client vs admin
  template/      → HTML email templates
  validate/      → input validation logic (currently only under validate/admin)
  views/         → Pug templates, split into admin/ and client/
  index.js       → app entry point
  ```

* **Naming convention:** match existing files in each folder before introducing a new pattern — this repo mixes client/admin naming (e.g. `admin.*.controller.js` style); check `controller/` and `routes/` for the exact pattern in use before adding new files.

* **Security middleware already in place** (don't duplicate, extend if needed):
  - Helmet.js — secure HTTP headers
  - xss-clean — sanitizes user input against XSS
  - express-mongo-sanitize — prevents NoSQL injection
  - express-rate-limit — brute-force / DDoS protection
  - bcrypt (password hashing) + JWT (session/token management)

* **Auth pattern:** Passport.js strategies (local + Google + Facebook OAuth) issuing JWT; session state via express-session. Roles are separated (admin, sales staff, customer support, customer).

* **Testing / verification method:** no automated test suite in the repo — verify manually by running `npm start` and checking the affected flow in-browser (client and admin views), plus checking MongoDB state directly when relevant. State the manual verification steps explicitly when reporting a fix (see Section 14).

* **Deployment target:** Vercel (see `vercel.json`).

* **Env vars required:** `PORT`, `MONGO_URL`, `SESSION_SECRET`, `EMAIL_USER`/`EMAIL_PASS`, `CLOUDINARY_*`, `GOOGLE_CLIENT_*`, `FACEBOOK_APP_*`, `TWILIO_*` — never hardcode these, always reference `process.env`.

---

# 1. Core Principles (Highest Priority)

Before writing any code:

* Read the relevant files completely.
* Understand the existing architecture and how the feature currently works.
* Identify dependencies.
* Think before coding.

Never guess on anything that affects **business logic, schema, or architecture**. If unclear:

* State your assumptions.
* Explain what is unclear.
* Ask for clarification.

For minor implementation details with an obvious existing convention, proceed without asking — don't block progress over trivial choices.

---

# 2. Simplicity First

Prefer the simplest solution that fully solves the problem.

Avoid: over-engineering, premature abstraction, future-proofing for imaginary requirements, generic frameworks for single-use logic, unnecessary configuration, duplicate code.

Ask: *"Would a senior engineer think this is unnecessarily complicated?"* If yes, simplify.

---

# 3. Surgical Changes

Modify only the code required for the requested task. Do NOT reformat unrelated files, rename unrelated variables, refactor unrelated modules, move files, or change coding style/structure without being asked.

If unrelated problems are discovered: mention them, don't fix them unless requested.

---

# 4. Search Before Creating

Before creating a service, controller, model, middleware, utility, component, hook, or function — search the project first. Prefer extending existing code. Avoid duplicate functionality.

---

# 5. Match Existing Style

Follow the project's folder structure, naming convention, code style, error handling pattern, validation approach, and logging style. Don't introduce a different style unless explicitly requested.

---

# 6. Architecture Rules

Respect the current architecture. Keep responsibilities separated:

* **Controllers:** receive requests, validate input, call services, return responses.
* **Services:** business logic only.
* **Models:** data definition only.
* **Utilities:** shared reusable functions only.

Never place business logic in controllers or database logic in views.

---

# 7. Database Rules (MongoDB / Mongoose)

Before modifying schema, read the existing Mongoose model in `models/` fully — understand its fields, types, refs (`ObjectId` relationships), and any hooks/virtuals already defined.

Prefer reusing or extending an existing schema/field over creating a duplicate collection or a duplicate relationship (e.g. don't add a second field that stores the same relation a `ref` already covers).

Never remove or rename existing fields unless requested — this breaks existing documents that still have the old shape. Add indexes only when justified by an actual query pattern (e.g. frequent filter/sort field), not speculatively.

Use Mongoose schema-level validation (`required`, `enum`, `min`/`max`, custom validators) instead of relying only on controller-level checks — the schema is the last line of defense against malformed data.

For relationships, use `.populate()` deliberately — don't populate fields that aren't needed in that response (extra payload, extra query cost).

For multi-step writes that must be atomic (e.g. decrementing stock + creating an order), use a Mongoose transaction/session, not sequential unguarded writes — partial failure must not leave inconsistent state.

---

# 8. Ecommerce Business Rules

Every feature must follow real ecommerce business logic:

* **Flash Sale:** overrides price only while active; auto-expires; never permanently changes the base product price.
* **Voucher:** validate at checkout — expiration, usage limit, minimum order, user eligibility.
* **Inventory:** never negative; update consistently; prevent overselling (use atomic decrement or transaction, not read-then-write).
* **Orders:** completed orders are immutable; payment status stays consistent with order state; shipping status follows the defined workflow.
* **Reviews:** only verified buyers can review; product rating recalculates automatically.
* **Wishlist:** must not affect inventory.
* **Cart:** always revalidate price/stock at checkout, never trust cached client-side price.

Business correctness takes priority over implementation convenience.

---

# 9. Frontend Rules

Every UI change should improve clarity, accessibility, consistency, responsiveness, or performance. Avoid visual clutter.

Always include: loading states, empty states, error states, meaningful feedback, consistent spacing/typography.

Never redesign a whole page unless requested.

---

# 10. Performance Rules

Avoid repeated queries, N+1 queries, unnecessary API calls, large payloads, duplicate rendering.

Concrete defaults for this project:

* Use pagination for any list endpoint that can grow unbounded.
* Batch or join instead of looping queries per item.
* Cache read-heavy, rarely-changing data (e.g. category lists) where appropriate — specify TTL.
* Measure before optimizing; don't micro-optimize code that isn't on a hot path.

---

# 11. Security Rules

Never trust user input. Always validate input, sanitize data, check permissions, verify authentication, protect sensitive operations.

Concrete defaults for this project:

* Never build Mongo queries from raw, unsanitized user input as an object (NoSQL/operator injection — e.g. a user-supplied `{ $gt: "" }` in a login field). `express-mongo-sanitize` is already installed globally — don't bypass it for a specific route; also validate types explicitly in Mongoose schema/controller.
* Enforce authorization checks server-side (in middleware/controller), never rely on hidden UI elements to "hide" unauthorized actions — admin routes must re-check role even if the client already filtered the menu.
* Never hardcode secrets, API keys, or credentials — always read from `process.env` (see the env var list in Section 0).
* Never expose internal error messages, stack traces, or raw Mongoose/DB errors to the client; log them server-side and return a generic message.
* Rate-limit or otherwise protect sensitive endpoints (login, checkout, password reset, OTP request) — `express-rate-limit` is already configured; extend it to new sensitive routes rather than adding a separate mechanism.
* Sanitize any user input rendered back into Pug templates to avoid stored/reflected XSS, even though `xss-clean` runs globally — be extra careful with any `!{}` (unescaped) interpolation in views.

---

# 12. Code Quality

Write code that is readable, maintainable, predictable, consistent.

Prefer: small functions, clear names, single responsibility.

Avoid: magic numbers, unused variables/imports, duplicate logic, deep nesting, long functions.

---

# 13. Error Handling

Handle realistic failures. Don't add defensive code for impossible situations. Provide meaningful error messages. Avoid silent failures.

---

# 14. Testing Mindset

Before implementation, define success criteria.

* **Bug fixes:** reproduce the issue → fix it → verify the fix.
* **New features:** verify the happy path, invalid input, and edge cases.

Verification method for this project: [specify — e.g. Jest unit tests, manual Postman check, QA checklist]. If no automated tests exist for the touched area, at minimum describe the manual steps used to verify.

---

# 15. Communication

Before implementation, briefly explain: what you understand, your assumptions, and your plan.

For multi-step work, structure as: Step → Verification → Next step.

If genuinely uncertain about something that affects business logic or architecture: stop and ask, don't guess.

---

# 16. Review Checklist (run after every task)

* Requirements satisfied, existing functionality still works.
* No unrelated files changed, no duplicate logic introduced.
* Business rules (Section 8) remain correct.
* Architecture (Section 6) still respected.
* Code is simpler or equally maintainable as before.
* Change improves at least one of: architecture, maintainability, scalability, UX, security, performance, business value, or academic value — without adding complexity just to look more advanced.

A task is only complete when this checklist passes.