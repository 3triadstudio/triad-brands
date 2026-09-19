# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` because those are Next.js and Remix conventions. The only root
layout is `src/routes/__root.tsx`.

## Conventions

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

## Application routes

| File                                | URL               | Access                                   |
| ----------------------------------- | ----------------- | ---------------------------------------- |
| `index.tsx`                         | `/`               | Public storefront homepage               |
| `shop.index.tsx`                    | `/shop`           | Public product catalog                   |
| `product.$id.tsx`                   | `/product/:id`    | Public product detail                    |
| `category.$slug.tsx`                | `/category/:slug` | Public catalog category                  |
| `solutions.tsx`                     | `/solutions`      | Public solutions page                    |
| `about.tsx`                         | `/about`          | Public studio and work page              |
| `work.$slug.tsx`                    | `/work/:slug`     | Public project detail                    |
| `contact.tsx`                       | `/contact`        | Public contact and lead capture          |
| `login.tsx`                         | `/login`          | Login screen                             |
| `auth.tsx`                          | `/auth`           | Authentication callback and session flow |
| `_authenticated/admin.tsx`          | `/admin`          | Authenticated admin shell                |
| `_authenticated/admin.builder.tsx`  | `/admin/builder`  | Builder: pages, sections, collections    |
| `_authenticated/admin.catalog.tsx`  | `/admin/catalog`  | Catalog management                       |
| `_authenticated/admin.projects.tsx` | `/admin/projects` | Work/project management                  |
| `_authenticated/admin.services.tsx` | `/admin/services` | Services management                      |
| `_authenticated/admin.sections.tsx` | `/admin/sections` | Compatibility redirect to Builder        |
| `_authenticated/admin.theme.tsx`    | `/admin/theme`    | Theme and site settings                  |
| `_authenticated/admin.socials.tsx`  | `/admin/socials`  | Social link management                   |
| `_authenticated/admin.whatsapp.tsx` | `/admin/whatsapp` | WhatsApp lead inbox                      |
| `_authenticated/admin.users.tsx`    | `/admin/users`    | Admin user management                    |

The `_authenticated/route.tsx` file provides the authenticated route boundary.
The `admin.tsx` route provides the admin shell and navigation for its child
routes. Keep the leading underscore on `_authenticated` because it is a pathless
layout segment.

## CMS conventions

The homepage and editable pages may render published documents from Supabase.
When no published document is available, the route falls back to the local
component blocks. Page Builder changes should be made through the admin UI or
the page editor helpers in `src/lib/page-editor.ts`.

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
