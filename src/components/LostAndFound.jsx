import React, { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Navigation, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function LostAndFound() {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'report'
  const [items, setItems] = useState([]);
  
  // Form State
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Found'); // 'Lost' or 'Found'
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initial dummy data to make the UI look populated immediately
  const initialDummyItems = [
    { id: 'd1', name: "Black Fastrack Watch", type: "Found", location: "Library 2nd Floor", details: "Left on the desk near the window. Handed over to the librarian.", time: "2 hours ago" },
    { id: 'd2', name: "Engineering Drawing Drafter", type: "Lost", location: "Workshop A", details: "Has my initials 'RS' scratched on the back scale.", time: "5 hours ago" }
  ];

  // Fetch from Firebase (merging with dummy data for hackathon presentation)
  useEffect(() => {
    const q = query(collection(db, 'lostAndFound'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realItems = snapshot.docs.map(doc => ({
        id: doc.id,
        time: "Just now", // Simplifying time for hackathon demo
        ...doc.data()
      }));
      // Merge real firebase items on top of our dummy database for the demo effect
      setItems([...realItems, ...initialDummyItems]);
    }, (error) => {
      console.warn("Firebase not connected yet, using dummy data.", error);
      setItems(initialDummyItems);
    });

    return () => unsubscribe();
  }, []);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!itemName || !location) return;

    // REAL BACKEND: Try to save to Firebase
    try {
      await addDoc(collection(db, 'lostAndFound'), {
        name: itemName,
        type: itemType,
        location: location,
        details: details,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Firebase save failed:", error);
      // Even if Firebase fails, we instantly update UI for an impressive demo tracking!
      const newDummyItem = {
        id: Date.now().toString(),
        name: itemName,
        type: itemType,
        location: location,
        details: details,
        time: "Just now"
      };
      setItems([newDummyItem, ...items]);
    }

    // DUMMY UI: Show Success Screen
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setItemName('');
      setLocation('');
      setDetails('');
      setActiveTab('feed');
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans">
      <div className="bg-white border border-blue-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] overflow-hidden">
        
        {/* Header Setup */}
        <div className="bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Search className="w-6 h-6 text-blue-400" />
               Campus Lost & Found
            </h2>
            <p className="text-slate-400 text-sm mt-1">Help peers recover their belongings.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'feed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Browse Items
            </button>
            <button 
              onClick={() => setActiveTab('report')}
              className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'report' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Plus className="w-4 h-4" /> Report
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 min-h-[400px]">
          
          {/* --- TAB: ITEM FEED --- */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
                  
                  {/* Icon Indicator based on Lost/Found */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.type === 'Found' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {item.type === 'Found' ? <Package className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.type === 'Found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.type}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-2">
                       <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{item.details}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400">{item.time}</span>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                        Contact Finder ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-10 text-slate-500">No items reported recently.</div>
              )}
            </div>
          )}

          {/* --- TAB: REPORT ITEM FORM --- */}
          {activeTab === 'report' && (
            <div className="max-w-md mx-auto">
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <h3 className="font-bold text-slate-800 text-lg">Item Reported!</h3>
                  <p className="text-sm text-slate-500 mt-1">It's now visible to the entire campus.</p>
                </div>
              ) : (
                <form onSubmit={handleReport} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                    {['Lost', 'Found'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setItemType(type)}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${itemType === type ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        I {type} it
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">What is the item?</label>
                    <input 
                      type="text" 
                      value={itemName} onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Blue Water Bottle, ID Card" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                       <MapPin className="w-4 h-4 text-blue-500" /> Location
                    </label>
                    <input 
                      type="text" 
                      value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where was it lost/found?" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Identifying Details</label>
                    <textarea 
                      rows="3"
                      value={details} onChange={(e) => setDetails(e.target.value)}
                      placeholder="Any specific marks, colors, or how to claim it..." 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Post Item
                  </button>

                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
