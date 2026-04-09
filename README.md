# RAISONI-PEERSPACE

## Project Description

Raisoni PeerSpace is a React + Vite frontend application with an Express backend. Ye project ek campus community platform banane ke liye hai jahan students, faculty, aur admin alag-alag services use kar sakte hain.

## What is included

- Frontend: React, Vite, React Router, Firebase, Tailwind-style CSS setup
- Backend: Express, CORS, dotenv, Google Gemini AI integration via `@google/genai`
- Dev tools: ESLint, Nodemon, Vite development server

## Run commands

### 1. Frontend setup

```bash
cd "C:\Users\madha\OneDrive\Desktop\Raisoni PeerSpace"
npm install
npm run dev
```

- `npm install` - install frontend dependencies
- `npm run dev` - locally frontend server start karega
- `npm run build` - production build banaega
- `npm run preview` - build preview dekhega
- `npm run lint` - code linting check karega

### 2. Backend setup

```bash
cd "C:\Users\madha\OneDrive\Desktop\Raisoni PeerSpace\backend"
npm install
npm run dev
```

- `npm install` - backend dependencies install karega
- `npm run dev` - backend ko `nodemon server.js` se run karega (auto restart)
- `npm start` - backend ko normal `node server.js` se run karega

### 3. Environment variables

Backend ke liye ek `.env` file create karein:

```env
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
```

> Note: `backend/.env` `.gitignore` me already ignore ho raha hai, isliye secret keys GitHub pe push nahi hongi.

## Used Technologies / Jo use kiya gaya

- React 18
- Vite
- React Router DOM
- Firebase
- Express
- Node.js
- Nodemon
- ESLint
- Tailwind-style CSS / custom CSS
- Google Gemini AI SDK (`@google/genai`)
- CORS
- dotenv

## Folder structure

- `src/` - frontend components, pages, CSS, assets
- `backend/` - Express server, environment settings
- `public/` - static files
- `package.json` - frontend scripts and dependencies
- `backend/package.json` - backend scripts and dependencies

## Future scope / Possible improvements

1. Authentication system add karna (Firebase Auth ya custom login)
2. User profile pages aur role-based access (student, faculty, admin)
3. Real-time chat / notifications support
4. Database integration (Firebase Firestore, MongoDB, ya SQL)
5. Search aur filter features for doubts, posts, lost and found
6. File upload support (images, documents)
7. Better mobile responsiveness aur UI improvements
8. Admin dashboard for moderation and user management
9. Deployment on Netlify/Vercel (frontend) aur Heroku/Render (backend)
10. Unit tests aur integration tests add karna

## GitHub repository

`https://github.com/sanketchute17-ctrl/RAISONI-PEERSPACE.git`


#RUN COMMANDS
on first terminal :cd backend
and then open new terminal : npm run dev
## Notes

- `.gitignore` already configured to ignore `node_modules`, `dist`, `.vscode`, aur environment files
- Agar backend se AI responses use karni hai to correct `GEMINI_API_KEY` set karna zaroori hai
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
