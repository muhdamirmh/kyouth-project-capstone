import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";


axios.defaults.baseURL = `${import.meta.env.VITE_BE_URL }/api/v1`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	// Initialize state from localStorage to persist login across refreshes
	const [token, setToken] = useState(localStorage.getItem("token"));
	const [isAuthenticated, setIsAuthenticated] = useState(
		!!localStorage.getItem("token"),
	);
	const [loading, setLoading] = useState(false);

	// Set the default header for all axios requests when the token changes
	useEffect(() => {
		if (token) {
			axios.defaults.headers.common["x-auth-token"] = token;
			localStorage.setItem("token", token);
			setIsAuthenticated(true);
		} else {
			delete axios.defaults.headers.common["x-auth-token"];
			localStorage.removeItem("token");
			setIsAuthenticated(false);
		}
	}, [token]);

	// Login function
	const login = async (email, password) => {
		setLoading(true);
		try {
			const res = await axios.post("/auth/login", { email, password });
			setToken(res.data.token); // This triggers the useEffect above
			setLoading(false);
			return true;
		} catch (err) {
			setLoading(false);
			// Handle error message for UI
			console.error("Login failed:", err.response?.data?.msg || "Server error");
			return false;
		}
	};

	const logout = () => {
		setToken(null);
	};

	// Provide the state and functions to components
	return (
		<AuthContext.Provider
			value={{ token, isAuthenticated, loading, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
