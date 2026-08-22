import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();

// Dynamic GenAI client loader: attempt to load official package if available,
// otherwise provide a lightweight fallback so the server runs without the package.
let genAI;
const initGenAI = async () => {
  try {
    const mod = await import('@google/genai');
    const { GoogleGenAI } = mod;
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Google GenAI client loaded');
  } catch (e) {
    console.warn('Google GenAI package not installed or failed to load. Using fallback generator.');
    genAI = {
      models: {
        generateContent: async (opts) => {
          const userMessage = (opts.contents && opts.contents[0] && opts.contents[0].parts && opts.contents[0].parts[0].text) || 'Hello';
          return {
            content: {
              parts: [{ text: `Fallback AI: I received your message: ${userMessage}` }]
            }
          };
        }
      }
    };
  }
};

initGenAI();

// Helper function to query AI (Groq API primary, Gemini secondary fallback)
const callAI = async ({ systemPrompt, userPrompt }) => {
  let debugLog = [];
  const rawKey = process.env.GROQ_API_KEY || 
                 process.env.GROK_API_KEY || 
                 process.env.GROQ_KEY || 
                 process.env.VITE_GROQ_API_KEY || 
                 process.env.VITE_GROK_API_KEY;

  const groqKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : null;

  if (groqKey && !groqKey.includes('YOUR_')) {
    try {
      // Step 1: Query Groq /v1/models to verify key & get active model IDs
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${groqKey}` }
      });
      const modelsData = await modelsRes.json();

      if (modelsRes.status === 401 || modelsRes.status === 403 || modelsData.error) {
        debugLog.push(`Groq Key Error (${modelsRes.status}): ${modelsData.error?.message || 'Invalid API Key'}`);
      } else if (modelsData.data && modelsData.data.length > 0) {
        // Filter out non-chat models (like whisper, guard)
        const availableModelIds = modelsData.data
          .map(m => m.id)
          .filter(id => !id.includes('whisper') && !id.includes('safetensors') && !id.includes('vision') && !id.includes('guard'));

        const preferredList = [
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant',
          'llama3-70b-8192',
          'llama3-8b-8192',
          'gemma2-9b-it',
          ...availableModelIds
        ];

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });

        const tried = new Set();
        for (const model of preferredList) {
          if (!model || tried.has(model)) continue;
          tried.add(model);

          try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ model, messages })
            });
            const data = await res.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
              return { text: data.choices[0].message.content };
            }
            if (data.error) {
              debugLog.push(`${model}: ${data.error.message || 'Error'}`);
            }
          } catch (e) {
            debugLog.push(`${model}: ${e.message}`);
          }
        }
      } else {
        debugLog.push("Groq returned empty models list.");
      }
    } catch (err) {
      debugLog.push(`Groq fetch exception: ${err.message}`);
    }
  } else {
    debugLog.push("No GROQ_API_KEY or GROK_API_KEY environment variable detected on Vercel.");
  }

  // Gemini Fallback
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (genAI && genAI.models && genAI.models.generateContent && geminiKey) {
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser Question: ${userPrompt}` : userPrompt;
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
      });
      const text = response.content?.parts?.map(p => p.text).join('');
      if (text) return { text };
    } catch (e) {
      debugLog.push(`Gemini: ${e.message}`);
    }
  }

  return { text: null, errorDetail: debugLog.join(' | ') };
};

// Configure CORS to allow origins from env, vercel domains, or dev URLs
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') || 
      origin.endsWith('.vercel.app') || 
      (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',').includes(origin))
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all origins for API calls
  }
}));

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

app.post('/api/ai-chat', async (req, res) => {
  const { message, examMode } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  const systemPrompt = examMode 
    ? `You are an expert strict college professor AI for Raisoni College. Present your answer using bullet points, short clear definitions, and specifically format your content to be easily scannable "Short Answer (2-5 marks)" style. Use markdown bolding for key terms.`
    : `You are a friendly, witty, and deeply helpful AI study buddy for a college student at Raisoni College. Use analogies and simple terms to explain complex concepts. Don't use overly academic language.`;

  const aiResult = await callAI({ systemPrompt, userPrompt: message });

  if (aiResult && aiResult.text) {
    return res.json({ success: true, aiMessage: aiResult.text });
  }

  const errorReason = aiResult?.errorDetail ? `\n\n*(Diagnostics: ${aiResult.errorDetail})*` : '';

  // Fallback response - provide helpful content even if API fails
  const fallbackMessage = `I'm experiencing a temporary connection issue, but I'm still here to help! ${errorReason}

**Your Question:** "${message.substring(0, 100)}..."

Please try one of these:
1. Rephrase your question more clearly
2. Break it into smaller parts
3. Try again in a few moments`;

  res.json({ 
    success: true, 
    aiMessage: fallbackMessage,
    isUsingFallback: true 
  });
});

