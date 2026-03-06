// firebase.js — Initialize Firebase once and export the auth instance.
// All other files import auth from here; nothing else initializes Firebase.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey:     process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId:  process.env.REACT_APP_FIREBASE_PROJECT_ID,
    appId:      process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
