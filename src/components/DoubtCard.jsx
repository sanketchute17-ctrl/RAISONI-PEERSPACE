import React, { useState } from 'react';
import { ArrowBigUp, MessageSquare, Ghost, User, Send, CheckCircle2, Sparkles, Loader2, X, ThumbsUp, ThumbsDown, Flag, AlertTriangle, Download } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export default function DoubtCard({ doubt, currentUser, userProfile, isUserAnonymous }) {
  const currentUserId = currentUser ? currentUser.uid : "anonymous_session";
  const initialUpvoted = doubt.upvoters ? doubt.upvoters.includes(currentUserId) : false;
  
  const [hasUpvoted, setHasUpvoted] = useState(initialUpvoted);
  
  // Peer Answer System State
  const [showAnswers, setShowAnswers] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [duplicateError, setDuplicateError] = useState('');

  const answersList = doubt.answers || [];
  const upvotesCount = doubt.upvotes || 0;

  const handleUpvote = async () => {
    if (!doubt.id) return;
    
    // Optimistic UI state
    const willUpvote = !hasUpvoted;
    setHasUpvoted(willUpvote);

    try {
      const doubtRef = doc(db, 'doubts', doubt.id.toString());
      if (willUpvote) {
        await updateDoc(doubtRef, {
          upvotes: increment(1),
          upvoters: arrayUnion(currentUserId)
        });
      } else {
        await updateDoc(doubtRef, {
          upvotes: increment(-1),
          upvoters: arrayRemove(currentUserId)
        });
      }
    } catch (err) {
      console.error("Upvote failed:", err);
      // Revert optimistic UI if failed
      setHasUpvoted(!willUpvote);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileUploadError('Please attach a PDF or image file only.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFileUploadError('');
  };

  const uploadAttachment = async () => {
    if (!selectedFile || !doubt.id) return null;
    setIsUploadingFile(true);
    try {
      const uploadPath = `doubtAnswers/${doubt.id}/${Date.now()}_${selectedFile.name}`;
      const storageReference = storageRef(storage, uploadPath);
      const uploadTask = uploadBytesResumable(storageReference, selectedFile);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, (error) => reject(error), () => resolve());
      });

      const url = await getDownloadURL(uploadTask.snapshot.ref);
      return {
        fileUrl: url,
        fileType: selectedFile.type,
        fileName: selectedFile.name
      };
    } catch (error) {
      console.error('Attachment upload failed:', error);
      setFileUploadError('Unable to upload attachment. Try again.');
      return null;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() && !selectedFile) return;
    if (!doubt.id) return;

    const answerText = newAnswer.trim();
    const isDuplicate = answersList.some(ans => ans.text?.trim().toLowerCase() === answerText.toLowerCase() && !ans.attachment);
    if (isDuplicate) {
      setDuplicateError("This exact answer has already been submitted!");
      return;
    }

    let authorName = "Student";
    if (isUserAnonymous) {
      authorName = "Ghost Protocol";
    } else {
      authorName = userProfile?.fullName || "Nagpur User";
    }

    let attachment = null;
    if (selectedFile) {
      attachment = await uploadAttachment();
      if (!attachment) return;
    }

    const answerObj = {
      id: Date.now(),
      text: answerText || (attachment ? 'Attached file answer' : ''),
      author: authorName,
      isVerified: userProfile?.rank === 1 || false,
      timeAgo: "Just now",
      attachment,
      upvotes: 0,
      downvotes: 0,
      upvoters: [],
      downvoters: [],
      reported: false
    };

    try {
      const doubtRef = doc(db, 'doubts', doubt.id.toString());
      await updateDoc(doubtRef, {
        answers: arrayUnion(answerObj)
      });
      setNewAnswer('');
      setSelectedFile(null);
      setDuplicateError('');
      setFileUploadError('');
      
      if (doubt.authorId && doubt.authorId !== currentUserId) {
        await addDoc(collection(db, 'notifications'), {
           receiverId: doubt.authorId,
           title: "New Answer!",
           message: `${authorName} answered your question: "${doubt.title}"`,
           read: false,
           timestamp: Date.now(),
           timeAgo: "Just now"
        });
      }
    } catch (err) {
      console.error("Answer failed:", err);
    }
  };

  const handleDownloadPDF = () => {
    const content = `
      <html><head><title>${doubt.title}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { color: #1e293b; margin-bottom: 10px; font-size: 24px; }
        .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; }
        .desc { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 15px; }
        h3 { color: #334155; margin-top: 40px; font-size: 20px; }
        .ans { border-bottom: 1px solid #f1f5f9; padding: 20px 0; }
        .ans-author { font-weight: bold; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .is-ai { color: #7e22ce; background: #faf5ff; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .ans-text { color: #475569; margin-top: 8px; white-space: pre-wrap; font-size: 15px; }
        .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
      </head><body>
      <div class="header">
        <h1>${doubt.title}</h1>
        <div class="meta">Asked by <strong>${doubt.author}</strong> on Raisoni PeerSpace</div>
        ${doubt.description ? `<div class="desc">${doubt.description}</div>` : ''}
      </div>
      <h3>Discussions & Answers (${answersList.filter(a => !a.reported).length})</h3>
      ${answersList.filter(a => !a.reported).length === 0 ? '<p style="color:#64748b">No answers available yet.</p>' : ''}
      ${answersList.filter(a => !a.reported).map(a => `
        <div class="ans">
          <div class="ans-author">
            ${a.author} 
            ${a.isAI ? '<span class="is-ai">AI Answer</span>' : ''}
          </div>
          <div class="ans-text">${a.text}</div>
        </div>
      `).join('')}
      <div class="footer">Generated from Raisoni PeerSpace for Educational Use</div>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 200);
  };

  const handleAIAnswer = async () => {
    if (!doubt.id || isGeneratingAI) return;
    
    // 1. Expand the thread so they see it appearing
    setShowAnswers(true);
    setIsGeneratingAI(true);

    // 2. Simulate AI Thinking Delay (1.5s for presentation effect)
    setTimeout(async () => {
      const aiAnswerObj = {
        id: Date.now(),
        text: "Based on my knowledge base, here is a structured answer: \n\n1. Define your core concepts clearly.\n2. Break the problem into smaller modules.\n3. Make sure to test edge cases.\n\nLet me know if you need a code example!",
        author: "PeerSpace AI",
        isVerified: true,
        isAI: true, // Special flag for styling
        timeAgo: "Just now"
      };

      try {
        const doubtRef = doc(db, 'doubts', doubt.id.toString());
        await updateDoc(doubtRef, {
          answers: arrayUnion(aiAnswerObj)
        });
      } catch (err) {
        console.error("AI Answer failed:", err);
      } finally {
        setIsGeneratingAI(false);
      }
    }, 1500);
  };

  return (
    <div className="bg-white border border-blue-100 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-md transition-shadow mb-5 flex gap-4 w-full">
      {/* Upvote Column */}
      <div className="flex flex-col items-center gap-1">
        <button 
          onClick={handleUpvote}
          className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${hasUpvoted ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
          <ArrowBigUp className={`w-7 h-7 ${hasUpvoted ? 'fill-current' : ''}`} />
        </button>
        <span className={`font-bold ${hasUpvoted ? 'text-blue-600' : 'text-slate-500'}`}>
          {upvotesCount}
        </span>
      </div>

      {/* Content Column */}
      <div className="flex-1 w-full">
        {/* Meta Info */}
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
          {doubt.isAnonymous ? (
            <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-slate-700 shadow-sm border border-slate-200">
              <Ghost className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-xs tracking-wide">Anonymous Student</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-700">
              <div className="bg-blue-100 p-1 rounded-full"><User className="w-3 h-3 text-blue-600" /></div>
              <span className="font-bold text-[#0f172a]">{doubt.author}</span>
            </div>
          )}
          <span className="text-slate-300">•</span>
          <span className="text-xs font-medium text-blue-600/70">{doubt.timeAgo || "Just now"}</span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[#0f172a] mb-2 leading-snug">{doubt.title}</h3>
        {doubt.description && (
          <p className="text-slate-600 mb-4 text-sm leading-relaxed whitespace-pre-wrap">{doubt.description}</p>
        )}

        {/* Display Doubt Attachment if any */}
        {doubt.attachment && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
             <p className="font-semibold text-slate-700 text-sm mb-2">Attached file</p>
             {doubt.attachment.fileType?.startsWith('image/') ? (
               <img src={doubt.attachment.fileUrl} alt={doubt.attachment.fileName} className="max-h-64 w-full object-contain rounded-lg border border-slate-200 bg-white" />
             ) : (
               <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                 <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                   PDF
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-bold text-slate-800 truncate">{doubt.attachment.fileName}</p>
                   <a href={doubt.attachment.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                     Click to View / Download
                   </a>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Tags & Actions */}
        <div className="flex items-center justify-between border-t border-blue-50 pt-3">
          <div className="flex flex-wrap gap-2">
            {doubt.tags?.map((tag, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100/50 text-[11px] font-bold px-2.5 py-1 uppercase tracking-wide rounded-md">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-sm"
              title="Save as PDF Notes"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button 
              onClick={handleAIAnswer}
              disabled={isGeneratingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 border border-purple-200 shadow-sm disabled:opacity-50"
            >
              {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGeneratingAI ? "Thinking..." : "AI Solve"}
            </button>

            <button 
              onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${showAnswers ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 border border-transparent'}`}
            >
              <MessageSquare className="w-4 h-4" />
              {answersList.length} Answers
            </button>
          </div>
        </div>

        {/* --- EXPANDABLE ANSWER THREAD --- */}
        {showAnswers && (
          <div className="mt-4 pt-4 border-t border-blue-50 bg-slate-50/50 -mx-5 px-5 pb-2 rounded-b-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Peer Responses</h4>
            
            {/* Existing Answers List */}
            <div className="space-y-4 mb-4">
              {answersList.length === 0 ? (
                <p className="text-sm text-slate-500 italic px-2">No answers yet. Be the first to help out!</p>
              ) : (
                answersList.map((ans) => {
                  const hasUpvotedAns = ans.upvoters?.includes(currentUserId);
                  const hasDownvotedAns = ans.downvoters?.includes(currentUserId);

                  const handleAnswerInteract = async (interactionType) => {
                    if (!doubt.id) return;
                    try {
                      const ansIndex = doubt.answers.findIndex(a => a.id === ans.id);
                      if (ansIndex === -1) return;

                      let newAnswers = [...doubt.answers];
                      let targetAns = { ...newAnswers[ansIndex] };

                      if (interactionType === 'upvote') {
                        if (hasUpvotedAns) {
                          targetAns.upvotes = Math.max(0, (targetAns.upvotes || 0) - 1);
                          targetAns.upvoters = (targetAns.upvoters || []).filter(uid => uid !== currentUserId);
                        } else {
                          if (hasDownvotedAns) {
                            targetAns.downvotes = Math.max(0, (targetAns.downvotes || 0) - 1);
                            targetAns.downvoters = (targetAns.downvoters || []).filter(uid => uid !== currentUserId);
                          }
                          targetAns.upvotes = (targetAns.upvotes || 0) + 1;
                          targetAns.upvoters = [...(targetAns.upvoters || []), currentUserId];
                        }
                      } else if (interactionType === 'downvote') {
                        if (hasDownvotedAns) {
                          targetAns.downvotes = Math.max(0, (targetAns.downvotes || 0) - 1);
                          targetAns.downvoters = (targetAns.downvoters || []).filter(uid => uid !== currentUserId);
                        } else {
                          if (hasUpvotedAns) {
                            targetAns.upvotes = Math.max(0, (targetAns.upvotes || 0) - 1);
                            targetAns.upvoters = (targetAns.upvoters || []).filter(uid => uid !== currentUserId);
                          }
                          targetAns.downvotes = (targetAns.downvotes || 0) + 1;
                          targetAns.downvoters = [...(targetAns.downvoters || []), currentUserId];
                        }
                      } else if (interactionType === 'report') {
                        targetAns.reported = true;
                      }

                      newAnswers[ansIndex] = targetAns;
                      await updateDoc(doc(db, 'doubts', doubt.id.toString()), { answers: newAnswers });
                    } catch (err) {
                      console.error("Interaction failed:", err);
                    }
                  };

                  return (
                    <div key={ans.id} className={`flex gap-3 p-3 rounded-xl border shadow-sm transition-all duration-300 ${ans.isAI ? 'bg-indigo-50/50 border-purple-200' : ans.reported ? 'bg-red-50/50 border-red-200 opacity-60 hover:opacity-100 grayscale hover:grayscale-0' : 'bg-white border-blue-50'}`}>
                      <div className="shrink-0">
                        {ans.isAI ? (
                          <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center p-1 shadow-sm">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        ) : ans.reported ? (
                          <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center p-1 shadow-sm border border-red-200">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </div>
                        ) : (
                          <User className="w-7 h-7 text-blue-400 bg-blue-50 rounded-full p-1" />
                        )}
                      </div>
                      <div className="flex-1 text-sm min-w-0">
                        <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                          <span className={`font-bold flex items-center gap-1 ${ans.isAI ? 'text-purple-700' : ans.reported ? 'text-red-700' : 'text-[#0f172a]'}`}>
                            {ans.reported ? "Reported Answer" : ans.author}
                            {ans.isVerified && !ans.reported && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{ans.timeAgo}</span>
                        </div>
                        
                        {ans.reported ? (
                          <p className="text-red-600 mt-1 italic font-semibold line-through decoration-red-300 text-xs">
                            This content has been flagged for violating community guidelines.
                          </p>
                        ) : (
                          <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{ans.text}</p>
                        )}
                        
                        {ans.attachment && !ans.reported && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="font-semibold text-slate-700 text-sm">Attached file</p>
                            {ans.attachment.fileType?.startsWith('image/') ? (
                              <img src={ans.attachment.fileUrl} alt={ans.attachment.fileName} className="mt-2 max-h-48 w-full object-contain rounded-lg border border-slate-200 bg-white" />
                            ) : (
                              <a href={ans.attachment.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 hover:underline">
                                <span>View Document: {ans.attachment.fileName}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Interactive Action Bar */}
                        {!ans.reported && !ans.isAI && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                             <div className="flex items-center gap-4">
                               <button 
                                 onClick={() => handleAnswerInteract('upvote')}
                                 className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${hasUpvotedAns ? 'text-green-600' : 'text-slate-400 hover:text-green-600'}`}
                               >
                                 <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvotedAns ? 'fill-current' : ''}`} />
                                 Like {ans.upvotes > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{ans.upvotes}</span>}
                               </button>
                               <button 
                                 onClick={() => handleAnswerInteract('downvote')}
                                 className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${hasDownvotedAns ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                               >
                                 <ThumbsDown className={`w-3.5 h-3.5 ${hasDownvotedAns ? 'fill-current' : ''}`} />
                                 Dislike {ans.downvotes > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{ans.downvotes}</span>}
                               </button>
                             </div>
                             <button 
                               onClick={() => {
                                 if (window.confirm("Are you sure you want to report this answer for teasing or wrong info?")) {
                                   handleAnswerInteract('report');
                                 }
                               }}
                               className="text-xs text-slate-400 hover:text-red-500 font-bold flex items-center gap-1 transition-colors"
                             >
                               <Flag className="w-3.5 h-3.5" /> Report
                             </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Answer Input Box */}
            <form onSubmit={submitAnswer} className="relative mt-2 space-y-3">
              <input 
                type="text" 
                value={newAnswer}
                onChange={(e) => {
                  setNewAnswer(e.target.value);
                  if (duplicateError) setDuplicateError('');
                }}
                placeholder="Write an accurate answer to help out..." 
                className={`w-full pl-4 pr-12 py-3 bg-white border ${duplicateError ? 'border-red-400 focus:ring-red-400 focus:border-red-500' : 'border-blue-100 focus:ring-blue-500 focus:border-blue-500'} rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-medium shadow-[0_2px_10px_-3px_rgba(15,23,42,0.05)] text-slate-800`}
              />

              <label className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                <span>{selectedFile ? selectedFile.name : 'Attach PDF or image'}</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFile && (
                <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {fileUploadError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                  {fileUploadError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button 
                  type="submit"
                  disabled={(!newAnswer.trim() && !selectedFile) || isUploadingFile}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
                >
                  {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isUploadingFile ? 'Uploading...' : 'Post Answer'}
                </button>
                <span className="text-xs text-slate-500">Supports PDF / JPG / PNG / WEBP</span>
              </div>
            </form>
            {duplicateError && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-1">
                <span className="font-bold">Duplicate:</span> {duplicateError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
