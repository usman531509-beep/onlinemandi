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
        if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;

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
        }
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
    );
}
