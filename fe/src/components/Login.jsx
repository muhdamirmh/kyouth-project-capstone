import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
    const [formData, setFormData] = useState({email: "", password: ""});
    const [error, setError] = useState("");

    // Use context for login function and loading status
    const {login, loading} = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Attempt login via AuthContext
        const success = await login(formData.email, formData.password);

        if (success) {
            // If login function returns true (token received), navigate to chat
            navigate("/chat");
        } else {
            // Set a generic error message if login failed (handled within AuthContext)
            setError("Login failed. Please check your credentials.");
        }
    };


    return (
        // 🌟 NEW CONTAINER STYLING: Centers everything vertically and horizontally 🌟
        <div className="d-flex align-items-center justify-content-center vh-100 vw-100 bg-light">
            <div className="card shadow-lg p-4 mx-3" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="card-title text-center mb-4 text-primary fw-bold">
                    Welcome Back!
                </h2>
                <hr className="mb-4" />
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label text-muted small">Email address</label>
                        <input
                            type="email"
                            className="form-control form-control-lg" // Larger input fields
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small">Password</label>
                        <input
                            type="password"
                            className="form-control form-control-lg" // Larger input fields
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <div className="alert alert-danger mt-4">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary w-100 mt-4 btn-lg shadow" // Large, prominent button
                        disabled={loading}
                    >
                        {loading ? "Logging In..." : "Login"}
                    </button>
                </form>
                <p className="mt-4 text-center small text-muted">
                    Don't have an account?
                    <Link to="/register" className="ms-1 fw-bold text-decoration-none">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
