"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/panel/AdminShell";

interface PaymentPlan {
    _id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: "month" | "year" | "one-time";
    features: string[];
    listingLimit: number;
    broadcastLimit: number;
    stripeProductId?: string;
    stripePriceId?: string;
    isActive: boolean;
    createdAt: string;
}

export default function PricingPlansPage() {
    const [plans, setPlans] = useState<PaymentPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [interval, setInterval] = useState<"month" | "year" | "one-time">("month");
    const [features, setFeatures] = useState<string[]>([""]);
    const [listingLimit, setListingLimit] = useState("10");
    const [broadcastLimit, setBroadcastLimit] = useState("5");

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/plans?role=admin");
            const data = await res.json();
            if (data.ok) {
                setPlans(data.plans);
            }
        } catch (error) {
            console.error("Failed to fetch plans", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (plan?: PaymentPlan) => {
        setStatusMsg(null);
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setDescription(plan.description || "");
            setPrice(plan.price.toString());
            setInterval(plan.interval);
            setFeatures(plan.features.length > 0 ? plan.features : [""]);
            setListingLimit(plan.listingLimit?.toString() || "10");
            setBroadcastLimit(plan.broadcastLimit?.toString() || "5");
        } else {
            setEditingPlan(null);
            setName("");
            setDescription("");
            setPrice("");
            setInterval("month");
            setFeatures([""]);
            setListingLimit("10");
            setBroadcastLimit("5");
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPlan(null);
    };

    const addFeatureRow = () => {
        setFeatures([...features, ""]);
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

    const removeFeature = (index: number) => {
        const newFeatures = features.filter((_, i) => i !== index);
        if (newFeatures.length === 0) newFeatures.push("");
        setFeatures(newFeatures);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg(null);

        const validFeatures = features.filter(f => f.trim() !== "");

        try {
            const url = editingPlan
                ? `/api/admin/plans/${editingPlan._id}?role=admin`
                : `/api/admin/plans?role=admin`;

            const method = editingPlan ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    price: Number(price),
                    interval: interval,
                    features: validFeatures,
                    listingLimit: Number(listingLimit) || 10,
                    broadcastLimit: Number(broadcastLimit) || 5,
                }),
            });

            const data = await res.json();
            if (res.ok && data.ok) {
                setStatusMsg({ type: "success", text: editingPlan ? "Plan updated successfully!" : "Plan created successfully in Stripe!" });
                fetchPlans();
                setTimeout(() => closeModal(), 1500);
            } else {
                setStatusMsg({ type: "error", text: data.message || "Something went wrong" });
            }
        } catch (error) {
            setStatusMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (plan: PaymentPlan) => {
        if (!confirm(`Are you sure you want to ${plan.isActive ? 'archive' : 'activate'} this plan?`)) return;

        try {
            const url = `/api/admin/plans/${plan._id}?role=admin`;
            const res = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !plan.isActive }),
            });
            if (res.ok) {
                fetchPlans();
            }
        } catch (error) {
            alert("Error toggling plan status");
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Are you sure you want to archive this plan? This will stop new subscriptions but won't cancel existing ones.")) return;

        try {
            const res = await fetch(`/api/admin/plans/${id}?role=admin`, { method: "DELETE" });
            if (res.ok) fetchPlans();
        } catch (error) {
            alert("Error archiving plan");
        }
    };

    return (
        <AdminShell>
            {(sessionUser) => (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h2 className="fw-bold mb-1" style={{ color: "#1b4332" }}>Pricing Plans</h2>
                            <p className="text-muted mb-0 small">Manage your subscription tiers and Stripe pricing.</p>
                        </div>
                        <button className="btn btn-warning fw-bold px-4" onClick={() => openModal()}>
                            <i className="fa-solid fa-plus me-2"></i> Create Plan
                        </button>
                    </div>

                    <div className="row g-4">
                        {isLoading ? (
                            <div className="col-12 text-center py-5">
                                <div className="spinner-border text-success" role="status"></div>
                                <p className="text-muted mt-2">Loading plans...</p>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="col-12 text-center py-5 bg-light rounded-4 border">
                                <i className="fa-solid fa-tags fa-3x text-muted mb-3 opacity-50"></i>
                                <h5>No pricing plans found</h5>
                                <p className="text-muted">Create a new pricing plan to start monetizing.</p>
                            </div>
                        ) : (
                            plans.map((plan) => (
                                <div className="col-md-6 col-lg-4" key={plan._id}>
                                    <div className={`card h-100 border shadow-sm rounded-4 overflow-hidden position-relative ${!plan.isActive ? 'opacity-75 bg-light' : ''}`}>
                                        {!plan.isActive && (
                                            <div className="position-absolute align-items-center justify-content-center w-100" style={{ top: 10, right: -130, transform: "rotate(45deg)", background: "#dc3545", color: "white", padding: "5px 150px", zIndex: 1, fontSize: "0.8rem", fontWeight: "bold", textAlign: "center" }}>
                                                Archived
                                            </div>
                                        )}

                                        <div className="card-header bg-white border-bottom p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="fw-bold mb-0 text-success">{plan.name}</h5>
                                                <span className="badge bg-light text-dark border">{plan.interval}</span>
                                            </div>
                                            <div className="d-flex align-items-baseline mb-2">
                                                <h2 className="fw-bold mb-0 me-1">Rs {plan.price.toLocaleString()}</h2>
                                                <span className="text-muted small">/ {plan.interval === 'one-time' ? 'lifetime' : plan.interval}</span>
                                            </div>
                                            <p className="text-muted small mb-0">{plan.description || "No description provided."}</p>
                                        </div>

                                        <div className="card-body p-4 flex-grow-1">
                                            <div className="d-flex gap-3 mb-3">
                                                <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                                                    <i className="fa-solid fa-list me-1"></i>{plan.listingLimit ?? 10} Listings
                                                </div>
                                                <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                                                    <i className="fa-solid fa-bullhorn me-1"></i>{plan.broadcastLimit ?? 5} Broadcasts
                                                </div>
                                            </div>
                                            <h6 className="fw-bold mb-3 small text-uppercase text-muted">Included Features</h6>
                                            <ul className="list-unstyled mb-0">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="mb-2 d-flex align-items-start">
                                                        <i className="fa-solid fa-check text-success mt-1 me-2 small"></i>
                                                        <span className="small">{feature}</span>
                                                    </li>
                                                ))}
                                                {plan.features.length === 0 && (
                                                    <li className="text-muted small fst-italic">No features listed.</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="card-footer bg-light p-3 border-top d-flex justify-content-between">
                                            <button
                                                className="btn btn-sm btn-outline-secondary px-3"
                                                onClick={() => handleToggleActive(plan)}
                                            >
                                                {plan.isActive ? <><i className="fa-solid fa-box-archive me-1"></i> Archive</> : <><i className="fa-solid fa-play me-1"></i> Activate</>}
                                            </button>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(plan)}>
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePlan(plan._id)} disabled={!plan.isActive}>
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Plan Modal */}
                    {showModal && (
                        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content border-0 shadow-lg rounded-4 bg-white">
                                    <div className="modal-header border-bottom px-4 py-3">
                                        <h5 className="modal-title fw-bold" style={{ color: "#1b4332" }}>
                                            {editingPlan ? "Edit Pricing Plan" : "Create New Plan"}
                                        </h5>
                                        <button type="button" className="btn-close" onClick={closeModal}></button>
                                    </div>

                                    <form onSubmit={handleSavePlan}>
                                        <div className="modal-body p-4">
                                            {statusMsg && (
                                                <div className={`alert alert-${statusMsg.type === "success" ? "success" : "danger"} mb-4`}>
                                                    {statusMsg.text}
                                                </div>
                                            )}

                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Plan Name <span className="text-danger">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light"
                                                        placeholder="e.g. Pro Seller"
                                                        required
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-semibold">Price (PKR) <span className="text-danger">*</span></label>
                                                    <input
                                                        type="number"
                                                        className="form-control bg-light"
                                                        placeholder="0"
                                                        required
                                                        min="0"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-semibold">Billing Interval <span className="text-danger">*</span></label>
                                                    <select
                                                        className="form-select bg-light"
                                                        required
                                                        value={interval}
                                                        onChange={(e) => setInterval(e.target.value as any)}
                                                    >
                                                        <option value="month">Monthly</option>
                                                        <option value="year">Yearly</option>
                                                        <option value="one-time">One-time</option>
                                                    </select>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">Description</label>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light"
                                                        placeholder="Short tagline or description"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Listing Limit</label>
                                                    <input
                                                        type="number"
                                                        className="form-control bg-light"
                                                        placeholder="10"
                                                        min="0"
                                                        value={listingLimit}
                                                        onChange={(e) => setListingLimit(e.target.value)}
                                                    />
                                                    <small className="text-muted">Max listings allowed for this plan</small>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">Broadcast Limit</label>
                                                    <input
                                                        type="number"
                                                        className="form-control bg-light"
                                                        placeholder="5"
                                                        min="0"
                                                        value={broadcastLimit}
                                                        onChange={(e) => setBroadcastLimit(e.target.value)}
                                                    />
                                                    <small className="text-muted">Max broadcasts allowed for this plan</small>
                                                </div>

                                                <div className="col-12 mt-4">
                                                    <label className="form-label fw-semibold d-flex justify-content-between">
                                                        <span>Included Features</span>
                                                        <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={addFeatureRow}>
                                                            <i className="fa-solid fa-plus me-1"></i> Add Feature
                                                        </button>
                                                    </label>

                                                    <div className="d-flex flex-column gap-2">
                                                        {features.map((feature, index) => (
                                                            <div className="input-group" key={index}>
                                                                <span className="input-group-text bg-white"><i className="fa-solid fa-check text-success"></i></span>
                                                                <input
                                                                    type="text"
                                                                    className="form-control bg-light"
                                                                    placeholder="Feature description..."
                                                                    value={feature}
                                                                    onChange={(e) => updateFeature(index, e.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => removeFeature(index)}
                                                                >
                                                                    <i className="fa-solid fa-xmark"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-footer border-top bg-light px-4 py-3">
                                            <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={closeModal} disabled={isSubmitting}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-warning px-4 fw-bold" disabled={isSubmitting}>
                                                {isSubmitting ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span> Saving...</>
                                                ) : (
                                                    <><i className="fa-brands fa-stripe text-dark me-2"></i> Save to Stripe</>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AdminShell>
    );
}
