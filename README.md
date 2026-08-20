# 🎓 Raisoni PeerSpace

> **The Next-Gen Campus Collaboration & AI Learning Platform for Raisoni College**

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28.svg)](https://firebase.google.com/)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70B-f97316.svg)](https://groq.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000.svg)](https://vercel.com/)

---

## 🌟 What is Raisoni PeerSpace?

**Raisoni PeerSpace** is a unified digital campus platform built for college students and faculty. It bridges the gap between academic doubts, peer collaboration, faculty mentorship, and AI-powered study assistance — all in one clean, easy-to-use application.

Whether a student is confused by a complex Java concept, wants an anonymous opinion on a syllabus topic, or needs direct mentorship from a professor, **PeerSpace makes campus learning interactive, fast, and accessible 24/7.**

---

## 🚀 Why Colleges Should Adopt PeerSpace (Key Advantages)

### 💡 For Students
- **Instant 24/7 AI Assistance**: Ask complex technical doubts anytime with PeerSpace AI and get instant simplified explanations.
- **Judgement-Free Learning**: Ask questions anonymously using **Ghost Protocol** without fear of being judged by peers.
- **Smart Peer Study Feed**: View top-voted syllabus questions, answer peers, and earn **XP Points** to climb the Campus Leaderboard.
- **Direct Faculty Access**: Submit career or subject mentorship requests directly to relevant faculty members.

### 👩‍🏫 For Faculty & Professors
- **Streamlined Mentorship Inbox**: Review, approve, or decline student guidance requests in an organized dashboard.
- **Campus Doubt Moderation**: Verify student answers and provide authoritative academic guidance.
- **Faculty Analytics**: Track engagement metrics, pending advice count, and student interaction trends.

### 🏫 For College Management
- **Boosts Academic Performance**: Encourages continuous peer learning and quick doubt resolution.
- **Digital Records & Insights**: Replaces unorganized WhatsApp groups with a structured campus platform.
- **Modern Campus Branding**: Positions the institution at the forefront of AI-driven education technology.

---

## 🔥 Features Overview

| Feature | Description |
| :--- | :--- |
| 💬 **Campus Doubts Feed** | Real-time question feed with tags, attachments, upvotes, and voice search. |
| 👻 **Ghost Protocol** | Option to ask or answer doubts 100% anonymously for hesitant students. |
| 🤖 **PeerSpace AI Assistant** | AI-powered Exam Assistant & Technical Vocabulary Translator (Groq Llama 3.3 70B & Gemini). |
| 🛡️ **Expert Mentorship** | Student-to-Faculty request channel for subject, career, and research advice. |
| 📊 **Interactive Insights** | Recharts analytics graphs showing monthly interaction trends and XP rank progression. |
| 📱 **Full Mobile Responsive** | Optimized for phones, tablets, and Mobile Chrome Desktop Mode. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router
- **Backend API**: Node.js, Express.js, CORS
- **Database & Auth**: Firebase Auth, Firestore Database, Firebase Storage
- **AI Engines**: Groq API (`llama-3.3-70b-versatile`), Google Gemini AI (`gemini-2.0-flash`)
- **Deployment**: Vercel (Serverless Functions & Static Hosting)

---

## 🔑 Environment Variables & API Key Setup

Create a `.env` file in the root folder for local development:

```env
# API Base URL (Leave empty in production on Vercel)
VITE_API_BASE_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id

# AI API Key (Set in Vercel Environment Variables for production)
GROQ_API_KEY=your_groq_api_key_starting_with_gsk_
```

---

## 💻 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/sanketchute17-ctrl/RAISONI-PEERSPACE.git
cd RAISONI-PEERSPACE
```

### 2. Install Frontend & Backend Dependencies
```bash
# Install frontend packages
npm install

# Install backend packages
cd backend
npm install
cd ..
```

### 3. Start Local Development Servers
Open **two terminals**:

- **Terminal 1 (Backend Server)**:
  ```bash
  cd backend
  npm run dev
  ```
  *(Runs backend API on `http://localhost:5000`)*

- **Terminal 2 (Frontend App)**:
  ```bash
  npm run dev
  ```
  *(Runs Vite frontend on `http://localhost:5173`)*

---

## 🌐 Deploying on Vercel

1. Push your code to GitHub.
2. Import your repository into [Vercel](https://vercel.com).
3. Under **Settings > Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq API key (`gsk_...`)
   - Firebase variables (optional, fallback defaults are included).
4. Click **Deploy**. Vercel will automatically build the React frontend and Express API routes.

---

## 📜 License & Copyright

Created for **G H Raisoni College of Engineering and Management**. All rights reserved.
