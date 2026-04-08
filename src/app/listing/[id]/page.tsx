"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import Navbar from "@/components/Navbar";

type Listing = {
    id: string;
    title: string;
    category: string;
    grade?: string;
    moisture?: string;
    delivery?: string;
    images?: string[];
    city: string;
    quantity: string;
    pricePerMaund: number;
    description: string;
    extraInfo?: { label: string; value: string }[];
    createdAt: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
        role: "admin" | "buyer" | "seller";
        verificationStatus?: string;
        phoneNumber?: string;
        address?: string;
    } | null;
};

type Review = {
    _id: string;
    reviewerName: string;
    reviewerEmail: string;
    rating: number;
    comment: string;
    createdAt: string;
};

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [listing, setListing] = useState<Listing | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [previewImage, setPreviewImage] = useState("");
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Review Form State
    const [reviewForm, setReviewForm] = useState({ name: "", email: "", rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });

    // Subscription-based contact visibility
    const [canSeeContact, setCanSeeContact] = useState(false);
    const [contactCheckDone, setContactCheckDone] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const [listingRes, reviewsRes] = await Promise.all([
                    fetch(`/api/listings/${id}`),
                    fetch(`/api/listings/${id}/reviews`)
                ]);

                const listingData = (await listingRes.json()) as { ok: boolean; listing?: Listing; message?: string };
                const reviewsData = (await reviewsRes.json()) as { ok: boolean; reviews?: Review[] };

                if (listingRes.ok && listingData.ok && listingData.listing) {
                    setListing(listingData.listing);
                    setPreviewImage(listingData.listing.images?.[0] || "");
                } else {
                    setError(listingData.message || "Listing not found.");
                }

                if (reviewsRes.ok && reviewsData.ok && reviewsData.reviews) {
                    setReviews(reviewsData.reviews);
                }
            } catch {
                setError("Failed to load listing details.");
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [id]);

    // Check subscription status for contact visibility
    useEffect(() => {
        if (!listing) return;
        try {
            const raw = localStorage.getItem("mundi:sessionUser");
            if (!raw) { setContactCheckDone(true); return; }
            const sessionUser = JSON.parse(raw);

            // Admin can always see contact details
            if (sessionUser?.role === "admin") {
                setCanSeeContact(true);
                setContactCheckDone(true);
                return;
            }

            // Seller viewing their own listing can see contact details
            if (listing.createdBy?.id === sessionUser?.id) {
                setCanSeeContact(true);
                setContactCheckDone(true);
                return;
            }

            // Otherwise check for active subscription
            if (sessionUser?.email) {
                fetch(`/api/user/subscription?email=${encodeURIComponent(sessionUser.email)}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.ok && data.subscription) {
                            setCanSeeContact(true);
                        }
                    })
                    .catch(() => { })
                    .finally(() => setContactCheckDone(true));
            } else {
                setContactCheckDone(true);
            }
        } catch {
            setContactCheckDone(true);
        }
    }, [listing]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingReview(true);
        setReviewMessage({ type: "", text: "" });

        if (!reviewForm.name || !reviewForm.email || !reviewForm.comment) {
            setReviewMessage({ type: "danger", text: "Please fill in all required fields." });
            setSubmittingReview(false);
            return;
        }

        try {
            const res = await fetch(`/api/listings/${id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewerName: reviewForm.name,
                    reviewerEmail: reviewForm.email,
                    rating: reviewForm.rating,
                    comment: reviewForm.comment
                })
            });

            const data = await res.json();
            if (res.ok && data.ok) {
                setReviewMessage({ type: "success", text: "Review submitted successfully!" });
                setReviews([data.review, ...reviews]);
                setReviewForm({ name: "", email: "", rating: 5, comment: "" });
            } else {
                setReviewMessage({ type: "danger", text: data.message || "Failed to submit review." });
            }
        } catch (error) {
            setReviewMessage({ type: "danger", text: "A network error occurred." });
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="container my-5 text-center py-5">
                    <div className="spinner-border text-success" role="status" style={{ width: 48, height: 48 }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading listing details...</p>
                </div>
            </>
        );
    }

    if (error || !listing) {
        return (
            <>
                <Navbar />
                <div className="container my-5 text-center py-5">
                    <i className="fa-solid fa-triangle-exclamation fa-3x text-warning mb-3"></i>
                    <h3 className="fw-bold">{error || "Listing not found"}</h3>
                    <p className="text-muted mb-4">The listing you&apos;re looking for may have been removed or doesn&apos;t exist.</p>
                    <Link href="/" className="btn btn-mandi btn-lg">
                        <i className="fa-solid fa-arrow-left me-2"></i>Back to Listings
                    </Link>
                </div>
            </>
        );
    }

    const resolvedPreview = (listing.images || []).includes(previewImage)
        ? previewImage
        : listing.images?.[0] || "";

    return (
        <>
            <Navbar />

            <div className="container-fluid bg-light py-5">
                <div className="container">
                    <div className="mb-4">
                        <button className="btn btn-link text-decoration-none text-dark p-0 d-flex align-items-center gap-2 fw-medium" onClick={() => router.back()}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Listings
                        </button>
                    </div>

                    <div className="bg-white p-4 p-md-5 rounded border shadow-sm">
                        <div className="row g-5">
                            {/* Left Column: Image Gallery */}
                            <div className="col-md-6">
                                <div className="product-gallery sticky-top" style={{ top: "2rem", zIndex: 1 }}>
                                    {listing.images?.length ? (
                                        <>
                                            {resolvedPreview && (
                                                <div
                                                    className="gallery-main-wrapper bg-light rounded position-relative"
                                                    style={{ backgroundColor: "#f8f9fa", padding: "20px" }}
                                                    onClick={() => setLightboxImage(resolvedPreview)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => e.key === "Enter" && setLightboxImage(resolvedPreview)}
                                                >
                                                    {/* Optional Badge on image */}
                                                    {listing.createdBy?.verificationStatus === "verified" && (
                                                        <div className="position-absolute top-0 start-0 m-3 z-3">
                                                            <span className="badge bg-success rounded-pill px-3 py-2 fw-semibold shadow-sm" style={{ letterSpacing: "0.5px" }}>
                                                                <i className="fa-solid fa-certificate me-1"></i>VERIFIED SELLER
                                                            </span>
                                                        </div>
                                                    )}

                                                    <Image
                                                        src={resolvedPreview}
                                                        alt={`${listing.title} preview`}
                                                        width={600}
                                                        height={600}
                                                        unoptimized
                                                        className="gallery-main-image rounded border border-light"
                                                        style={{ width: "100%", height: "450px", objectFit: "contain", backgroundColor: "#fff" }}
                                                    />

                                                    <div className="gallery-main-overlay d-flex align-items-center justify-content-center text-white" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", opacity: 0, transition: "opacity 0.2s" }}>
                                                        <i className="fa-solid fa-magnifying-glass-plus fa-3x"></i>
                                                    </div>
                                                </div>
                                            )}
                                            {listing.images.length > 1 && (
                                                <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                                                    {listing.images.map((img, idx) => (
                                                        <button
                                                            key={`${img}-${idx}`}
                                                            type="button"
                                                            className={`btn p-0 border-2 overflow-hidden ${resolvedPreview === img ? "border-success" : "border-light"}`}
                                                            style={{ width: "80px", height: "80px", borderRadius: "10px", transition: "all 0.2s" }}
                                                            onClick={() => setPreviewImage(img)}
                                                        >
                                                            <Image
                                                                src={img}
                                                                alt={`${listing.title} ${idx + 1}`}
                                                                width={80}
                                                                height={80}
                                                                unoptimized
                                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="empty-gallery-images bg-light rounded d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: "450px", border: "2px dashed #dee2e6" }}>
                                            <i className="fa-regular fa-image fa-3x mb-3"></i>
                                            <span>No images uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Details & Specs */}
                            <div className="col-md-6 pt-2">
                                <div className="product-details">
                                    <div className="fw-bold small text-uppercase mb-2 tracking-wide" style={{ color: "#1b4332", letterSpacing: "1px" }}>
                                        {listing.category} COLLECTION
                                    </div>

                                    <h1 className="fw-bolder mb-2 text-dark" style={{ fontSize: "2.4rem", letterSpacing: "-0.5px" }}>
                                        {listing.title}
                                    </h1>

                                    <div className="d-flex align-items-center mb-4 text-warning small gap-1 border-bottom pb-4">
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star text-muted opacity-50"></i>
                                        <span className="text-muted ms-2 fw-medium">
                                            Seller: {listing.createdBy?.fullName || "Unknown Seller"} ({listing.city})
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-end mb-3 gap-3">
                                        <h2 className="fw-bolder mb-0" style={{ fontSize: "2.5rem", color: "#1b4332" }}>
                                            Rs {listing.pricePerMaund.toLocaleString()}
                                        </h2>
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 align-self-center mt-2 fw-bold" style={{ letterSpacing: "0.5px" }}>
                                            ● IN STOCK
                                        </span>
                                    </div>

                                    <div className="flash-sale-banner bg-success bg-opacity-10 text-success rounded p-3 mb-4 d-flex align-items-center fw-medium border border-success border-opacity-25" style={{ fontSize: "0.95rem" }}>
                                        <i className="fa-regular fa-clock me-2 fs-5"></i>
                                        <span>Listed on: <span className="fw-bold ms-1">{new Date(listing.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span></span>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="bg-light rounded p-3 d-flex align-items-start gap-3 h-100 border border-light">
                                                <i className="fa-solid fa-box text-dark fs-4 mt-1"></i>
                                                <div>
                                                    <div className="fw-bolder fs-6 text-dark text-uppercase" style={{ letterSpacing: "-0.2px" }}>QUANTITY</div>
                                                    <div className="text-muted small">{listing.quantity}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {listing.extraInfo && listing.extraInfo.map((info, idx) => {
                                            const getIconForLabel = (label: string) => {
                                                const lowerLabel = label.toLowerCase();
                                                if (lowerLabel.includes('grade')) return 'fa-ranking-star';
                                                if (lowerLabel.includes('moist')) return 'fa-droplet';
                                                if (lowerLabel.includes('deliv') || lowerLabel.includes('transport')) return 'fa-truck-fast';
                                                if (lowerLabel.includes('variety') || lowerLabel.includes('type')) return 'fa-seedling';
                                                if (lowerLabel.includes('size')) return 'fa-compress';
                                                if (lowerLabel.includes('weight')) return 'fa-weight-hanging';
                                                if (lowerLabel.includes('packag')) return 'fa-box-open';
                                                if (lowerLabel.includes('color')) return 'fa-palette';
                                                return 'fa-tag';
                                            };
                                            const iconClass = getIconForLabel(info.label);
                                            
                                            return (
                                                <div className="col-6" key={idx}>
                                                    <div className="bg-light rounded p-3 d-flex align-items-start gap-3 h-100 border border-light">
                                                        <i className={`fa-solid ${iconClass} text-dark fs-4 mt-1`}></i>
                                                        <div>
                                                            <div className="fw-bolder fs-6 text-dark text-uppercase" style={{ letterSpacing: "-0.2px" }}>{info.label}</div>
                                                            <div className="text-muted small">{info.value || "Not specified"}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="col-12 mt-2">
                                        <div className="bg-light rounded p-4 border border-light">
                                            <h6 className="fw-bolder mb-3 text-uppercase" style={{ letterSpacing: "0.5px", fontSize: "0.9rem" }}>Contact Details</h6>

                                            <div className="d-flex align-items-center mb-3">
                                                <i className="fa-solid fa-phone text-muted me-3 fs-5"></i>
                                                <div>
                                                    <div className="text-muted small mb-1">Mobile Number</div>
                                                    <div className="fw-medium text-dark" style={!canSeeContact ? { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
                                                        {listing.createdBy?.phoneNumber || "Not provided"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-start">
                                                <i className="fa-solid fa-location-dot text-muted me-3 fs-5 mt-1"></i>
                                                <div>
                                                    <div className="text-muted small mb-1">Address</div>
                                                    <div className="fw-medium text-dark" style={!canSeeContact ? { filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' } : {}}>
                                                        {listing.createdBy?.address || "Not provided"}
                                                    </div>
                                                </div>
                                            </div>

                                            {!canSeeContact && contactCheckDone && (
                                                <div className="mt-3 pt-3 border-top text-center">
                                                    <p className="text-muted small mb-2">
                                                        <i className="fa-solid fa-lock me-1"></i>
                                                        Subscribe to a plan to view contact details
                                                    </p>
                                                    <a href="/#pricing-section" className="btn btn-success btn-sm px-4 fw-bold">
                                                        <i className="fa-solid fa-crown me-2"></i>Subscribe to Unlock
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {canSeeContact && listing.createdBy?.phoneNumber ? (
                                        <div className="mt-4 pt-2 border-top btn-mundi:hover ">
                                            <a
                                                href={`https://wa.me/${listing.createdBy.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`I am interested in ${listing.title}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-mundi w-100 py-3 fw-bold fs-5 rounded border-0"
                                            >
                                                <i className="fab fa-whatsapp me-2"></i>Contact via WhatsApp
                                            </a>
                                        </div>
                                    ) : !canSeeContact && contactCheckDone ? (
                                        <div className="mt-4 pt-2 border-top">
                                            <a
                                                href="/#pricing-section"
                                                className="btn w-100 py-3 fw-bold fs-5 rounded border-0"
                                                style={{ backgroundColor: '#2d6a4f', color: 'white' }}
                                            >
                                                <i className="fa-solid fa-lock me-2"></i>Subscribe to Contact Seller
                                            </a>
                                        </div>
                                    ) : null}

                                    <div className="mt-5 border-top pt-4">
                                        <h6 className="fw-bold mb-3 text-uppercase" style={{ letterSpacing: "0.5px", fontSize: "0.9rem" }}>Description</h6>
                                        <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "0.95rem" }}>
                                            {listing.description || "No description provided."}
                                        </p>


                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews & Ratings Section */}
                        <div className="mt-5 pt-5 border-top border-light">
                            <div className="row g-5">
                                {/* Left Col - Write Review */}
                                <div className="col-lg-5">
                                    <div className="bg-light p-4 rounded border border-light" style={{ backgroundColor: "#fcfdfe" }}>
                                        <h4 className="fw-bolder mb-4 text-dark" style={{ letterSpacing: "-0.5px" }}>Write a Review</h4>
                                        {reviewMessage.text && (
                                            <div className={`alert alert-${reviewMessage.type} small py-2 px-3 fw-medium`}>
                                                {reviewMessage.text}
                                            </div>
                                        )}
                                        <form onSubmit={handleReviewSubmit}>
                                            <div className="mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Your Name"
                                                    value={reviewForm.name}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Your Email"
                                                    value={reviewForm.email}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <select
                                                    className="form-select text-dark fw-medium"
                                                    value={reviewForm.rating}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                                >
                                                    <option value="5">5 Stars Rating - Excellent</option>
                                                    <option value="4">4 Stars Rating - Very Good</option>
                                                    <option value="3">3 Stars Rating - Average</option>
                                                    <option value="2">2 Stars Rating - Poor</option>
                                                    <option value="1">1 Star Rating - Terrible</option>
                                                </select>
                                            </div>
                                            <div className="mb-4">
                                                <textarea
                                                    className="form-control"
                                                    placeholder="Share your experience..."
                                                    rows={4}
                                                    value={reviewForm.comment}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                    required
                                                ></textarea>
                                            </div>
                                            <button
                                                type="submit"
                                                className="btn btn-mandi fw-bold px-4 py-2 text-white border-0"
                                                style={{ backgroundColor: "#0b0c10" }}
                                                disabled={submittingReview}
                                            >
                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Right Col - Customer Reviews */}
                                <div className="col-lg-7">
                                    <h4 className="fw-bolder mb-4 text-dark" style={{ letterSpacing: "-0.5px" }}>What Customers Say ({reviews.length})</h4>
                                    {reviews.length === 0 ? (
                                        <p className="text-muted fst-italic">No reviews yet. Be the first to share your experience!</p>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {reviews.map((r) => (
                                                <div key={r._id} className="p-4 rounded border border-light bg-white d-flex flex-column gap-2" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="fw-bold mb-0 text-success">{r.reviewerName}</h6>
                                                        <span className="badge" style={{ backgroundColor: "#fef1d2", color: "#8d6a13" }}>
                                                            <i className="fa-solid fa-star text-warning me-1"></i>
                                                            {r.rating}/5
                                                        </span>
                                                    </div>
                                                    <p className="text-muted mb-0 small" style={{ lineHeight: "1.6" }}>{r.comment}</p>
                                                    <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div >

            {/* Lightbox Overlay */}
            {
                lightboxImage && listing.images && (
                    <div
                        className="lightbox-overlay"
                        onClick={() => setLightboxImage(null)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setLightboxImage(null);
                            if (e.key === "ArrowRight") {
                                const idx = listing.images!.indexOf(lightboxImage);
                                if (idx < listing.images!.length - 1) setLightboxImage(listing.images![idx + 1]);
                            }
                            if (e.key === "ArrowLeft") {
                                const idx = listing.images!.indexOf(lightboxImage);
                                if (idx > 0) setLightboxImage(listing.images![idx - 1]);
                            }
                        }}
                        tabIndex={0}
                        role="dialog"
                        ref={(el) => el?.focus()}
                    >
                        <button className="lightbox-close" onClick={() => setLightboxImage(null)} aria-label="Close">
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        {listing.images.indexOf(lightboxImage) > 0 && (
                            <button
                                className="lightbox-nav lightbox-prev"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const idx = listing.images!.indexOf(lightboxImage);
                                    setLightboxImage(listing.images![idx - 1]);
                                }}
                                aria-label="Previous image"
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                        )}

                        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <Image
                                src={lightboxImage}
                                alt="Full size preview"
                                width={1200}
                                height={800}
                                unoptimized
                                className="lightbox-image"
                            />
                            <div className="lightbox-counter">
                                {listing.images.indexOf(lightboxImage) + 1} / {listing.images.length}
                            </div>
                        </div>

                        {listing.images.indexOf(lightboxImage) < listing.images.length - 1 && (
                            <button
                                className="lightbox-nav lightbox-next"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const idx = listing.images!.indexOf(lightboxImage);
                                    setLightboxImage(listing.images![idx + 1]);
                                }}
                                aria-label="Next image"
                            >
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        )}
                    </div>
                )
            }

            <footer className="bg-dark text-white py-4 mt-5">
                <div className="container text-center">
                    <p className="mb-1">© 2026 OnlineMundi Pakistan - Direct Agricultural Trade Platform</p>
                    <small className="text-muted">
                        Designed for Bulk Trading only. Commission charged on deal finalization.
                    </small>
                </div>
            </footer>

            <style jsx>{`
        .detail-main-image-wrapper {
          position: relative;
          cursor: pointer;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #dce7e2;
        }

        .detail-main-image {
          width: 100%;
          height: 400px;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .detail-main-image-wrapper:hover .detail-main-image {
          transform: scale(1.02);
        }

        .detail-main-image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .detail-main-image-overlay i {
          font-size: 2rem;
        }

        .detail-main-image-wrapper:hover .detail-main-image-overlay {
          opacity: 1;
        }

        .detail-thumb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .detail-thumb-btn {
          border: 2px solid transparent;
          border-radius: 8px;
          padding: 0;
          background: #fff;
          overflow: hidden;
          line-height: 0;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .detail-thumb-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .detail-thumb-btn.active {
          border-color: #1b4332;
          box-shadow: 0 0 0 2px rgba(27, 67, 50, 0.2);
        }

        .detail-thumb-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          display: block;
        }

        .empty-detail-images {
          border: 1px dashed #cddad3;
          border-radius: 10px;
          background: #f5faf7;
          color: #6f8379;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-spec-item {
          padding: 6px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .product-spec-item:last-child {
          border-bottom: none;
        }

        .verified-badge {
          background: linear-gradient(135deg, #198754, #2d9f6f) !important;
          color: white !important;
          font-weight: 600;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          padding: 5px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(25, 135, 84, 0.25);
        }

        .btn-mundi {
          background-color: #1b4332;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 8px;
        }

        .btn-mundi:hover {
          background-color: #081c15;
          color: white;
        }

        /* Lightbox */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: lightboxFadeIn 0.25s ease;
          outline: none;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 10001;
        }

        .lightbox-close:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: white;
          font-size: 1.3rem;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          z-index: 10001;
        }

        .lightbox-prev { left: 20px; }
        .lightbox-next { right: 20px; }

        .lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .lightbox-content {
          max-width: 90vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lightbox-image {
          max-width: 90vw;
          max-height: 80vh;
          width: auto !important;
          height: auto !important;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
        }

        .lightbox-counter {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          margin-top: 12px;
          letter-spacing: 0.05em;
        }

        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

            <Script
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
                strategy="afterInteractive"
            />
        </>
    );
}
