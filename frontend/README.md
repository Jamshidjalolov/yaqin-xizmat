Frontend setup (Vite + React + TypeScript)

1. Create a new Vite app:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

2. Install Bootstrap and Axios:

```bash
npm install bootstrap axios react-router-dom
```

3. Start dev server:

```bash
npm run dev
```

Implement login/register pages that call the backend API via Axios and store JWT in `localStorage`.
