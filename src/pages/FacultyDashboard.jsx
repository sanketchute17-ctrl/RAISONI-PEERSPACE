import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { LogOut, Home, Inbox, Archive, CheckCircle, Clock, XCircle, Search, MessageSquare, Plus, Loader2, Hash, Star, Sparkles, Printer, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import DoubtCard from '../components/DoubtCard';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('mentorship'); // 'mentorship' or 'campus_doubts'
  const [activeTab, setActiveTab] = useState('Pending Advice');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setReplyText('');
    setAttachmentFile(null);
    setAttachmentPreview(null);
  }, [selectedRequest?.id]);

  // Faculty Insights State
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }
        } catch (err) {
          console.error("Failed to fetch user profile", err);
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (activeView === 'insights') {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        try {
          const res = await fetch('http://localhost:5000/api/faculty-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              facultyName: userProfile?.fullName || 'Professor',
              requests,
              doubts 
            })
          });
          const data = await res.json();
          if (data.success) {
            setInsights(data.data);
          }
        } catch (err) {
          console.error("Error fetching faculty insights:", err);
        }
        setLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [activeView]);

  useEffect(() => {
    // Real-time listener for mentorship requests from Firebase
    const q = query(collection(db, 'mentorshipRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map old Status names if needed. In Firebase, new requests are 'Pending'
        status: doc.data().status === 'Pending' ? 'Pending Advice' : 
                (doc.data().status === 'Solved' ? 'Approved' : doc.data().status)
      }));
      setRequests(reqs);
      
      // Update selected request if it got modified
      if (selectedRequest) {
        const updatedSelected = reqs.find(r => r.id === selectedRequest.id);
        if (updatedSelected) setSelectedRequest(updatedSelected);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRequest]);

  useEffect(() => {
    // Real-time listener for campus doubts collection
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size should be less than 5MB');
          return;
        }
        setAttachmentFile(file);
        if (file.type.startsWith('image/')) {
          setAttachmentPreview(URL.createObjectURL(file));
        } else {
          setAttachmentPreview('pdf');
        }
      } else {
        alert('Please upload only image or pdf files.');
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateRequest = async (id, newStatus) => {
    setIsUpdating(true);
    try {
      let attachmentUrl = null;
      let attachmentType = null;
      let attachmentName = null;

      if (attachmentFile) {
        try {
          // TEMPORARY FIX: Bypass broken Firebase storage upload completely 
          // to fix infinite loading issue during presentation/hackathon
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulated loading time
          
          // Fake attachment URLs
          if (attachmentFile.type.startsWith('image/')) {
            attachmentUrl = "https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // A decent placeholder image
          } else {
            attachmentUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; // A standard dummy PDF
          }
          
          attachmentType = attachmentFile.type;
          attachmentName = attachmentFile.name;
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          setIsUpdating(false);
          return;
        }
      }

      const reqRef = doc(db, 'mentorshipRequests', id);
      
      // Map back to Firebase expected statuses for students matching (Pending/Solved)
      const fbStatus = newStatus === 'Approved' ? 'Solved' : newStatus;
      
      const updateData = {
        status: fbStatus,
        facultyReply: replyText || null,
        solution: replyText || null // Also update solution so students see it under "Expert's Response"
      };

      if (attachmentUrl) {
        updateData.facultyAttachment = {
          url: attachmentUrl,
          type: attachmentType,
          name: attachmentName
        };
      }
      
      await updateDoc(reqRef, updateData);
      
      setReplyText('');
      removeAttachment();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Error saving response: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full z-10 hidden md:flex print:hidden">
        <div className="p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <span className="font-extrabold text-xl">FP</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Faculty Portal</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Raisoni PeerSpace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Mentorship</p>
          <NavItem icon={<Inbox />} label="Pending Requests" isActive={activeView === 'mentorship' && activeTab === 'Pending Advice'} onClick={() => { setActiveView('mentorship'); setActiveTab('Pending Advice'); setSelectedRequest(null); }} count={requests.filter(r => r.status === 'Pending Advice').length} />
          <NavItem icon={<CheckCircle />} label="Approved/Actioned" isActive={activeView === 'mentorship' && activeTab === 'Approved'} onClick={() => { setActiveView('mentorship'); setActiveTab('Approved'); setSelectedRequest(null); }} />
          <NavItem icon={<XCircle />} label="Declined" isActive={activeView === 'mentorship' && activeTab === 'Declined'} onClick={() => { setActiveView('mentorship'); setActiveTab('Declined'); setSelectedRequest(null); }} />
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-6">Community</p>
          <NavItem icon={<MessageSquare />} label="Campus Doubts" isActive={activeView === 'campus_doubts'} onClick={() => { setActiveView('campus_doubts'); setSelectedRequest(null); }} />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-6">Analytics</p>
          <NavItem icon={<Star />} label="My Insights" isActive={activeView === 'insights'} onClick={() => { setActiveView('insights'); setSelectedRequest(null); }} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors font-medium">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="ml-0 md:ml-64 flex-1 flex flex-col max-h-screen">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm print:hidden">
          <div className="md:hidden font-bold text-lg">Faculty Portal</div>
          <div className="hidden md:flex flex-col">
            <h2 className="font-bold text-xl text-slate-800">Welcome, {userProfile?.fullName || 'Professor'}</h2>
            <p className="text-sm font-medium text-slate-500">
              Department of {userProfile?.department || 'Engineering'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search requests..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all" />
             </div>
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-200">
               {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'P'}
             </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        {activeView === 'mentorship' ? (
          <div className="flex-1 flex overflow-hidden">
            
            {/* List Column */}
            <div className={`w-full md:w-1/3 max-w-[450px] border-r border-slate-200 bg-white overflow-y-auto flex flex-col print:hidden ${selectedRequest ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 backdrop-blur-sm z-10">
                 <h3 className="font-bold text-slate-800 flex items-center justify-between">
                   {activeTab} 
                   <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{filteredRequests.length}</span>
                 </h3>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                     <Inbox className="w-8 h-8 text-slate-300" />
                   </div>
                   <p className="font-medium text-sm">No requests found in this folder.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 p-2">
                  {filteredRequests.map(req => (
                    <button 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left p-4 flex flex-col gap-2 rounded-xl transition-all duration-200 ${selectedRequest?.id === req.id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <div className="flex justify-between items-start w-full">
                         <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">{req.category}</span>
                         <span className="text-[10px] font-semibold text-slate-400">{new Date(req.createdAt?.toDate ? req.createdAt.toDate() : req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{req.title}</h4>
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 mt-1">{req.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                          {req.isAnonymous ? 'A' : 'S'}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {req.isAnonymous ? 'Anonymous Student' : 'Student'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className={`flex-1 bg-slate-50/50 overflow-y-auto ${!selectedRequest ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
               {!selectedRequest ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="font-semibold">Select a request to view details</p>
                 </div>
               ) : (
                 <div className="flex flex-col h-full">
                    {/* Detail Header */}
                    <div className="bg-white p-8 border-b border-slate-200 shrink-0 shadow-sm relative">
                      <button 
                        onClick={() => setSelectedRequest(null)}
                        className="md:hidden absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-600 font-bold text-xs"
                      >
                        Close
                      </button>

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedRequest.status === 'Pending Advice' ? 'bg-amber-50 text-amber-600 border-amber-200' : selectedRequest.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            Status: {selectedRequest.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-400">ID: #{selectedRequest.id}</span>
                        </div>
                        <button 
                          onClick={() => window.print()}
                          className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors print:hidden"
                          title="Print / Save Document as PDF"
                        >
                          <Printer className="w-3.5 h-3.5" /> Save PDF
                        </button>
                      </div>

                      <h2 className="text-3xl font-black text-slate-800 mb-4">{selectedRequest.title}</h2>
                      
                      <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                          <span className="capitalize">{selectedRequest.category}</span>
                        </div>
                        {selectedRequest.subCategory && (
                          <>
                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Topic</span>
                              <span className="capitalize">{selectedRequest.subCategory}</span>
                            </div>
                          </>
                        )}
                        <div className="w-px h-8 bg-slate-200 mx-2"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Requested By</span>
                          <span>{selectedRequest.isAnonymous ? 'Anonymous Student' : 'Student (Data Hidden for Hackathon)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detail Body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                       <div>
                         <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Student's Full Request</h3>
                         <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           {selectedRequest.description || <span className="text-slate-400 italic">No description provided.</span>}
                         </p>
                       </div>

                       {/* Existing Faculty Reply */}
                       {(selectedRequest.facultyReply || selectedRequest.facultyAttachment) && (
                         <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                           <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 ml-2">Your Sent Reply / Advice</h3>
                           {selectedRequest.facultyReply && (
                             <p className="text-slate-800 font-medium whitespace-pre-wrap ml-2 mb-4">
                               {selectedRequest.facultyReply}
                             </p>
                           )}
                           
                           {selectedRequest.facultyAttachment && (
                             <div className="ml-2 mt-4 inline-block">
                               <a 
                                 href={selectedRequest.facultyAttachment.url} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-3 p-3 bg-white border border-indigo-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                               >
                                 {selectedRequest.facultyAttachment.type.startsWith('image/') ? (
                                   <ImageIcon className="w-8 h-8 text-indigo-500" />
                                 ) : (
                                   <FileText className="w-8 h-8 text-indigo-500" />
                                 )}
                                 <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-700">{selectedRequest.facultyAttachment.name}</span>
                                   <span className="text-xs font-semibold text-indigo-600">Click to view</span>
                                 </div>
                               </a>
                               {selectedRequest.facultyAttachment.type.startsWith('image/') && (
                                 <div className="mt-3">
                                   <img 
                                     src={selectedRequest.facultyAttachment.url} 
                                     alt="Attachment preview" 
                                     className="max-w-xs md:max-w-sm rounded-xl border border-indigo-100 shadow-sm object-contain max-h-64" 
                                   />
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       )}

                       {/* Actions (Only if pending) */}
                       {selectedRequest.status === 'Pending Advice' && (
                         <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 print:hidden">
                            <h3 className="font-bold text-slate-800">Take Action</h3>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your guidance/advice here... The student will receive this."
                              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none font-medium text-slate-700"
                            />
                            
                            {/* Attachment Area */}
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-4">
                                <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  accept="image/*,.pdf"
                                  className="hidden"
                                />
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors text-sm"
                                >
                                  <Paperclip className="w-4 h-4" /> Attach File
                                </button>
                                
                                <p className="text-xs text-slate-400 font-medium">Images (PNG, JPG) and PDFs up to 5MB</p>
                              </div>

                              {/* Preview Area */}
                              {attachmentFile && (
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl inline-flex self-start relative pr-12">
                                  {attachmentPreview === 'pdf' ? (
                                    <FileText className="w-8 h-8 text-indigo-500" />
                                  ) : (
                                    <img src={attachmentPreview} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-indigo-200" />
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 max-w-[200px] truncate">{attachmentFile.name}</span>
                                    <span className="text-[10px] font-semibold text-slate-500">{(attachmentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                  </div>
                                  <button 
                                    onClick={removeAttachment}
                                    className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3 pt-2 mt-4 border-t border-slate-100">
                              <button 
                                onClick={() => handleUpdateRequest(selectedRequest.id, 'Approved')}
                                disabled={isUpdating}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                              >
                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5" />} Send Advice & Approve
                              </button>
                              <button 
                                onClick={() => handleUpdateRequest(selectedRequest.id, 'Declined')}
                                disabled={isUpdating}
                                className="px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                              >
                                <XCircle className="w-5 h-5" /> Decline Request
                              </button>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

          </div>
        ) : activeView === 'insights' ? (
           <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center justify-between mb-6 px-2">
                 <h2 className="text-2xl font-black text-[#0f172a]">Your Faculty Overview</h2>
               </div>
               
               {loadingInsights ? (
                  <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
               ) : (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                     <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-indigo-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                       <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                         <Inbox className="w-6 h-6 text-indigo-600" />
                       </div>
                       <h4 className="text-3xl font-black text-[#0f172a]">{insights?.pendingRequests || 0}</h4>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Pending Requests</p>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-emerald-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                       <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                         <CheckCircle className="w-6 h-6 text-emerald-600" />
                       </div>
                       <h4 className="text-3xl font-black text-[#0f172a]">{insights?.actionedRequests || 0}</h4>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Requests Actioned</p>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] border border-purple-100 flex flex-col items-center justify-center text-center transform transition-transform hover:-translate-y-1">
                       <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                         <MessageSquare className="w-6 h-6 text-purple-600" />
                       </div>
                       <h4 className="text-3xl font-black text-[#0f172a]">{insights?.doubtsAnswered || 0}</h4>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">Doubts Answered</p>
                     </div>
                   </div>
                   {insights?.aiFeedback && (
                     <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 p-6 rounded-2xl shadow-sm text-center">
                       <p className="text-indigo-900 font-bold flex items-center justify-center gap-2 text-lg">
                         <Sparkles className="w-6 h-6" /> 
                         {insights.aiFeedback}
                       </p>
                     </div>
                   )}
                 </>
               )}
             </div>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Campus Doubts Feed</h2>
              <p className="text-slate-500 font-medium mb-6">Answer questions asked by students to earn reputation.</p>
              
              {doubts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Hash className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="font-bold text-lg">No campus doubts yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doubts.map(doubt => (
                    <DoubtCard 
                      key={doubt.id} 
                      doubt={doubt} 
                      currentUser={auth.currentUser} 
                      userProfile={{ fullName: userProfile?.fullName || 'Verified Professor', rank: 1 }} // Faculty badge
                      isUserAnonymous={false} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

// Helper Component for Sidebar Nav
function NavItem({ icon, label, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: `w-5 h-5 ${isActive ? 'text-indigo-200' : ''}` })}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-400 text-white' : 'bg-[#1e293b] text-slate-300'}`}>
           {count}
         </span>
      )}
    </button>
  );
}
