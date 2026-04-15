# Malta POS System

A full restaurant Point of Sale system built with React + Tailwind CSS.

## Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) — plug in your keys to activate
- **Languages**: English, Maltese, Italian

## Roles
Super Admin → Admin → Owner → Manager → Cashier → Supervisor → Waiter → Kitchen Cook → Supplier

---

## How to Run

### Requirements
- Node.js v18+ → download from https://nodejs.org
- VS Code → download from https://code.visualstudio.com

### Steps

1. Open VS Code
2. Open the `malta-pos` folder: File → Open Folder
3. Open Terminal in VS Code: View → Terminal  (or Ctrl + `)
4. Install dependencies:
   ```
   npm install
   ```
5. Start the dev server:
   ```
   npm run dev
   ```
6. Open your browser at: http://localhost:5173

---

## Connect to Supabase (when ready)

1. Create a `.env` file in the root folder
2. Add your keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart the dev server: `npm run dev`
4. The app will auto-create all tables on first run

---

## Default Login Credentials

| Role        | Username    | Password    |
|-------------|-------------|-------------|
| Super Admin | superadmin  | Admin@1234  |
| Admin       | admin       | Admin@1234  |
| Owner       | owner       | Admin@1234  |
| Manager     | manager     | Admin@1234  |
| Cashier     | cashier     | Admin@1234  |
| Waiter      | waiter      | Admin@1234  |
| Cook        | cook        | Admin@1234  |
| Supplier    | supplier    | Admin@1234  |

---

## Project Structure

```
malta-pos/
├── src/
│   ├── components/
│   │   └── UI.jsx          ← Reusable components (Button, Card, Table...)
│   ├── context/
│   │   └── AppContext.jsx   ← Auth, theme, language state
│   ├── i18n/
│   │   └── translations.js  ← EN, MT, IT translations
│   ├── lib/
│   │   ├── supabase.js      ← Supabase client + DB setup SQL
│   │   └── mockData.js      ← Demo data (replace with Supabase queries)
│   ├── pages/
│   │   ├── Dashboard.jsx    ← All page components
│   │   ├── Layout.jsx       ← Sidebar + topbar shell
│   │   └── Login.jsx        ← Login screen
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                     ← Your Supabase keys (create this)
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Build for Production

```
npm run build
```
Output goes to `dist/` folder — deploy to Vercel, Netlify, or any web host.

## Deploy to Vercel (free)
1. Go to https://vercel.com
2. Connect your GitHub repo
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy — get a live URL!
