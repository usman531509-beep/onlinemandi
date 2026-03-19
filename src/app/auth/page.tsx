"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";

type AuthMode = "login" | "signup";
type UserRole = "admin" | "buyer" | "seller";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
};

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "buyer" as UserRole,
  });

  const performSessionCleanup = () => {
    const pendingBroadcast = localStorage.getItem("mandi:pendingBroadcast");

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("mandi:")) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (pendingBroadcast) {
        localStorage.setItem("mandi:pendingBroadcast", pendingBroadcast);
    }
  };

  useEffect(() => {
    // Clear old session user and drafts immediately to prevent session overlap
    performSessionCleanup();
  }, []);

  const storeSessionAndRedirect = (user: SessionUser) => {
    performSessionCleanup();
    localStorage.setItem("mandi:sessionUser", JSON.stringify(user));

    // If there is a pending broadcast, redirect to post-requirement to auto-submit
    const pending = localStorage.getItem("mandi:pendingBroadcast");
    if (pending) {
      router.push("/post-requirement?resume=1");
      return;
    }

    router.push(`/${user.role}/panel`);
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

      storeSessionAndRedirect(data.user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            <div className="auth-card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="auth-header text-white p-4 p-md-5">
                <p className="mb-2 small text-uppercase">OnlineMandi Pakistan</p>
                <h1 className="h3 mb-2 fw-bold">Welcome to your trade account</h1>
                <p className="mb-0 auth-header-subtitle">
                  Access verified crop listings, post requirements, and connect faster.
                </p>
              </div>

              <div className="p-4 p-md-5 bg-white">
                <div className="mode-switch mb-4" role="tablist" aria-label="Login and signup tabs">
                  <button
                    type="button"
                    className={`mode-btn ${mode === "login" ? "active" : ""}`}
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${mode === "signup" ? "active" : ""}`}
                    onClick={() => {
                      setMode("signup");
                      setError("");
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={onSubmit}>
                  {mode === "signup" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter your full name"
                        required
                        value={signupForm.fullName}
                        onChange={(event) => setSignupForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="name@example.com"
                      required
                      value={mode === "login" ? loginForm.email : signupForm.email}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (mode === "login") {
                          setLoginForm((prev) => ({ ...prev, email: value }));
                        } else {
                          setSignupForm((prev) => ({ ...prev, email: value }));
                        }
                      }}
                    />
                  </div>

                  {mode === "signup" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-lg"
                        placeholder="+92 3XX XXXXXXX"
                        required
                        value={signupForm.phoneNumber}
                        onChange={(event) =>
                          setSignupForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                        }
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      placeholder="Enter password"
                      required
                      value={mode === "login" ? loginForm.password : signupForm.password}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (mode === "login") {
                          setLoginForm((prev) => ({ ...prev, password: value }));
                        } else {
                          setSignupForm((prev) => ({ ...prev, password: value }));
                        }
                      }}
                    />
                  </div>

                  {mode === "signup" && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Role</label>
                      <select
                        className="form-select form-select-lg"
                        required
                        value={signupForm.role}
                        onChange={(event) =>
                          setSignupForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                        }
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" className="btn btn-auth w-100 btn-lg fw-semibold" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Login to Dashboard" : "Create Account"}
                  </button>
                </form>

                <p className="text-center text-muted mt-4 mb-0">
                  {mode === "login" ? "New to OnlineMandi?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0 align-baseline auth-link"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError("");
                    }}
                  >
                    {mode === "login" ? "Create one" : "Login"}
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
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #ffd979 0%, #f8f9fa 32%, #eef7f3 100%);
        }

        .auth-card {
          background: #fff;
        }

        .auth-header {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
        }

        .auth-header-subtitle {
          color: rgba(255, 255, 255, 0.88);
        }

        .mode-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #d9e2dd;
          border-radius: 10px;
          padding: 4px;
          background: #f7faf8;
        }

        .mode-btn {
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #50635a;
          font-weight: 600;
          padding: 10px 14px;
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          background: #1b4332;
          color: #fff;
          box-shadow: 0 4px 12px rgba(27, 67, 50, 0.25);
        }

        .btn-auth {
          background-color: #1b4332;
          color: #fff;
          border: 0;
          border-radius: 10px;
          padding: 12px;
        }

        .btn-auth:hover {
          background-color: #143226;
          color: #fff;
        }

        .auth-link {
          color: #1b4332;
        }

        .auth-link:hover {
          color: #143226;
        }

        @media (max-width: 576px) {
          .auth-header {
            padding: 1.25rem;
          }
        }
      `}</style>
    </main>
  );
}
