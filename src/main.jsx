import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { PreferencesProvider } from "./app/Preferences";
import "./styles/base.css";
import "./styles/navigation.css";
import "./styles/hero.css";
import "./styles/pointer.css";
import "./styles/languages.css";
import "./styles/library.css";
import "./styles/tools.css";
import "./styles/footer.css";
import "./styles/search.css";
import "./styles/motion.css";

createRoot(document.getElementById("root")).render(
  <PreferencesProvider>
    <App />
  </PreferencesProvider>,
);
