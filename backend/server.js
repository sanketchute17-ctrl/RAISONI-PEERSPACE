import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

const ai = new GoogleGenAI({});

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// 🧠 SIMPLE IN-MEMORY DATABASE (Hackathon Speed)
// ==========================================
let questions = [
  {
    id: 1,
    title: "How does Garbage Collection work in Java?",
    description: "Our professor mentioned this but I didn't get it fully.",
    tags: ["Java Programming", "General"],
    author: "Anonymous Student",
    isAnonymous: true,
    upvotes: 12,
    answers: [
      {
        id: 101,
        text: "Java uses a Mark-and-Sweep algorithm to automatically free memory. Unreachable objects get deleted.",
        author: "Rahul Sharma",
        isVerified: true
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "When is the next T&P Drive?",
    description: "Are there any companies coming next week?",
    tags: ["T&P Updates"],
    author: "Priya Singh",
    isAnonymous: false,
    upvotes: 5,
    answers: [],
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

// Simple Leaderboard Dummy Data
let users = [
  { name: "Rahul Sharma", points: 1420, rank: 1 },
  { name: "Priya Singh", points: 980, rank: 2 },
  { name: "Aman D.", points: 650, rank: 3 }
];

// ==========================================
// 🚀 BACKEND APIs
// ==========================================

// 1. GET /questions -> Fetch all questions
app.get('/api/questions', (req, res) => {
  // Sort questions by newest first
  const sortedQuestions = [...questions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: sortedQuestions });
});

// 2. POST /questions -> Ask a new question
app.post('/api/questions', (req, res) => {
  const { title, description, tags, author, isAnonymous } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, message: "Title is required!" });
  }

  const newQuestion = {
    id: Date.now(), // simple unique ID
    title,
    description: description || "",
    tags: tags || ["General"],
    author: isAnonymous ? "Anonymous Student" : (author || "Student"),
    isAnonymous: isAnonymous || false,
    upvotes: 0,
    answers: [],
    createdAt: new Date().toISOString()
  };

  questions.push(newQuestion);
  res.status(201).json({ success: true, data: newQuestion });
});

// 3. POST /answers -> Answer a specific question
app.post('/api/answers', (req, res) => {
  const { questionId, text, author } = req.body;

  if (!questionId || !text) {
    return res.status(400).json({ success: false, message: "Question ID and Answer Text are required!" });
  }

  const questionIndex = questions.findIndex(q => q.id === parseInt(questionId));
  if (questionIndex === -1) {
    return res.status(404).json({ success: false, message: "Question not found!" });
  }

  const newAnswer = {
    id: Date.now(),
    text,
    author: author || "Student",
    isVerified: false
  };

  questions[questionIndex].answers.push(newAnswer);
  res.status(201).json({ success: true, data: newAnswer });
});

// 4. POST /upvote -> Upvote a question
app.post('/api/upvote', (req, res) => {
  const { questionId, decrement } = req.body; // decrement flag if removing upvote

  const questionIndex = questions.findIndex(q => q.id === parseInt(questionId));
  if (questionIndex === -1) {
    return res.status(404).json({ success: false, message: "Question not found!" });
  }

  if (decrement) {
    questions[questionIndex].upvotes -= 1;
  } else {
    questions[questionIndex].upvotes += 1;
  }
  
  res.json({ success: true, points: questions[questionIndex].upvotes });
});

// 5. GET /leaderboard -> Fetch top users
app.get('/api/leaderboard', (req, res) => {
  res.json({ success: true, data: users });
});

// 5.b GET /subjects -> Fetch subjects based on branch
const branchSubjects = {
  CSE: ["Data Structures", "Operating Systems", "Java Programming", "Machine Learning", "Computer Networks"],
  IT: ["Web Development", "Cloud Computing", "Database Management", "Software Engineering", "Cyber Security"],
  MECH: ["Thermodynamics", "Fluid Mechanics", "Engineering Mechanics", "Machine Design", "AutoCAD"],
  CIVIL: ["Structural Analysis", "Geotechnical Engineering", "Fluid Mechanics", "Surveying", "Concrete Technology"],
  EXTC: ["Digital Electronics", "Signals & Systems", "Microprocessors", "Communication Systems"],
  AI: ["Artificial Intelligence", "Neural Networks", "Python Programming", "Deep Learning"],
  AIML: ["Machine Learning", "Deep Learning", "Data Mining", "Statistics", "Computer Vision"],
  DS: ["Data Science", "Big Data Analytics", "Data Visualization", "R Programming", "Predictive Modeling"],
  General: ["Aptitude", "Communication Skills", "T&P Updates", "General Campus"]
};

