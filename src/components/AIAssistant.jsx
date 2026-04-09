import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Sparkles, BookA, Send, Settings, BookOpen, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'translator'
  const [examMode, setExamMode] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: "Hi! I'm your PeerSpace AI Assistant powered by Google Gemini. Ask me any technical topic, and I'll help you prepare!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Translator State
  const [translatorInput, setTranslatorInput] = useState('');
  const [translationResult, setTranslationResult] = useState(null);
  const [isTranslateLoading, setIsTranslateLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, activeTab, isChatLoading]);

  // --- Real Backend API LOGIC ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, examMode })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.aiMessage }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.aiMessage || "Error connecting to AI." }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Network error! Make sure the backend server (port 5000) and Gemini API are running." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!translatorInput.trim() || isTranslateLoading) return;

    setTranslationResult(null);
    setIsTranslateLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: translatorInput })
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setTranslationResult(data.translation);
      } else {
        setTranslationResult({
           word: translatorInput,
           meaning: "Error connecting to AI.",
           explanation: data.aiMessage || "Make sure Gemini API key is set.",
           hindi: "त्रुटि (Error)"
        });
      }
    } catch (e) {
      setTranslationResult({
           word: translatorInput,
           meaning: "Network error!",
           explanation: "Make sure the backend server (port 5000) is running and accessible.",
           hindi: "सर्वर त्रुटि (Server Error)"
      });
    } finally {
      setIsTranslateLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    // Simple markdown renderer for bolding and bullet points
    return text.split('\n').map((line, i) => {
      // Bold handling
      let htmlLine = line;
      if (htmlLine.includes('**')) {
        const parts = htmlLine.split('**');
        return (
          <span key={i} className="block text-sm mb-1">
            {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-blue-900">{part}</strong> : part)}
          </span>
        );
      } else if (line.startsWith('* ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc text-sm">{line.substring(2)}</li>;
      }
      return <span key={i} className="block text-sm mb-1">{line}</span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none animate-bounce hover:animate-none border-4 border-white"
      >
        {isOpen ? <X className="text-white w-7 h-7" /> : <Sparkles className="text-white w-7 h-7" />}
      </button>

      {/* Main AI Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[550px] max-h-[70vh] bg-white rounded-3xl shadow-[0_10px_50px_-10px_rgba(37,99,235,0.3)] flex flex-col overflow-hidden border border-blue-100 animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[#0f172a] text-white p-4 shrink-0 shadow-md relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
                <Sparkles className="w-6 h-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-blue-400 opacity-20 blur-md animate-pulse"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  PeerSpace AI
                  <span className="bg-blue-600/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-500/30">Gemini</span>
                </h3>
                <p className="text-xs text-blue-300 font-medium">Your personal campus study assistant</p>
              </div>
            </div>

            {/* Exam Mode Toggle */}
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 ${examMode ? 'text-green-400' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-200">Exam Mode</span>
              </div>
              <button 
                onClick={() => setExamMode(!examMode)}
                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${examMode ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${examMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-blue-50 bg-slate-50 shrink-0">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 relative transition-colors ${activeTab === 'chat' ? 'text-blue-700 bg-white' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <MessageCircle className="w-4 h-4" /> Exam Assistant
              {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('translator')}
              className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 relative transition-colors ${activeTab === 'translator' ? 'text-blue-700 bg-white' : 'text-slate-500 hover:bg-white/50'}`}
            >
              <BookA className="w-4 h-4" /> Smart Translator
              {activeTab === 'translator' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 relative hidescrollbar" id="ai-scroll-container">
            
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border border-blue-100 text-slate-700 rounded-bl-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm font-medium">{msg.content}</p>
                      ) : (
                        <div className="text-sm space-y-1">{renderFormattedText(msg.content)}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                   <div className="flex justify-start">
                     <div className="max-w-[85%] bg-white border border-blue-100 text-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                       <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                       <span className="text-sm font-medium">Gemini is thinking...</span>
                     </div>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 mb-4 text-center">
                   <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookA className="w-6 h-6 text-blue-600" />
                   </div>
                   <h4 className="font-extrabold text-slate-800 mb-1">Confused by a technical word?</h4>
                   <p className="text-xs text-slate-500 font-medium px-4">Enter a difficult jargon or concept. Gemini will simplify it for you instantly.</p>
                </div>

                <form onSubmit={handleTranslate} className="mb-4 relative">
                  <input
                    type="text"
                    value={translatorInput}
                    onChange={(e) => setTranslatorInput(e.target.value)}
                    placeholder="e.g. Deadlock, Polymorphism..."
                    disabled={isTranslateLoading}
                    className="w-full px-4 py-4 pr-24 bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-700 placeholder:text-slate-400 shadow-sm transition-all disabled:bg-slate-50"
                  />
                  <button 
                    type="submit"
                    disabled={isTranslateLoading}
                    className="absolute right-2 top-2 bottom-2 bg-[#0f172a] hover:bg-blue-900 disabled:bg-slate-400 text-white px-4 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center min-w-[70px]"
                  >
                    {isTranslateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Explain"}
                  </button>
                </form>

                {translationResult && (
                  <div className="bg-white border text-left border-green-100 rounded-2xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <h4 className="font-extrabold text-lg text-slate-800 capitalize tracking-tight">{translationResult.word}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Simple Meaning</span>
                        <p className="text-sm font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                          {translationResult.meaning}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Student-Friendly Explanation</span>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-50 mt-1">
                          {translationResult.explanation}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider drop-shadow-sm">Hindi Context (हिन्दी)</span>
                        <p className="text-sm font-medium text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mt-1">
                          {translationResult.hindi}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input Footer (Only visible in Chat mode) */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-white border-t border-blue-100 shrink-0">
              <form onSubmit={handleChatSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={examMode ? "Ask Gemini for exam notes..." : "Ask your AI buddy..."}
                  disabled={isChatLoading}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 disabled:bg-slate-50 focus:bg-white border-2 border-transparent focus:border-blue-400 rounded-2xl outline-none font-medium text-sm text-slate-700 placeholder:text-slate-400 transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-blue-600 disabled:bg-slate-300 text-white rounded-xl shadow-md transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          )}

        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hidescrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .hidescrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hidescrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}} />
    </>
  );
}
