import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, Plus, Search, Filter, Bookmark, Trash2, Loader2, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function StudyHub({ currentUser, userProfile, role }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedResourceIds, setSavedResourceIds] = useState([]);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes');
  const [branch, setBranch] = useState(userProfile?.branch || 'CSE');
  const [semester, setSemester] = useState('Sem 3');
  const [subject, setSubject] = useState('');
  const [unit, setUnit] = useState('Unit 1-4');
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const isFaculty = role === 'faculty';

  // Real-time Firestore sync with zero dummy data
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'study_resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Apply branch, semester, category, and search filters
      if (selectedBranch !== 'All') list = list.filter(r => r.branch === selectedBranch);
      if (selectedSemester !== 'All') list = list.filter(r => r.semester === selectedSemester);
      if (selectedCategory !== 'All') list = list.filter(r => r.category === selectedCategory);
      if (searchQuery.trim()) {
        const qStr = searchQuery.toLowerCase();
        list = list.filter(r => (r.title && r.title.toLowerCase().includes(qStr)) || (r.subject && r.subject.toLowerCase().includes(qStr)));
      }

      setResources(list);
      setLoading(false);
    }, (err) => {
      console.log("Firestore study_resources snapshot fallback:", err);
      fetchResources();
    });

    return () => unsubscribe();
  }, [selectedBranch, selectedSemester, selectedCategory, searchQuery]);

  const fetchResources = async () => {
    try {
      let url = `${API_BASE}/api/resources?branch=${selectedBranch}&semester=${selectedSemester}&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setResources(data.data);
      }
    } catch (err) {
      console.error("Error fetching study resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) {
      toast.error("Please fill in Resource Title and Subject.");
      return;
    }

    setIsUploading(true);
    try {
      const resourceData = {
        title: title.trim(),
        category,
        branch,
        semester,
        subject: subject.trim(),
        unit,
        author: userProfile?.fullName || (isFaculty ? 'Verified Professor' : 'Student'),
        authorRole: isFaculty ? 'faculty' : 'student',
        authorUid: currentUser?.uid || 'anonymous',
        downloadCount: 0,
        fileUrl: fileUrl || '#',
        createdAt: serverTimestamp()
      };

      // Save directly to Firestore collection study_resources
      await addDoc(collection(db, 'study_resources'), resourceData);
      
      // Notify backend server
      try {
        await fetch(`${API_BASE}/api/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceData)
        });
      } catch (e) {}

      toast.success("Study Material Uploaded & Live! 📚");
      setTitle('');
      setSubject('');
      setFileUrl('');
      setIsUploadOpen(false);
    } catch (err) {
      console.error("Error uploading resource:", err);
      toast.error("Failed to upload resource.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'study_resources', id));

      // Notify backend server
      try {
        await fetch(`${API_BASE}/api/resources/${id}`, { method: 'DELETE' });
      } catch (e) {}

      toast.success("Resource deleted permanently.");
    } catch (err) {
      toast.error("Failed to delete resource.");
    }
  };

  const toggleSaveBookmark = (id) => {
    if (savedResourceIds.includes(id)) {
      setSavedResourceIds(prev => prev.filter(x => x !== id));
      toast.success("Removed from Saved Bookmarks!");
    } else {
      setSavedResourceIds(prev => [...prev, id]);
      toast.success("Saved to Academic Bookmarks! 🔖");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div className="space-y-2 max-w-xl z-10">
            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
               <BookOpen className="w-3.5 h-3.5" /> Academic Resource Repository
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
               Raisoni Centralized Study Hub
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium leading-relaxed">
               Access verified professor handwritten notes, past 5-year question papers, model answer keys, and lab manuals organized by branch & semester.
            </p>
         </div>

         {/* Upload Button */}
         <button 
            onClick={() => setIsUploadOpen(true)}
            className="z-10 shrink-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
         >
            <Plus className="w-4 h-4" />
            <span>Upload Study Material</span>
         </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
         {/* Search & Categories Row */}
         <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes, subjects..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto custom-scrollbar">
               {['All', 'Notes', 'Previous Year Papers', 'Question Banks', 'Lab Manuals'].map(cat => (
                  <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>
         </div>

         {/* Branch & Semester Selector Row */}
         <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Branch:</span>
               <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-semibold text-slate-800 dark:text-slate-100 outline-none"
               >
                  {['All', 'CSE', 'IT', 'MECH', 'CIVIL', 'EXTC', 'AI', 'AIML', 'DS'].map(b => (
                     <option key={b} value={b}>{b}</option>
                  ))}
               </select>
            </div>

            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Semester:</span>
               <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-semibold text-slate-800 dark:text-slate-100 outline-none"
               >
                  {['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map(s => (
                     <option key={s} value={s}>{s}</option>
                  ))}
               </select>
            </div>
         </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
         <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : resources.length === 0 ? (
         <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-700 dark:text-slate-200">No resources found</h3>
            <p className="text-xs text-slate-400 mt-1">Be the first to upload materials for {selectedBranch} {selectedSemester}!</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resources.map(item => (
               <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                  <div>
                     <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                           {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                           <button 
                              onClick={() => toggleSaveBookmark(item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${savedResourceIds.includes(item.id) ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' : 'text-slate-400 hover:text-slate-600'}`}
                              title="Bookmark Resource"
                           >
                              <Bookmark className="w-4 h-4 fill-current" />
                           </button>
                           {isFaculty && (
                              <button 
                                 onClick={() => handleDeleteResource(item.id)}
                                 className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                 title="Delete Resource"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     </div>

                     <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {item.title}
                     </h3>
                     <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {item.subject} • {item.unit}
                     </p>

                     <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                           {item.authorRole === 'faculty' ? <UserCheck className="w-3.5 h-3.5 text-green-500" /> : null}
                           {item.author}
                        </span>
                        <span>•</span>
                        <span>{item.branch} ({item.semester})</span>
                     </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                     <span className="text-[11px] font-bold text-slate-400">📥 {item.downloadCount} Downloads</span>
                     <button 
                        onClick={() => {
                           toast.success(`Accessing ${item.title}...`);
                           window.open(item.fileUrl || '#', '_blank');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                     >
                        <Download className="w-3.5 h-3.5" /> Download / View
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Upload Resource Modal */}
      {isUploadOpen && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0f172a]/75 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
               <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-blue-400" /> Upload Academic Material
                  </h3>
                  <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white">✕</button>
               </div>

               <form onSubmit={handleUploadResource} className="p-5 space-y-4 text-xs">
                  <div>
                     <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Material Title</label>
                     <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Data Structures Unit 1 Complete Notes"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none" 
                        required 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold">
                           <option value="Notes">Notes</option>
                           <option value="Previous Year Papers">Previous Year Papers</option>
                           <option value="Question Banks">Question Banks</option>
                           <option value="Lab Manuals">Lab Manuals</option>
                           <option value="Important Questions">Important Questions</option>
                        </select>
                     </div>
                     <div>
                        <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Branch</label>
                        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold">
                           <option value="CSE">CSE</option>
                           <option value="IT">IT</option>
                           <option value="MECH">MECH</option>
                           <option value="CIVIL">CIVIL</option>
                           <option value="EXTC">EXTC</option>
                           <option value="AI">AI</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject Name</label>
                        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Operating Systems" className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold" required />
                     </div>
                     <div>
                        <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Semester & Unit</label>
                        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Sem 3 (Unit 1-4)" className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold" />
                     </div>
                  </div>

                  <div>
                     <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Upload PDF / Document File</label>
                     <div className="flex flex-col gap-2">
                        <input 
                           type="file" 
                           accept=".pdf,image/*,.doc,.docx"
                           onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 if (file.size > 10 * 1024 * 1024) {
                                    toast.error("File size must be under 10MB");
                                    return;
                                 }
                                 const reader = new FileReader();
                                 reader.onload = (evt) => {
                                    setFileUrl(evt.target.result);
                                    toast.success(`Attached ${file.name}!`);
                                 };
                                 reader.readAsDataURL(file);
                              }
                           }}
                           className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300"
                        />
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-slate-400 font-bold uppercase">Or paste URL:</span>
                           <input 
                              type="text" 
                              value={fileUrl} 
                              onChange={(e) => setFileUrl(e.target.value)} 
                              placeholder="https://drive.google.com/..." 
                              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold" 
                           />
                        </div>
                     </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                     <button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-2">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload Material
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
   </div>
  );
}
