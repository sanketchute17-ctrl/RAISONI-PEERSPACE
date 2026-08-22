import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Sparkles, BookA, Send, Settings, BookOpen, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';

export default function AIAssistant() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'translator'
  const [examMode, setExamMode] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: "Hi! I'm your PeerSpace AI Assistant. Ask me any technical topic, and I'll help you prepare!" }
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

  useEffect(() => {
    const handleOpenWithPrompt = (event) => {
      const promptText = event.detail?.prompt;
      setIsOpen(true);
      if (promptText) {
        setChatInput(promptText);
      }
    };
    window.addEventListener('openAIChatPrompt', handleOpenWithPrompt);
    return () => window.removeEventListener('openAIChatPrompt', handleOpenWithPrompt);
  }, []);

  // --- Smart Translation Dictionary & Generator Engine ---
  const getSmartTranslation = (wordInput) => {
    const word = wordInput.trim();
    if (!word) return null;
    const lower = word.toLowerCase();

    const dictionary = {
      'recursion': {
        word: 'Recursion',
        meaning: 'A programming technique where a function calls itself to break down a complex problem.',
        explanation: 'Imagine standing between two parallel mirrors where your image repeats until you reach a base condition (stop point).',
        hindi: 'पुनरावृत्ति (एक फ़ंक्शन द्वारा स्वयं को बार-बार निष्पादित करके बड़ी समस्या को हल करना)',
        marathi: 'पुनरावृत्ती (एका फंक्शनने स्वतःला वारंवार कॉल करून मोठी समस्या छोट्या भागात सोडवणे)'
      },
      'oop': {
        word: 'Object-Oriented Programming (OOP)',
        meaning: 'A programming paradigm structured around real-world objects and classes.',
        explanation: 'Think of a car blueprint (Class) and the physical red sports car built from it (Object).',
        hindi: 'ऑब्जेक्ट-ओरिएंटेड प्रोग्रामिंग (डेटा और फंक्शंस को एक ऑब्जेक्ट/क्लास में जोड़ना)',
        marathi: 'ऑब्जेक्ट-ओरिएंटेड प्रोग्रामिंग (डेटा आणि फंक्शन्सना एका ऑब्जेक्ट/क्लासमध्ये एकत्र आणणे)'
      },
      'polymorphism': {
        word: 'Polymorphism',
        meaning: 'The ability of a function or method to operate in multiple forms based on context.',
        explanation: 'Like a smartphone power button: one press locks the screen, holding it opens power options.',
        hindi: 'बहुरूपता (एक ही नाम के फंक्शन का परिस्थिति के अनुसार अलग काम करना)',
        marathi: 'बहुरूपता (एकाच नावाचे फंक्शन परिस्थितीनुसार वेगवेगळ्या स्वरूपात काम करणे)'
      },
      'inheritance': {
        word: 'Inheritance',
        meaning: 'A mechanism where a child class acquires attributes and methods of a parent class.',
        explanation: 'Like inheriting your parent’s eye color while also developing your own personal skills.',
        hindi: 'अनुवंशिकता (पुरानी क्लास के गुणों और फंक्शंस को नई क्लास में री-यूज़ करना)',
        marathi: 'वारसाहक्क (पुनर्वापर - जुन्या क्लासचे गुणधर्म नवीन क्लासमध्ये वापरणे)'
      },
      'encapsulation': {
        word: 'Encapsulation',
        meaning: 'Wrapping data and methods inside a single class while restricting direct access from outside.',
        explanation: 'Like a medical pill capsule that protects bitter medicine inside a protective shell.',
        hindi: 'कैप्सूलीकरण (डेटा और मेथड्स को एक कैप्सूल की तरह सुरक्षित बांधकर रखना)',
        marathi: 'कॅप्सुलेशन (डेटा आणि पद्धतींना एका घटकात सुरक्षित एकत्र बांधणे)'
      },
      'dbms': {
        word: 'Database Management System (DBMS)',
        meaning: 'Software designed to store, manage, retrieve, and query data efficiently.',
        explanation: 'Like a digital library catalog system that locates any book among millions in milliseconds.',
        hindi: 'डेटाबेस प्रबंधन प्रणाली (डेटा को व्यवस्थित तरीके से स्टोर, खोजना और मैनेज करना)',
        marathi: 'डेटाबेस व्यवस्थापन प्रणाली (डेटा सुरक्षितपणे साठवणे आणि शोधणे)'
      },
      'deadlock': {
        word: 'Deadlock',
        meaning: 'A situation where two or more processes are blocked forever, waiting for each other.',
        explanation: 'Like two trains approaching each other on a single track, both refusing to back up.',
        hindi: 'डेडलॉक (ऐसी स्थिति जहां 2 या अधिक प्रोसेस एक-दूसरे के रिसोर्स का इंतजार करते हुए रुक जाती हैं)',
        marathi: 'डेडलॉक (अशी स्थिती जिथे दोन किंवा अधिक प्रक्रिया एकमेकांच्या संसाधनाची वाट पाहत थांबतात)'
      },
      'algorithm': {
        word: 'Algorithm',
        meaning: 'A clear, step-by-step sequence of instructions to solve a problem.',
        explanation: 'Like a recipe for baking a cake: follow exact steps in order for a guaranteed result.',
        hindi: 'एल्गोरिदम (किसी कार्य या समस्या को हल करने के चरणबद्ध निर्देश)',
        marathi: 'अल्गोरिदम (कोणतीही समस्या सोडवण्यासाठी पायरी-पायरीचे नियम/सूचना)'
      },
      'compiler': {
        word: 'Compiler',
        meaning: 'A translator program that converts high-level source code into CPU machine code.',
        explanation: 'Like a language translator translating an entire English book into Hindi all at once.',
        hindi: 'कंपाइलर (हाई-लेवल प्रोग्रामिंग कोड को सीधे मशीन कोड में बदलने वाला टूल)',
        marathi: 'कंपायलर (हाय-लेव्हल कोडचे थेट मशीन कोडमध्ये रूपांतर करणारा टूल)'
      },
      'operating system': {
        word: 'Operating System (OS)',
        meaning: 'Software managing computer hardware and software resources.',
        explanation: 'Like a college principal directing departments, classrooms, and schedules seamlessly.',
        hindi: 'ऑपरेटिंग सिस्टम (कंप्यूटर हार्डवेयर और ऐप्स को कंट्रोल करने वाला मेन सॉफ्टवेयर)',
        marathi: 'ऑपरेटिंग सिस्टीम (संगणक हार्डवेअर आणि सॉफ्टवेअर नियंत्रित करणारी मुख्य प्रणाली)'
      },
      'stack': {
        word: 'Stack Data Structure',
        meaning: 'A linear data structure operating on Last-In, First-Out (LIFO).',
        explanation: 'Like a stack of dinner plates at a party: the last plate put on top is taken first.',
        hindi: 'स्टैक (LIFO - जो एलिमेंट अंत में आए, वही सबसे पहले बाहर निकले)',
        marathi: 'स्टॅक (LIFO - शेवटी आलेला घटक सर्वात आधी बाहेर पडतो)'
      },
      'queue': {
        word: 'Queue Data Structure',
        meaning: 'A linear data structure operating on First-In, First-Out (FIFO).',
        explanation: 'Like a line at a college canteen: the first person in line gets served first.',
        hindi: 'क्यू (FIFO - जो एलिमेंट पहले आए, वही सबसे पहले बाहर निकले)',
        marathi: 'क्यू (FIFO - आधी आलेला घटक सर्वात आधी बाहेर पडतो)'
      }
    };

    if (dictionary[lower]) {
      return dictionary[lower];
    }

    for (const key in dictionary) {
      if (lower.includes(key) || key.includes(lower)) {
        return dictionary[key];
      }
    }

    const titleCase = word.charAt(0).toUpperCase() + word.slice(1);
    return {
      word: titleCase,
      meaning: `${titleCase} is a core academic concept used in engineering and syllabus topics.`,
      explanation: `Understanding ${titleCase} allows you to solve complex syllabus exam questions by breaking down logical steps.`,
      hindi: `${titleCase} (यह आपके पाठ्यक्रम का एक महत्वपूर्ण तकनीकी शब्द है)`,
      marathi: `${titleCase} (हा तुमच्या अभ्यासक्रमातील एक महत्त्वाचा तांत्रिक संकल्पना आहे)`
    };
  };

  const getSmartAIChatResponse = (prompt, isExam) => {
    const p = prompt.toLowerCase();

    if (p.includes('viva') || p.includes('exam')) {
      return `### 📚 Viva & Exam Preparation Guide:\n* **Q1:** What is the core definition of this concept?\n  *Answer:* Focus on 1-2 line precise definitions with technical keywords.\n* **Q2:** What are key real-world applications?\n  *Answer:* Mention industrial use-cases like database indexing, memory management, or API handling.\n* **Exam Tip:** Draw clean block diagrams during written exams for maximum marks!`;
    }

    if (p.includes('hindi') || p.includes('explain')) {
      return `### 💡 Easy Syllabus Explanation:\nIs topic ka mukhya uddeshya system efficiency ko badhana aur logical problem-solving ko asan banana hai. Isko samajhne ke liye key concepts ko chote steps mein divide karein aur real-world examples se compare karein.`;
    }

    return `Here is a clear overview of **"${prompt}"**:\n\n* **Core Definition:** A fundamental concept in your engineering syllabus designed for efficient data/system management.\n* **Key Takeaway:** Always remember the main workflow and syntax.\n* **Study Tip:** Practice solving previous year syllabus doubts on PeerSpace!`;
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, examMode })
      });
      const data = await res.json();
      if (data.success && data.aiMessage) {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.aiMessage }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: getSmartAIChatResponse(userMsg, examMode) }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: getSmartAIChatResponse(userMsg, examMode) }]);
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
      const res = await fetch(`${API_BASE}/api/ai-translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: translatorInput.trim() })
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setTranslationResult(data.translation);
      } else {
        setTranslationResult(getSmartTranslation(translatorInput));
      }
    } catch (e) {
      setTranslationResult(getSmartTranslation(translatorInput));
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
        id="ai-assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none animate-bounce hover:animate-none border-4 border-white dark:border-slate-800"
      >
        {isOpen ? <X className="text-white w-6 h-6 md:w-7 md:h-7" /> : <Sparkles className="text-white w-6 h-6 md:w-7 md:h-7" />}
      </button>

      {/* Main AI Window */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-28 right-4 md:right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[520px] md:h-[550px] max-h-[70vh] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_10px_50px_-10px_rgba(37,99,235,0.3)] flex flex-col overflow-hidden border border-blue-100 dark:border-slate-800 animate-in slide-in-from-bottom-8 fade-in duration-300">
          
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
                  <span className="bg-gradient-to-r from-purple-500/30 to-orange-500/30 text-orange-300 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> Live</span>
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
                   <div className="flex justify-start animate-in fade-in duration-200">
                     <div className="max-w-[85%] bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg flex items-center gap-3">
                       <div className="relative flex items-center justify-center">
                         <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                         <div className="absolute inset-0 bg-orange-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="text-xs font-bold bg-gradient-to-r from-purple-300 via-orange-300 to-amber-200 bg-clip-text text-transparent tracking-wide">
                           PeerSpace AI is thinking
                         </span>
                         <span className="flex gap-1 items-center ml-1">
                           <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                           <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                           <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                         </span>
                       </div>
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
                   <p className="text-xs text-slate-500 font-medium px-4">Enter a difficult jargon or concept. PeerSpace AI will simplify it for you instantly.</p>
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
                    
                    <div className="space-y-3.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Simple Meaning</span>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                          {translationResult.meaning}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Student-Friendly Explanation</span>
                        <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-50 mt-1">
                          {translationResult.explanation}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider flex items-center gap-1">
                          🇮🇳 Hindi Translation (हिन्दी अर्थ व व्याख्या)
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-amber-950 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60 mt-1">
                          {translationResult.hindi}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-orange-700 tracking-wider flex items-center gap-1">
                          🚩 Marathi Translation (मराठी अर्थ व स्पष्टीकरण)
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-orange-950 bg-orange-50/80 p-2.5 rounded-lg border border-orange-200/60 mt-1">
                          {translationResult.marathi}
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
                  placeholder={examMode ? "Ask AI for exam notes..." : "Ask your AI buddy..."}
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
