import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, Calendar, MapPin, DollarSign, CheckCircle2, BookOpen, ThumbsUp, Plus, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function PlacementHub({ userProfile }) {
  const [drives, setDrives] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drives'); // 'drives', 'prep', 'experiences'

  // Share Experience Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [questions, setQuestions] = useState('');
  const [rounds, setRounds] = useState('3 Rounds (Aptitude + Technical + HR)');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tips, setTips] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlacementData = async () => {
     setLoading(true);
     try {
        const res = await fetch(`${API_BASE}/api/placements`);
        const data = await res.json();
        if (data.success) {
           setDrives(data.drives || []);
           setExperiences(data.experiences || []);
        }
     } catch (err) {
        console.error("Error fetching placement data:", err);
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => {
     fetchPlacementData();
  }, []);

  const handleShareExperience = async (e) => {
     e.preventDefault();
     if (!company.trim() || !questions.trim()) {
        toast.error("Please fill in Company Name and Interview Questions details.");
        return;
     }

     setIsSubmitting(true);
     try {
        const res = await fetch(`${API_BASE}/api/placements/experiences`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              company: company.trim(),
              role: role.trim(),
              author: `${userProfile?.fullName || 'Student'} (${userProfile?.branch || 'CSE'} 2025)`,
              questions: questions.trim(),
              rounds,
              difficulty,
              tips: tips.trim()
           })
        });
        const data = await res.json();
        if (data.success) {
           toast.success("Interview Experience Shared! 🚀");
           setCompany('');
           setQuestions('');
           setTips('');
           setIsModalOpen(false);
           fetchPlacementData();
        }
     } catch (err) {
        toast.error("Failed to share experience.");
     } finally {
        setIsSubmitting(false);
     }
  };

  const handleUpvoteExperience = (id) => {
     setExperiences(prev => prev.map(exp => exp.id === id ? { ...exp, upvotes: exp.upvotes + 1 } : exp));
     toast.success("Upvoted Interview Experience! 👍");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Hero Banner */}
       <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
             <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
                <Briefcase className="w-3.5 h-3.5" /> Campus Placement & Career Portal
             </span>
             <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Raisoni T&P Placement Hub
             </h1>
             <p className="text-xs sm:text-sm text-cyan-200/90 font-medium leading-relaxed">
                Track upcoming campus recruitment drives, company eligibility criteria, interview preparation roadmaps, and peer interview experiences.
             </p>
          </div>

          <button 
             onClick={() => setIsModalOpen(true)}
             className="z-10 shrink-0 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
             <Plus className="w-4 h-4" />
             <span>Share Interview Experience</span>
          </button>
       </div>

       {/* Sub-Tabs */}
       <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm">
          {[
             { id: 'drives', label: '🏢 Active Company Drives' },
             { id: 'prep', label: '📚 Placement Prep Roadmaps' },
             { id: 'experiences', label: '⭐ Peer Interview Experiences' }
          ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             >
                {tab.label}
             </button>
          ))}
       </div>

       {/* Tab Content */}
       {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
       ) : (
          <div>
             {/* 1. Company Drives */}
             {activeTab === 'drives' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {drives.map(drive => (
                      <div key={drive.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Building2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                               <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{drive.company}</h3>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${drive.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-amber-100 text-amber-700'}`}>
                               {drive.status}
                            </span>
                         </div>

                         <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <p className="font-extrabold text-slate-900 dark:text-slate-100">Role: {drive.role}</p>
                            <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Package: <strong className="text-green-600 dark:text-green-400">{drive.package}</strong></p>
                            <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Criteria: {drive.eligibility} ({drive.branches?.join(', ')})</p>
                            <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-500" /> Deadline: <span className="font-bold text-red-500">{drive.deadline}</span></p>
                         </div>

                         <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                            <p className="font-bold text-slate-400 text-[10px] uppercase mb-1">Selection Rounds:</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{drive.process}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}

             {/* 2. Placement Prep Modules */}
             {activeTab === 'prep' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {[
                      { title: "Aptitude & Logical Reasoning", topics: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", "Speed Math Techniques"], icon: "📐" },
                      { title: "DSA & Coding Rounds", topics: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "SQL Query Optimization"], icon: "💻" },
                      { title: "Technical & HR Interview Prep", topics: ["OOPs & System Design", "Project Deep-Dive", "Behavioral STAR Method", "Resume Building"], icon: "👔" }
                   ].map((mod, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
                         <div className="text-3xl">{mod.icon}</div>
                         <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{mod.title}</h3>
                         <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            {mod.topics.map((t, i) => (
                               <li key={i} className="flex items-center gap-2 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> {t}
                               </li>
                            ))}
                         </ul>
                      </div>
                   ))}
                </div>
             )}

             {/* 3. Peer Interview Experiences */}
             {activeTab === 'experiences' && (
                <div className="space-y-4">
                   {experiences.map(exp => (
                      <div key={exp.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="bg-cyan-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">{exp.company}</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{exp.role}</span>
                               </div>
                               <p className="text-xs text-slate-400 font-medium mt-1">Shared by {exp.author}</p>
                            </div>
                            <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full w-max">
                               Difficulty: {exp.difficulty}
                            </span>
                         </div>

                         <div className="space-y-2 text-xs">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px]">Questions Asked & Experience:</h4>
                            <p className="font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{exp.questions}</p>
                         </div>

                         {exp.tips && (
                            <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50">
                               <strong className="font-bold">Preparation Tips:</strong> {exp.tips}
                            </div>
                         )}

                         <div className="pt-2 flex justify-end">
                            <button 
                               onClick={() => handleUpvoteExperience(exp.id)}
                               className="bg-slate-100 dark:bg-slate-700 hover:bg-cyan-50 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                            >
                               <ThumbsUp className="w-3.5 h-3.5 text-cyan-600" /> Helpful ({exp.upvotes})
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
       )}

       {/* Modal Share Experience */}
       {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0f172a]/75 backdrop-blur-md animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-5 text-white flex items-center justify-between">
                   <h3 className="font-extrabold text-base flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-cyan-400" /> Share Placement Interview Experience
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleShareExperience} className="p-5 space-y-4 text-xs">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company Name</label>
                         <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. TCS / Infosys / Wipro" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none" required />
                      </div>
                      <div>
                         <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Job Role</label>
                         <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. System Engineer" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none" />
                      </div>
                   </div>

                   <div>
                      <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Interview Questions & Rounds</label>
                      <textarea rows="4" value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="List questions asked in technical and HR rounds..." className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none resize-none" required />
                   </div>

                   <div>
                      <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Preparation Advice / Tips</label>
                      <textarea rows="2" value={tips} onChange={(e) => setTips(e.target.value)} placeholder="Advice for junior students..." className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none resize-none" />
                   </div>

                   <div className="pt-3 border-t flex justify-end gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="bg-cyan-500 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md">Share Experience</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}
