# ⚡ Bolt: AI Website Builder

Bolt is a full-stack AI-powered website builder that lets you generate, edit, preview, download, and deploy modern websites with a single prompt. The project is split into two main parts:

- [`backend`](backend/) — Node.js/Express API for AI generation and Netlify deployment
- [`frontend/website-maker`](frontend/website-maker/) — React + Vite web app for user interaction

---

## 🚀 Features

- **AI Website Generation:** Describe your website, and AI generates HTML, CSS, and JS.
- **Live Editing:** Edit the generated code in a beautiful, multi-tab editor.
- **Instant Preview:** See your changes live as you type.
- **Download as ZIP:** Download your site as a ready-to-use ZIP file.
- **One-click Deploy:** Deploy your site to Netlify with a single click.

---

## 🗂️ Project Structure

```
.
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   └── .netlify/
│       └── netlify.toml
└── frontend/
    └── website-maker/
        ├── package.json
        ├── index.html
        ├── src/
        │   ├── App.jsx
        │   ├── main.jsx
        │   └── ...
        └── ...
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm install -g netlify-cli`)
- OpenAI API key (for backend `.env`)

---

## ⚙️ Backend Setup (`backend/`)

1. **Install dependencies:**
   ```sh
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Create a `.env` file in `backend/`:
     ```
     OPENAI_API_KEY=sk-...
     ```
   - (Already present in your workspace.)

3. **Start the backend server:**
   ```sh
   npm start
   ```
   - Runs on [http://localhost:4000](http://localhost:4000)
   - Endpoints:
     - `POST /generate-site` — Generates website code from prompt
     - `POST /deploy` — Deploys generated site to Netlify

4. **Netlify Setup:**
   - Ensure your Netlify site ID and token are set in [`server.js`](backend/server.js).
   - Netlify CLI must be installed and authenticated (`netlify login`).

---

## 🎨 Frontend Setup (`frontend/website-maker/`)

1. **Install dependencies:**
   ```sh
   cd frontend/website-maker
   npm install
   ```

2. **Start the development server:**
   ```sh
   npm run dev
   ```
   - Runs on [http://localhost:5173](http://localhost:5173) (default Vite port)

3. **Usage Flow:**
   - Enter a prompt describing your desired website.
   - Click **"Build with AI"** to generate the site.
   - Edit HTML, CSS, or JS in the editor tabs.
   - Preview updates live.
   - Download your site as a ZIP or deploy it live to Netlify.

---

## 🌐 Full Workflow

1. **User enters a prompt** in the frontend.
2. **Frontend sends** the prompt to `POST /generate-site` on the backend.
3. **Backend calls OpenAI** to generate HTML, CSS, JS, and returns them as JSON.
4. **Frontend displays** the generated code and live preview.
5. **User can edit** the code, download as ZIP, or deploy live.
6. **Deploy:** Frontend sends files to `POST /deploy` on the backend, which uploads to Netlify and returns a live URL.

---

## 📝 Customization

- **AI Prompting:** Modify the system prompt in [`server.js`](backend/server.js) for different generation styles.
- **Deployment:** Update Netlify credentials in [`server.js`](backend/server.js) as needed.

---

## 🧑‍💻 Development Notes

- Frontend uses [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/).
- Backend uses [Express](https://expressjs.com/), [node-fetch](https://www.npmjs.com/package/node-fetch), and [dotenv](https://www.npmjs.com/package/dotenv).
- Ensure CORS is enabled for local development.

---

## 📦 Production

- Build frontend:  
  ```sh
  npm run build
  ```
- Serve static files or deploy as needed.

---

## 🛡️ Security

- **Never commit your `.env` or API keys** to public repositories.
- Restrict Netlify tokens and OpenAI keys.

---

## 📄 License

MIT

---

**Made with ⚡ by Gaurav**
