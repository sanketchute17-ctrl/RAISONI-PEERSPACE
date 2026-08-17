import React, { useState } from 'react';
import { ArrowUp, MessageCircle, Clock, Tag, X, Send, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function QuestionFeed() {
  // Dummy Data
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: "How to reverse a Linked List?",
      description: "Can someone explain the iterative approach to reversing a singly linked list in C++?",
      tags: ["Data Structures", "C++"],
      votes: 14,
      time: "2 hours ago",
      answersCount: 3,
      answers: [
        "You can use three pointers: prev, current, and next to reverse the links iteratively in a loop.",
        "Store all the nodes in an array/vector first, then re-link them in reverse. It takes O(N) extra space but works.",
        "A recursive approach is also an option, but for iterative, just keep updating the 'next' pointer of the current node to point back."
      ]
    },
    {
      id: 2,
      title: "What is the syllabus for the mid-semester exam?",
      description: "Did the professor mention if Chapter 4 is included in tomorrow's test?",
      tags: ["Exams", "General"],
      votes: 3,
      time: "5 hours ago",
      answersCount: 0,
      answers: []
    },
    {
      id: 3,
      title: "Help with React useEffect hook",
      description: "My component is rendering infinitely. How do I fix the dependency array?",
      tags: ["React", "Web Dev"],
      votes: 8,
      time: "10 mins ago",
      answersCount: 1,
      answers: [
        "You probably have state updates happening inside the useEffect without a correct dependency array. Pass [] to run it only once on mount."
      ]
    }
  ]);

  // Modal State
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  
  // Expanded Answers State
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const handleVote = (id) => {
    setQuestions(questions.map(q => {
      if (q.id === id) return { ...q, votes: q.votes + 1 };
      return q;
    }));
  };

  const openAnswerModal = (id) => {
    setActiveQuestionId(id);
    setAnswerText('');
    setDuplicateError('');
  };

  const submitAnswer = (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    
    const activeQuestion = questions.find(q => q.id === activeQuestionId);
    
    // Duplicate Answer Detection Logic
    const isDuplicate = activeQuestion.answers?.some(
      ans => ans.trim().toLowerCase() === answerText.trim().toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateError("Duplicate Answer: This exact answer has already been submitted!");
      return;
    }
    
    setQuestions(questions.map(q => {
      if (q.id === activeQuestionId) {
        return { 
          ...q, 
          answersCount: q.answersCount + 1,
          answers: [...(q.answers || []), answerText.trim()]
        };
      }
      return q;
    }));
    
    // Close modal & reset
    setActiveQuestionId(null);
    setAnswerText('');
    setDuplicateError('');
    // Automatically open answers for the user to see their response
    setExpandedQuestionId(activeQuestionId);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 font-sans">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Questions</h2>
      
      {questions.map((question) => (
        <div key={question.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            
            {/* Votes Sidebar */}
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => handleVote(question.id)}
                className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors border border-slate-100 hover:border-blue-200"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <span className="font-bold text-slate-700">{question.votes}</span>
            </div>

            {/* Question Content */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                {question.title}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {question.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1.5 rounded-md">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {question.time}
                  </span>
                  <button 
                    onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {question.answersCount} Answers
                    {expandedQuestionId === question.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                <button 
                  onClick={() => openAnswerModal(question.id)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Answer
                </button>
              </div>

              {/* Answers Display */}
              {expandedQuestionId === question.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    Student Responses
                  </h4>
                  {question.answers && question.answers.length > 0 ? (
                    <div className="space-y-3">
                      {question.answers.map((ans, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                          {ans}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 border-dashed text-center">
                      <p className="text-sm text-slate-500 italic">No answers yet. Be the first to help out!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      ))}

      {/* Answer Modal */}
      {activeQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Write an Answer</h3>
              <button 
                onClick={() => setActiveQuestionId(null)}
                className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitAnswer} className="p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-slate-700">
                  {questions.find(q => q.id === activeQuestionId)?.title}
                </p>
              </div>

              <textarea
                autoFocus
                rows="4"
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  if (duplicateError) setDuplicateError(''); // clear error when typing
                }}
                placeholder="Share your knowledge to help a peer..."
                className={`w-full p-3 bg-slate-50 border rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:bg-white resize-none transition-colors ${
                  duplicateError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              ></textarea>
              
              {duplicateError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{duplicateError}</p>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={!answerText.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Post Answer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
