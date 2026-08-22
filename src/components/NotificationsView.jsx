import React from 'react';
import { Bell, CheckCircle2, MessageSquare, Trophy, Zap, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsView({ notifications = [] }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Banner */}
       <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-blue-800/60 flex items-center justify-between">
          <div>
             <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max mb-2">
                <Bell className="w-3.5 h-3.5" /> Notifications Center
             </span>
             <h1 className="text-2xl font-black text-white">Campus Activity & Alerts</h1>
             <p className="text-xs text-blue-200/90 font-medium mt-1">Real-time alerts for doubt answers, mentorship status, study resources & XP updates.</p>
          </div>
          <button 
             onClick={() => toast.success("All notifications marked as read!")}
             className="bg-white/10 hover:bg-white/20 text-blue-200 border border-white/15 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          >
             Mark All as Read
          </button>
       </div>

       {/* Notifications Feed */}
       <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          {notifications.length === 0 ? (
             <div className="text-center py-16 text-slate-400">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-600 dark:text-slate-300">No new notifications</h3>
                <p className="text-xs text-slate-400 mt-1">You're all caught up with campus updates!</p>
             </div>
          ) : (
             notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 hover:bg-blue-50/40 transition-colors">
                   <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                      <Bell className="w-4 h-4" />
                   </div>
                   <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                         <h4 className="font-bold text-slate-900 dark:text-slate-100">{notif.title || "Campus Notification"}</h4>
                         <span className="text-[10px] text-slate-400 font-medium">Recently</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{notif.message || notif.text}</p>
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
}
