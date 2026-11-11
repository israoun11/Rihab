import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/style.css";
import "./styles/site-additions.css";
import { App } from "./App";

document.documentElement.classList.add("js");

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable.");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
