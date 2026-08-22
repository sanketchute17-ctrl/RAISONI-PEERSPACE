import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, PlusCircle, Ghost, User, X, BookOpen, Trophy, Hash, Star, LogOut, Camera, LayoutDashboard, ShieldQuestion, MapPin, Mic, Loader2, Paperclip, BarChart2, History, Trash2, Moon, Sun, Bookmark, Info, Sparkles, Send, MessageSquare, CheckCircle2, Zap, Flame, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DoubtCard from '../components/DoubtCard';
import FacultyCareerConnect from '../components/FacultyCareerConnect';
import { auth, db, storage } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AIAssistant from '../components/AIAssistant';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, isAnonymous: contextIsAnonymous, updateProfile, logout } = useAuth();
  
  // Check if user logged in anonymously from context or login page state
  const isUserAnonymous = contextIsAnonymous || location.state?.isAnonymous || false;

  const [activeView, setActiveView] = useState('doubts'); // 'doubts', 'mentorship', 'lostfound'
  const [doubts, setDoubts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [newProfilePicUrl, setNewProfilePicUrl] = useState('');
  const [newAbout, setNewAbout] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Local Bookmarks State for Anonymous Users
  const [localSavedDoubts, setLocalSavedDoubts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved_doubts') || '[]'); } catch(e) { return []; }
  });

  // Insights State
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Real-time listener for doubts collection
  useEffect(() => {
    const q = query(collection(db, 'doubts'), orderBy('createdAt', 'desc'));
    const unsubscribeDoubts = onSnapshot(q, (snapshot) => {
      const doubtsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setDoubts(doubtsData);
    });
    return () => unsubscribeDoubts();
  }, []);

  useEffect(() => {
    if (!currentUser || isUserAnonymous) return;
    const q = query(collection(db, 'notifications')); 
    const unsub = onSnapshot(q, (snap) => {
       const notifs = snap.docs
         .map(d => ({id: d.id, ...d.data()}))
         .filter(n => n.receiverId === currentUser.uid)
         .sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
       setNotifications(notifs);
    });
    return () => unsub();
  }, [currentUser, isUserAnonymous]);

  useEffect(() => {
    const handleLocalBookmarksUpdate = () => {
      try { setLocalSavedDoubts(JSON.parse(localStorage.getItem('saved_doubts') || '[]')); } catch(e) {}
    };
    window.addEventListener('localBookmarksUpdated', handleLocalBookmarksUpdate);
    return () => window.removeEventListener('localBookmarksUpdated', handleLocalBookmarksUpdate);
  }, []);

  useEffect(() => {
    if (activeView === 'insights') {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        const defaultChartData = [
          { name: 'Jan', questions: 2, answers: 1 },
          { name: 'Feb', questions: 4, answers: 3 },
          { name: 'Mar', questions: 3, answers: 5 },
          { name: 'Apr', questions: 6, answers: 4 },
          { name: 'May', questions: 5, answers: 8 },
        ];
        const defaultInsights = {
          questionsAsked: doubts ? doubts.filter(d => d.authorId === (currentUser?.uid || 'anonymous')).length : 2,
          upvotesReceived: 8,
          answersGiven: 4,
          chartData: defaultChartData,
          aiFeedback: "Keep up the great work! Answering peer doubts helps strengthen your own concepts."
        };
        try {
          const res = await fetch(`${API_BASE}/api/user-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              uid: currentUser?.uid || 'anonymous', 
              userFullName: userProfile?.fullName || 'Student',
              doubts: doubts || []
            })
          });
          const data = await res.json();
          if (data.success && data.data && data.data.chartData && data.data.chartData.length > 0) {
            setInsights(data.data);
          } else {
            setInsights(defaultInsights);
          }
        } catch (err) {
          console.error("Error fetching insights:", err);
          setInsights(defaultInsights);
        }
        setLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [activeView, currentUser, userProfile, doubts]);

  useEffect(() => {
    if (userProfile) {
      setNewProfilePicUrl(userProfile.profilePicUrl || '');
      setNewAbout(userProfile.about || '');
    }
  }, [userProfile]);

  const handleGalleryPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file from your device gallery.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target.result;
      setNewProfilePicUrl(base64Url);
      toast.success("Gallery photo loaded! Click 'Save Changes' below to update.");
    };
    reader.readAsDataURL(file);
  };

  const avatarPresets = [
    `https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile?.fullName || 'Student1'}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.fullName || 'Robot'}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.fullName || 'Scholar'}`,
    `https://api.dicebear.com/7.x/person/svg?seed=${userProfile?.fullName || 'Peer'}`,
    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${userProfile?.fullName || 'Star'}`
  ];

  const handleUpdateProfile = async () => {
    if (currentUser) {
      const res = await updateProfile({
        profilePicUrl: newProfilePicUrl,
        about: newAbout
      });
      if (res?.success !== false) {
        alert("Profile updated successfully!");
      } else {
        alert("Error updating profile.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteHistory = async (doubtId) => {
    if (window.confirm("Are you sure you want to delete this specific question permanently?")) {
      try {
        await deleteDoc(doc(db, 'doubts', doubtId));
      } catch (err) {
        console.error("Error deleting doubt:", err);
      }
    }
  };

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTag, setNewTag] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [duplicateError, setDuplicateError] = useState('');
  const [duplicateQuestionData, setDuplicateQuestionData] = useState(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileUploadError('Please attach a PDF or image file only.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setFileUploadError('');
  };

  const uploadAttachment = async () => {
    if (!selectedFile) return null;
    setIsUploadingFile(true);
    try {
      const uploadPath = `doubtQuestions/${currentUser?.uid || 'anon'}/${Date.now()}_${selectedFile.name}`;
      const storageReference = storageRef(storage, uploadPath);
      const uploadTask = uploadBytesResumable(storageReference, selectedFile);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, (error) => reject(error), () => resolve());
      });

      const url = await getDownloadURL(uploadTask.snapshot.ref);
      return {
        fileUrl: url,
        fileType: selectedFile.type,
        fileName: selectedFile.name
      };
    } catch (error) {
      console.error('Attachment upload failed:', error);
      setFileUploadError('Unable to upload attachment. Try again.');
      return null;
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Voice Input State
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);

  const startVoiceRecognition = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Google Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English context
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (field === 'title') setIsListeningTitle(true);
      if (field === 'desc') setIsListeningDesc(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'title') {
         setNewTitle(prev => (prev ? prev + " " : "") + transcript);
         if (duplicateError) {
           setDuplicateError('');
           setDuplicateQuestionData(null);
         }
      } else {
         setNewDesc(prev => (prev ? prev + " " : "") + transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      setIsListeningTitle(false);
      setIsListeningDesc(false);
    };

    recognition.onend = () => {
      setIsListeningTitle(false);
      setIsListeningDesc(false);
    };

    recognition.start();
  };

  // Search State & filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState(null);

  const startSearchVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListeningSearch(true);
    recognition.onresult = (event) => setSearchQuery(event.results[0][0].transcript);
    recognition.onerror = () => setIsListeningSearch(false);
    recognition.onend = () => setIsListeningSearch(false);
    recognition.start();
  };

  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  const handlePostDoubt = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    // Check for exact local duplicate
    const existingDoubt = doubts.find(d => d.title?.trim().toLowerCase() === newTitle.trim().toLowerCase());
    if (existingDoubt) {
      setDuplicateError("This exact question has already been asked!");
      setDuplicateQuestionData(existingDoubt);
      return;
    }

    // AI Semantic Check and Enhancement
    setIsAnalyzingAI(true);
    let finalTitle = newTitle;
    let finalTags = newTag ? [newTag.replace('#', '')] : ["General"];
    try {
      const recentTitles = doubts.slice(0, 15).map(d => d.title);
      const aiRes = await fetch(`${API_BASE}/api/analyze-doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, recentTitles })
      });
      const data = await aiRes.json();
      if (data.success && data.analysis) {
         if (data.analysis.isDuplicate && data.analysis.duplicateOf) {
           setDuplicateError(`AI Semantic Match: This looks like a duplicate of "${data.analysis.duplicateOf}"`);
           const existing = doubts.find(d => d.title.trim().toLowerCase() === data.analysis.duplicateOf.trim().toLowerCase());
           if (existing) setDuplicateQuestionData(existing);
           setIsAnalyzingAI(false);
           return;
         }
         if (data.analysis.enhancedTitle) finalTitle = data.analysis.enhancedTitle;
         if (data.analysis.suggestedTags?.length > 0) finalTags = [...new Set([...finalTags, ...data.analysis.suggestedTags])];
      }
    } catch(err) {
      console.error("AI Analysis failed/skipped:", err);
    }
    setIsAnalyzingAI(false);

    let authorName = "Anonymous Student";
    if (!postAnonymously) {
      authorName = isUserAnonymous ? "Ghost Protocol" : (userProfile?.fullName || "Student");
    }

    let attachment = null;
    if (selectedFile) {
      attachment = await uploadAttachment();
      if (!attachment) return; // If upload failed, stop submission
    }

    try {
      await addDoc(collection(db, 'doubts'), {
        title: finalTitle,
        description: newDesc,
        author: authorName,
        isAnonymous: postAnonymously,
        authorId: currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        upvotes: 0,
        upvoters: [], // tracking who liked
        tags: finalTags,
        answers: [],
        attachment: attachment
      });
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewTag('');
      setSelectedFile(null);
      setFileUploadError('');
      setDuplicateError('');
      setDuplicateQuestionData(null);
      setIsModalOpen(false);
    } catch(err) {
      console.error("Error adding doubt:", err);
      alert("Error posting doubt. Check console.");
    }
  };

  const [subjects, setSubjects] = useState(["General Campus", "Aptitude", "T&P Updates"]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        let branchUrl = `${API_BASE}/api/subjects`;
        if (userProfile?.branch && userProfile.branch !== 'Unknown' && userProfile.branch !== 'Setup Firestore') {
           branchUrl += `?branch=${userProfile.branch}`;
        } else if (isUserAnonymous) {
           branchUrl += `?branch=General`;
        }
        const res = await fetch(branchUrl);
        const data = await res.json();
        if (data.success) {
           setSubjects(data.data);
        }
      } catch(err) {
        console.error("Failed to fetch subjects:", err);
      }
    };
    if (userProfile || isUserAnonymous) {
      fetchSubjects();
    }
  }, [userProfile, isUserAnonymous]);

  // Dynamically calculate Top Contributors (Leaderboard) from live doubts
  const userPointsMap = doubts.reduce((acc, curr) => {
    // Add points for asking questions (e.g., 2 points per question + upvotes)
    if (curr.author && !curr.isAnonymous) {
      acc[curr.author] = (acc[curr.author] || 0) + 2 + (curr.upvotes || 0);
    }
    // Add points for answering questions
    if (curr.answers && Array.isArray(curr.answers)) {
       curr.answers.forEach(ans => {
         if (ans.author && ans.author !== "Ghost Protocol" && ans.author !== "Anonymous Student" && !ans.isAI) {
           acc[ans.author] = (acc[ans.author] || 0) + 5 + (ans.upvotes || 0);
         }
       });
    }
    return acc;
  }, {});

  const leaderboard = Object.entries(userPointsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry, index) => ({ name: entry[0], points: entry[1], rank: index + 1 }));

  const trendingTagsMap = doubts.reduce((acc, curr) => {
    curr.tags?.forEach(t => acc[t] = (acc[t] || 0) + 1);
    return acc;
  }, {});
  const topTrending = Object.entries(trendingTagsMap).sort((a,b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);

  const filteredDoubts = doubts.filter(d => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (d.title?.toLowerCase().includes(lowerQuery) || 
            d.description?.toLowerCase().includes(lowerQuery) || 
            d.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)));
  });

  // Dynamic Real XP & Streak Calculation from live Firestore data
  const userDoubtsAsked = doubts.filter(d => d.authorId === (currentUser?.uid || 'anonymous') || (!d.isAnonymous && userProfile?.fullName && d.author === userProfile.fullName));
  const userQuestionsCount = userDoubtsAsked.length;
  
  const userAnswersCount = doubts.reduce((count, d) => {
    if (Array.isArray(d.answers)) {
       return count + d.answers.filter(a => a.author === (userProfile?.fullName || 'Student')).length;
    }
    return count;
  }, 0);

  const upvotesReceived = userDoubtsAsked.reduce((acc, d) => acc + (d.upvotes || 0), 0);

  // REAL DYNAMIC XP: 25 Base XP + 20 per Question + 50 per Answer + 5 per Upvote
  const totalUserXP = (userProfile ? 25 : 10) + (userQuestionsCount * 20) + (userAnswersCount * 50) + (upvotesReceived * 5);

  // REAL DYNAMIC TIER
  const userRankName = totalUserXP < 50 ? "Rookie" : totalUserXP < 150 ? "Campus Scholar" : totalUserXP < 350 ? "Campus Master" : "Campus Star";

  // REAL DYNAMIC STREAK
  const realStreakDays = (userQuestionsCount > 0 || userAnswersCount > 0) ? Math.min(30, 1 + userQuestionsCount + userAnswersCount) : 1;

  // REAL DYNAMIC QUEST STATUS
  const isQuest1Done = userQuestionsCount > 0;
  const isQuest2Done = userAnswersCount > 0;

  // 3-Mode Theme State: 'light' (Day Mode), 'eyecare' (Eye Care Sepia Mode), 'dark' (Night Mode)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('peerspace_theme_mode') || 'light';
  });

  const applyThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('peerspace_theme_mode', mode);

    const root = document.documentElement;
    root.classList.remove('dark', 'eyecare');
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'eyecare') {
      root.classList.add('eyecare');
    }
  };

  useEffect(() => {
    applyThemeMode(themeMode);
  }, []);

  return (
    <div className="min-h-screen bg-[#e8eff5] dark:bg-slate-900 font-sans transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0f172a] border-b border-blue-900 px-4 py-2 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo & College Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/college-logo.png" alt="G H Raisoni College Logo" className="h-12 w-auto object-contain bg-white/10 rounded px-2 mix-blend-screen" />
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus topics, tags, or questions..." 
              className={`w-full pl-11 pr-12 py-2.5 bg-blue-900/50 border ${isListeningSearch ? 'border-blue-400 ring-2 ring-blue-500 bg-blue-900' : 'border-blue-800'} rounded-full text-sm font-medium text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-blue-900 focus:border-blue-700 transition-all outline-none`}
            />
            <button
              onClick={startSearchVoiceRecognition}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListeningSearch ? 'text-white bg-blue-600 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Voice Search"
            >
              {isListeningSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* 3-Option Theme Mode Switcher */}
            <div className="flex items-center bg-blue-950/80 border border-blue-800/80 rounded-full p-0.5 shadow-inner">
               <button 
                  onClick={() => applyThemeMode('light')}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${themeMode === 'light' ? 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-amber-300' : 'text-slate-400 hover:text-white'}`}
                  title="Day Mode (Light)"
               >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] uppercase tracking-wider">Day</span>
               </button>
               <button 
                  onClick={() => applyThemeMode('eyecare')}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${themeMode === 'eyecare' ? 'bg-amber-200 text-amber-950 shadow-sm ring-1 ring-amber-300' : 'text-slate-400 hover:text-white'}`}
                  title="Eye Care Mode (Soft Sepia Reading)"
               >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] uppercase tracking-wider">Eye Care</span>
               </button>
               <button 
                  onClick={() => applyThemeMode('dark')}
                  className={`px-2 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${themeMode === 'dark' ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-slate-400 hover:text-white'}`}
                  title="Night Mode (Dark)"
               >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] uppercase tracking-wider">Night</span>
               </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="text-slate-300 hover:text-white transition-colors relative outline-none p-1"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.length > 0 && notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute top-12 -right-12 sm:right-0 w-[300px] sm:w-85 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                   <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                       <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
                       {notifications.filter(n => !n.read).length > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.read).length} New
                          </span>
                       )}
                     </div>
                     <button 
                       onClick={() => setIsNotificationsOpen(false)}
                       className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="max-h-80 overflow-y-auto custom-scrollbar">
                     {notifications.length === 0 ? (
                       <div className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-xs font-medium flex flex-col items-center gap-2">
                         <Bell className="w-8 h-8 opacity-30" />
                         <p>No new notifications right now</p>
                       </div>
                     ) : (
                       notifications.map(n => (
                         <div key={n.id} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 ${n.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50/60 dark:bg-blue-950/40'} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3`}>
                           <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                             <MessageSquare className="w-3.5 h-3.5" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-baseline gap-1">
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                               <span className="text-[10px] text-slate-400 font-bold shrink-0">{n.timeAgo || 'Just now'}</span>
                             </div>
                             <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-blue-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-50 leading-none">
                  {isUserAnonymous ? 'Ghost Protocol' : (userProfile?.fullName || 'Student')}
                </p>
                <p className="text-xs font-medium text-blue-300">
                  {isUserAnonymous ? 'Nagpur Campus' : (userProfile?.branch ? `${userProfile.branch} - ${userProfile.startYear}` : 'Nagpur Campus')}
                </p>
              </div>
              <div 
                onClick={() => !isUserAnonymous && setIsProfileModalOpen(true)}
                className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-700 shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                title={isUserAnonymous ? "Anonymous User" : "View Profile"}
              >
                {isUserAnonymous ? (
                  <Ghost className="w-5 h-5 text-slate-300" />
                ) : userProfile?.profilePicUrl ? (
                  <img src={userProfile.profilePicUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile?.fullName || 'Felix'}`} alt="avatar" className="w-full h-full object-cover" />
                )}
              </div>
              <button 
                onClick={handleLogout}
                title="Logout"
                className="ml-2 w-9 h-9 flex items-center justify-center rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Strip (Visible on mobile screens < 768px) */}
      <div className="md:hidden bg-[#0f172a] border-b border-blue-900 px-3 py-2 space-y-2 sticky top-[61px] z-30 shadow-md">
        {/* Mobile Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus topics, tags..." 
            className="w-full pl-9 pr-10 py-1.5 bg-blue-950 border border-blue-800 rounded-full text-xs font-medium text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <button
            onClick={startSearchVoiceRecognition}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            {isListeningSearch ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Scrollable Nav Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hidescrollbar">
          <button
            onClick={() => setActiveView('doubts')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeView === 'doubts' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-950 text-slate-300 border border-blue-900'
            }`}
          >
            <Hash className="w-3.5 h-3.5" /> Doubts
          </button>
          <button
            onClick={() => setActiveView('mentorship')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeView === 'mentorship' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-950 text-slate-300 border border-blue-900'
            }`}
          >
            <ShieldQuestion className="w-3.5 h-3.5" /> Mentorship
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeView === 'insights' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-950 text-slate-300 border border-blue-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Insights
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeView === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-950 text-slate-300 border border-blue-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
          <button
            onClick={() => setActiveView('bookmarks')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeView === 'bookmarks' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-blue-950 text-slate-300 border border-blue-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Saved
          </button>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 bg-blue-950 text-slate-300 border border-blue-900"
          >
            <Info className="w-3.5 h-3.5" /> About
          </button>
        </div>
      </div>

      {/* Live Campus Announcement Marquee Ticker */}
      <div className="bg-gradient-to-r from-blue-950 via-[#0f172a] to-blue-950 border-b border-blue-800/80 px-4 py-2 text-xs text-slate-200 shadow-inner flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0 bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
           <Zap className="w-3 h-3 fill-white" /> Campus Live
        </div>
        <div className="flex items-center gap-6 overflow-x-auto hidescrollbar whitespace-nowrap text-slate-300 font-medium">
           <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-yellow-400" /> <strong className="text-white">Exam Notice:</strong> Mid-Sem Examination timetable released for CSE & IT departments.</span>
           <span className="text-slate-600">•</span>
           <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-400" /> <strong className="text-white">Faculty Notes:</strong> Dr. Arvind Gupta uploaded new Data Structures Question Bank.</span>
           <span className="text-slate-600">•</span>
           <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-orange-400" /> <strong className="text-white">PeerSpace Hackathon:</strong> Registrations live! Earn up to 500 XP.</span>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">
        
        {/* LEFT SIDEBAR: Navigation & Categorization */}
        <aside className="hidden md:block w-64 shrink-0 top-24 sticky space-y-6">
          
          {/* Global Navigation */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
            <h3 className="font-bold text-[#0f172a] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <LayoutDashboard className="w-4 h-4 text-blue-700" />
              Menu
            </h3>
            <ul className="space-y-1">
              <li>
                <button 
                  onClick={() => setActiveView('doubts')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeView === 'doubts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}
                >
                  <Hash className={`w-4 h-4 ${activeView === 'doubts' ? 'text-blue-200' : 'text-blue-400'}`} />
                  Campus Doubts
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('mentorship')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeView === 'mentorship' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}
                >
                  <ShieldQuestion className={`w-4 h-4 ${activeView === 'mentorship' ? 'text-blue-200' : 'text-blue-400'}`} />
                  Expert Mentorship
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('insights')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeView === 'insights' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}
                >
                  <BarChart2 className={`w-4 h-4 ${activeView === 'insights' ? 'text-blue-200' : 'text-blue-400'}`} />
                  My Insights
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('history')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeView === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'}`}
                >
                  <History className={`w-4 h-4 ${activeView === 'history' ? 'text-blue-200' : 'text-blue-400'}`} />
                  My History
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('bookmarks')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeView === 'bookmarks' ? 'bg-yellow-500 text-white shadow-md' : 'text-slate-600 hover:bg-yellow-50 hover:text-yellow-600'}`}
                >
                  <Bookmark className={`w-4 h-4 ${activeView === 'bookmarks' ? 'text-yellow-100' : 'text-yellow-500'}`} />
                  Saved Bookmarks
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsAboutOpen(true)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${isAboutOpen ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <Info className={`w-4 h-4 ${isAboutOpen ? 'text-indigo-200' : 'text-indigo-500'}`} />
                  About App
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* CENTER VIEW: Dynamic Content Render */}
        <div className="flex-1 min-w-0">
          
          {activeView === 'doubts' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              
              {/* Gamification & Welcome Hero Card */}
              <div className="mb-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800/60 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all pointer-events-none"></div>
                 
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                    <div>
                       <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
                             <Flame className="w-3 h-3 fill-white" /> {realStreakDays} Day Streak
                          </span>
                          <span className="bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                             {userRankName} Tier
                          </span>
                       </div>
                       <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                          Welcome back, {isUserAnonymous ? 'Ghost Scholar' : (userProfile?.fullName || 'Student')}! 👋
                       </h1>
                       <p className="text-xs sm:text-sm text-blue-200/90 font-medium mt-1">
                          Solve campus doubts, consult faculty, and level up your engineering skills.
                       </p>

                       {/* XP Progress Bar */}
                       <div className="mt-4 max-w-md">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 mb-1">
                             <span>XP Level Progress ({totalUserXP} / 500 XP)</span>
                             <span className="text-blue-400 font-extrabold">{Math.min(100, Math.round((totalUserXP / 500) * 100))}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-blue-950/80 rounded-full overflow-hidden border border-blue-800/60 p-0.5">
                             <div 
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                                style={{ width: `${Math.max(10, Math.min(100, (totalUserXP / 500) * 100))}%` }}
                             ></div>
                          </div>
                       </div>
                    </div>

                    {/* Daily Quests Box */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl shrink-0 space-y-2 max-w-xs">
                       <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" /> Daily Campus Quests
                       </h4>
                       <div className="space-y-1.5 text-xs text-slate-200">
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className={`w-3.5 h-3.5 ${isQuest1Done ? 'text-green-400' : 'text-slate-500'} shrink-0`} />
                             <span className={isQuest1Done ? 'line-through text-slate-300' : ''}>Ask 1 syllabus doubt <strong className="text-amber-300">(+20 XP)</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className={`w-3.5 h-3.5 ${isQuest2Done ? 'text-green-400' : 'text-slate-500'} shrink-0`} />
                             <span className={isQuest2Done ? 'line-through text-slate-300' : ''}>Answer a peer's question <strong className="text-amber-300">(+50 XP)</strong></span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Quick AI Study Prompts Chips */}
              <div className="mb-6 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 border border-purple-200 dark:border-purple-900/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                       <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-slate-800 dark:text-slate-100">AI Instant Study Helper</p>
                       <p className="text-[11px] text-slate-500 dark:text-slate-400">Click any prompt to ask AI assistant</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 overflow-x-auto pb-1 hidescrollbar">
                    <button 
                       onClick={() => {
                          window.dispatchEvent(new CustomEvent('openAIChatPrompt', { detail: { prompt: 'Explain the core syllabus concept clearly in simple terms.' } }));
                       }}
                       className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5"
                    >
                       💡 Explain Concept in Hindi
                    </button>
                    <button 
                       onClick={() => {
                          window.dispatchEvent(new CustomEvent('openAIChatPrompt', { detail: { prompt: 'Generate 5 important Viva Examination Questions and Answers.' } }));
                       }}
                       className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5"
                    >
                       📝 Generate Viva Q&A
                    </button>
                    <button 
                       onClick={() => {
                          window.dispatchEvent(new CustomEvent('openAIChatPrompt', { detail: { prompt: 'Summarize key syllabus points into quick revision notes.' } }));
                       }}
                       className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5"
                    >
                       📄 Summarize Notes
                    </button>
                 </div>
              </div>

              {/* Subject Quick Filter Pills Row */}
              <div className="mb-6">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Subject Filter</span>
                    {selectedTopicFilter && (
                       <button 
                          onClick={() => { setSelectedTopicFilter(null); setSearchQuery(''); }}
                          className="text-xs font-bold text-red-500 hover:underline"
                       >
                          Clear Filter
                       </button>
                    )}
                 </div>
                 <div className="flex items-center gap-2 overflow-x-auto pb-1 hidescrollbar">
                    {subjects.map((sub, idx) => {
                       const isSelected = selectedTopicFilter === sub;
                       return (
                          <button
                             key={idx}
                             onClick={() => {
                                if (isSelected) {
                                   setSelectedTopicFilter(null);
                                   setSearchQuery('');
                                } else {
                                   setSelectedTopicFilter(sub);
                                   setSearchQuery(sub);
                                }
                             }}
                             className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 shadow-sm ${
                                isSelected 
                                   ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-blue-500/20' 
                                   : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                             }`}
                          >
                             <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                             {sub}
                          </button>
                       );
                    })}
                 </div>
              </div>

              <div className="bg-white border border-blue-100 p-4 rounded-2xl mb-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => { setIsModalOpen(true); if(selectedTopicFilter) setNewTag(selectedTopicFilter); }}>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                     {isUserAnonymous ? <Ghost className="w-5 h-5 text-blue-800" /> : <User className="w-5 h-5 text-blue-800" />}
                  </div>
                  <div className="bg-slate-50 flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-blue-50/50 hover:text-slate-700 transition-colors border border-transparent hover:border-blue-100">
                    What syllabus topic are you struggling with?
                  </div>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(true); if(selectedTopicFilter) setNewTag(selectedTopicFilter); }}
                  className="hidden sm:flex items-center gap-2 bg-[#0f172a] hover:bg-blue-900 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  Ask
                </button>
              </div>

              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-extrabold text-[#0f172a]">Recent Campus Doubts</h2>
                <select className="bg-transparent text-sm font-bold text-blue-700 cursor-pointer outline-none">
                  <option>Top Voted</option>
                  <option>Newest First</option>
                  <option>Unanswered</option>
                </select>
              </div>

              <div className="space-y-0">
                {filteredDoubts.map(doubt => (
                  <DoubtCard key={doubt.id} doubt={doubt} currentUser={currentUser} userProfile={userProfile} isUserAnonymous={isUserAnonymous} />
                ))}
                {filteredDoubts.length === 0 && doubts.length > 0 && (
                   <div className="text-center py-10 bg-white rounded-2xl border border-blue-100 mt-4 shadow-sm">
                       <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                       <h3 className="font-bold text-slate-600">No results found for "{searchQuery}"</h3>
                       <p className="text-sm text-slate-400 mt-1">Try another syllabus topic or tag.</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'bookmarks' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center justify-between mb-6 px-2">
                 <h2 className="text-2xl font-black text-[#0f172a] dark:text-white flex items-center gap-2">
                   <Bookmark className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                   Saved Bookmarks
                 </h2>
               </div>
               <div className="space-y-4">
                  {doubts.filter(d => userProfile?.savedDoubts?.includes(d.id?.toString()) || localSavedDoubts.includes(d.id)).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Bookmark className="w-16 h-16 mb-4 text-slate-200 dark:text-slate-700" />
                      <h3 className="font-bold text-xl mb-2 text-slate-500">No bookmarks yet</h3>
                      <p className="text-sm">Save questions you want to revisit later!</p>
                    </div>
                  ) : (
                    doubts.filter(d => userProfile?.savedDoubts?.includes(d.id?.toString()) || localSavedDoubts.includes(d.id)).map(doubt => (
                       <DoubtCard key={doubt.id} doubt={doubt} currentUser={currentUser} userProfile={userProfile} isUserAnonymous={isUserAnonymous} />
                    ))
                  )}
               </div>
            </div>
          )}

          {activeView === 'mentorship' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-extrabold text-[#0f172a]">Faculty & Career Mentorship</h2>
              </div>
              <FacultyCareerConnect />
            </div>
          )}

          {activeView === 'insights' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-extrabold text-[#0f172a]">Your Insights Overview</h2>
              </div>
              {loadingInsights ? (
                 <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-blue-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <History className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="text-3xl font-black text-[#0f172a]">{insights?.questionsAsked || 0}</h4>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Campus Doubts Asked</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-blue-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="text-3xl font-black text-[#0f172a]">{insights?.upvotesReceived || 0}</h4>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Total Upvotes Received</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-blue-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="text-3xl font-black text-[#0f172a]">{insights?.answersGiven || 0}</h4>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Total Answers Given</p>
                    </div>
                  </div>
                  {insights?.aiFeedback && (
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 p-5 rounded-2xl shadow-sm text-center">
                      <p className="text-purple-800 font-bold flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" /> 
                        {insights.aiFeedback}
                      </p>
                    </div>
                  )}

                  {/* Student Performance Chart */}
                  {insights?.chartData && insights.chartData.length > 0 && (
                     <div className="mt-8 bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-blue-100">
                        <h3 className="font-bold text-slate-800 mb-6">Your Interaction Trends (Past 5 Months)</h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height={280} minWidth={100} minHeight={200}>
                            <BarChart 
                              data={insights.chartData} 
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
                              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} iconType="circle" />
                              <Bar dataKey="questions" name="Questions Asked" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                              <Bar dataKey="answers" name="Answers Given" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                     </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeView === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-extrabold text-[#0f172a]">My Question History</h2>
              </div>
              <div className="space-y-4">
                {doubts.filter(d => d.authorId === (currentUser?.uid || 'anonymous')).length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-blue-100 shadow-sm">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-600">No questions asked yet</h3>
                    <p className="text-sm text-slate-400 mt-1">Be the first to start a campus discussion!</p>
                  </div>
                ) : (
                  doubts.filter(d => d.authorId === (currentUser?.uid || 'anonymous')).map(doubt => (
                    <div key={doubt.id} className="relative group">
                       <DoubtCard doubt={doubt} currentUser={currentUser} userProfile={userProfile} isUserAnonymous={isUserAnonymous} />
                       
                       {/* Floating Delete Button */}
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => handleDeleteHistory(doubt.id)} 
                           className="bg-white/80 backdrop-blur border border-red-200 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 p-2 rounded-xl shadow-sm transition-all" 
                           title="Delete History"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR: Reputation & Leaderboard */}
        <aside className="hidden xl:block w-80 shrink-0 top-24 sticky space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-pink-100 border-t-4 border-t-pink-500 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform"><Star className="w-32 h-32 text-pink-500" /></div>
             <h3 className="font-bold text-[#0f172a] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10">
               🔥 Trending Topics
             </h3>
             <ul className="space-y-2 relative z-10">
                {topTrending.map((tag, idx) => (
                   <li key={idx} className="flex items-center justify-between text-sm py-2 border-b border-pink-50 last:border-0 hover:bg-pink-50/50 rounded-xl px-3 transition-all cursor-pointer hover:shadow-sm" onClick={() => { setSearchQuery(tag); setActiveView('doubts'); }}>
                      <span className="font-bold text-slate-700 flex items-center gap-2 truncate pr-2" title={tag}>#{tag}</span>
                      <span className="text-[10px] font-black text-pink-600 bg-pink-100 px-2 py-1 rounded-full shrink-0 shadow-sm">{trendingTagsMap[tag]} doubts</span>
                   </li>
                ))}
                {topTrending.length === 0 && <p className="text-sm text-slate-500">Not enough data yet.</p>}
             </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 border-t-4 border-t-blue-600 group">
            <h3 className="font-bold text-[#0f172a] mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-blue-600" />
              Top Contributors
            </h3>
            <div className="space-y-4">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                      user.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 border border-yellow-400' : 
                      user.rank === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border border-slate-300' : 
                      'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-50 border border-amber-800'
                    }`}>
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0f172a] leading-tight">{user.name}</p>
                      <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                        <Star className="w-3 h-3 text-blue-500 fill-current" /> {user.points} XP
                      </p>
                    </div>
                  </div>
                  {user.rank === 1 && <span className="text-[10px] bg-[#0f172a] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Campus Star</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0f172a] to-blue-900 rounded-2xl p-5 shadow-lg border border-blue-800 text-slate-50 relative overflow-hidden">
             <Ghost className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
             <h4 className="font-black text-lg mb-2 relative z-10">The Raisoni Promise</h4>
             <p className="text-sm text-blue-200 block font-medium leading-relaxed relative z-10">
               No question is too simple. Ask anonymously, learn confidently, and help others when you can!
             </p>
          </div>
        </aside>
      </main>

      {/* Ask Question Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-[0_0_40px_rgba(15,23,42,0.2)] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0f172a] border-b border-blue-900 px-6 py-4 flex items-center justify-between">
              <h2 className="font-extrabold text-lg text-slate-50">Ask the Campus</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-blue-800/50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostDoubt} className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-[#0f172a]">Title</label>
                  <button 
                    type="button" 
                    onClick={() => startVoiceRecognition('title')} 
                    className={`text-xs flex items-center gap-1 font-bold ${isListeningTitle ? 'text-blue-600 animate-pulse' : 'text-slate-500 hover:text-blue-600'} transition-colors`}
                  >
                     {isListeningTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                     {isListeningTitle ? "Listening..." : "Use Voice"}
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (duplicateError) {
                      setDuplicateError('');
                      setDuplicateQuestionData(null);
                    }
                  }}
                  placeholder="e.g. How does garbage collection work in Java?" 
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${duplicateError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-blue-100 focus:ring-blue-600 focus:border-blue-600'} rounded-xl focus:bg-white outline-none transition-all font-medium text-slate-800`}
                  required
                />
                {duplicateError && (
                  <div className="mt-2 animate-in slide-in-from-top-1">
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2 mb-2 shadow-sm">
                      <span className="font-bold">Duplicate Notice:</span> {duplicateError}
                    </div>
                    {duplicateQuestionData && duplicateQuestionData.answers?.length > 0 && (
                       <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl mt-3 max-h-48 overflow-y-auto custom-scrollbar">
                         <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Answers from the original question:</p>
                         {duplicateQuestionData.answers.map((ans, idx) => (
                           <div key={idx} className="bg-white p-3 rounded-xl text-sm text-slate-700 mb-2 border border-blue-100 shadow-[0_2px_10px_-4px_rgba(37,99,235,0.1)] leading-relaxed">
                             <div className="font-extrabold mb-1.5 text-xs text-[#0f172a] flex items-center gap-1.5">
                               {ans.author}
                               {ans.isVerified && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                             </div>
                             {ans.text}
                           </div>
                         ))}
                       </div>
                    )}
                    {duplicateQuestionData && duplicateQuestionData.answers?.length === 0 && (
                       <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mt-3">
                         <p className="text-xs font-bold text-slate-500 text-center">This question exists but has no answers yet.</p>
                       </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-[#0f172a]">Description (Optional)</label>
                  <button 
                    type="button" 
                    onClick={() => startVoiceRecognition('desc')} 
                    className={`text-xs flex items-center gap-1 font-bold ${isListeningDesc ? 'text-blue-600 animate-pulse' : 'text-slate-500 hover:text-blue-600'} transition-colors`}
                  >
                     {isListeningDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                     {isListeningDesc ? "Listening..." : "Use Voice"}
                  </button>
                </div>
                <textarea 
                  rows="3"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide context or mention which professor taught this..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all resize-none font-medium text-sm text-slate-800"
                  required
                ></textarea>
              </div>

              {/* File Attachment Box */}
              <div className="mb-4">
                <label className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">{selectedFile ? selectedFile.name : 'Attach a Document (PDF/Image)'}</span>
                  </div>
                  {selectedFile ? (
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFile(null); }} 
                      className="text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">Browse</span>
                  )}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {fileUploadError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                    {fileUploadError}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[#0f172a] mb-1.5">Subject Tag</label>
                <select 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium appearance-none text-slate-800"
                >
                  <option value="" disabled>Select a subject...</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* The Innovation: Anonymous Toggle */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-extrabold text-[#0f172a] flex items-center gap-2">
                    <Ghost className="w-4 h-4 text-blue-600" />
                    Ask Anonymously
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Hide your identity from students and teachers.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={postAnonymously}
                    onChange={() => setPostAnonymously(!postAnonymously)}
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUploadingFile || isAnalyzingAI}
                  className="bg-[#0f172a] hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {(isUploadingFile || isAnalyzingAI) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isAnalyzingAI ? "AI Analyzing..." : isUploadingFile ? "Posting..." : "Post Campus Doubt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && !isUserAnonymous && userProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden zoom-in duration-200 border border-slate-200 dark:border-slate-700">
             <div className="bg-gradient-to-r from-[#0f172a] via-blue-950 to-blue-900 p-6 flex flex-col items-center justify-center text-slate-50 relative">
               <button 
                 onClick={() => setIsProfileModalOpen(false)}
                 className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
               <div className="w-24 h-24 rounded-full bg-blue-950 border-4 border-slate-50 overflow-hidden shadow-xl mb-3 relative group">
                 {newProfilePicUrl ? (
                    <img src={newProfilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                 ) : userProfile.profilePicUrl ? (
                    <img src={userProfile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile.fullName}`} alt="avatar" className="w-full h-full object-cover" />
                 )}
               </div>
               <h2 className="text-xl font-bold flex items-center gap-2">
                 {userProfile.fullName || 'Not provided'}
               </h2>
               <div className="flex items-center gap-2 mt-1">
                 <p className="text-blue-300 font-medium text-xs">{userProfile.regNo || userProfile.empId || 'Not provided'}</p>
                 <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                 <span className="text-[10px] bg-blue-800 border border-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-200">
                   {userRankName} ({totalUserXP} XP)
                 </span>
               </div>
             </div>
             
             <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department & Academic Year</label>
                    <p className="font-semibold text-sm text-[#0f172a] dark:text-slate-100">
                      {userProfile.department || userProfile.branch || 'Not provided'}
                      {(userProfile.startYear || userProfile.endYear) ? ` (${userProfile.startYear || ''} - ${userProfile.endYear || ''})` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <p className="font-semibold text-sm text-[#0f172a] dark:text-slate-100">{userProfile.dob || 'Not provided'}</p>
                  </div>

                  {/* Profile Photo & Gallery Upload */}
                  <div className="pt-4 border-t border-blue-100 dark:border-slate-700">
                    <label className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <Camera className="w-4 h-4" /> Change Profile Photo
                    </label>

                    {/* Direct Gallery Upload Button */}
                    <div className="mb-3">
                       <label className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
                          <Camera className="w-4 h-4" />
                          <span>Choose Photo from Device Gallery</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleGalleryPhotoUpload} />
                       </label>
                    </div>

                    {/* Preset Avatars Selection */}
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">Or Select a Preset Avatar:</p>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {avatarPresets.map((avatarUrl, idx) => (
                           <div 
                              key={idx}
                              onClick={() => {
                                setNewProfilePicUrl(avatarUrl);
                                toast.success("Avatar selected!");
                              }}
                              className={`w-10 h-10 rounded-full border-2 cursor-pointer overflow-hidden transition-all shrink-0 hover:scale-110 ${newProfilePicUrl === avatarUrl ? 'border-blue-600 ring-2 ring-blue-400 scale-105' : 'border-slate-200'}`}
                           >
                              <img src={avatarUrl} alt="Avatar option" className="w-full h-full object-cover" />
                           </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={newProfilePicUrl}
                        onChange={(e) => setNewProfilePicUrl(e.target.value)}
                        placeholder="Or paste an image URL..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded-xl text-xs text-[#0f172a] dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea 
                        value={newAbout}
                        onChange={(e) => setNewAbout(e.target.value)}
                        placeholder="Write a short bio about yourself..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded-xl text-xs text-[#0f172a] dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16"
                      />
                      <button 
                        onClick={handleUpdateProfile}
                        className="w-full bg-[#0f172a] hover:bg-blue-900 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors mt-1"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* About Application Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-[#0f172a]/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden zoom-in duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh]">
             {/* Modal Header */}
             <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-5 sm:p-6 text-white flex items-center justify-between relative shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                   </div>
                   <div>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-tight">About Raisoni PeerSpace</h2>
                      <p className="text-xs text-blue-200 font-medium">Empowering Campus Learning & Doubt Resolution</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             {/* Modal Body */}
             <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Branding Banner */}
                <div className="flex flex-col items-center text-center bg-gradient-to-b from-blue-50/50 to-slate-50 dark:from-slate-800/50 dark:to-slate-800 p-5 rounded-2xl border border-blue-100 dark:border-slate-700">
                  <img src="/college-logo.png" alt="Raisoni Logo" className="h-14 mb-3 object-contain" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Raisoni PeerSpace</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">v1.2.0 Production</span>
                    <span className="text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span> Live Campus Network
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-3 leading-relaxed max-w-md">
                    Raisoni PeerSpace is an official student-faculty peer learning ecosystem designed for G.H. Raisoni College of Engineering, Nagpur. Ask doubts, get instant AI & faculty verified answers, access syllabus resources, and connect effortlessly.
                  </p>
                </div>

                {/* Key Features Grid */}
                <div>
                   <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Key Features & Highlights</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-xl flex items-start gap-2.5">
                         <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-xs font-bold text-purple-950 dark:text-purple-200">AI Doubt Solver</p>
                            <p className="text-[11px] text-purple-700/80 dark:text-purple-300">Instant AI answers for complex syllabus doubts</p>
                         </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-start gap-2.5">
                         <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-xs font-bold text-blue-950 dark:text-blue-200">Direct Faculty Connect</p>
                            <p className="text-[11px] text-blue-700/80 dark:text-blue-300">Verified answers from experienced professors</p>
                         </div>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-2.5">
                         <Ghost className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Ghost Protocol Mode</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Post anonymously without revealing identity</p>
                         </div>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl flex items-start gap-2.5">
                         <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-xs font-bold text-orange-950 dark:text-orange-200">Leaderboard & Badges</p>
                            <p className="text-[11px] text-orange-700/80 dark:text-orange-300">Earn XP & badges by helping peer students</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Contact & Support Section */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl border border-blue-800/50 shadow-lg">
                   <div className="flex items-center justify-between mb-3 border-b border-blue-800/60 pb-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                         <Info className="w-4 h-4 text-blue-400" /> Technical Contact & Support
                      </h4>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">24/7 Campus Support</span>
                   </div>

                   <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                         <span className="text-slate-400 font-medium">Developer & Lead Architect:</span>
                         <span className="font-bold text-slate-100">Sanket Chute</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-slate-400 font-medium">Campus Location:</span>
                         <span className="font-bold text-slate-100">GHRCEM / GHRCE, Nagpur</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-slate-400 font-medium">Official Support Email:</span>
                         <a href="mailto:sanketchute17@gmail.com" className="font-bold text-blue-400 hover:underline">sanketchute17@gmail.com</a>
                      </div>
                   </div>

                   <div className="mt-4 pt-3 border-t border-blue-800/60 flex items-center justify-between gap-3">
                      <a 
                         href="mailto:sanketchute17@gmail.com?subject=Raisoni PeerSpace Support Request"
                         className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-xl text-xs text-center transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                         <Send className="w-3.5 h-3.5" /> Email Support Team
                      </a>
                      <button 
                         onClick={() => {
                            navigator.clipboard.writeText("sanketchute17@gmail.com");
                            toast.success("Support email copied to clipboard! 📋");
                         }}
                         className="bg-white/10 hover:bg-white/20 text-blue-200 font-bold py-2 px-3 rounded-xl text-xs transition-colors border border-white/10"
                      >
                         Copy Email
                      </button>
                   </div>
                </div>

             </div>

             {/* Footer */}
             <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-xs shadow-sm"
                >
                  Close
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Global AI Assistant & Smart Translator Tool */}
      <AIAssistant />
    </div>
  );
}
