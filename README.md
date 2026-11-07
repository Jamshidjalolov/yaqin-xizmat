yaqin xizmat — starter repo

This workspace contains a FastAPI backend and a Vite + React TypeScript frontend.

See `backend/README.md` and `frontend/README.md` for setup instructions.

The Telegram bot and Mini App setup is documented in [`telegram-bot/README.md`](telegram-bot/README.md).

## Free deployment

- The frontend is deployed at https://yaqin-xizmat.netlify.app.
- `render.yaml` configures the backend and Telegram webhook bot as free Render web services and reuses the existing Neon PostgreSQL database.
- Connect this repository to Render as a Blueprint and set the prompted database and bot secrets; Render generates a new JWT secret by default.
- After Render deploys, set the Netlify environment variable `VITE_API_BASE_URL` to the Render API URL and redeploy the frontend.
- Set `API_BASE_URL` in `telegram-bot/.env` to the same API URL and `WEB_APP_URL` to the Netlify URL.

The backend must be publicly deployed before the frontend or bot can use the shared database over the internet. Never commit `.env` files or database files.
