# Triad Studio

Triad Studio is a React storefront and content management system for a Nairobi
creative studio. The public site presents branding, print, digital design, and
branded merchandise services. The authenticated admin area manages storefront
content, catalog data, page layouts, theme settings, projects, services, social
links, and inbound leads.

## Features

### Storefront

- CMS-driven homepage with configurable block order and visibility.
- Product catalog with categories, product detail pages, pricing, stock, and
  WhatsApp enquiry actions.
- Solutions, about, contact, project, and category pages.
- Editable site navigation, SEO metadata, footer content, branding, contact
  details, and social links.
- Supabase Realtime refreshes selected storefront and admin data.

### Admin CMS

- Page Builder with draft, preview, publish, revisions, restore, and saved
  sections.
- Site Settings and Page Sections management.
- Catalog, Work, Services, and Socials management.
- WhatsApp Leads and form lead dashboards.
- Supabase Auth-protected admin routes with role and capability checks.
- Supabase Storage support for site assets, product media, and profile avatars.

## Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite 8
- Tailwind CSS 4 and Radix UI primitives
- TanStack Query, React Hook Form, Zod, and Lucide React
- Supabase PostgreSQL, Auth, Storage, Realtime, and Row Level Security

## Requirements

- Node.js 18 or newer
- npm 10 or newer, or Bun
- Docker Desktop, if running the local Supabase stack
- A Supabase project for hosted development, or the Supabase CLI for local
  development

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

   The repository also includes `bun.lock` for Bun-based workflows.

2. Create local environment variables:

   ```bash
   cp .env.example .env
   ```

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.
   `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are also supported for SSR
   environments. Admin user invites and role management additionally require
   the server-only `SUPABASE_SECRET_KEY` (preferred) or
   `SUPABASE_SERVICE_ROLE_KEY`. Never put a privileged key in a `VITE_` variable
   or expose it to the browser.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` unless Vite reports another available port.

## Local Supabase

The project uses imperative migrations in `supabase/migrations/` and the local
project configuration in `supabase/config.toml`.

```bash
supabase start
supabase db reset
npm run dev
```

`supabase db reset` recreates the local database and applies all committed
migrations. Use `supabase db push` to apply pending migrations to a linked
remote project. Inspect the local service URLs and keys with:

```bash
supabase status
```

The local Supabase Studio runs on the port configured in `supabase/config.toml`.
Authentication, Storage, Realtime, and the database must be available for the
full storefront and admin experience.

## Routes

Public and authentication routes are documented in
[`src/routes/README.md`](src/routes/README.md). The main admin area is under
`/admin` and requires an authenticated user with the appropriate admin access.

## End-to-end smoke tests

This project includes a Playwright smoke suite covering the public storefront and
inner pages. Run the browser-based checks after local changes to ensure the major
routes still mount and render correctly.

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

The suite exercises key public routes including `/`, `/about`, `/solutions`,
`/shop`, `/contact`, and `/category/apparel`, and includes assertions for page
content, contact links, and the product catalog filter flow.

## Scripts

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Vite/TanStack Start development server |
| `npm run build`     | Create a production build                        |
| `npm run build:dev` | Create a development-mode build                  |
| `npm run preview`   | Serve the production build locally               |
| `npm run lint`      | Run ESLint across the repository                 |
| `npm run format`    | Format supported files with Prettier             |

Run the main checks before opening a pull request:

```bash
npm run lint
npm run build
```

## Project structure

```text
src/
   components/       Shared storefront, landing, admin, and UI components
   integrations/     Supabase client, auth, and generated database types
   lib/              CMS, storefront, authorization, cart, and server functions
   routes/           TanStack file-based routes
   router.tsx        Router construction and QueryClient context
   server.ts         TanStack Start server entry and error handling
   start.ts          Server and CSRF middleware
supabase/
   migrations/       Ordered database migrations
   config.toml       Local Supabase service configuration
```

`src/routeTree.gen.ts` is generated by TanStack Router. Do not edit it by hand.

## Deployment notes

Build with `npm run build` and deploy the generated TanStack Start output using
the hosting adapter supported by the current Vite/TanStack Start setup. Configure
the Supabase URL and publishable key in the hosting provider's environment
settings, then configure the Supabase Auth site URL and redirect allow-list for
the deployed origin.

Before production deployment, verify that admin authorization, Storage policies,
database RLS policies, Auth redirects, and Realtime subscriptions are configured
for the target Supabase project.
