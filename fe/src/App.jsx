import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Chat from "./components/Chat.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import { useAuth } from "./contexts/AuthContext.jsx"; // Get state from context

// Simple component to protect routes
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, loading } = useAuth();

	if (loading) return <div>Loading...</div>; // Simple loading check

	// If not authenticated, redirect to login
	return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
	return (
		<div className="container p-0">
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				{/* Protected Chat Route */}
				<Route
					path="/chat"
					element={
						<ProtectedRoute>
							<Chat />
						</ProtectedRoute>
					}
				/>

				{/* Default route redirects to /chat or /login */}
				<Route path="/" element={<Navigate to="/chat" />} />
			</Routes>
		</div>
	);
}

export default App;
