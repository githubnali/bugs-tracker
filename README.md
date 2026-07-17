# Bug Tracker

A responsive, role-aware bug management application for QA and developer teams. Its interface is deliberately minimal: warm vanilla surfaces, burnt-orange actions, and compact, readable issue data.

## Tech stack

React 19, Vite, TypeScript, React Router, Tailwind CSS v4, React Hook Form, Axios, Recharts, Node.js, Express, Prisma, SQLite, Multer, and JWT authentication.

## Installation and running

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open `http://localhost:5173`. The API runs on port 4000. All four seeded users share the password `bugtracker123`:

- QA: Vinith, Sai Teja
- Developer: Nagaraju, Suraj

## Prisma commands

```bash
npx prisma studio
npx prisma generate
npx prisma migrate dev --name meaningful_change
npm run prisma:seed
```

## Features

- JWT login and protected QA/developer views
- Complete Open → Assigned → In Progress → Review → Closed workflow, including QA rejection
- Bug creation, validation, developer assignment, screenshot upload, comments, immutable activity history, and in-app notifications
- Debounced search, filters, sorting-ready API, pagination, sticky responsive table, bug detail drawer, image preview, CSV export, dark mode, charts, and mobile navigation
- Seeded users and realistic sample bugs

## Folder structure

```
src/                 React application, pages, components, styling
server/src/          Express REST API, authentication, uploads
prisma/              Prisma schema and deterministic seed data
uploads/             Runtime screenshot uploads (created automatically)
```

## Deployment

For Render, set `DATABASE_URL`, `JWT_SECRET`, `PORT`, and `CLIENT_URL`; use `npm run build` for the build command and `npm run start` to run the service. SQLite is appropriate for a persistent Render disk, although production teams commonly switch the Prisma datasource to PostgreSQL.

For Netlify, deploy the Vite build output (`dist`) and set a proxy/rewrite from `/api/*` to the Render API URL. Set `VITE_API_URL` and update the Axios base URL if the frontend and API are hosted on different origins.

## Future improvements

Email notifications, organization-level SSO, PostgreSQL for multi-instance hosting, saved filter views, and audit exports can be added without changing the core workflow.
