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
        const result = await login(formData.email, formData.password);

        if (result.success) {
            // If login function returns true (token received), navigate to chat
            navigate("/chat");
        } else {
            // Set a generic error message if login failed (handled within AuthContext)
            setError(`Login failed. ${result.message}`);
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
                        {loading ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-arrow-clockwise rotate-clockwise me-2" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                              d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                        <path
                                            d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                                    </svg>
                                    <span>Logging in..</span>
                                </>
                            ) :

                            (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-box-arrow-in-right me-2" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                              d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
                                        <path fill-rule="evenodd"
                                              d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                                    </svg>
                                    <span>Login</span>
                                </>
                            )
                        }
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
