import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBtYu3SY_XTXzDc3lK09944M_qfdIqJyIA",
  authDomain: "gubs-online.firebaseapp.com",
  databaseURL: "https://gubs-online-default-rtdb.firebaseio.com",
  projectId: "gubs-online",
  storageBucket: "gubs-online.appspot.com",
  messagingSenderId: "936911098464",
  appId: "1:936911098464:web:f762c9ebaa51c723362905",
  measurementId: "G-2DEX510CWW"
};

const app = initializeApp(firebaseConfig);




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



