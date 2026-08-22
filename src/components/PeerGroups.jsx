import React, { useState, useEffect } from 'react';
import { Users, Plus, MessageSquare, Search, ShieldCheck, UserPlus, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function PeerGroups({ currentUser, userProfile }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // New Group Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Placement Prep');
  const [branch, setBranch] = useState('CSE / IT');
  const [isCreating, setIsCreating] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/peer-groups`);
      const data = await res.json();
      if (data.success && data.data) {
        setGroups(data.data);
        if (!selectedGroup && data.data.length > 0) setSelectedGroup(data.data[0]);
      }
    } catch (err) {
      console.error("Error fetching peer groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/peer-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          branch,
          owner: userProfile?.fullName || 'Student'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New Peer Study Group Created! 👥");
        setName('');
        setDescription('');
        setIsCreateOpen(false);
        fetchGroups();
      }
    } catch (err) {
      toast.error("Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleJoin = async (groupId) => {
    try {
      const res = await fetch(`${API_BASE}/api/peer-groups/${groupId}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.isJoined ? "Joined Peer Study Group!" : "Left Study Group.");
        fetchGroups();
        if (selectedGroup && selectedGroup.id === groupId) {
          setSelectedGroup(prev => ({ ...prev, isJoined: data.isJoined, membersCount: data.membersCount }));
        }
      }
    } catch (err) {
      toast.error("Error toggling group membership.");
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!postText.trim() || !selectedGroup) return;

    setIsPosting(true);
    try {
      const res = await fetch(`${API_BASE}/api/peer-groups/${selectedGroup.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: postText.trim(),
          author: userProfile?.fullName || 'Student'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Posted to Group Discussion! 💬");
        setPostText('');
        setSelectedGroup(prev => ({
          ...prev,
          posts: [data.data, ...(prev.posts || [])]
        }));
      }
    } catch (err) {
      toast.error("Failed to post message.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
         <div className="space-y-2 max-w-xl z-10">
            <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
               <Users className="w-3.5 h-3.5" /> Peer Learning Community Groups
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
               Raisoni Student Study Groups
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium leading-relaxed">
               Join dedicated subject study circles, LeetCode placement prep groups, and final year project collaboration channels.
            </p>
         </div>

         <button 
            onClick={() => setIsCreateOpen(true)}
            className="z-10 shrink-0 bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
         >
            <Plus className="w-4 h-4" />
            <span>Create Study Group</span>
         </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left Column: Groups List */}
         <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider px-1">
               Active Campus Groups ({groups.length})
            </h3>

            {loading ? (
               <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
            ) : (
               groups.map(group => (
                  <div 
                     key={group.id}
                     onClick={() => setSelectedGroup(group)}
                     className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${selectedGroup?.id === group.id ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-200'}`}
                  >
                     <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                           <span className="bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              {group.category}
                           </span>
                           <span className="text-[11px] font-bold text-slate-400">👥 {group.membersCount} members</span>
                        </div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{group.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-medium">{group.description}</p>
                     </div>

                     <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-[10px] font-bold text-slate-400">{group.branch}</span>
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleToggleJoin(group.id); }}
                           className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${group.isJoined ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                        >
                           {group.isJoined ? '✓ Joined' : '+ Join Group'}
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Right Column: Selected Group Detail & Discussion Stream */}
         <div className="lg:col-span-2 space-y-4">
            {selectedGroup ? (
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">{selectedGroup.category}</span>
                           <span className="text-xs font-bold text-slate-400">Created by {selectedGroup.owner}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{selectedGroup.name}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">{selectedGroup.description}</p>
                     </div>

                     <button 
                        onClick={() => handleToggleJoin(selectedGroup.id)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all ${selectedGroup.isJoined ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                     >
                        {selectedGroup.isJoined ? '✓ Member of Group' : '+ Join Study Group'}
                     </button>
                  </div>

                  {/* Post New Question / Note in Group */}
                  <form onSubmit={handleAddPost} className="space-y-2">
                     <textarea 
                        rows="2"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        placeholder={`Share notes, questions or resources with ${selectedGroup.name}...`}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                     />
                     <div className="flex items-center justify-between">
                        <label className="cursor-pointer text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1">
                           📎 Attach File / PDF
                           <input 
                              type="file" 
                              accept=".pdf,image/*,.doc,.docx"
                              onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                    setPostText(prev => prev + `\n[Attached File: ${file.name}]`);
                                    toast.success(`Attached ${file.name}`);
                                 }
                              }}
                              className="hidden" 
                           />
                        </label>
                        <button 
                           type="submit"
                           disabled={isPosting || !postText.trim()}
                           className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                           {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post Message
                        </button>
                     </div>
                  </form>

                  {/* Discussion Posts Stream */}
                  <div className="space-y-3 pt-2">
                     <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Group Discussion Feed</h4>
                     
                     {(!selectedGroup.posts || selectedGroup.posts.length === 0) ? (
                        <p className="text-xs text-slate-400 py-6 text-center font-medium">No posts in this group yet. Be the first to start the discussion!</p>
                     ) : (
                        selectedGroup.posts.map(post => (
                           <div key={post.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                 <span className="font-bold text-purple-600 dark:text-purple-400">{post.author}</span>
                                 <span className="text-slate-400">Just now</span>
                              </div>
                              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{post.text}</p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            ) : (
               <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border text-slate-400 text-xs font-bold">
                  Select a group from the left to view discussions.
               </div>
            )}
         </div>

      </div>

      {/* Create Group Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0f172a]/75 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
               <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-5 text-white flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                     <Users className="w-5 h-5 text-purple-300" /> Create New Peer Group
                  </h3>
                  <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
               </div>

               <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
                  <div>
                     <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Group Name</label>
                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DBMS Query Masters" className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold text-slate-800 dark:text-slate-100 outline-none" required />
                  </div>
                  <div>
                     <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                     <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold">
                        <option value="Placement Prep">Placement Prep</option>
                        <option value="AI/ML">AI / ML</option>
                        <option value="Academic">Academic Subject</option>
                        <option value="Project Group">Final Year Project</option>
                     </select>
                  </div>
                  <div>
                     <label className="font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                     <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief purpose of this study group..." className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold outline-none resize-none h-20" />
                  </div>
                  <div className="pt-3 border-t flex justify-end gap-3">
                     <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancel</button>
                     <button type="submit" disabled={isCreating} className="bg-purple-600 text-white font-bold px-5 py-2 rounded-xl shadow-md">Create Group</button>
                  </div>
               </form>
            </div>
         </div>
      )}
   </div>
  );
}
