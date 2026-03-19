"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/panel/AdminShell";

type SellRequest = {
    _id: string;
    cropType: string;
    variety?: string;
    moistureLevel?: number;
    totalQuantityTons: number;
    pricePerMaund: number;
    district: string;
    mobileNumber: string;
    email: string;
    farmPhotos?: string[];
    status: "pending" | "reviewed" | "closed";
    createdAt: string;
};

export default function AdminSellRequestsPage() {
    return (
        <AdminShell>
            {(sessionUser) => <SellRequestsContent sessionUser={sessionUser} />}
        </AdminShell>
    );
}

function SellRequestsContent({ sessionUser }: { sessionUser: { id: string; role: string } }) {
    const [requests, setRequests] = useState<SellRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        if (sessionUser.role !== "admin") return;
        fetchRequests();
    }, [sessionUser]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/requests/sell?role=${sessionUser.role}&userId=${sessionUser.id}`);
            const data = await res.json();
            if (res.ok && data.ok) {
                setRequests(data.requests || []);
            } else {
                setError(data.message || "Failed to load sell requests.");
            }
        } catch (e) {
            setError("Network error while trying to fetch requests.");
        } finally {
            setLoading(false);
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
        <>
            <div className="card border-light shadow-sm bg-white rounded-4 overflow-hidden">
                <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold" style={{ color: "#1b4332" }}>
                        <i className="fa-solid fa-wheat-awn me-2"></i> Sell Crop Requests
                    </h5>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                        {requests.length} total
                    </span>
                </div>

                <div className="bg-light border-bottom p-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><i className="fa-solid fa-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 ps-0" placeholder="Search by crop, district, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                <option value="all">All Crops</option>
                                {Array.from(new Set(requests.map(r => r.cropType))).filter(Boolean).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small">
                                <tr>
                                    <th className="ps-4 fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Date</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Crop Details</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Qty & Price</th>
                                    <th className="fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Contact Info</th>
                                    <th className="pe-4 fw-medium text-uppercase px-4 py-3" style={{ letterSpacing: "0.5px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filteredRequests = requests.filter(req => {
                                        if (filterStatus !== "all" && req.status !== filterStatus) return false;
                                        if (filterCategory !== "all" && req.cropType !== filterCategory) return false;
                                        
                                        if (searchQuery) {
                                            const query = searchQuery.toLowerCase();
                                            const matchesCategory = req.cropType?.toLowerCase().includes(query);
                                            const matchesDistrict = req.district?.toLowerCase().includes(query);
                                            const matchesMobile = req.mobileNumber?.toLowerCase().includes(query);
                                            const matchesEmail = req.email?.toLowerCase().includes(query);
                                            if (!matchesCategory && !matchesDistrict && !matchesMobile && !matchesEmail) return false;
                                        }
                                        return true;
                                    });

                                    if (filteredRequests.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} className="text-center py-5 text-muted">No sell requests found</td>
                                            </tr>
                                        );
                                    }

                                    return filteredRequests.map((req) => (
                                        <tr
                                            key={req._id}
                                            className="cursor-pointer"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            <td className="ps-4 px-4 py-3 text-muted small whitespace-nowrap">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="fw-semibold text-dark">{req.cropType}</div>
                                                {req.variety && <div className="text-muted small">Variety: {req.variety}</div>}
                                                <div className="text-muted small"><i className="fa-solid fa-location-dot me-1"></i>{req.district}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="fw-medium">{req.totalQuantityTons} Tons</div>
                                                <div className="text-success small fw-semibold">PKR {req.pricePerMaund.toLocaleString()}/Maund</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-dark small"><i className="fa-solid fa-phone me-1 text-muted"></i>{req.mobileNumber}</div>
                                                <div className="text-muted small"><i className="fa-solid fa-envelope me-1"></i>{req.email}</div>
                                            </td>
                                            <td className="pe-4 text-end px-4 py-3 text-start">
                                                <span className={`badge ${req.status === 'pending' ? 'bg-warning text-dark' : req.status === 'reviewed' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                                    {req.status?.toUpperCase() || "PENDING"}
                                                </span>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Request Details Modal */}
            {selectedRequest && (
                <>
                    <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content bg-white border-0 shadow-lg" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                                {/* Modal Header */}
                                <div className="modal-header border-bottom-0 pb-0 px-4 pt-4">
                                    <h5 className="modal-title fw-bold" style={{ color: "#1b4332" }}>
                                        <i className="fa-solid fa-file-invoice me-2"></i> Request Details
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setSelectedRequest(null)}
                                        aria-label="Close"
                                    ></button>
                                </div>

                                {/* Modal Body */}
                                <div className="modal-body px-4 py-4">
                                    {/* Overview Badges */}
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <span className={`badge ${selectedRequest.status === 'pending' ? 'bg-warning text-dark' : selectedRequest.status === 'reviewed' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                            STATUS: {selectedRequest.status?.toUpperCase() || "PENDING"}
                                        </span>
                                        <span className="badge bg-light text-dark border">
                                            <i className="fa-regular fa-clock me-1 text-muted"></i>
                                            {new Date(selectedRequest.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="row g-4 mb-4">
                                        <div className="col-md-6">
                                            <div className="card h-100 bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Commodity Info</h6>
                                                    <div className="mb-2"><span className="text-muted me-2">Crop Type:</span> <strong className="text-dark">{selectedRequest.cropType}</strong></div>
                                                    <div className="mb-2"><span className="text-muted me-2">Variety:</span> <span className="text-dark">{selectedRequest.variety || "N/A"}</span></div>
                                                    <div className="mb-2"><span className="text-muted me-2">Moisture:</span> <span className="text-dark">{selectedRequest.moistureLevel ? `${selectedRequest.moistureLevel}%` : "Not specified"}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="card h-100 bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Quantity & Pricing</h6>
                                                    <div className="mb-2"><span className="text-muted me-2">Quantity:</span> <strong className="text-dark fs-5">{selectedRequest.totalQuantityTons} Tons</strong></div>
                                                    <div className="mb-2"><span className="text-muted me-2">Price:</span> <strong className="text-success">PKR {selectedRequest.pricePerMaund.toLocaleString()} / Maund</strong></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="card bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Location & Contact</h6>
                                                    <div className="row">
                                                        <div className="col-md-4 mb-2"><span className="text-muted me-2"><i className="fa-solid fa-location-dot"></i> District:</span> <span className="text-dark">{selectedRequest.district}</span></div>
                                                        <div className="col-md-4 mb-2"><span className="text-muted me-2"><i className="fa-solid fa-phone"></i> Mobile:</span> <span className="text-dark">{selectedRequest.mobileNumber}</span></div>
                                                        <div className="col-md-4 mb-2"><span className="text-muted me-2"><i className="fa-solid fa-envelope"></i> Email:</span> <span className="text-dark">{selectedRequest.email}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Farm Photos */}
                                    {selectedRequest.farmPhotos && selectedRequest.farmPhotos.length > 0 && (
                                        <div>
                                            <h6 className="fw-bold text-uppercase small text-muted mb-3">Farm Photos ({selectedRequest.farmPhotos.length})</h6>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {selectedRequest.farmPhotos.map((photoStr, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={photoStr}
                                                        alt={`Farm photo ${idx + 1}`}
                                                        className="rounded shadow-sm border"
                                                        style={{ width: "120px", height: "120px", objectFit: "cover" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer border-top-0 px-4 pb-4 pt-1">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedRequest(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