app.get('/api/subjects', (req, res) => {
  const { branch } = req.query;
  let subjects = branchSubjects.General;
  if (branch && branchSubjects[branch]) {
    subjects = [...new Set([...branchSubjects[branch], ...branchSubjects.General])];
  } else if (!branch || branch === 'All') {
    subjects = [...new Set(Object.values(branchSubjects).flat())];
  }
  res.json({ success: true, data: subjects });
});

// 6. POST /faculty-connect -> Advanced Mentorship Module
let guidanceRequests = [];
app.post('/api/faculty-connect', (req, res) => {
  const { category, subCategory, subject, facultyName, title, description, isAnonymous } = req.body;
  
  if (!category || !title) {
    return res.status(400).json({ success: false, message: "Category and Title are required!" });
  }

  const newRequest = {
    id: Date.now(),
    category,
    subCategory: subCategory || null,
    subject: subject || null,
    facultyName: facultyName || null,
    title,
    description: description || "",
    isAnonymous: isAnonymous || false,
    status: "Pending Advice",
    createdAt: new Date().toISOString()
  };

  guidanceRequests.push(newRequest);
  res.status(201).json({ success: true, data: newRequest, message: "Your request has been submitted successfully" });
});

// 6.b GET /faculty-requests -> Fetch all mentorship requests for faculty dashboard
app.get('/api/faculty-requests', (req, res) => {
  // Sort newest first
  const sortedRequests = [...guidanceRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: sortedRequests });
});

// 6.c PATCH /faculty-requests/:id -> Update request status (Accept/Decline/Advice)
app.patch('/api/faculty-requests/:id', (req, res) => {
  const { id } = req.params;
  const { status, facultyReply } = req.body;

  const requestIndex = guidanceRequests.findIndex(r => r.id === parseInt(id));
  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  if (status) guidanceRequests[requestIndex].status = status;
  if (facultyReply) guidanceRequests[requestIndex].facultyReply = facultyReply;
  
  res.json({ success: true, data: guidanceRequests[requestIndex] });
});

// 7. POST /ai-chat -> AI Assistant functionality
app.post('/api/ai-chat', async (req, res) => {
  const { message, examMode } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  try {
    const aiCodeInstructions = examMode 
      ? `You are an expert strict college professor AI for Raisoni College. Present your answer using bullet points, short clear definitions, and specifically format your content to be easily scannable "Short Answer (2-5 marks)" style. Use markdown bolding for key terms.`
      : `You are a friendly, witty, and deeply helpful AI study buddy for a college student. Use analogies and simple terms to explain complex concepts. Don't use overly academic language.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: aiCodeInstructions
      }
    });

    res.json({ success: true, aiMessage: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ success: false, message: "AI Backend failed to respond.", aiMessage: "There was a glitch in the AI matrix! Did you forget to set GEMINI_API_KEY in the backend .env file?" });
  }
});

// 8. POST /ai-translate -> Smart Vocabulary Translator
app.post('/api/ai-translate', async (req, res) => {
  const { word } = req.body;
  if (!word) { return res.status(400).json({ success: false, message: "Word is required" }); }

  try {
    const prompt = `Define the technical concept or word '${word}' strictly in the following JSON format:
    {
      "word": "${word}",
      "meaning": "A 1-2 sentence extremely simple meaning.",
      "explanation": "A slightly longer, student-friendly explanation using a fun real-world analogy.",
      "hindi": "A short Hindi translation / context of the meaning."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text);
    res.json({ success: true, translation: data });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ success: false, aiMessage: "AI Backend failed to translate. Check backend constraints." });
  }
});

