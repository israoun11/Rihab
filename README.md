# Rihab Baabou · Website and CMS

The Rihab Baabou interior architecture portfolio, converted from the original static site into a full-stack application:

- **Frontend**: React 19 + TypeScript (Vite), in `client/`
- **Backend**: Node.js + Express 5 + TypeScript, in `server/`
- **Database**: MongoDB (Mongoose). Texts, projects, categories, admin accounts, sessions **and uploaded images** (GridFS) are all stored in MongoDB.
- **Shared**: the content model, default content and types used by both sides, in `shared/`

The visual design is the original one: `client/src/styles/style.css` is the original stylesheet, unchanged. The few rules needed for the requested changes live separately in `client/src/styles/site-additions.css`. Images, fonts, animations (cursor reveal on the hero, section entrances, mobile menu) and the contact form behave as before.

---

## 1. Requirements

- Node.js **20.12 or later** (22 LTS recommended) and npm 10+
- A MongoDB database: local install, Docker (`docker compose up -d` with the included `docker-compose.yml`) or a free MongoDB Atlas cluster

## 2. Installation

```bash
npm install                 # installs all workspaces and builds the shared package
cp .env.example .env        # then edit .env
```

In `.env`, set at least:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/rihab` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First administrator, created at startup if none exists (password: 10+ characters). You can remove `ADMIN_PASSWORD` from `.env` once the account exists. |

All variables are documented in `.env.example`. No secret is stored in the code.

## 3. Running

**Development** (API with auto-reload on :4000, Vite dev server on :5173):

```bash
npm run dev
```

Open http://localhost:5173 for the site and http://localhost:5173/admin for the dashboard.

**Production** (one Node process serves the API, the uploaded images and the built site):

```bash
npm run build
NODE_ENV=production npm start      # http://localhost:4000
```

In production the session cookie is HTTPS-only. To try the production build locally over plain http, add `COOKIE_SECURE=false` to `.env`. Behind a host or reverse proxy (Render, Railway, Nginx…), set `TRUST_PROXY=1`.

On first start the server inserts the original five projects and two categories. Page texts come from the default content (the original wording) until they are edited in the dashboard.

## 4. Admin dashboard

Go to **/admin** and sign in.

- **Pages**: every page is split into its sections (hero, about, services, footer…). Each section has its own **Save** and **Cancel** buttons, an "unsaved changes" marker, and a **Restore original content** link. Common elements (navigation labels, footer, contact details, social links, 404 page) are under **Éléments communs**.
- **Text formatting**: in titles, a new line breaks the title like the original design; `*text*` gives italics, `**text**` bold, and a blank line starts a new paragraph. No HTML is ever interpreted.
- **Images**: every image shows a preview in the exact frame ratio used on the site. "Replace" opens the image picker: upload from the computer (drag and drop works), reuse an image from the library, or put back one of the original images. The new image is previewed in the form and only goes live after **Save**. Images are cropped to the frame (object-fit: cover), so the layout and proportions never change. Optional images (e.g. the detail image of the homepage About section) can be removed.
- **Projects & categories**: create, edit, reorder and delete projects; manage the card image, the opening image and the gallery (add, replace, reorder, remove). Categories can be added, renamed, reordered and deleted (a category that still contains projects is protected).
- **Media library**: all uploaded images, with size and dimensions. An image still used somewhere on the site cannot be deleted; the dashboard says where it is used.

Saved changes are visible on the public site immediately (the content API is never cached), with no rebuild or redeployment.

To create another administrator or reset a password:

```bash
npm run create-admin -- email@example.com "a-new-password"
```

## 5. What changed compared with the static site

Only the changes requested in the brief:

1. **Homepage** is a preview of the whole site: the original hero, then short previews of À propos, Services, Projets (an automatic projects slider) and Contact, each with a button to its dedicated page. The "À propos" navigation link scrolls to the About preview; the full biography stays at `/a-propos`. Every preview text is editable in the dashboard (Accueil page); the services and project slides come from their own pages/projects, so they are edited once.
   The projects slider (`client/src/components/ProjectSlider.tsx`) shows one project at a time as a full-width landscape image (16:10, 4:5 on phones) that fills its frame edge to edge, with the project name, "place - type" and "Découvrir le projet" over the bottom of the image, and a "Voir tous les projets" button below. It cross-fades automatically (display time editable, 6 s by default), pauses while hovered, focused, off-screen or in a background tab, and also responds to swipe and the keyboard arrows; there are no arrows, numbers or indicators. With "reduce motion" enabled in the system, it does not move on its own. The space between the hero and À propos is reduced (`site-additions.css`).
   The Formations preview is no longer shown on the homepage; its texts are kept in the dashboard (Accueil › Formations) and the page stays in the navigation.
   **Formations page**: the "Enseignement" text section is replaced by an image-only section (Formations › Image, 16:9, empty by default; nothing is shown on the site until an image is added). A "Professional Software Courses" section follows (Formations › Formations logiciels): label, title and a list of software cards with an optional logo, name, description and button; the button opens the contact form preset to "Formation". The logos are empty by default and can be uploaded per card.
2. **Navigation order**: Accueil, À propos, Services, Projets, Formations, then the contact button (same order in the mobile menu and the footer). "Accueil" was added as the first link.
3. **Projects** have their own page (`/projets`), grouped by category (Résidentiel, Commercial), with the existing filter buttons. Every card uses the same 16:10 image frame; Curated Comfort no longer has a larger image. Cards show only the location, the type of project and **Découvrir le projet**, which opens the project page (`/projets/<slug>`).
4. Everything is editable from the dashboard.

Old addresses (`projets.html`, `projet-curated-comfort.html`…) redirect permanently to the new ones.

## 6. Project structure

```
shared/src/
  schema.ts       content model: pages → sections → fields (drives the dashboard, the API validation and the types)
  defaults.ts     original wording of every text
  projects.ts     project and category types, original projects
  richtext.ts     safe *italic* / **bold** / line-break markup
