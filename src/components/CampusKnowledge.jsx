import React, { useState } from 'react';
import { Search, Sparkles, BookOpen, MessageSquare, Briefcase, Bell, ArrowRight, Filter, ExternalLink, CheckCircle2, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampusKnowledge({ doubts = [], onSelectDoubt }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'doubts', 'resources', 'placements', 'announcements'
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Sample Knowledge Base Data
  const resourcesList = [
    { id: 1, title: "Data Structures & Algorithms Solved Question Bank 2025", category: "Notes", branch: "CSE", sem: "Sem 3", downloads: 340 },
    { id: 2, title: "Operating Systems System Calls Lab Manual", category: "Lab Manuals", branch: "IT", sem: "Sem 4", downloads: 180 },
    { id: 3, title: "Fluid Mechanics Formula Sheet & Gate PYQs", category: "PYQs", branch: "CIVIL", sem: "Sem 4", downloads: 210 }
  ];

  const placementKnowledge = [
    { id: 101, company: "TCS Digital", topic: "Technical Interview Questions & SQL Queries", author: "Akash V. (CSE)", upvotes: 45 },
    { id: 102, company: "Infosys SP", topic: "Coding Assessment Pattern & Dynamic Programming Tips", author: "Priya S. (IT)", upvotes: 62 }
  ];

  const announcementsList = [
    { id: 201, title: "Mid-Semester Exam Timetable Released for CSE & IT", date: "2026-08-20", category: "Academic" },
    { id: 202, title: "Raisoni PeerSpace Hackathon Registration Open", date: "2026-08-22", category: "Event" }
  ];

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    // Simulate AI synthesized summary for the search query
    setTimeout(() => {
      setAiSummary(`Campus Knowledge Search Summary for "${query}": Found ${doubts.length + resourcesList.length} relevant entries across syllabus doubts, faculty answers, and academic study notes. Review the categorized results below.`);
      setIsSearching(false);
      toast.success("Campus Knowledge Search Completed!");
    }, 600);
  };

  const filteredDoubts = doubts.filter(d => {
    if (!query) return true;
    const q = query.toLowerCase();
    return d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.tags?.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
             <Sparkles className="w-3.5 h-3.5" /> Campus Knowledge Search Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Search Entire Raisoni PeerSpace Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/90 font-medium leading-relaxed">
            Instantly search across Student Doubts, Faculty Verified Answers, PYQ Study Notes, Placement Experiences, and Campus Announcements.
          </p>

          {/* Search Bar Input */}
          <form onSubmit={handleGlobalSearch} className="pt-2 flex items-center gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                   type="text"
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder='Search e.g. "How to prepare for TCS?", "Normalization", "Fluid Mechanics Notes"...'
                   className="w-full pl-12 pr-4 py-3.5 bg-white/10 dark:bg-slate-900/80 backdrop-blur border border-blue-400/30 rounded-2xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-inner"
                />
             </div>
             <button 
                type="submit"
                disabled={isSearching}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
             >
                {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
             </button>
          </form>
        </div>
      </div>

      {/* Category Tabs & Branch Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
         {/* Category Tabs */}
         <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto custom-scrollbar">
            {[
               { id: 'all', label: 'All Results', icon: Sparkles },
               { id: 'doubts', label: 'Campus Doubts', icon: MessageSquare },
               { id: 'resources', label: 'Study Resources', icon: BookOpen },
               { id: 'placements', label: 'Placement Hub', icon: Briefcase },
               { id: 'announcements', label: 'Announcements', icon: Bell }
            ].map(tab => {
               const Icon = tab.icon;
               return (
                  <button
                     key={tab.id}
                     onClick={() => setActiveCategory(tab.id)}
                     className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${activeCategory === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                     <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
               );
            })}
         </div>

         {/* Branch Filter */}
         <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter Branch:</span>
            <select 
               value={selectedBranch}
               onChange={(e) => setSelectedBranch(e.target.value)}
               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
            >
               <option value="All">All Branches</option>
               <option value="CSE">CSE</option>
               <option value="IT">IT</option>
               <option value="MECH">MECH</option>
               <option value="CIVIL">CIVIL</option>
               <option value="EXTC">EXTC</option>
            </select>
         </div>
      </div>

      {/* AI Synthesized Summary Card (If query entered) */}
      {aiSummary && (
         <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 text-white p-5 rounded-2xl border border-purple-500/40 shadow-md space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
               <h3 className="font-extrabold text-sm uppercase tracking-wider text-purple-200">AI Campus Knowledge Insight</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">{aiSummary}</p>
         </div>
      )}

      {/* Categorized Results Grid */}
      <div className="space-y-6">
         
         {/* Section 1: Campus Doubts & Q&A */}
         {(activeCategory === 'all' || activeCategory === 'doubts') && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                     Campus Doubts & Solutions ({filteredDoubts.length})
                  </h3>
               </div>
               
               {filteredDoubts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center font-medium">No matching campus doubts found for this search.</p>
               ) : (
                  <div className="space-y-3">
                     {filteredDoubts.map(doubt => (
                        <div 
                           key={doubt.id}
                           onClick={() => onSelectDoubt && onSelectDoubt(doubt)}
                           className="p-4 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                           <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                 <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                    {doubt.tags?.[0] || 'General'}
                                 </span>
                                 <span className="text-[11px] text-slate-400 font-medium">By {doubt.author || 'Student'}</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                                 {doubt.title}
                              </h4>
                           </div>
                           <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                              <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                                 {doubt.answers?.length || 0} Answers
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {/* Section 2: Study Resources Knowledge */}
         {(activeCategory === 'all' || activeCategory === 'resources') && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                     Study Resources & Material
                  </h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {resourcesList.map(item => (
                     <div key={item.id} className="p-4 bg-purple-50/50 dark:bg-slate-900 border border-purple-100 dark:border-slate-700/60 rounded-2xl flex flex-col justify-between gap-3">
                        <div>
                           <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">{item.category}</span>
                           <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-2 line-clamp-2">{item.title}</h4>
                           <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold mt-1">{item.branch} • {item.sem}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-purple-100 dark:border-slate-800 pt-2 text-[11px]">
                           <span className="text-slate-500 font-medium">📥 {item.downloads} Downloads</span>
                           <button onClick={() => toast.success(`Downloading ${item.title}...`)} className="font-bold text-purple-600 hover:underline flex items-center gap-1">
                              View <ExternalLink className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Section 3: Placement Knowledge & Experiences */}
         {(activeCategory === 'all' || activeCategory === 'placements') && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
               <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                     <Briefcase className="w-5 h-5 text-amber-500" />
                     Placement Knowledge & Interview Experiences
                  </h3>
               </div>
               
               <div className="space-y-3">
                  {placementKnowledge.map(exp => (
                     <div key={exp.id} className="p-4 bg-amber-50/40 dark:bg-slate-900 border border-amber-100 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3">
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{exp.company}</span>
                              <span className="text-[11px] text-slate-400 font-medium">Shared by {exp.author}</span>
                           </div>
                           <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{exp.topic}</h4>
                        </div>
                        <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full shrink-0">
                           👍 {exp.upvotes} Helpful
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         )}

      </div>
    </div>
  );
}
