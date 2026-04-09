import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, PlusCircle, Ghost, User, X, BookOpen, Trophy, Hash, Star, LogOut, Camera, LayoutDashboard, ShieldQuestion, MapPin, Mic, Loader2, Paperclip, BarChart2, History, Trash2 } from 'lucide-react';
import DoubtCard from '../components/DoubtCard';
import FacultyCareerConnect from '../components/FacultyCareerConnect';
import { auth, db, storage } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import AIAssistant from '../components/AIAssistant';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  // Check if user logged in anonymously from the login page state
  const isUserAnonymous = location.state?.isAnonymous || false;

  const [activeView, setActiveView] = useState('doubts'); // 'doubts', 'mentorship', 'lostfound'
  const [doubts, setDoubts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // Real Profile State
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProfilePicUrl, setNewProfilePicUrl] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Insights State
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (activeView === 'insights') {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
          const res = await fetch('http://localhost:5000/api/user-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              uid: currentUser?.uid || 'anonymous', 
              userFullName: userProfile?.fullName || 'Student',
              doubts: doubts 
            })
          });
          const data = await res.json();
          if (data.success) {
            setInsights(data.data);
          }
        } catch (err) {
          console.error("Error fetching insights:", err);
        }
        setLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [activeView]);

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isUserAnonymous) {
        setCurrentUser(user);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);
            setNewProfilePicUrl(data.profilePicUrl || '');
          } else {
            setUserProfile({
               fullName: user.displayName || user.email.split('@')[0] || 'Student',
               regNo: 'Please recreate account',
               branch: 'Unknown',
               startYear: '',
               endYear: '',
               dob: '',
               profilePicUrl: user.photoURL || ''
            });
          }
        } catch(e) {
          console.error("Firestore error:", e);
          setUserProfile({
             fullName: 'Student (DB Not Connected)',
             regNo: 'Error',
             branch: 'Setup Firestore',
             startYear: '',
             endYear: '',
             dob: '',
             profilePicUrl: ''
          });
        }
      } else if (!isUserAnonymous && !user) {
        // Not logged in and not anonymous, go back to login
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, isUserAnonymous]);

  const handleUpdateProfilePic = async () => {
    if (currentUser && newProfilePicUrl) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profilePicUrl: newProfilePicUrl
      });
      setUserProfile({...userProfile, profilePicUrl: newProfilePicUrl});
      alert("Profile photo updated!");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
    const existingDoubt = doubts.find(d => d.title.trim().toLowerCase() === newTitle.trim().toLowerCase());
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
      const aiRes = await fetch('http://localhost:5000/api/analyze-doubt', {
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
        let branchUrl = 'http://localhost:5000/api/subjects';
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

  const leaderboard = [
    { name: "Rahul Sharma", points: 1420, rank: 1 },
    { name: "Priya Singh", points: 980, rank: 2 },
    { name: "Aman D.", points: 650, rank: 3 }
  ];

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

  const totalUserXP = doubts.filter(d => d.authorId === (currentUser?.uid || 'anonymous')).reduce((acc, curr) => acc + (curr.upvotes || 0), 0);
  const userRankName = totalUserXP < 10 ? "Rookie" : totalUserXP < 50 ? "Campus Scholar" : "Campus Star";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0f172a] border-b border-blue-900 px-4 py-2 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo & College Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <User className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-50 block leading-none">PeerSpace</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">G.H. Raisoni College</span>
            </div>
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
          <div className="flex items-center gap-5">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="text-slate-300 hover:text-white transition-colors relative outline-none"
              >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute top-10 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                   <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                   </div>
                   <div className="max-h-80 overflow-y-auto custom-scrollbar">
                     {notifications.length === 0 ? (
                       <div className="px-4 py-8 text-center text-slate-500 text-sm font-medium">No new notifications</div>
                     ) : (
                       notifications.map(n => (
                         <div key={n.id} className={`px-4 py-3 border-b border-slate-50 ${n.read ? 'bg-white' : 'bg-blue-50/50'} hover:bg-slate-50 transition-colors`}>
                           <p className="text-sm font-bold text-slate-800">{n.title}</p>
                           <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                           <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{n.timeAgo}</p>
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

      {/* Main 3-Column Layout */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 items-start">
        
        {/* LEFT SIDEBAR: Navigation & Categorization */}
        <aside className="hidden lg:block w-64 shrink-0 top-24 sticky space-y-6">
          
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
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
            <h3 className="font-bold text-[#0f172a] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-blue-700" />
              Topics Filter
            </h3>
            <ul className="space-y-1">
              {subjects.map((sub, idx) => (
                <li key={idx}>
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800 transition-colors flex items-center gap-3">
                    <Hash className="w-4 h-4 text-blue-300" />
                    {sub}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* CENTER VIEW: Dynamic Content Render */}
        <div className="flex-1 min-w-0">
          
          {activeView === 'doubts' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white border border-blue-100 p-4 rounded-2xl mb-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                     {isUserAnonymous ? <Ghost className="w-5 h-5 text-blue-800" /> : <User className="w-5 h-5 text-blue-800" />}
                  </div>
                  <div className="bg-slate-50 flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-blue-50/50 hover:text-slate-700 transition-colors border border-transparent hover:border-blue-100">
                    What syllabus topic are you struggling with?
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank === 1 ? 'bg-blue-100 text-blue-700' : user.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                      #{user.rank}
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
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden zoom-in duration-200">
             <div className="bg-gradient-to-r from-[#0f172a] to-blue-900 p-6 flex flex-col items-center justify-center text-slate-50 relative">
               <button 
                 onClick={() => setIsProfileModalOpen(false)}
                 className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
               <div className="w-24 h-24 rounded-full bg-blue-950 border-4 border-slate-50 overflow-hidden shadow-lg mb-3">
                 {userProfile.profilePicUrl ? (
                    <img src={userProfile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile.fullName}`} alt="avatar" className="w-full h-full object-cover" />
                 )}
               </div>
               <h2 className="text-xl font-bold flex items-center gap-2">
                 {userProfile.fullName}
               </h2>
               <div className="flex items-center gap-2 mt-1">
                 <p className="text-blue-300 font-medium text-xs">{userProfile.regNo}</p>
                 <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                 <span className="text-[10px] bg-blue-800 border border-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-blue-200">
                   {userRankName} ({totalUserXP} XP)
                 </span>
               </div>
            </div>
            
            <div className="p-6">
               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                   <p className="font-medium text-[#0f172a]">{userProfile.branch} ({userProfile.startYear} - {userProfile.endYear})</p>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                   <p className="font-medium text-[#0f172a]">{userProfile.dob}</p>
                 </div>
                 <div className="pt-4 border-t border-blue-100">
                   <label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                     <Camera className="w-3 h-3" /> Update Photo URL
                   </label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={newProfilePicUrl}
                       onChange={(e) => setNewProfilePicUrl(e.target.value)}
                       placeholder="Paste image URL here..."
                       className="flex-1 px-3 py-2 bg-slate-50 border border-blue-100 rounded-lg text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <button 
                       onClick={handleUpdateProfilePic}
                       className="bg-[#0f172a] hover:bg-blue-900 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                     >
                       Save
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Global AI Assistant & Smart Translator Tool */}
      <AIAssistant />
    </div>
  );
}
