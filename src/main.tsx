import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Логуємо API_URL при завантаженні додатку
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
console.log('[MAIN] API_URL:', API_URL);
console.log('[MAIN] VITE_API_URL from env:', import.meta.env.VITE_API_URL || 'NOT SET (using localhost:3000)');
(window as any).__API_URL__ = API_URL;
(window as any).__VITE_API_URL__ = import.meta.env.VITE_API_URL || 'NOT SET';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // StrictMode викликає подвійні рендери в dev, що призводить до подвійних запитів
  // В production це не впливає, але для оптимізації вимкнено
  <App />
);
