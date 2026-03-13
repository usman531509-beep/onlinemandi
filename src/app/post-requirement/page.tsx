"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";

type FormValues = Record<string, string>;

type SessionUser = {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
};

const initialBuyerForm: FormValues = {
    category: "",
    grade: "",
    requirementDetails: "",
    requiredQuantity: "",
    targetPricePerMaund: "",
    city: "",
    deliveryLocation: "",
    paymentTerms: "Cash on Delivery",
};

function PostRequirementContent() {
    const [buyerForm, setBuyerForm] = useState<FormValues>(initialBuyerForm);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Load session user
    useEffect(() => {
        const raw = localStorage.getItem("mandi:sessionUser");
        if (raw) {
            try {
                setSessionUser(JSON.parse(raw) as SessionUser);
            } catch {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                if (res.ok && data.ok) {
                    setCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Load drafts from localStorage
    useEffect(() => {
        const raw = localStorage.getItem("mandi:draft:buyer-form");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as FormValues;
            setBuyerForm((prev) => ({ ...prev, ...parsed }));
        } catch {
            localStorage.removeItem("mandi:draft:buyer-form");
        }
    }, []);

    // Save drafts to localStorage
    useEffect(() => {
        localStorage.setItem("mandi:draft:buyer-form", JSON.stringify(buyerForm));
    }, [buyerForm]);

    // Auto-submit if resuming after login
    useEffect(() => {
        if (searchParams.get("resume") !== "1") return;
        if (!sessionUser) return;

        const pendingRaw = localStorage.getItem("mandi:pendingBroadcast");
        if (!pendingRaw) return;

        try {
            const pendingForm = JSON.parse(pendingRaw) as FormValues;
            setBuyerForm(pendingForm);

            // Submit immediately
            const submitBroadcast = async () => {
                setLoading(true);
                try {
                    const response = await fetch("/api/broadcasts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: sessionUser.id,
                            ...pendingForm,
                        }),
                    });
                    const data = await response.json();
                    if (response.ok && data.ok) {
                        localStorage.removeItem("mandi:pendingBroadcast");
                        localStorage.removeItem("mandi:draft:buyer-form");
                        setSuccessMessage("Requirement broadcasted to all sellers!");
                        setTimeout(() => router.push("/"), 2000);
                    } else {
                        alert(data.message || "Failed to broadcast. Please try again.");
                    }
                } catch {
                    alert("Network error. Please try again.");
                } finally {
                    setLoading(false);
                }
            };

            submitBroadcast();
        } catch {
            localStorage.removeItem("mandi:pendingBroadcast");
        }
    }, [searchParams, sessionUser, router]);

    const handleBuyerChange = (name: string, value: string) => {
        setBuyerForm((prev) => ({ ...prev, [name]: value }));
    };

    const onBuyerSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // If not logged in, save form and redirect to login
        if (!sessionUser) {
            localStorage.setItem("mandi:pendingBroadcast", JSON.stringify(buyerForm));
            router.push("/auth");
            return;
        }

        // Logged in — post to API
        setLoading(true);
        setSuccessMessage("");
        try {
            const response = await fetch("/api/broadcasts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: sessionUser.id,
                    ...buyerForm,
                }),
            });
            const data = await response.json();
            if (response.ok && data.ok) {
                localStorage.removeItem("mandi:draft:buyer-form");
                setSuccessMessage("Requirement broadcasted to all sellers!");
                setBuyerForm(initialBuyerForm);
                setTimeout(() => router.push("/"), 2000);
            } else {
                alert(data.message || "Failed to broadcast. Please try again.");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />

            {/* Hero Banner */}
            <section className="req-hero">
                <div className="container text-center">
                    <div className="req-hero-icon">
                        <i className="fa-solid fa-bullhorn"></i>
                    </div>
                    <h1 className="display-5 fw-bold mb-3 req-hero-title">Post Your Requirement</h1>
                    <p className="lead mb-0 req-hero-subtitle" style={{ maxWidth: 620, margin: "0 auto" }}>
                        Tell sellers exactly what you need. Get competitive offers from verified sellers across Pakistan.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <div className="container" style={{ marginTop: "-60px", position: "relative", zIndex: 2 }}>
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card req-form-card border-0">
                            <div className="card-body p-4 p-md-5">

                                {successMessage && (
                                    <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
                                        <i className="fa-solid fa-circle-check"></i>
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                {!sessionUser && (
                                    <div className="alert alert-info d-flex align-items-center gap-2 mb-4" role="alert">
                                        <i className="fa-solid fa-circle-info"></i>
                                        <span>You are not logged in. You will be asked to login before your requirement is broadcasted.</span>
                                    </div>
                                )}

                                <form id="buyer-form" onSubmit={onBuyerSubmit}>

                                    {/* Section: Requirement Details */}
                                    <div className="req-section-header">
                                        <div className="req-section-icon"><i className="fa-solid fa-clipboard-list"></i></div>
                                        <h5 className="fw-bold mb-0">Requirement Details</h5>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Category</label>
                                            <select
                                                className="form-select"
                                                name="category"
                                                required
                                                value={buyerForm.category}
                                                onChange={(e) => handleBuyerChange("category", e.target.value)}
                                            >
                                                <option value="" disabled>Select Category...</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Grade <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="grade"
                                                placeholder="e.g. A-Grade, Premium"
                                                required
                                                value={buyerForm.grade || ""}
                                                onChange={(e) => handleBuyerChange("grade", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">What are you looking for? <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="requirementDetails"
                                                placeholder="e.g. Need 100 Tons Super Basmati Rice"
                                                required
                                                value={buyerForm.requirementDetails}
                                                onChange={(e) => handleBuyerChange("requirementDetails", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Quantity Required</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="requiredQuantity"
                                                placeholder="e.g. 50 Tons"
                                                value={buyerForm.requiredQuantity}
                                                onChange={(e) => handleBuyerChange("requiredQuantity", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Target Price (PKR/Maund)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="targetPricePerMaund"
                                                placeholder="Your budget"
                                                value={buyerForm.targetPricePerMaund}
                                                onChange={(e) => handleBuyerChange("targetPricePerMaund", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Delivery & Payment */}
                                    <div className="req-section-header">
                                        <div className="req-section-icon"><i className="fa-solid fa-truck-fast"></i></div>
                                        <h5 className="fw-bold mb-0">Delivery & Payment</h5>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="city"
                                                placeholder="e.g. Lahore"
                                                required
                                                value={buyerForm.city || ""}
                                                onChange={(e) => handleBuyerChange("city", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Delivery Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="deliveryLocation"
                                                placeholder="Detailed address"
                                                value={buyerForm.deliveryLocation}
                                                onChange={(e) => handleBuyerChange("deliveryLocation", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Payment Terms</label>
                                            <select
                                                className="form-select"
                                                name="paymentTerms"
                                                value={buyerForm.paymentTerms}
                                                onChange={(e) => handleBuyerChange("paymentTerms", e.target.value)}
                                            >
                                                <option>Cash on Delivery</option>
                                                <option>Bank Transfer (Advance)</option>
                                                <option>50% Advance / 50% Delivery</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-mandi btn-lg w-100 mt-2" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Broadcasting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-paper-plane me-2"></i>Broadcast Requirement to All Sellers
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
        .req-hero {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%);
          color: white;
          padding: 70px 0 100px;
          position: relative;
          overflow: hidden;
        }

        .req-hero::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 202, 40, 0.12) 0%, transparent 70%);
          border-radius: 50%;
        }

        .req-hero::after {
          content: "";
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
          border-radius: 50%;
        }

        .req-hero-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255, 202, 40, 0.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #ffca28;
          margin-bottom: 18px;
          border: 2px solid rgba(255, 202, 40, 0.3);
        }

        .req-hero-title {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.7s ease forwards 0.1s;
        }

        .req-hero-subtitle {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.7s ease forwards 0.25s;
        }

        .req-form-card {
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
          background: white;
        }

        .req-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e4f1eb;
        }

        .req-section-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1b4332, #2d6a4f);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          flex-shrink: 0;
        }

        .form-control, .form-select {
          border-radius: 10px;
          border: 1.5px solid #dce7e2;
          padding: 10px 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-control:focus, .form-select:focus {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.12);
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <Script
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
                strategy="afterInteractive"
            />
        </>
    );
}

export default function PostRequirementPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PostRequirementContent />
        </Suspense>
    );
}
