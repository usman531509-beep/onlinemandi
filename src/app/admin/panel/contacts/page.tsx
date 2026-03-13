"use client";

import { useEffect, useState, useCallback } from "react";
import AdminShell from "@/components/panel/AdminShell";

type ContactSubmission = {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: "unread" | "read";
    createdAt: string;
};

export default function AdminContactsPage() {
    return (
        <AdminShell>
            {(sessionUser) => <ContactsContent role={sessionUser.role} />}
        </AdminShell>
    );
}

function ContactsContent({ role }: { role: "admin" | "buyer" | "seller" }) {
    const [contacts, setContacts] = useState<ContactSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMessage, setViewMessage] = useState<ContactSubmission | null>(null);

    const loadContacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/contacts?role=${role}`);
            const data = await res.json();
            if (res.ok && data.ok) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error("Failed to load contacts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [role]);

    useEffect(() => {
        void loadContacts();
    }, [loadContacts]);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 fw-bold mb-0" style={{ color: "#1b4332" }}>Contact Inquiries</h1>
                <button className="btn btn-outline-success btn-sm" onClick={() => void loadContacts()} disabled={isLoading}>
                    <i className={`fa-solid fa-rotate-right me-2 ${isLoading ? "fa-spin" : ""}`}></i>
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                    <div className="spinner-border text-success mb-3" role="status"></div>
                    <p className="text-muted mb-0">Loading inquiries...</p>
                </div>
            ) : contacts.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <div className="mb-3">
                        <i className="fa-solid fa-inbox fa-3x" style={{ color: "#dee2e6" }}></i>
                    </div>
                    <h5 className="fw-semibold text-muted">No Inquiries Found</h5>
                    <p className="text-muted mb-0 small">When users submit the contact form, their messages will appear here.</p>
                </div>
            ) : (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-4 text-secondary fw-semibold small text-uppercase">Date</th>
                                    <th className="py-3 px-4 text-secondary fw-semibold small text-uppercase">Name</th>
                                    <th className="py-3 px-4 text-secondary fw-semibold small text-uppercase">Subject</th>
                                    <th className="py-3 px-4 text-secondary fw-semibold small text-uppercase text-center">Status</th>
                                    <th className="py-3 px-4 text-secondary fw-semibold small text-uppercase text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr key={contact._id}>
                                        <td className="py-3 px-4">
                                            <span className="small text-muted">{new Date(contact.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="fw-medium">{contact.name}</div>
                                            <div className="small text-muted">{contact.email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="fw-medium text-truncate" style={{ maxWidth: "250px" }}>{contact.subject}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {contact.status === "unread" ? (
                                                <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">Unread</span>
                                            ) : (
                                                <span className="badge bg-success px-2 py-1 rounded-pill">Read</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-end">
                                            <button
                                                className="btn btn-sm btn-light border shadow-sm"
                                                onClick={() => setViewMessage(contact)}
                                            >
                                                <i className="fa-solid fa-eye me-1 text-muted"></i> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View Message Modal */}
            {viewMessage && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={(e) => {
                        if (e.target === e.currentTarget) setViewMessage(null);
                    }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header bg-light border-bottom-0 p-4">
                                    <div>
                                        <h5 className="modal-title fw-bold" style={{ color: "#1b4332" }}>Contact Inquiry</h5>
                                        <p className="mb-0 text-muted small">Submitted on {new Date(viewMessage.createdAt).toLocaleString("en-PK")}</p>
                                    </div>
                                    <button type="button" className="btn-close" onClick={() => setViewMessage(null)} aria-label="Close"></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-4 mb-4">
                                        <div className="col-md-4">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <span className="d-block text-uppercase text-muted fw-bold mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>Sender</span>
                                                <div className="fw-semibold">{viewMessage.name}</div>
                                                <div className="small text-muted">
                                                    <a href={`mailto:${viewMessage.email}`} className="text-decoration-none">
                                                        <i className="fa-solid fa-envelope me-1"></i>{viewMessage.email}
                                                    </a>
                                                </div>
                                                {viewMessage.phone && (
                                                    <div className="small text-muted mt-1">
                                                        <a href={`tel:${viewMessage.phone}`} className="text-decoration-none text-muted">
                                                            <i className="fa-solid fa-phone me-1"></i>{viewMessage.phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-8">
                                            <div className="p-3 bg-light rounded-3 h-100 border">
                                                <span className="d-block text-uppercase text-muted fw-bold mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>Subject</span>
                                                <div className="fw-bold fs-5" style={{ color: "#1b4332" }}>{viewMessage.subject}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white rounded-3 border shadow-sm">
                                        <span className="d-block text-uppercase text-muted fw-bold mb-3" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>Message Content</span>
                                        <p className="mb-0 fs-6" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{viewMessage.message}</p>
                                    </div>
                                </div>
                                <div className="modal-footer border-top-0 p-4 pt-0">
                                    <button type="button" className="btn btn-secondary px-4 rounded-3" onClick={() => setViewMessage(null)}>Close</button>
                                    <a href={`mailto:${viewMessage.email}?subject=Re: ${viewMessage.subject}`} className="btn btn-success px-4 rounded-3">
                                        <i className="fa-solid fa-reply me-2"></i>Reply via Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .modal-backdrop {
                    opacity: 0.5;
                    background-color: #000;
                }
            `}</style>
        </>
    );
}
