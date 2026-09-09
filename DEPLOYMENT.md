# Free deployment

The recommended free-tier layout is:

- **Frontend:** Vercel Static Site, with the Vercel project root set to `frontend`.
- **API:** Render Free Web Service, created from the included `render.yaml`.
- **Database:** Neon Free PostgreSQL. Use its pooled connection string as `DATABASE_URL`.
- **Redis:** optional Upstash Redis. Without it, the API sends email in-process; with it, BullMQ retries and persists jobs.
- **Email:** use an SMTP provider that permits free-tier SMTP/API sending. Render Free blocks outbound ports 25, 465, and 587, so use an HTTPS email API adapter or a provider supported through an allowed port if email is required in production.

## 1. Create the database

Create a Neon project and copy the pooled PostgreSQL URL. Keep `?sslmode=require` in the URL. Do not commit it.

## 2. Deploy the API on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml` and creates the free API service.
4. Set these values when prompted:
   - `DATABASE_URL`: Neon pooled URL
   - `FRONTEND_URL`: the final Vercel URL, for example `https://peoplepay360.vercel.app`
   - `CORS_ORIGIN`: the same Vercel URL; comma-separate preview/custom origins if needed
   - `REDIS_URL`: optional Upstash URL
5. `start:prod` runs `prisma migrate deploy` before starting the server.

The API health check is `https://<render-service>.onrender.com/health`.

## 3. Deploy the frontend on Vercel

1. Import the same repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Vercel detects Vite. The build command is `npm run build` and the output directory is `dist`.
4. Add `VITE_API_URL=https://<render-service>.onrender.com` for Production and Preview as appropriate.
5. Redeploy after saving the environment variable.

The included `frontend/vercel.json` preserves client-side routes such as `/dashboard` on refresh.

## Local production check

```text
cd backend
npm ci
npm run prisma:generate
npm run build

cd ../frontend
npm ci
npm run build
```

Free service caveats: Render Free services sleep when idle, local uploads are ephemeral, and the no-Redis email fallback is best-effort. For durable evidence files, add object storage later and replace `backend/src/utils/upload.ts` storage with an object-storage adapter.
