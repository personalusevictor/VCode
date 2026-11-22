import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { PreferencesProvider } from "./app/Preferences";
import "./styles/base.css";
import "./styles/choices.css";
import "./workspace/workspace.css";
import "./styles/navigation.css";
import "./styles/pointer.css";
import "./styles/footer.css";
import "./styles/search.css";
import "./styles/motion.css";

createRoot(document.getElementById("root")).render(
  <PreferencesProvider>
    <App />
  </PreferencesProvider>,
);
