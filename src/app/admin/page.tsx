"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    // If already logged in as admin, redirect to panel
    try {
      const raw = localStorage.getItem("mundi:sessionUser");
      if (raw) {
        const user = JSON.parse(raw) as SessionUser;
        if (user.role === "admin") {
          router.replace("/admin/panel");
        }
      }
    } catch {
      // ignore
    }
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
        user?: SessionUser;
      };

      if (!response.ok || !data.ok || !data.user) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      if (data.user.role !== "admin") {
        setError(t("admin.login.accessDenied"));
        return;
      }

      localStorage.setItem("mundi:sessionUser", JSON.stringify(data.user));
      router.push("/admin/panel");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="text-center mb-4">
          <div className="admin-icon-ring mx-auto mb-3">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className="h4 fw-bold" style={{ color: "#1b4332" }}>{t("admin.login.title")}</h1>
          <p className="text-muted small mb-0">{t("admin.login.subtitle")}</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 rounded-3 py-2 px-3 mb-3 d-flex align-items-center gap-2 small">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">{t("admin.login.emailLabel")}</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="fa-solid fa-user text-muted small"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder={t("admin.login.emailPlaceholder")}
                required
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">{t("admin.login.passwordLabel")}</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="fa-solid fa-lock text-muted small"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0 ps-0"
                placeholder={t("admin.login.passwordPlaceholder")}
                required
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="input-group-text bg-light border-start-0 text-muted"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} small`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 py-2 fw-semibold text-white"
            style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)" }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket me-2"></i>{t("admin.login.signIn")}
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/" className="text-muted small text-decoration-none">
            <i className="fa-solid fa-arrow-left me-1"></i> {t("admin.login.backToHome")}
          </Link>
        </div>
      </div>

      <style jsx>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f1f17 0%, #1b4332 50%, #2d6a4f 100%);
          padding: 1.5rem;
        }

        .admin-login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .admin-icon-ring {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1b4332, #2d6a4f);
          display: grid;
          place-items: center;
          color: white;
          font-size: 1.4rem;
          box-shadow: 0 0 0 8px rgba(27, 67, 50, 0.1);
        }

        .input-group-text {
          border-color: #e9ecef;
        }

        .form-control {
          border-color: #e9ecef;
          padding: 0.65rem 0.75rem;
        }

        .form-control:focus {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 0.2rem rgba(45, 106, 79, 0.08);
        }

        .form-control:focus ~ .input-group-text,
        .form-control:focus + .input-group-text {
          border-color: #2d6a4f;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(27, 67, 50, 0.25);
        }
      `}</style>
    </main>
  );
}
