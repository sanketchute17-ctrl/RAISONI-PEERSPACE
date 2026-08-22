import React, { useState } from 'react';
import { Sparkles, Send, BookOpen, HelpCircle, FileText, BrainCircuit, Lightbulb, RefreshCw, Copy, Check, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function AIStudyPage() {
  const [messages, setMessages] = useState([
     { sender: 'ai', text: "Hello! I'm your Raisoni AI Academic Study Assistant. Select any quick action chip below or ask any syllabus question to get started!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isExamMode, setIsExamMode] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const quickActionChips = [
     { label: "💡 Explain Concept in Hindi", prompt: "Explain the core engineering concept in simple Hinglish with real-world analogies:" },
     { label: "📝 Generate Viva Q&A", prompt: "Generate top 5 viva examination questions and concise 2-line answers for:" },
     { label: "❓ Generate 5 MCQs", prompt: "Create 5 multiple choice questions with correct answer explanations for:" },
     { label: "📄 Summarize Notes", prompt: "Summarize key bullet points and exam formulas for:" },
     { label: "📅 Create 3-Day Study Plan", prompt: "Create a 3-day structured revision timetable to master:" },
     { label: "👶 Explain Like a Beginner", prompt: "Explain this topic as if I am a complete beginner with no prior experience:" },
     { label: "🧪 Lab Viva Questions", prompt: "List top practical lab viva questions for:" }
  ];

  const handleSendMessage = async (userPromptText) => {
     const textToSend = userPromptText || inputText;
     if (!textToSend.trim()) return;

     const newMessages = [...messages, { sender: 'user', text: textToSend }];
     setMessages(newMessages);
     if (!userPromptText) setInputText('');
     setIsAsking(true);

     try {
        const res = await fetch(`${API_BASE}/api/ai-chat`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: textToSend, examMode: isExamMode })
        });
        const data = await res.json();
        if (data.success && data.aiMessage) {
           setMessages([...newMessages, { sender: 'ai', text: data.aiMessage }]);
        } else {
           setMessages([...newMessages, { sender: 'ai', text: "I am ready to help! Please ask your syllabus question or concept details." }]);
        }
     } catch (err) {
        console.error("AI Assistant error:", err);
        setMessages([...newMessages, { sender: 'ai', text: "Sorry, I ran into a network issue. Please try again!" }]);
     } finally {
        setIsAsking(false);
     }
  };

  const copyToClipboard = (text, idx) => {
     navigator.clipboard.writeText(text);
     setCopiedIndex(idx);
     toast.success("Copied AI response to clipboard! 📋");
     setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       {/* Hero Header */}
       <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0f172a] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/60 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl z-10">
             <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-max">
                <Sparkles className="w-3.5 h-3.5" /> 24/7 AI Syllabus Assistant
             </span>
             <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Raisoni AI Study Workspace
             </h1>
             <p className="text-xs sm:text-sm text-indigo-200/90 font-medium leading-relaxed">
                Ask any complex syllabus doubt, generate instant viva Q&A, exam MCQs, unit summaries, or study plans powered by Groq & Gemini AI.
             </p>
          </div>

          {/* Strict Exam Mode Toggle */}
          <div className="z-10 bg-white/10 backdrop-blur border border-white/15 p-4 rounded-2xl shrink-0 flex items-center gap-3">
             <div>
                <p className="text-xs font-bold text-white">Exam Answer Mode</p>
                <p className="text-[10px] text-indigo-200">Strict bullet-point 2-5 mark layout</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                   type="checkbox" 
                   checked={isExamMode}
                   onChange={() => setIsExamMode(!isExamMode)}
                   className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
             </label>
          </div>
       </div>

       {/* Quick Action Prompt Chips Row */}
       <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Quick AI Student Helpers:</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
             {quickActionChips.map((chip, idx) => (
                <button
                   key={idx}
                   onClick={() => {
                      const topic = prompt(`Enter topic for "${chip.label}":`, "Data Structures");
                      if (topic) handleSendMessage(`${chip.prompt} ${topic}`);
                   }}
                   className="bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-sm transition-all whitespace-nowrap shrink-0"
                >
                   {chip.label}
                </button>
             ))}
          </div>
       </div>

       {/* Chat Messages Log Box */}
       <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[420px] max-h-[550px] flex flex-col justify-between overflow-hidden">
          
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1 mb-4">
             {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                         AI
                      </div>
                   )}
                   
                   <div className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm relative group ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      
                      {msg.sender === 'ai' && (
                         <button 
                            onClick={() => copyToClipboard(msg.text, index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 shadow-sm"
                            title="Copy Response"
                         >
                            {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                         </button>
                      )}
                   </div>

                   {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                         You
                      </div>
                   )}
                </div>
             ))}

             {isAsking && (
                <div className="flex gap-3 justify-start">
                   <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                      AI
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-bold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> AI is thinking & formulating answer...
                   </div>
                </div>
             )}
          </div>

          {/* Input Box */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
             <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask any syllabus doubt, code syntax or engineering concept..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500"
             />
             <button 
                type="submit"
                disabled={isAsking || !inputText.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
             >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
             </button>
          </form>
       </div>
    </div>
  );
}
