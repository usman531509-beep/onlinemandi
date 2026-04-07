"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect, Suspense } from "react";
import Image from "next/image";

type AuthMode = "login" | "signup";
type UserRole = "admin" | "buyer" | "seller";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
};

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "buyer" as UserRole,
  });

  // Handle query params for initial state
  useEffect(() => {
    const requestedMode = searchParams.get("mode") as AuthMode;
    const requestedRole = searchParams.get("role") as UserRole;
    
    if (requestedMode === "signup" || requestedMode === "login") {
      setMode(requestedMode);
    }
    
    if (requestedRole === "buyer" || requestedRole === "seller") {
      setSignupForm(prev => ({ ...prev, role: requestedRole }));
    }
  }, [searchParams]);

  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<SessionUser | null>(null);

  const performSessionCleanup = () => {
    const pendingBroadcast = localStorage.getItem("mundi:pendingBroadcast");

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("mundi:")) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (pendingBroadcast) {
        localStorage.setItem("mundi:pendingBroadcast", pendingBroadcast);
    }
  };

  useEffect(() => {
    performSessionCleanup();
  }, []);

  const storeSessionAndRedirect = (user: SessionUser) => {
    performSessionCleanup();
    localStorage.setItem("mundi:sessionUser", JSON.stringify(user));
    router.push(`/${user.role}/panel`);
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
        if (i === 4) formatted += "-";
        formatted += digits[i];
    }
    return formatted;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: loginForm.email, password: loginForm.password }
          : {
            fullName: signupForm.fullName,
            email: signupForm.email,
            phoneNumber: signupForm.phoneNumber,
            password: signupForm.password,
            role: signupForm.role,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
        user?: SessionUser;
      };

      if (!response.ok || !data.ok || !data.user) {
        setError(data.error ? `${data.message || "Request failed."} ${data.error}` : data.message || "Request failed. Please try again.");
        return;
      }

      if (mode === "signup") {
        setRegisteredUser(data.user);
        setShowWelcome(true);
      } else {
        storeSessionAndRedirect(data.user);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <div className="row g-0 h-100">
        {/* Left Side: Visual & Value Proposition */}
        <div className="col-lg-6 d-none d-lg-block position-relative overflow-hidden">
          <div className="auth-visual-side">
            <Image
              src="/images/auth-bg.png"
              alt="Agricultural Pakistan"
              fill
              className="object-fit-cover"
              priority
            />
            <div className="auth-visual-overlay"></div>
            <div className="auth-visual-content p-5 text-white">
              <div className="mb-4">
                <Link href="/" className="text-decoration-none d-inline-block">
                  <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center gap-2">
                    <span className="fw-bold text-success fs-4">Online<span className="text-dark">Mundi</span></span>
                  </div>
                </Link>
              </div>
              <div className="mt-auto">
                <h2 className="display-4 fw-bold mb-3">Pakistan's Premium Mundi Marketplace</h2>
                <p className="lead opacity-90 mb-4">
                  Join thousands of verified buyers and sellers. Trade crops with confidence, track real-time prices, and grow your Mundi today.
                </p>
                <div className="d-flex gap-4 mt-5">
                  <div className="stat-item">
                    <h3 className="fw-bold mb-0">10k+</h3>
                    <p className="small opacity-75">Active Traders</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="fw-bold mb-0">500+</h3>
                    <p className="small opacity-75">Daily Listings</p>
                  </div>
                  <div className="stat-item">
                    <h3 className="fw-bold mb-0">Verified</h3>
                    <p className="small opacity-75">Secure Deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="col-lg-6 col-12 d-flex align-items-center justify-content-center bg-white p-4 p-md-5">
          <div className="auth-form-wrapper w-100" style={{ maxWidth: "440px" }}>
            <div className="d-lg-none mb-4 text-center">
              <Link href="/" className="text-decoration-none">
                <span className="fw-bold text-success fs-3">Online<span className="text-dark">Mundi</span></span>
              </Link>
            </div>

            <div className="text-center mb-5">
              <h1 className="h2 fw-bold text-brand-dark mb-2">
                {mode === "login" ? "Welcome Back" : "Get Started"}
              </h1>
              <p className="text-muted">
                {mode === "login" 
                  ? "Access your dashboard and manage your trades." 
                  : "Join the marketplace and start trading today."}
              </p>
            </div>

            <div className="auth-mode-pill mb-4">
              <button
                type="button"
                className={`mode-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => { setMode("login"); setError(""); }}
              >
                Login
              </button>
              <button
                type="button"
                className={`mode-tab ${mode === "signup" ? "active" : ""}`}
                onClick={() => { setMode("signup"); setError(""); }}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="alert alert-danger-custom border-0 rounded-3 p-3 mb-4 d-flex align-items-center gap-3">
                <i className="fa-solid fa-circle-exclamation fs-5"></i>
                <div className="small fw-medium">{error}</div>
              </div>
            )}

            <form onSubmit={onSubmit} className="auth-form">
              {mode === "signup" && (
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase opacity-75">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0"><i className="fa-solid fa-user text-muted opacity-50"></i></span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Enter your full name"
                      required
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="form-label small fw-bold text-uppercase opacity-75">
                  {mode === "login" ? "Email or Phone" : "Email Address"}
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className={`fa-solid ${mode === "login" ? "fa-id-card" : "fa-envelope"} text-muted opacity-50`}></i>
                  </span>
                  <input
                    type={mode === "login" ? "text" : "email"}
                    className="form-control border-start-0 ps-0"
                    placeholder={mode === "login" ? "name@email.com or 03XX-XXXXXXX" : "name@example.com"}
                    required
                    value={mode === "login" ? loginForm.email : signupForm.email}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (mode === "login" && /^\d/.test(val)) val = formatPhone(val);
                      if (mode === "login") setLoginForm(prev => ({ ...prev, email: val }));
                      else setSignupForm(prev => ({ ...prev, email: val }));
                    }}
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase opacity-75">Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0"><i className="fa-solid fa-phone text-muted opacity-50"></i></span>
                    <input
                      type="tel"
                      className="form-control border-start-0 ps-0"
                      placeholder="03XX-XXXXXXX"
                      required
                      value={signupForm.phoneNumber}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, phoneNumber: formatPhone(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-bold text-uppercase opacity-75 mb-0">Password</label>
                  {mode === "login" && (
                    <Link href="/forgot-password" className="text-brand-success text-decoration-none fw-semibold x-small">
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0"><i className="fa-solid fa-lock text-muted opacity-50"></i></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="Enter password"
                    required
                    value={mode === "login" ? loginForm.password : signupForm.password}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (mode === "login") setLoginForm(prev => ({ ...prev, password: val }));
                      else setSignupForm(prev => ({ ...prev, password: val }));
                    }}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-transparent border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} opacity-75`}></i>
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="mb-4">
                  <label className="form-label small fw-bold text-uppercase opacity-75">Select Your Role</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0"><i className="fa-solid fa-hands-holding-circle text-muted opacity-50"></i></span>
                    <select
                      className="form-select border-start-0 ps-0"
                      required
                      value={signupForm.role}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    >
                      <option value="buyer">I am a Buyer (Wholesaler, Retailer)</option>
                      <option value="seller">I am a Seller (Farmer, Stockist)</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-brand-success w-100 btn-lg rounded-3 py-3 mt-2 shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>
                    <span>{mode === "login" ? "Log In to Your Account" : "Create My Trade Account"}</span>
                    <i className="fa-solid fa-arrow-right-long small opacity-50"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-5">
              <p className="text-muted small">
                {mode === "login" ? "New to OnlineMundi?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="btn btn-link p-0 text-brand-success text-decoration-none fw-bold"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                >
                  {mode === "login" ? "Register now" : "Go to Login"}
                </button>
              </p>
              <div className="text-center mt-3">
                  <Link href="/" className="small text-decoration-none auth-link">
                    Back to Home
                  </Link>
                </div>
            </div>
          </div>
        </div>
      </div>

      {showWelcome && registeredUser && (
        <div className="welcome-modal-overlay">
          <div className="welcome-card card border-0 shadow-lg p-5 text-center rounded-4">
            <div className="success-lottie mb-4 mx-auto">
              <div className="success-ring"><i className="fa-solid fa-check fs-1 text-white"></i></div>
            </div>
            <h2 className="fw-bold mb-3">Welcome to OnlineMundi, {registeredUser.fullName}!</h2>
            <p className="text-muted mb-5">
              Your trade account as a <strong>{registeredUser.role}</strong> has been secured. 
              Start exploring the marketplace now.
            </p>
            <button
              className="btn btn-brand-success btn-lg py-3 rounded-3 fw-bold"
              onClick={() => storeSessionAndRedirect(registeredUser)}
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .auth-container {
          height: 100vh;
          min-height: 700px;
          overflow-x: hidden;
        }

        .auth-visual-side {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .auth-visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(27,67,50,0.4) 0%, rgba(27,67,50,0.8) 100%);
          z-index: 1;
        }

        .auth-visual-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .stat-item {
          border-left: 3px solid rgba(255,255,255,0.3);
          padding-left: 1rem;
        }

        .auth-mode-pill {
          background: #f1f5f3;
          padding: 5px;
          border-radius: 12px;
          display: flex;
          gap: 5px;
        }

        .mode-tab {
          flex: 1;
          border: 0;
          background: transparent;
          padding: 8px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #6c757d;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mode-tab.active {
          background: #fff;
          color: #1b4332;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .input-group-text {
          color: #adb5bd;
          transition: all 0.2s;
        }

        .form-control:focus + .input-group-text,
        .form-control:focus ~ .input-group-text {
          color: #1b4332;
        }

        .form-control, .form-select {
          padding: 0.75rem;
          font-size: 0.95rem;
          border-color: #e9ecef;
        }

        .form-control:focus, .form-select:focus {
          border-color: #1b4332;
          box-shadow: 0 0 0 0.25rem rgba(27, 67, 50, 0.05);
        }

        .btn-brand-success {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
          color: #fff;
          border: none;
        }

        .btn-brand-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(27, 67, 50, 0.15);
          color: #fff;
        }

        .alert-danger-custom {
          background: #fff5f5;
          color: #e03131;
        }

        .welcome-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 27, 21, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .welcome-card {
          width: 100%;
          max-width: 480px;
          animation: slideZoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideZoomIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .success-ring {
          width: 80px;
          height: 80px;
          background: #2d6a4f;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 0 0 10px rgba(45, 106, 79, 0.1);
        }

        .text-brand-dark { color: #1b4332; }
        .text-brand-success { color: #2d6a4f; }
        .x-small { font-size: 0.8rem; }
      `}</style>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="d-flex align-items-center justify-content-center min-vh-100"><div className="spinner-border text-success" role="status"></div></div>}>
      <AuthContent />
    </Suspense>
  );
}
