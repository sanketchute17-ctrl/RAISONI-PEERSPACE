import React from 'react';
import { Bookmark, MessageSquare, BookOpen, Briefcase, Bell } from 'lucide-react';
import DoubtCard from './DoubtCard';

export default function BookmarksView({ doubts = [], userProfile, currentUser, isUserAnonymous, localSavedDoubts = [] }) {
  const savedDoubtsList = doubts.filter(d => 
     userProfile?.savedDoubts?.includes(d.id?.toString()) || localSavedDoubts.includes(d.id)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Banner */}
       <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 shadow-xl border border-amber-800/60 flex items-center justify-between">
          <div>
             <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max mb-2">
                <Bookmark className="w-3.5 h-3.5 fill-current" /> Unified Bookmarks Manager
             </span>
             <h1 className="text-2xl font-black text-white">Saved Academic Bookmarks</h1>
             <p className="text-xs text-amber-200/90 font-medium mt-1">Access all your bookmarked syllabus doubts, study materials, and placement preparation notes.</p>
          </div>
       </div>

       {/* Bookmarks Feed */}
       <div className="space-y-4">
          {savedDoubtsList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-slate-400">
                <Bookmark className="w-16 h-16 mb-4 text-amber-500/40" />
                <h3 className="font-extrabold text-xl text-slate-700 dark:text-slate-200">No saved bookmarks yet</h3>
                <p className="text-xs text-slate-400 mt-1">Click the bookmark icon on any doubt, study material, or placement note to save it here!</p>
             </div>
          ) : (
             savedDoubtsList.map(doubt => (
                <DoubtCard 
                   key={doubt.id} 
                   doubt={doubt} 
                   currentUser={currentUser} 
                   userProfile={userProfile} 
                   isUserAnonymous={isUserAnonymous} 
                />
             ))
          )}
       </div>
    </div>
  );
}
