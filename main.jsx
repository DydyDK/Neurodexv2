import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HILLS } from "./data/hills.js";
import "./styles.css";

// Ciel étoilé et collines de fond
const sky = document.getElementById("sky");
let stars = "";
for (let i = 0; i < 90; i++) {
  stars += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 75}%;opacity:${(0.3 + Math.random() * 0.6).toFixed(2)};animation-delay:${(Math.random() * 4).toFixed(1)}s"></i>`;
}
sky.innerHTML = stars;
document.getElementById("hills").innerHTML = HILLS;

createRoot(document.getElementById("root")).render(<App />);
