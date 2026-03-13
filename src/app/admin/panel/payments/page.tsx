"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/panel/AdminShell";

interface PaymentTransaction {
    _id: string;
    userEmail: string;
    userName?: string;
    planId?: {
        _id: string;
        name: string;
    };
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    amount: number;
    currency: string;
    status: "completed" | "failed" | "pending";
    paymentDate: string;
}

export default function PaymentsHistoryPage() {
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/payments?role=admin");
            const data = await res.json();
            if (data.ok) {
                setPayments(data.payments);
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i className="fa-solid fa-check-circle me-1"></i> Completed</span>;
            case "pending":
                return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1"><i className="fa-solid fa-clock me-1"></i> Pending</span>;
            case "failed":
                return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i className="fa-solid fa-times-circle me-1"></i> Failed</span>;
            default:
                return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <AdminShell>
            {(sessionUser) => (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h2 className="fw-bold mb-1" style={{ color: "#1b4332" }}>Payments History</h2>
                            <p className="text-muted mb-0 small">View and track all subscription and checkout payments from users.</p>
                        </div>
                        <button className="btn btn-outline-secondary fw-bold" onClick={fetchPayments}>
                            <i className="fa-solid fa-rotate-right me-2"></i> Refresh List
                        </button>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-success" role="status"></div>
                                    <p className="text-muted mt-2">Loading payments...</p>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-5 bg-light">
                                    <i className="fa-brands fa-stripe fa-3x text-muted mb-3 opacity-50"></i>
                                    <h5>No payments found</h5>
                                    <p className="text-muted">Once a user subscribes, their payment record will appear here.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Date</th>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Customer</th>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Plan</th>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Checkout ID</th>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase text-end">Amount</th>
                                                <th className="py-3 px-4 fw-semibold text-muted small text-uppercase text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((payment) => (
                                                <tr key={payment._id}>
                                                    <td className="py-3 px-4">
                                                        <span className="fw-medium text-dark">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                                                        <br />
                                                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{new Date(payment.paymentDate).toLocaleTimeString()}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="fw-medium text-dark">{payment.userName || "Guest / Unknown"}</div>
                                                        <div className="small text-muted">{payment.userEmail}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {payment.planId ? (
                                                                <><i className="fa-solid fa-tag text-success"></i> <span className="fw-medium">{payment.planId.name}</span></>
                                                            ) : (
                                                                <span className="text-muted fst-italic">Unknown or Deleted Plan</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted small font-monospace">
                                                        {payment.stripeSessionId.replace('cs_test_', '...')}
                                                    </td>
                                                    <td className="py-3 px-4 text-end">
                                                        <span className="fw-bold text-dark">{payment.amount.toLocaleString()}</span>
                                                        <span className="text-muted ms-1 small text-uppercase">{payment.currency}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {getStatusBadge(payment.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="card-footer bg-white border-top py-3 px-4 text-center">
                            <p className="text-muted small mb-0"><i className="fa-solid fa-lock text-success me-1"></i> Payments securely processed and tracked via Stripe Webhooks.</p>
                        </div>
                    </div>
                </>
            )}
        </AdminShell>
    );
}
