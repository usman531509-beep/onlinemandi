"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-password-page d-flex flex-column min-vh-100">
      <Navbar />
      
      <div className="container flex-grow-1 d-flex align-items-center py-5">
        <div className="row justify-content-center w-100 m-0">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="auth-header text-white p-4 text-center">
                <i className="fa-solid fa-key fa-3x mb-3 opacity-75"></i>
                <h1 className="h4 fw-bold mb-1">Reset Password</h1>
                <p className="small mb-0 opacity-75">We'll send a link to your email to reset your pass.</p>
              </div>

              <div className="card-body p-4 p-md-5 bg-white">
                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger py-2 small">{error}</div>}
                    
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-auth w-100 btn-lg fw-semibold mb-3" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>

                    <div className="text-center">
                      <Link href="/auth" className="small text-decoration-none auth-link fw-semibold">
                        <i className="fa-solid fa-arrow-left me-2"></i>
                        Back to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-3">
                    <div className="success-icon mb-4">
                      <i className="fa-solid fa-circle-check fa-4x text-success"></i>
                    </div>
                    <h3 className="h5 fw-bold mb-3">Check your email</h3>
                    <p className="text-muted small mb-4">
                      We've sent a password reset link to <strong>{email}</strong>. 
                      Please check your inbox and follow the instructions.
                    </p>
                    <Link href="/auth" className="btn btn-outline-success w-100 rounded-3 fw-semibold">
                      Return to Login
                    </Link>
                    <p className="mt-4 mb-0 small text-muted">
                      Didn't receive the email?{" "}
                      <button 
                        onClick={() => setSubmitted(false)} 
                        className="btn btn-link p-0 small auth-link align-baseline fw-semibold"
                      >
                        Try again
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .forgot-password-page {
          background: radial-gradient(circle at top right, #ffd979 0%, #f8f9fa 32%, #eef7f3 100%);
        }
        
        .auth-header {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
        }

        .btn-auth {
          background-color: #1b4332;
          color: #fff;
          border: 0;
          border-radius: 10px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .btn-auth:hover {
          background-color: #143226;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27, 67, 50, 0.2);
        }

        .auth-link {
          color: #1b4332;
        }

        .auth-link:hover {
          color: #2d6a4f;
        }

        .form-control:focus {
          border-color: #1b4332;
          box-shadow: 0 0 0 0.25rem rgba(27, 67, 50, 0.1);
        }
      `}</style>
    </main>
  );
}
