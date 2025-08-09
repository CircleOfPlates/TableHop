# TableHop Monorepo

Dev quickstart:

1. Copy envs for API: create `apps/api/.env` with at least:

```
NODE_ENV=development
PORT=4000
SESSION_SECRET=dev-secret-change
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tablehop
```

2. Start services (or use local Postgres):

```
npm run db:up
```

3. Push schema:

```
npm run db:push -w apps/api
```

4. Start dev servers:

```
npm run dev
```


