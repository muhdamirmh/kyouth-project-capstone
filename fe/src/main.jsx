import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<AuthProvider>
            <ChatProvider>
                <Router>
                    <App />
                </Router>
            </ChatProvider>
		</AuthProvider>
	</StrictMode>,
);
