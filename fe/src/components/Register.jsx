
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setLoading(true);

		try {
			// API call directly to the Express register endpoint
			await axios.post("/auth/register", formData);

			setMessage({
				type: "success",
				text: "Registration successful! Please log in.",
			});
			setLoading(false);

			// Optionally redirect to login after a short delay
			setTimeout(() => navigate("/login"), 1500);
		} catch (err) {
			setLoading(false);
			const errorMsg = `Registration failed: ${err.response?.data?.msg}`
			setMessage({ type: "danger", text: errorMsg });
		}
	};

    return (
        // 🌟 NEW CONTAINER STYLING: Centers everything vertically and horizontally 🌟
        <div className="d-flex align-items-center justify-content-center vh-100 vw-100 bg-light">
            <div className="card shadow-lg p-4 mx-3" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="card-title text-center mb-4 text-success fw-bold">
                    Create Your Account
                </h2>
                <hr className="mb-4" />
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label text-muted small">Email address</label>
                        <input
                            type="email"
                            className="form-control form-control-lg"
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
                            className="form-control form-control-lg"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`alert alert-${message.type} mt-4`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-success w-100 mt-4 btn-lg shadow" // Large, prominent button
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>
                <p className="mt-4 text-center small text-muted">
                    Already have an account?
                    <Link to="/login" className="ms-1 fw-bold text-decoration-none">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
