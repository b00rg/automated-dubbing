# Handoff

You can take a look at the DB schema in `src/db/schema.ts`

# Webapp

This repo will contain the Next.js project that will provide the UI for users to interact with our video translating service.

# Running this project

## Prerequisites

- Node.js (Look up how to install this)
- Docker + Docker Compose (Also look this up or ask somebody for help)

## 0) Install pnpm

If you don’t have pnpm installed yet:

```bash
npm install -g pnpm
```

## 1) Install dependencies

From the repo root:

```bash
pnpm install
```

## 2) Start the database (Docker) (If you don't have a DB running already)

(Hopefully you won't need to do this soon)
Start the services defined in `docker-compose.yml`:

```bash
docker compose up -d --build
```

## 3) Configure environment variables

Create a `.env` file in the repo root. Look at `.env.example`

~~(You can use the values from the discord server)~~

## 4) Push the database schema

With Docker running and your `.env` configured:

```bash
pnpm db:generate
pnpm db:migrate
```

## 5) Run the app

Start the Next.js dev server:

```bash
pnpm dev
```

If everything is configured correctly, the app should be available at the URL printed in the terminal (commonly `http://localhost:3000`).

# Style

The project is using shadcn for components and tailwind for styling.
I recommend you use the components from https://ui.shadcn.com/docs/components wherever possible.
You can install a component by running `pnpm dlx shadcn@latest add component_name`, they have examples of this under every component on the site.

# Contributors

- Sam Walsh
- Stephen Harpur
- Bobbi Beattie
- Omar Abdalla
