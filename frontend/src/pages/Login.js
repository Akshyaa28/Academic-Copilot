import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setStatusMessage("");
    setIsError(false);

    if (!email.trim() || !password.trim()) {
      setIsError(true);
      setStatusMessage("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password
      });

      setIsError(false);
      setStatusMessage(res.data.msg || "Login successful");

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      }
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.msg || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-login">
        <div className="auth-brand" aria-hidden="true">
          <div className="auth-brand-icon">
            <span className="auth-brand-book" />
          </div>
          <div className="auth-brand-copy">
            <div className="auth-brand-title">Academic Co-Pilot</div>
            <div className="auth-brand-tagline">SYLLABUS -&gt; MASTERY</div>
          </div>
        </div>

        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to continue your learning journey.
          </p>

          <button type="button" className="auth-google-btn">
            <span className="auth-google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.6 14.5 2.7 12 2.7A9.3 9.3 0 0 0 2.7 12c0 5.1 4.1 9.3 9.3 9.3 5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.5H12Z"
                />
                <path
                  fill="#34A853"
                  d="M2.7 7.3 5.9 9.7C6.8 7.4 9.1 5.8 12 5.8c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.6 14.5 2.7 12 2.7c-3.6 0-6.8 2-8.3 4.6Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 21.3c2.4 0 4.5-.8 6-2.3l-2.9-2.4c-.8.6-1.8 1-3.1 1-3.7 0-5.1-2.6-5.4-3.8l-3.1 2.4c1.5 3 4.6 5.1 8.5 5.1Z"
                />
                <path
                  fill="#4285F4"
                  d="M21 12.2c0-.6-.1-1.1-.2-1.5H12v3.9h5.4c-.3 1.3-1.1 2.3-2.3 3l2.9 2.4c1.7-1.6 3-4 3-7.8Z"
                />
              </svg>
            </span>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="........"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="auth-submit-btn">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {statusMessage ? (
            <p className={isError ? "auth-feedback auth-feedback-error" : "auth-feedback auth-feedback-success"}>
              {statusMessage}
            </p>
          ) : null}

          <p className="auth-footer-text">
            No account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