// 8. POST /ai-translate -> Smart Vocabulary Translator
app.post('/api/ai-translate', async (req, res) => {
  const { word } = req.body;
  if (!word) { return res.status(400).json({ success: false, message: "Word is required" }); }

  const prompt = `Define the technical concept or word '${word}' strictly in the following JSON format without any markdown backticks:
  {
    "word": "${word}",
    "meaning": "A 1-2 sentence extremely simple meaning.",
    "explanation": "A slightly longer, student-friendly explanation using a fun real-world analogy.",
    "hindi": "A short Hindi translation / context of the meaning."
  }`;

  const text = await callAI({ userPrompt: prompt });
  if (text) {
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ success: true, translation: parsed });
    } catch (e) {}
  }

  // Fallback translation response
  const fallbackTranslation = {
    word: word,
    meaning: "A technical term used in academic or professional contexts.",
    explanation: "This term refers to a specific concept in your field of study. Try searching for more context in your textbooks or course materials.",
    hindi: "यह एक तकनीकी शब्द है।",
    isUsingFallback: true
  };
  res.json({ success: true, translation: fallbackTranslation });
});

// 9. POST /analyze-doubt -> Smart AI Enhancer & Duplicate Checker
app.post('/api/analyze-doubt', async (req, res) => {
  const { title, description, recentTitles } = req.body;
  
  if (!title) { return res.status(400).json({ success: false, message: "Title is required" }); }

  const prompt = `You are an AI assistant for a college study forum.
  Analyze this new question:
  Title: "${title}"
  Description: "${description || 'None'}"
  
  Here is a list of recent question titles already asked:
  [${(recentTitles || []).join(', ')}]
  
  Respond STRICTLY in this JSON format without markdown backticks:
  {
    "enhancedTitle": "Clarified title string",
    "suggestedTags": ["Tag1", "Tag2"],
    "isDuplicate": false,
    "duplicateOf": ""
  }`;

  const text = await callAI({ userPrompt: prompt });
  if (text) {
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ success: true, analysis: parsed });
    } catch (e) {}
  }

  // Fallback analysis
  const fallbackAnalysis = {
    enhancedTitle: title || "General Academic Question",
    suggestedTags: ["General", "Academic"],
    isDuplicate: false,
    duplicateOf: "",
    isUsingFallback: true
  };
  res.json({ success: true, analysis: fallbackAnalysis });
});

