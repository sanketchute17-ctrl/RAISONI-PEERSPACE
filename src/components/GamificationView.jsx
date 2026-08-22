import React, { useState } from 'react';
import { Trophy, Award, Flame, Star, Zap, CheckCircle2, Shield, Lock } from 'lucide-react';

export default function GamificationView({ leaderboard = [], totalUserXP = 0, userStreak = 1, userRankName = "Rookie" }) {
  const [timeframe, setTimeframe] = useState('alltime'); // 'weekly', 'monthly', 'alltime'

  const achievements = [
     { id: 1, title: "First Syllabus Question", desc: "Asked your first academic doubt on PeerSpace", icon: "❓", xp: "+10 XP", unlocked: true },
     { id: 2, title: "Peer Contributor", desc: "Answered a peer's question successfully", icon: "🎯", xp: "+20 XP", unlocked: totalUserXP >= 25 },
     { id: 3, title: "7-Day Streak Warrior", desc: "Maintained active campus study streak for 7 days", icon: "🔥", xp: "+50 XP", unlocked: userStreak >= 7 },
     { id: 4, title: "Study Hub Supporter", desc: "Uploaded verified notes to Campus Study Hub", icon: "📚", xp: "+30 XP", unlocked: totalUserXP >= 100 },
     { id: 5, title: "Master Problem Solver", desc: "Achieved 5 accepted answers verified by faculty", icon: "💡", xp: "+100 XP", unlocked: totalUserXP >= 300 },
     { id: 6, title: "Placement Ready", desc: "Shared interview experience on Placement Hub", icon: "🚀", xp: "+40 XP", unlocked: totalUserXP >= 150 }
  ];

  const levelThresholds = [
     { level: 1, name: "Beginner", minXP: 0 },
     { level: 2, name: "Learner", minXP: 50 },
     { level: 3, name: "Contributor", minXP: 150 },
     { level: 4, name: "Problem Solver", minXP: 300 },
     { level: 5, name: "Campus Expert", minXP: 500 },
     { level: 6, name: "Mentor", minXP: 800 },
     { level: 7, name: "Campus Master", minXP: 1200 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Hero Header */}
       <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-800/60 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl z-10">
             <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
                <Trophy className="w-3.5 h-3.5" /> Campus XP & Gamification Hub
             </span>
             <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Leaderboards & Achievements
             </h1>
             <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed">
                Earn XP by asking doubts, providing accepted answers, uploading study materials, and maintaining daily study streaks.
             </p>
          </div>

          <div className="z-10 bg-white/10 backdrop-blur border border-white/15 p-4 rounded-2xl shrink-0 flex items-center gap-4">
             <div>
                <p className="text-xs font-bold text-slate-300">Your Current Level</p>
                <h3 className="text-xl font-black text-amber-400">{userRankName}</h3>
                <p className="text-[11px] font-bold text-amber-200">{totalUserXP} Total XP</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
                🏆
             </div>
          </div>
       </div>

       {/* Grid: Leaderboard & Achievements */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Leaderboard Column */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                   <Trophy className="w-5 h-5 text-amber-500" /> Raisoni Campus Leaderboard
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-[11px] font-bold">
                   <button onClick={() => setTimeframe('alltime')} className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === 'alltime' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500'}`}>All Time</button>
                   <button onClick={() => setTimeframe('monthly')} className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500'}`}>Monthly</button>
                </div>
             </div>

             <div className="space-y-2.5">
                {leaderboard.length === 0 ? (
                   <p className="text-xs text-slate-400 py-6 text-center font-medium">No contributors recorded yet.</p>
                ) : (
                   leaderboard.map((user, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-800 text-white'}`}>
                               {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </span>
                            <div>
                               <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</h4>
                               <p className="text-[10px] text-slate-400 font-medium">Campus Contributor</p>
                            </div>
                         </div>
                         <span className="text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full shrink-0">
                            {user.points} XP
                         </span>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Achievements Column */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
             <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                   <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Badges & Achievements
                </h3>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map(ach => (
                   <div key={ach.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${ach.unlocked ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                      <span className="text-2xl shrink-0">{ach.icon}</span>
                      <div className="space-y-0.5">
                         <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{ach.title}</h4>
                            {ach.unlocked ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                         </div>
                         <p className="text-[10px] text-slate-500 font-medium leading-snug">{ach.desc}</p>
                         <span className="inline-block text-[10px] font-extrabold text-purple-600 dark:text-purple-400 pt-1">{ach.xp}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
}
