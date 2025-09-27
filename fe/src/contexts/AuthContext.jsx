import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";


const isProduction = import.meta.env.VITE_ENV == "production";

const baseURL = isProduction
    ? '/api/v1'
    : `${import.meta.env.VITE_BE_URL}/api/v1`;

axios.defaults.baseURL = baseURL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

    // 1. CRITICAL: Handles initial load from localStorage and all token changes
    useEffect(() => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
            // Found token in storage: Set state and Axios header immediately
            setToken(storedToken);
            setIsAuthenticated(true);
            axios.defaults.headers.common["x-auth-token"] = storedToken;
        }

        // This is the only place we set loading to false, ensuring it only runs once
        setLoading(false);
    }, []); // 👈 Runs ONLY ONCE when the component mounts

    // 2. Secondary useEffect to handle token changes from LOGIN/LOGOUT
    useEffect(() => {
        if (token) {
            // Update localStorage and headers when a NEW token is set (via login)
            axios.defaults.headers.common["x-auth-token"] = token;
            localStorage.setItem("token", token);
            setIsAuthenticated(true);
        } else if (token === null && isAuthenticated) {
            // Handle explicit LOGOUT where setToken(null) is called
            delete axios.defaults.headers.common["x-auth-token"];
            localStorage.removeItem("token");
            setIsAuthenticated(false);
        }
    }, [token]);

    // Login function
    const login = async (email, password) => {
        setLoading(true); // Temporary loading state for the request
        try {
            const res = await axios.post("/auth/login", { email, password });
            setToken(res.data.token); // This triggers the secondary useEffect
            setLoading(false);
            return true;
        } catch (err) {
            setLoading(false);
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