server/src/
  index.ts        startup (database, initial data, first admin)
  app.ts          Express app: security headers, routes, built site, legacy redirects
  config.ts       environment variables (validated)
  models/         Mongoose models
  routes/         public API, authentication, admin API
  services/       content, projects, media (GridFS), validation (zod), seeding
  middleware/     sessions, CSRF guard, rate limiting, errors
  scripts/        seed, create-admin
server/test/      API integration tests (node:test)
client/src/
  pages/          Home, About, Services, Projects, ProjectDetail, Formations, Contact, NotFound
  components/     Nav, Footer, Frame, ProjectCard, EnquiryForm, ContactSection…
  hooks/          hero cursor reveal, section entrances, page titles
  content/        content provider (fetches /api/content)
  admin/          dashboard (lazy-loaded, never sent to regular visitors)
  styles/         original style.css + additions
client/public/assets/img/   original images
```

## 7. API

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/content` | public: all content, projects and categories |
| GET | `/media/:id` | public: uploaded image |
| POST | `/api/auth/login`, `/api/auth/logout` · GET `/api/auth/me` | session |
| GET · PUT · DELETE | `/api/admin/content[/:page/:section]` | admin |
| GET · POST · PUT · DELETE | `/api/admin/projects[/:id]`, PUT `/api/admin/projects/order` | admin |
| GET · POST · PUT · DELETE | `/api/admin/categories[/:id]`, PUT `/api/admin/categories/order` | admin |
| GET · POST · DELETE | `/api/admin/media[/:id]` | admin |

## 8. Security

- Passwords hashed with scrypt; sessions are random tokens stored hashed in MongoDB, expire automatically, and travel in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` in production).
- Every state-changing request needs a custom header and a matching `Origin` (CSRF protection); login attempts are rate-limited per IP.
- All input is validated server-side (zod) against the content model: unknown fields, empty required texts, external image addresses and unsafe links (`javascript:`) are refused.
- Uploads: JPG, PNG, WebP, AVIF or GIF only, checked from the file content (not the declared type), size-limited (`MAX_UPLOAD_MB`). SVG uploads are refused.
- Helmet security headers with a strict Content-Security-Policy; texts are rendered as text, never as HTML.

## 9. Checks

```bash
npm run typecheck     # strict TypeScript, all workspaces
npm test              # API tests; uses MONGODB_TEST_URI or "<your database>_test", dropped after the run
npm run build
```

## 10. Still to provide (unchanged from the static site)

- Real project photos and renders (the current project visuals are marked "Image de démonstration" until they are replaced from the dashboard; the tag disappears automatically on replacement).
- The contact form still prepares the message for e-mail or WhatsApp, as on the original site; it does not send anything by itself.