// 9. POST /analyze-doubt -> Smart AI Enhancer & Duplicate Checker
app.post('/api/analyze-doubt', async (req, res) => {
  const { title, description, recentTitles } = req.body;
  
  if (!title) { return res.status(400).json({ success: false, message: "Title is required" }); }

  try {
    const prompt = `You are an AI assistant for a college study forum.
    Analyze this new question:
    Title: "${title}"
    Description: "${description || 'None'}"
    
    Here is a list of recent question titles already asked:
    [${(recentTitles || []).join(', ')}]
    
    Your tasks:
    1. Enhance the title to be clear, professional, and academic.
    2. Extract exactly 2 relevant technical tags/subjects.
    3. Check if the meaning/intent of the new question is severely similar to any of the recent questions (Semantic duplicate).
    
    Respond STRICTLY in this JSON format:
    {
      "enhancedTitle": "...",
      "suggestedTags": ["...", "..."],
      "isDuplicate": true/false,
      "duplicateOf": "exact string of the matching title from recent questions if duplicate, else empty string"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text);
    res.json({ success: true, analysis: data });
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ success: false, message: "AI Backend failed to analyze." });
  }
});

// 10. POST /api/user-insights -> Calculate User Metrics & AI Feedback
app.post('/api/user-insights', async (req, res) => {
  const { uid, userFullName, doubts } = req.body;
  if (!uid || !doubts) {
    return res.status(400).json({ success: false, message: "Missing uid or doubts" });
  }

  // Backend Calculations
  const questionsAsked = doubts.filter(d => d.authorId === uid).length;
  const upvotesReceived = doubts.filter(d => d.authorId === uid).reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
  const answersGiven = doubts.reduce((acc, cur) => acc + (cur.answers || []).filter(a => a.author === userFullName).length, 0);

  try {
    const prompt = `You are an encouraging college AI mentor. 
    A student named ${userFullName || 'Student'} has the following stats on the study platform:
    - Questions Asked: ${questionsAsked}
    - Upvotes Received: ${upvotesReceived}
    - Answers Given: ${answersGiven}
    
    Write a fun, single-sentence (max 15 words) personalized feedback for them. E.g., if they ask a lot but don't answer, encourage answering. If they have high upvotes, praise them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({
      success: true,
      data: {
        questionsAsked,
        upvotesReceived,
        answersGiven,
        aiFeedback: response.text.replace(/"/g, '')
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        questionsAsked,
        upvotesReceived,
        answersGiven,
        aiFeedback: "Keep up the great work on the campus platform!"
      }
    });
  }
});

// 11. POST /api/faculty-insights -> Calculate Faculty Metrics & AI Feedback
app.post('/api/faculty-insights', async (req, res) => {
  const { facultyName, requests, doubts } = req.body;
  if (!requests || !doubts) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  // Calculate Metrics
  const pendingRequests = requests.filter(r => r.status === 'Pending Advice' || r.status === 'Pending').length;
  const actionedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Solved' || r.status === 'Declined').length;
  
  // Faculty answers across campus doubts (simple estimation based on 'Professor' / verified flag or actual name)
  let doubtsAnswered = 0;
  doubts.forEach(d => {
    if (d.answers) {
      doubtsAnswered += d.answers.filter(a => a.isVerified || a.author.includes('Professor') || a.author === facultyName).length;
    }
  });

  try {
    const prompt = `You are a professional assistant evaluating a college professor. 
    The professor named ${facultyName || 'Professor'} has the following stats:
    - Pending Student Mentorship Requests: ${pendingRequests}
    - Mentorships Fully Actioned: ${actionedRequests}
    - Campus Doubts Answered: ${doubtsAnswered}
    
    Write a highly professional, encouraging 1-sentence (max 15 words) summary praising their dedication to student guidance, or nudging them respectfully to check pending requests if high.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({
      success: true,
      data: {
        pendingRequests,
        actionedRequests,
        doubtsAnswered,
        aiFeedback: response.text.replace(/"/g, '').trim()
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        pendingRequests,
        actionedRequests,
        doubtsAnswered,
        aiFeedback: "Thank you for your continuous dedication to guiding our students."
      }
    });
  }
});

// ==========================================
// 🏃‍♂️ START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Raisoni PeerSpace Backend running on http://localhost:${PORT}`);
});
