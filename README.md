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

Vite forwards `/api` and `/media` to the API on the `PORT` of your `.env` (or `API_URL` if set). If the terminal shows `[proxy] … ECONNREFUSED`, the API is not running: scroll up for the reason it stopped (`Configuration invalide` = missing `.env` / `MONGODB_URI`; `Démarrage impossible` = MongoDB unreachable or another startup error, printed with its stack trace). Projects with incomplete images in the database no longer stop the server: they are listed at startup with a warning, and opening them in the dashboard lets you add the missing images.

**Production** (one Node process serves the API, the uploaded images and the built site):

```bash
npm run build
NODE_ENV=production npm start      # http://localhost:4000
```

In production the session cookie is HTTPS-only. To try the production build locally over plain http, add `COOKIE_SECURE=false` to `.env`. Behind a host or reverse proxy (Render, Railway, Nginx…), set `TRUST_PROXY=1`.

On first start the server inserts the original five projects and two categories. Page texts come from the default content (the original wording) until they are edited in the dashboard.

## 4. Admin dashboard

Go to **/admin** and sign in.

- **Langue d’édition (FR / AR / EN)**: at the top of every page and of the project editor. Texts, image descriptions, project and category names are edited per language; the French text is shown as a reference under each Arabic or English field. Missing translations are counted on the language buttons and marked « À traduire »; saving a change that leaves new texts untranslated asks for confirmation. Images, list items (add / delete / order), links, colours and section layout are shared by the three languages.
- **Pages**: every page is split into its sections (hero, about, services, footer…). Each section has its own **Save** and **Cancel** buttons, an "unsaved changes" marker, and a **Restore original content** link. Common elements (navigation labels, footer, contact details, social links, 404 page) are under **Éléments communs**.
- **Text formatting**: in titles, a new line breaks the title like the original design; `*text*` gives italics, `**text**` bold, and a blank line starts a new paragraph. No HTML is ever interpreted.
- **Images**: every image shows a preview in the exact frame ratio used on the site. "Replace" opens the image picker: upload from the computer (drag and drop works), reuse an image from the library, or put back one of the original images. The new image is previewed in the form and only goes live after **Save**. Images are cropped to the frame (object-fit: cover), so the layout and proportions never change. Optional images (e.g. the detail image of the homepage About section) can be removed.
- **Projects & categories**: create, edit, reorder and delete projects; manage the card image, the opening image and the gallery (add, replace, reorder, remove). Categories can be added, renamed, reordered and deleted (a category that still contains projects is protected).
- **Media library**: all uploaded images, with size and dimensions. An image still used somewhere on the site cannot be deleted; the dashboard says where it is used.

Saved changes are visible on the public site immediately, with no rebuild or redeployment (see section 6).

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

## 6. Dashboard → website synchronisation

The database is the single source of truth: every text, image, link, menu entry, section, colour, font and SEO field shown on the public site comes from it (`GET /api/content?lang=fr|ar|en`). There is no copy of the content in the built site (the original texts only live in `shared/src/defaults.ts` and `translations.ts`, as the values used until something is saved).

- The content request is always revalidated (`Cache-Control: no-cache` + ETag): unchanged content costs a 304, a saved change is returned at once. Uploaded images get a new address on every upload, so a replaced image can never be served from an old cache.
- Open tabs of the site refresh their content as soon as the dashboard saves (same browser), when the visitor comes back to the tab, and every 30 seconds while visible.
- Pages are served by the Node server with their title, description, language, direction, hreflang links, colours and fonts already in the HTML (search engines and link previews see the saved content; unknown addresses answer 404).
- While the content loads a minimal screen is shown; if the API cannot be reached, a message offers to retry (and retries automatically). The site never silently shows old bundled texts.
- **Deployment**: the site must be served by this Node server (`npm start`), or by a proxy that forwards `/api` and `/media` to it. A static host serving only `client/dist` cannot read the database: that is the usual reason why "changes are saved but do not appear".

Editable in the dashboard, besides all texts: **Éléments communs › Identité** (name, logo, favicon), **Référencement commun** (share image), **Apparence** (7 colours, text and heading fonts for Latin and Arabic), **Navigation** (labels, order and visibility of the menu entries, the bar button), **Réseaux sociaux**, **Coordonnées**; on every page **Sections de la page** (order and visibility of the sections; the Formations preview of the homepage is hidden by default and can be shown again).

## 7. Languages (FR / AR / EN)