// 10. POST /api/user-insights -> Calculate User Metrics & AI Feedback
app.post('/api/user-insights', async (req, res) => {
  const { uid, userFullName, doubts } = req.body;
  if (!uid || !doubts) {
    return res.status(400).json({ success: false, message: "Missing uid or doubts" });
  }

  // Generate real monthly chart data (Past 5 months)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const pastMonths = [];
  for (let i = 4; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    pastMonths.push({ name: months[m], index: m, questions: 0, answers: 0 });
  }

  // Backend Calculations
  const questionsAsked = doubts.filter(d => d.authorId === uid).length;
  const upvotesReceived = doubts.filter(d => d.authorId === uid).reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
  
  let answersGiven = 0;
  doubts.forEach(d => {
    if (d.authorId === uid && d.createdAt) {
      const date = new Date(d.createdAt.seconds ? d.createdAt.seconds * 1000 : d.createdAt);
      const m = date.getMonth();
      const monthObj = pastMonths.find(x => x.index === m);
      if (monthObj) monthObj.questions++;
    }

    if (d.answers) {
      const myAnswers = d.answers.filter(a => a.author === userFullName);
      answersGiven += myAnswers.length;
      
      myAnswers.forEach(() => {
        if (d.createdAt) {
           const date = new Date(d.createdAt.seconds ? d.createdAt.seconds * 1000 : d.createdAt);
           const m = date.getMonth();
           const monthObj = pastMonths.find(x => x.index === m);
           if (monthObj) monthObj.answers++;
        }
      });
    }
  });

  const chartData = pastMonths.map(m => ({ name: m.name, questions: m.questions, answers: m.answers }));

  const prompt = `You are an encouraging college AI mentor for Raisoni College. 
  A student named ${userFullName || 'Student'} has the following stats:
  - Questions Asked: ${questionsAsked}
  - Upvotes Received: ${upvotesReceived}
  - Answers Given: ${answersGiven}
  
  Write a fun, single-sentence (max 15 words) personalized feedback for them.`;

  const text = await callAI({ userPrompt: prompt });
  const feedback = text ? text.replace(/"/g, '').trim() : 'Keep up the great work on the campus platform!';

  res.json({
    success: true,
    data: {
      questionsAsked,
      upvotesReceived,
      answersGiven,
      chartData,
      aiFeedback: feedback
    }
  });
});

// 11. POST /api/faculty-insights -> Calculate Faculty Metrics & AI Feedback
app.post('/api/faculty-insights', async (req, res) => {
  const { facultyName, requests, doubts } = req.body;
  if (!requests || !doubts) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const myRequests = requests;
  const pendingRequests = myRequests.filter(r => r.status === 'Pending Advice' || r.status === 'Pending').length;
  const actionedRequests = myRequests.filter(r => r.status === 'Approved' || r.status === 'Solved' || r.status === 'Declined').length;
  
  let doubtsAnswered = 0;
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const pastMonths = [];
  for (let i = 4; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    pastMonths.push({ name: months[m], index: m, requests: 0, doubts: 0 });
  }

  myRequests.forEach(r => {
    if (r.createdAt) {
      const date = new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt);
      const m = date.getMonth();
      const monthObj = pastMonths.find(x => x.index === m);
      if (monthObj) monthObj.requests++;
    }
  });

  doubts.forEach(d => {
    if (d.answers) {
      const myAnswers = d.answers.filter(a => a.author === facultyName);
      doubtsAnswered += myAnswers.length;
      
      myAnswers.forEach(() => {
        if (d.createdAt) {
           const date = new Date(d.createdAt.seconds ? d.createdAt.seconds * 1000 : d.createdAt);
           const m = date.getMonth();
           const monthObj = pastMonths.find(x => x.index === m);
           if (monthObj) monthObj.doubts++;
        }
      });
    }
  });

  const chartData = pastMonths.map(m => ({ name: m.name, requests: m.requests, doubts: m.doubts }));

  const prompt = `You are a professional assistant evaluating a college professor. 
  The professor named ${facultyName || 'Professor'} has stats:
  - Pending Mentorships: ${pendingRequests}
  - Actioned: ${actionedRequests}
  - Doubts Answered: ${doubtsAnswered}
  
  Write a highly professional, encouraging 1-sentence (max 15 words) summary.`;

  const text = await callAI({ userPrompt: prompt });
  const feedback = text ? text.replace(/"/g, '').trim() : 'Thank you for your continuous dedication to guiding our students.';

  res.json({
    success: true,
    data: {
      pendingRequests,
      actionedRequests,
      doubtsAnswered,
      chartData,
      aiFeedback: feedback
    }
  });
});

// ==========================================
// 📚 ACADEMIC STUDY HUB APIs
// ==========================================
let studyResources = [
  {
    id: 1,
    title: "Data Structures & Algorithms Handwritten Notes",
    category: "Notes",
    branch: "CSE",
    semester: "Sem 3",
    subject: "Data Structures",
    unit: "Unit 1-4",
    author: "Dr. Arvind Gupta",
    authorRole: "faculty",
    downloadCount: 142,
    fileUrl: "#",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Operating Systems 2025 Model Question Bank",
    category: "Question Banks",
    branch: "IT",
    semester: "Sem 4",
    subject: "Operating Systems",
    unit: "Unit 1-6",
    author: "Prof. Sunita R.",
    authorRole: "faculty",
    downloadCount: 89,
    fileUrl: "#",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: "Fluid Mechanics Previous Year Solved Papers",
    category: "Previous Year Papers",
    branch: "CIVIL",
    semester: "Sem 4",
    subject: "Fluid Mechanics",
    unit: "Unit 1-5",
    author: "Sanket Chute",
    authorRole: "student",
    downloadCount: 210,
    fileUrl: "#",
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

app.get('/api/resources', (req, res) => {
  const { branch, semester, category, search } = req.query;
  let filtered = [...studyResources];

  if (branch && branch !== 'All') filtered = filtered.filter(r => r.branch === branch);
  if (semester && semester !== 'All') filtered = filtered.filter(r => r.semester === semester);
  if (category && category !== 'All') filtered = filtered.filter(r => r.category === category);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q));
  }

  res.json({ success: true, data: filtered });
});

