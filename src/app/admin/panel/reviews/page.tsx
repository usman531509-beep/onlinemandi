"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/panel/AdminShell";

type Review = {
    _id: string;
    listingId?: {
        _id: string;
        title: string;
        createdBy?: { fullName: string; }
    };
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    comment: string;
    createdAt: string;
};

export default function AdminReviewsPage() {
    return (
        <AdminShell>
            {(sessionUser) => <ReviewsContent sessionUser={sessionUser} />}
        </AdminShell>
    );
}

function ReviewsContent({ sessionUser }: { sessionUser: { id: string; role: string } }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void | Promise<void>;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    useEffect(() => {
        if (sessionUser.role !== "admin") return;
        fetchReviews();
    }, [sessionUser]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reviews?role=${sessionUser.role}&userId=${sessionUser.id}`);
            const data = await res.json();
            if (res.ok && data.ok) {
                setReviews(data.reviews || []);
            } else {
                setError(data.message || "Failed to load reviews.");
            }
        } catch (e) {
            setError("Network error while trying to fetch reviews.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Review",
            message: "Are you sure you want to delete this review? This action cannot be undone.",
            onConfirm: async () => {
                setDeletingId(id);
                try {
                    const res = await fetch(`/api/admin/reviews/${id}?role=${sessionUser.role}&userId=${sessionUser.id}`, {
                        method: "DELETE"
                    });
                    const data = await res.json();
                    if (res.ok && data.ok) {
                        setReviews((prev) => prev.filter((r) => r._id !== id));
                    } else {
                        alert(data.message || "Failed to delete review.");
                    }
                } catch (e) {
                    alert("A network error occurred while closing to delete.");
                } finally {
                    setDeletingId(null);
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    if (loading) return (
        <div>
            <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="alert alert-danger" role="alert">
            {error}
        </div>
    );

    return (
        <>
            {confirmModal.isOpen && (
                <div className="category-modal-backdrop" onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
                    <div className="category-modal card border shadow-sm rounded-4 bg-white" style={{ maxWidth: "450px" }} onClick={(event) => event.stopPropagation()}>
                        <div className="card-body p-4 text-center">
                            <div className="mb-3 text-danger">
                                <i className="fa-solid fa-circle-exclamation fa-3x"></i>
                            </div>
                            <h3 className="h5 fw-bold mb-2">{confirmModal.title}</h3>
                            <p className="text-muted mb-4">{confirmModal.message}</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4"
                                    onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger px-4"
                                    onClick={() => void confirmModal.onConfirm()}
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .category-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1050;
                    padding: 20px;
                }
                .category-modal {
                    animation: modalEntry 0.3s ease-out;
                    width: 100%;
                }
                @keyframes modalEntry {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            <div className="card border-light shadow-sm bg-white rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold" style={{ color: "#1b4332" }}>
                        <i className="fa-solid fa-star me-2"></i> All Reviews
                    </h5>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                        {reviews.length} total
                    </span>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small">
                                <tr>
                                    <th className="ps-4 fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Date</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Listing</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Reviewer</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Rating</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Comment</th>
                                    <th className="pe-4 fw-medium text-uppercase text-end px-4 py-3" style={{ letterSpacing: "0.5px" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5 text-muted">No reviews found</td>
                                    </tr>
                                ) : (
                                    reviews.map((r) => (
                                        <tr key={r._id}>
                                            <td className="ps-4 px-4 py-3 text-muted small whitespace-nowrap">
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.listingId ? (
                                                    <>
                                                        <a href={`/listing/${r.listingId._id}`} target="_blank" className="text-decoration-none fw-semibold d-block" style={{ color: "#1b4332" }}>
                                                            {r.listingId.title}
                                                        </a>
                                                        {r.listingId.createdBy ? (
                                                            <span className="text-muted small">Seller: {r.listingId.createdBy.fullName}</span>
                                                        ) : (
                                                            <span className="text-muted small fst-italic">Unknown Seller</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted fst-italic">Unknown/Deleted</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="fw-semibold text-dark">{r.reviewerName}</div>
                                                <div className="text-muted small">{r.reviewerEmail}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="badge" style={{ backgroundColor: "#fef1d2", color: "#8d6a13" }}>
                                                    <i className="fa-solid fa-star me-1 text-warning"></i>
                                                    {r.rating}/5
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-wrap" style={{ maxWidth: "300px" }}>
                                                <p className="mb-0 text-truncate text-muted" title={r.comment}>{r.comment}</p>
                                            </td>
                                            <td className="pe-4 text-end px-4 py-3">
                                                <button
                                                    className={`btn btn-sm btn-outline-danger ${deletingId === r._id ? "disabled" : ""}`}
                                                    onClick={() => handleDeleteReview(r._id)}
                                                    title="Delete Review"
                                                >
                                                    {deletingId === r._id ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <i className="fa-solid fa-trash"></i>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
