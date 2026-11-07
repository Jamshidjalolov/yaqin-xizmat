Backend setup

1. Create virtual environment and activate it

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and set your database URL and secret key.
   For Telegram Mini App sign-in, set `TELEGRAM_BOT_TOKEN` to the same BotFather token used by `telegram-bot/.env`.

4. Run the app

```powershell
uvicorn app.main:app --reload --port 8000
```

## Deploy to Render

The repository root contains `render.yaml`. Push the project to a private GitHub repository, then create a Render Blueprint from that repository. Set the prompted `DATABASE_URL` to the existing Neon PostgreSQL connection string and `TELEGRAM_BOT_TOKEN` to the same BotFather token used by the bot. Render generates `SECRET_KEY` automatically; if you need existing JWTs to remain valid, replace the generated secret with the current `SECRET_KEY`.

After the service deploys, use its public `onrender.com` URL as `VITE_API_BASE_URL` in the Netlify site and as `API_BASE_URL` in `telegram-bot/.env`. The bot's `WEB_APP_URL` should be `https://yaqin-xizmat.netlify.app`.
