import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Actual config from the Firebase console screenshot
const firebaseConfig = {
  apiKey: "AIzaSyAbbqBQoEsaBo9wt7j8yu52Muw94BCuBRA",
  authDomain: "peerspace-hackathon.firebaseapp.com",
  projectId: "peerspace-hackathon",
  storageBucket: "peerspace-hackathon.firebasestorage.app",
  messagingSenderId: "245486818342",
  appId: "1:245486818342:web:0dc523ad4e3b9d741cc2e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
