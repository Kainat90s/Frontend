# ByteSlot Frontend

A modern scheduling UI for ByteSlot with role-based dashboards, booking flows, and public appointment booking. Built with React + Vite + Tailwind and designed around a glassmorphism UI system.

## Overview
ByteSlot Frontend provides three primary experiences:
- **Admin**: manage availability, view and update bookings, configure scheduling settings, and connect Google integration.
- **Client/User**: view upcoming meetings, book new appointments, and manage personal bookings.
- **Public booking**: a shareable booking page for visitors without an account.

## Features
- Role-based routing with protected admin and client dashboards
- JWT auth with refresh token handling (auto refresh on 401)
- Availability management with bulk day deletion
- Bookings management: filter/search, status updates, pagination
- Client booking flow with duration refinement and meeting type selection
- Google OAuth entry points and connection status
- Admin settings for scheduling and SMTP notifications
- Polished glassmorphism UI + custom Tailwind design system

## Tech Stack
- **React 18** + **React Router v6**
- **Vite 5** (dev server + build tool)
- **Tailwind CSS** (custom theme + utilities)
- **Axios** (API client + interceptors)
- **react-hot-toast** (notifications)
- **react-icons** (iconography)

## Local Setup
Requirements:
- **Node.js 18+** (recommended for Vite 5)

Install and run:
```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:8000` (see `vite.config.js`).

## Build
```bash
npm run build
npm run preview
```

## Configuration Notes
- API base URL is `/api` via `src/api/axios.js`.
- Dev proxy for `/api` is defined in `vite.config.js`.
- Password reset pages currently call a hardcoded backend URL (`http://localhost:8000`):
  - `src/pages/ForgotPasswordPage.jsx`
  - `src/pages/ResetPasswordConfirm.jsx`
  Update these if your backend host differs.
- Auth tokens and user data are stored in `localStorage` under `tokens` and `user`.

## Routes
Public:
- `/login`
- `/forgot-password`
- `/password-reset-confirm/:uid/:token`
- `/book` (public booking page)

Admin:
- `/admin/dashboard`
- `/admin/availability`
- `/admin/bookings`
- `/admin/book` (book for client)
- `/admin/settings`

Client/User:
- `/user/dashboard`
- `/user/book`
- `/user/my-bookings`

Root:
- `/` and `*` redirect based on user role

## Project Structure
- `src/App.jsx` — routing and role guards
- `src/main.jsx` — app bootstrap, router, toast config
- `src/api/axios.js` — API client and JWT refresh logic
- `src/context/AuthContext.jsx` — auth state and actions
- `src/components/` — layouts and sidebars
- `src/pages/` — auth, admin, and public booking screens
- `src/pages/user/` — client dashboard and booking flows
- `src/index.css` — Tailwind base + custom UI utilities

## API Endpoints Used (from frontend code)
Auth and profile:
- `POST /accounts/login/`
- `POST /accounts/register/`
- `POST /accounts/register/otp/request/`
- `GET /accounts/profile/`
- `PUT /accounts/profile/`
- `POST /accounts/profile/change-password/`
- `POST /accounts/password-reset/`
- `POST /accounts/password-reset-confirm/:uid/:token/`
- `POST /accounts/token/refresh/`

Availability:
- `GET /availability/slots/`
- `GET /availability/admin/slots/`
- `POST /availability/admin/slots/`
- `DELETE /availability/admin/slots/:id/`
- `DELETE /availability/admin/slots/bulk-delete/:date/`

Bookings:
- `GET /bookings/`
- `POST /bookings/create/`
- `POST /bookings/:id/update-status/`
- `POST /bookings/:id/cancel/`
- `GET /bookings/my/`

Core and integrations:
- `GET /core/dashboard/`
- `GET /core/settings/`
- `PUT /core/settings/`
- `GET /integrations/google/status/`
- `GET /integrations/google/auth/`
- `POST /integrations/google/disconnect/`
- `GET /integrations/google/login/`

## UI System
Custom utilities live in `src/index.css`:
- `glass-card`, `glass-card-hover`
- `btn-primary`, `btn-secondary`, `btn-danger`
- `input-field`, `stat-card`, `badge-*`

Tailwind theme extensions are in `tailwind.config.js` (custom `primary` and `surface` palettes, animations, shadows).

## Notes for Backend Integration
- The frontend expects JWT access/refresh tokens and a `/accounts/profile/` endpoint.
- Booking statuses: `pending`, `confirmed`, `cancelled`.
- Meeting types: `video`, `phone`, `in_person`.

## License
Private project — no license specified.