- Addresses: French keeps the original addresses (`/services`), Arabic and English are under `/ar/…` and `/en/…`. Every internal link keeps the current language.
- The switcher (navigation bar, mobile menu, footer) opens the same page in the other language and remembers the choice (`localStorage`): refreshing keeps the language, and a French address opened later redirects to the chosen language.
- Arabic switches the whole document to `dir="rtl"`: layout, menus, arrows, borders, hero image and form mirror (`client/src/styles/i18n.css`), with Arabic fonts (IBM Plex Sans Arabic / Noto Naskh Arabic by default, changeable in Apparence), no letter-spacing, capitals or italics on Arabic text; numbers, e-mail and phone stay left-to-right.
- Storage: every translatable value is `{ fr, ar, en }` in MongoDB (`shared/src/i18n.ts`). The API resolves one language and falls back to French for an empty translation, so no section is ever empty. Adding a field to `schema.ts` makes it translatable automatically (`i18n: false` for values identical in every language, such as the e-mail).
- Data saved by the previous French-only version is upgraded automatically: original texts receive their Arabic and English translations, edited texts keep their French and are flagged « À traduire ».
- Only the loading / server-error message is not in the dashboard (`client/src/i18n/uiStrings.ts`), since it is shown before any content exists. The dashboard itself stays in French.

## 8. Project structure

```
shared/src/
  schema.ts       content model: pages → sections → fields (drives the dashboard, the API validation and the types)
  defaults.ts     original wording of every text (French)
  translations.ts Arabic and English versions of the default content
  i18n.ts         languages, localized storage format, resolution, upgrade of old data, translation gaps
  theme.ts        colours and fonts → CSS variables / Google Fonts
  projects.ts     project and category types, original projects
  richtext.ts     safe *italic* / **bold** / line-break markup
server/src/
  index.ts        startup (database, initial data, first admin)
  app.ts          Express app: security headers, routes, built site, legacy redirects
  config.ts       environment variables (validated)
  models/         Mongoose models
  routes/         public API, authentication, admin API
  services/       content, projects, media (GridFS), validation (zod), seeding, seo (HTML per page)
  middleware/     sessions, CSRF guard, rate limiting, errors
  scripts/        seed, create-admin
server/test/      API integration tests (node:test)
scripts/e2e/      browser tests (Playwright): languages on every page, full dashboard workflow
client/src/
  pages/          Home, About, Services, Projects, ProjectDetail, Formations, Contact, NotFound
  components/     Nav, Footer, Frame, ProjectCard, EnquiryForm, ContactSection…
  hooks/          hero cursor reveal, section entrances, page titles
  content/        content provider (fetches /api/content per language, live refresh, theme)
  i18n/           localized links, language switcher, saved language
  admin/          dashboard (lazy-loaded, never sent to regular visitors)
  styles/         original style.css + additions
client/public/assets/img/   original images
```

## 9. API

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/content?lang=fr\|ar\|en` | public: all content, projects and categories in one language |
| GET | `/media/:id` | public: uploaded image |
| POST | `/api/auth/login`, `/api/auth/logout` · GET `/api/auth/me` | session |
| GET · PUT · DELETE | `/api/admin/content[/:page/:section]` | admin |
| GET · POST · PUT · DELETE | `/api/admin/projects[/:id]`, PUT `/api/admin/projects/order` | admin |
| GET · POST · PUT · DELETE | `/api/admin/categories[/:id]`, PUT `/api/admin/categories/order` | admin |
| GET · POST · DELETE | `/api/admin/media[/:id]` | admin |

## 10. Security

- Passwords hashed with scrypt; sessions are random tokens stored hashed in MongoDB, expire automatically, and travel in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` in production).
- Every state-changing request needs a custom header and a matching `Origin` (CSRF protection); login attempts are rate-limited per IP.
- All input is validated server-side (zod) against the content model: unknown fields, empty required texts, external image addresses and unsafe links (`javascript:`) are refused.
- Uploads: JPG, PNG, WebP, AVIF or GIF only, checked from the file content (not the declared type), size-limited (`MAX_UPLOAD_MB`). SVG uploads are refused.
- Helmet security headers with a strict Content-Security-Policy; texts are rendered as text, never as HTML.

## 11. Checks

```bash
npm run typecheck     # strict TypeScript, all workspaces
npm test              # API tests; uses MONGODB_TEST_URI or "<your database>_test", dropped after the run
npm run build
```

Browser tests (need `npm i -D playwright && npx playwright install chromium`, and a running server): `node scripts/e2e/lang.mjs` checks the three languages on every page; `node scripts/e2e/admin.mjs` runs the whole dashboard workflow and **changes the content**, so run it on a test database only.

## 12. Still to provide (unchanged from the static site)

- Real project photos and renders (the current project visuals are marked "Image de démonstration" until they are replaced from the dashboard; the tag disappears automatically on replacement).
- The contact form still prepares the message for e-mail or WhatsApp, as on the original site; it does not send anything by itself.
