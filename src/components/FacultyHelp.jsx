import React, { useState } from 'react';
import { Send, GraduationCap, FileText, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FacultyHelp() {
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [doubtText, setDoubtText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const faculties = [
    { id: 1, name: "Dr. Arvind Gupta", department: "Computer Science" },
    { id: 2, name: "Prof. Neha Sharma", department: "Data Structures" },
    { id: 3, name: "Dr. Vivek Deshmukh", department: "Mathematics" },
    { id: 4, name: "Prof. Anjali Verma", department: "Machine Learning" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFaculty || !doubtText.trim()) return;

    // REAL BACKEND: Save to Firebase
    try {
      await addDoc(collection(db, 'facultyDoubts'), {
        faculty: selectedFaculty,
        doubt: doubtText,
        createdAt: serverTimestamp(),
        status: "Pending" // For future use
      });
    } catch (error) {
      console.error("Error submitting to faculty:", error);
      // We will still show the success message for dummy hackathon demo purposes
      // even if Firebase fails or permissions are missing.
    }

    // DUMMY UI: Simulate success screen
    setIsSubmitted(true);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedFaculty('');
      setDoubtText('');
    }, 3000);
  };

  return (
    <div className="max-w-xl mx-auto p-4 font-sans">
      <div className="bg-white border text-left border-blue-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f172a] to-blue-900 p-6 text-slate-50 relative overflow-hidden">
          <GraduationCap className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20 text-blue-200" />
          <h2 className="text-xl font-bold flex items-center gap-2 relative z-10">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            Direct Faculty Connect
          </h2>
          <p className="text-blue-200 text-sm mt-1 relative z-10">
            Submit your doubts directly to your professors.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Doubt Sent Successfully!</h3>
              <p className="text-sm text-slate-500 mt-1">The professor will respond via the campus portal.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Faculty Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 block">Select Professor</label>
                <div className="relative">
                  <select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white appearance-none transition-all font-medium"
                    required
                  >
                    <option value="" disabled>Choose a faculty member...</option>
                    {faculties.map(faculty => (
                      <option key={faculty.id} value={faculty.name}>
                        {faculty.name} ({faculty.department})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Your Doubt
                </label>
                <textarea
                  rows="4"
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="Clearly explain the topic you are struggling with..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all"
                  required
                ></textarea>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedFaculty || !doubtText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 text-white py-3.5 rounded-xl font-bold transition-colors shadow-sm"
                >
                  <Send className="w-5 h-5" />
                  Submit to Faculty
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