app.post('/api/resources', (req, res) => {
  const { title, category, branch, semester, subject, unit, author, authorRole, fileUrl } = req.body;
  if (!title || !subject) {
    return res.status(400).json({ success: false, message: "Title and Subject are required" });
  }
  const newResource = {
    id: Date.now(),
    title,
    category: category || "Notes",
    branch: branch || "CSE",
    semester: semester || "Sem 3",
    subject,
    unit: unit || "Unit 1",
    author: author || "Faculty",
    authorRole: authorRole || "faculty",
    downloadCount: 0,
    fileUrl: fileUrl || "#",
    createdAt: new Date().toISOString()
  };
  studyResources.unshift(newResource);
  res.status(201).json({ success: true, data: newResource });
});

app.delete('/api/resources/:id', (req, res) => {
  const { id } = req.params;
  studyResources = studyResources.filter(r => r.id !== parseInt(id));
  res.json({ success: true, message: "Resource deleted successfully" });
});

// ==========================================
// 👥 PEER GROUPS APIs
// ==========================================
let peerGroups = [
  {
    id: 101,
    name: "AI / ML Deep Learning Group",
    description: "Collaborative study group for Neural Networks, PyTorch & Kaggle competitions.",
    category: "AI/ML",
    branch: "CSE / AI",
    membersCount: 28,
    isJoined: false,
    owner: "Samay Raina",
    posts: [
      { id: 1, author: "Rahul M.", text: "Anyone working on CNN image classification task for Lab 4?", createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 102,
    name: "DSA & LeetCode Crackers",
    description: "Daily 2 DSA problems discussion, Trees, Graphs, Dynamic Programming & interview prep.",
    category: "Placement Prep",
    branch: "All Branches",
    membersCount: 45,
    isJoined: true,
    owner: "Priya S.",
    posts: [
      { id: 2, author: "Priya S.", text: "Today's challenge: Slidng Window Maximum (Hard). Drop your solution!", createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 103,
    name: "DBMS & SQL Masterclass",
    description: "Normalization, Transactions, Indexing & SQL query optimization.",
    category: "Academic",
    branch: "IT / CSE",
    membersCount: 19,
    isJoined: false,
    owner: "Prof. Arvind",
    posts: []
  }
];

app.get('/api/peer-groups', (req, res) => {
  res.json({ success: true, data: peerGroups });
});

app.post('/api/peer-groups', (req, res) => {
  const { name, description, category, branch, owner } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Group name is required" });
  const newGroup = {
    id: Date.now(),
    name,
    description: description || "",
    category: category || "General",
    branch: branch || "All",
    membersCount: 1,
    isJoined: true,
    owner: owner || "Student",
    posts: []
  };
  peerGroups.unshift(newGroup);
  res.status(201).json({ success: true, data: newGroup });
});

app.post('/api/peer-groups/:id/join', (req, res) => {
  const { id } = req.params;
  const group = peerGroups.find(g => g.id === parseInt(id));
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  group.isJoined = !group.isJoined;
  group.membersCount += group.isJoined ? 1 : -1;
  res.json({ success: true, isJoined: group.isJoined, membersCount: group.membersCount });
});

app.post('/api/peer-groups/:id/posts', (req, res) => {
  const { id } = req.params;
  const { text, author } = req.body;
  const group = peerGroups.find(g => g.id === parseInt(id));
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  const newPost = {
    id: Date.now(),
    author: author || "Member",
    text,
    createdAt: new Date().toISOString()
  };
  group.posts.unshift(newPost);
  res.status(201).json({ success: true, data: newPost });
});

// ==========================================
// 🚀 PLACEMENT HUB APIs
// ==========================================
let placementDrives = [
  {
    id: 1,
    company: "TCS Ninja / Digital",
    role: "System Engineer & Software Developer",
    eligibility: "CGPA 6.0+",
    branches: ["CSE", "IT", "EXTC", "MECH", "CIVIL"],
    package: "₹3.6 LPA - ₹7.2 LPA",
    location: "Pune / Mumbai / PAN India",
    deadline: "2026-09-15",
    process: "Aptitude Test -> Coding Test -> Technical Interview -> HR Round",
    status: "Active"
  },
  {
    id: 2,
    company: "Infosys Specialist Programmer",
    role: "Specialist Programmer & Digital Specialist",
    eligibility: "CGPA 7.5+",
    branches: ["CSE", "IT", "AI"],
    package: "₹9.5 LPA",
    location: "Bangalore / Hyderabad",
    deadline: "2026-09-30",
    process: "HackWithInfy / Hackathon -> Coding Interview -> HR",
    status: "Upcoming"
  }
];

let interviewExperiences = [
  {
    id: 1,
    company: "TCS Digital",
    role: "Software Engineer",
    author: "Akash Verma (CSE 2025)",
    questions: "1. Explain B-Trees vs B+ Trees\n2. Solve DP Problem: Longest Common Subsequence\n3. SQL Query for Second Highest Salary",
    rounds: "3 Rounds (Aptitude + Technical + HR)",
    difficulty: "Medium",
    tips: "Focus heavily on Data Structures, OOPs concepts, and DBMS SQL queries.",
    upvotes: 24,
    createdAt: new Date().toISOString()
  }
];

app.get('/api/placements', (req, res) => {
  res.json({ success: true, drives: placementDrives, experiences: interviewExperiences });
});

app.post('/api/placements/experiences', (req, res) => {
  const { company, role, author, questions, rounds, difficulty, tips } = req.body;
  if (!company || !questions) {
    return res.status(400).json({ success: false, message: "Company and Questions details are required" });
  }
  const newExp = {
    id: Date.now(),
    company,
    role: role || "Software Engineer",
    author: author || "Student",
    questions,
    rounds: rounds || "Technical & HR",
    difficulty: difficulty || "Medium",
    tips: tips || "Review core syllabus and DSA.",
    upvotes: 0,
    createdAt: new Date().toISOString()
  };
  interviewExperiences.unshift(newExp);
  res.status(201).json({ success: true, data: newExp });
});

// ==========================================
// 🔍 CAMPUS KNOWLEDGE UNIFIED SEARCH API
// ==========================================
app.get('/api/campus-knowledge/search', (req, res) => {
  const { query: searchQuery, category } = req.query;
  const q = (searchQuery || '').toLowerCase().trim();

  const results = {
    doubts: questions.filter(d => !q || d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)),
    resources: studyResources.filter(r => !q || r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q)),
    placements: interviewExperiences.filter(e => !q || e.company.toLowerCase().includes(q) || e.questions.toLowerCase().includes(q)),
    announcements: placementDrives
  };

  res.json({ success: true, query: searchQuery, results });
});

// ==========================================
// 🏆 GAMIFICATION & ACHIEVEMENTS APIs
// ==========================================
let achievementsList = [
  { id: "first_question", title: "First Question", desc: "Asked your first syllabus doubt on PeerSpace", icon: "❓", xp: 10 },
  { id: "first_answer", title: "First Answer", desc: "Helped a classmate by answering a question", icon: "🎯", xp: 20 },
  { id: "streak_7", title: "7 Day Streak", desc: "Maintained a 7-day continuous study streak", icon: "🔥", xp: 50 },
  { id: "resource_contributor", title: "Resource Contributor", desc: "Uploaded study materials to Campus Study Hub", icon: "📚", xp: 30 },
  { id: "problem_solver", title: "Problem Solver", desc: "Had 5 answers accepted as correct solutions", icon: "💡", xp: 100 },
  { id: "faculty_helper", title: "Faculty Helper", desc: "Answer verified by Raisoni Faculty", icon: "👨‍🏫", xp: 75 },
  { id: "placement_ready", title: "Placement Ready", desc: "Shared interview experience or placement prep notes", icon: "🚀", xp: 40 }
];

app.get('/api/achievements', (req, res) => {
  res.json({ success: true, data: achievementsList });
});

// ==========================================
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Raisoni PeerSpace Backend running on port ${PORT}`);
  });
}

export default app;
