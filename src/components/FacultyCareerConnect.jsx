import React, { useState, useEffect } from 'react';
import { Target, BookOpen, Briefcase, GraduationCap, Send, ShieldQuestion, CheckCircle2, UserCircle, Clock, CheckCircle, MessageSquareText, Search, FileText, Image as ImageIcon } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FacultyCareerConnect() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'tracking'

  // Main Category State
  const [category, setCategory] = useState('');
  
  // Form State
  const [subCategory, setSubCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myRequests, setMyRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Configuration for dynamic categories
  const categories = [
    { id: 'subject', name: 'Subject Doubt', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'career', name: 'Career Guidance', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'placement', name: 'Placement Preparation', icon: Target, color: 'text-rose-500', bg: 'bg-rose-100' },
    { id: 'higher_studies', name: 'Higher Studies', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-100' }
  ];

  const subCategoryOptions = {
    'subject': ['Computer Science (CSE)', 'Information Tech (IT)', 'Mechanical (MECH)'],
    'career': ['Software Engineer', 'Data Scientist', 'Government Jobs', 'MBA / Business'],
    'placement': ['DSA / Coding', 'Aptitude & Logic', 'Mock Interviews & HR'],
    'higher_studies': ['GATE Preparation', 'MS in US / UK', 'CAT / MBA']
  };

  const subjectOptions = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Machine Learning'];
  
  const facultyList = ['Dr. Arvind Gupta', 'Prof. Neha Sharma', 'Dr. Vivek Deshmukh', 'Prof. Anjali Verma'];

  // Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Fetch Requests from Firebase
  useEffect(() => {
    if (!currentUser) {
      setMyRequests([]);
      return;
    }
    const q = query(
      collection(db, 'mentorshipRequests'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          displayDate: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
          sortTimestamp: data.createdAt ? data.createdAt.seconds : Infinity
        };
      });
      // Sort manually to avoid needing a composite index in Firebase
      reqs.sort((a,b) => b.sortTimestamp - a.sortTimestamp);
      setMyRequests(reqs);
    });
    return () => unsub();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !title || !currentUser) {
      if (!currentUser) alert("You must be logged in to submit a request.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'mentorshipRequests'), {
        category: categories.find(c => c.id === category)?.name || 'General Query',
        subCategory: subCategory || null,
        subject: subject || null,
        faculty: facultyName || 'Any Available Expert',
        title,
        description,
        isAnonymous,
        userId: currentUser.uid,
        status: 'Pending',
        solution: null,
        createdAt: serverTimestamp()
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setCategory(''); setSubCategory(''); setSubject('');
        setFacultyName(''); setTitle(''); setDescription(''); setIsAnonymous(false);
        setActiveTab('tracking'); 
      }, 2500);
    } catch (error) {
      console.error("Firebase submit error", error);
      alert("Error submitting to database: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubCategoryLabel = () => {
    if (category === 'subject') return 'Select Department';
    if (category === 'career') return 'Target Career Type';
    if (category === 'placement') return 'Preparation Focus Area';
    if (category === 'higher_studies') return 'Higher Studies Goal';
    return 'Select Option';
  };

  return (
    <div className="mx-auto font-sans">
      <div className="bg-white border text-left border-blue-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Header Setup */}
        <div className="bg-gradient-to-r from-[#0f172a] to-blue-900 p-6 flex items-center justify-between relative overflow-hidden">
          <Target className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-white" />
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldQuestion className="w-6 h-6 text-blue-400" />
                Expert Mentorship
              </h2>
            </div>
            <p className="text-blue-100 text-sm font-medium">Get personalized mentorship and track your requests.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-blue-50 bg-slate-50">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 relative transition-colors ${activeTab === 'new' ? 'text-blue-700 bg-white' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Send className="w-4 h-4" /> New Request
            {activeTab === 'new' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 relative transition-colors ${activeTab === 'tracking' ? 'text-blue-700 bg-white' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <Search className="w-4 h-4" /> Track Status
            {activeTab === 'tracking' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        </div>

        {/* Main Content Body */}
        <div className="p-6">
          {activeTab === 'new' && (
            isSubmitted ? (
              <div className="bg-green-50/50 border border-green-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Your request has been submitted successfully!</h3>
                <p className="text-sm font-medium text-slate-500">Redirecting you to the tracking page...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-bold text-slate-800 block mb-3">1. What kind of help do you need?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setCategory(cat.id); setSubCategory(''); setSubject(''); }}
                          className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${category === cat.id ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}
                        >
                           <div className={`${cat.bg} ${cat.color} p-2 rounded-lg mb-2`}>
                              <Icon className="w-5 h-5" />
                           </div>
                           <span className={`font-bold text-sm ${category === cat.id ? 'text-blue-800' : 'text-slate-700'}`}>{cat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dynamic Fields */}
                {category && (
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">{getSubCategoryLabel()}</label>
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                        required
                      >
                        <option value="" disabled>Select an option...</option>
                        {subCategoryOptions[category].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {category === 'subject' && (
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">Specific Subject</label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                        >
                          <option value="">General (Not subject specific)</option>
                          {subjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-slate-400" /> Preferred Mentor / Faculty (Optional)
                      </label>
                      <select
                        value={facultyName}
                        onChange={(e) => setFacultyName(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      >
                        <option value="">Any available expert</option>
                        {facultyList.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Text Input */}
                {category && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Title / Subject of your request</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. How to prepare for Amazon SDE 1?" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Detailed Description</label>
                      <textarea 
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide some background so the mentor understands your context..." 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium text-slate-800"
                        required
                      ></textarea>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Submit Anonymously</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Your name will be hidden from the faculty.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !title || !description}
                      className="w-full bg-[#0f172a] hover:bg-blue-900 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 transform hover:-translate-y-0.5"
                    >
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send className="w-5 h-5" /> Send Request</>}
                    </button>
                  </div>
                )}
              </form>
            )
          )}

          {/* Tracking Module */}
          {activeTab === 'tracking' && (
            <div className="space-y-4 animate-in fade-in">
              {myRequests.length === 0 ? (
                <div className="text-center py-10">
                   <ShieldQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                   <h3 className="font-bold text-slate-500">No requests yet</h3>
                </div>
              ) : (
                myRequests.map((req) => (
                  <div key={req.id} className="bg-white border text-left border-blue-50 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-blue-50 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-[10px] uppercase font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider">
                             {req.category}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                             <Clock className="w-3 h-3" /> {req.displayDate}
                           </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-[15px] mb-1">{req.title}</h4>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                           <UserCircle className="w-3.5 h-3.5 text-slate-400" /> Sent to: {req.faculty}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        {req.status === 'Solved' ? (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                             <CheckCircle className="w-3.5 h-3.5" />
                             <span className="text-xs font-extrabold uppercase">Solved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                             <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                             <span className="text-xs font-extrabold uppercase">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Solution Module */}
                    {req.status === 'Solved' && (req.solution || req.facultyAttachment) && (
                      <div className="bg-blue-50/30 p-4 border-t border-blue-50">
                        <div className="flex gap-2">
                           <MessageSquareText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                           <div className="flex-1 min-w-0">
                             <p className="text-xs font-extrabold text-blue-900 mb-2">Expert's Response:</p>
                             {req.solution && (
                               <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white border border-blue-50 p-3 rounded-xl shadow-sm mb-3">
                                 {req.solution}
                               </p>
                             )}
                             {req.facultyAttachment && (
                               <a 
                                 href={req.facultyAttachment.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm inline-flex max-w-full"
                               >
                                 {req.facultyAttachment.type?.startsWith('image/') ? (
                                   <ImageIcon className="w-6 h-6 text-blue-500 shrink-0" />
                                 ) : (
                                   <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                                 )}
                                 <div className="flex flex-col min-w-0">
                                   <span className="text-sm font-bold text-slate-700 truncate">{req.facultyAttachment.name}</span>
                                   <span className="text-xs font-semibold text-blue-600">Click to view attachment</span>
                                 </div>
                               </a>
                             )}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
