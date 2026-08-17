import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Fetching doubts...");
    const snapshot = await getDocs(collection(db, 'doubts'));
    console.log(`Successfully fetched ${snapshot.docs.length} doubts.`);
    
    // Add a test doubt
    console.log("Adding a test doubt...");
    const docRef = await addDoc(collection(db, 'doubts'), {
      title: "Test Doubt",
      description: "Testing Firebase",
      author: "Test",
      isAnonymous: true,
      authorId: 'test',
      createdAt: serverTimestamp(),
      upvotes: 0,
      upvoters: [],
      tags: ["General"],
      answers: [],
      attachment: null
    });
    console.log("Successfully added doubt with ID: ", docRef.id);
    
  } catch (err) {
    console.error("Firebase Error:", err);
  }
}

test();
