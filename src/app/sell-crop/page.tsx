"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type FormValues = Record<string, string | string[]>;

const initialSellerForm: FormValues = {
    cropType: "",
    variety: "",
    moistureLevel: "",
    qualityGrade: "A-Grade",
    totalQuantityTons: "",
    pricePerMaund: "",
    district: "",
    mobileNumber: "",
    email: "",
    farmPhotos: [] as string[],
};

export default function SellCropPage() {
    const [sellerForm, setSellerForm] = useState<FormValues>(initialSellerForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const raw = localStorage.getItem("mandi:draft:seller-form");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as FormValues;
            setSellerForm((prev) => ({ ...prev, ...parsed }));
        } catch {
            localStorage.removeItem("mandi:draft:seller-form");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("mandi:draft:seller-form", JSON.stringify(sellerForm));
    }, [sellerForm]);

    const handleSellerChange = (name: string, value: string | string[]) => {
        setSellerForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesToConvert = Array.from(e.target.files);

        // Convert simple array of files into array of Base64 strings
        const base64Files = await Promise.all(
            filesToConvert.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            })
        );
        handleSellerChange("farmPhotos", base64Files);
    };

    const onSellerSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/requests/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sellerForm)
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                alert("Listing Requested! Our team will review your application shortly.");
                localStorage.removeItem("mandi:draft:seller-form");
                router.push("/");
            } else {
                alert(data.message || "Failed to submit request.");
            }
        } catch (error) {
            alert("A network error occurred while submitting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />

            {/* Hero Banner */}
            <section className="sell-hero">
                <div className="container text-center">
                    <div className="sell-hero-icon">
                        <i className="fa-solid fa-wheat-awn"></i>
                    </div>
                    <h1 className="display-5 fw-bold mb-3 sell-hero-title">Sell Your Crop</h1>
                    <p className="lead mb-0 sell-hero-subtitle" style={{ maxWidth: 620, margin: "0 auto" }}>
                        List your agricultural produce and connect directly with bulk buyers across Pakistan. No middlemen, better prices.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <div className="container" style={{ marginTop: "-60px", position: "relative", zIndex: 2 }}>
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card sell-form-card border-0">
                            <div className="card-body p-4 p-md-5">

                                <form id="seller-form" onSubmit={onSellerSubmit}>

                                    {/* Section: Commodity Info */}
                                    <div className="sell-section-header">
                                        <div className="sell-section-icon"><i className="fa-solid fa-seedling"></i></div>
                                        <h5 className="fw-bold mb-0">Commodity Info</h5>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Crop Type</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="cropType"
                                                placeholder="e.g. Wheat, Rice, Cotton"
                                                required
                                                value={sellerForm.cropType}
                                                onChange={(e) => handleSellerChange("cropType", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Variety (e.g. 1121, Basmati)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="variety"
                                                placeholder="Variety name"
                                                value={sellerForm.variety}
                                                onChange={(e) => handleSellerChange("variety", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Moisture Level (%)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="moistureLevel"
                                                placeholder="e.g. 12"
                                                value={sellerForm.moistureLevel}
                                                onChange={(e) => handleSellerChange("moistureLevel", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Quality Grade</label>
                                            <select
                                                className="form-select"
                                                name="qualityGrade"
                                                value={sellerForm.qualityGrade}
                                                onChange={(e) => handleSellerChange("qualityGrade", e.target.value)}
                                            >
                                                <option>A-Grade</option>
                                                <option>B-Grade</option>
                                                <option>Export Quality</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Section: Quantity & Pricing */}
                                    <div className="sell-section-header">
                                        <div className="sell-section-icon"><i className="fa-solid fa-coins"></i></div>
                                        <h5 className="fw-bold mb-0">Quantity & Pricing</h5>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Total Quantity</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="totalQuantityTons"
                                                    required
                                                    value={sellerForm.totalQuantityTons}
                                                    onChange={(e) => handleSellerChange("totalQuantityTons", e.target.value)}
                                                />
                                                <span className="input-group-text">Tons</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Price per Maund (PKR)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="pricePerMaund"
                                                placeholder="Ask price"
                                                required
                                                value={sellerForm.pricePerMaund}
                                                onChange={(e) => handleSellerChange("pricePerMaund", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Section: Location & Media */}
                                    <div className="sell-section-header">
                                        <div className="sell-section-icon"><i className="fa-solid fa-location-dot"></i></div>
                                        <h5 className="fw-bold mb-0">Location & Contact Details</h5>
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">District</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="district"
                                                placeholder="e.g. Sahiwal"
                                                required
                                                value={sellerForm.district}
                                                onChange={(e) => handleSellerChange("district", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Mobile Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                name="mobileNumber"
                                                placeholder="03XX-XXXXXXX"
                                                required
                                                value={sellerForm.mobileNumber}
                                                onChange={(e) => handleSellerChange("mobileNumber", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                name="email"
                                                placeholder="your@email.com"
                                                required
                                                value={sellerForm.email}
                                                onChange={(e) => handleSellerChange("email", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Upload Farm Photos <span className="text-muted fw-normal fs-6">(Optional)</span></label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                name="farmPhotos"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-mandi btn-lg w-100 mt-2" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting...</>
                                        ) : (
                                            <><i className="fa-solid fa-paper-plane me-2"></i>Request for Listing</>
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
        .sell-hero {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%);
          color: white;
          padding: 70px 0 100px;
          position: relative;
          overflow: hidden;
        }

        .sell-hero::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 202, 40, 0.12) 0%, transparent 70%);
          border-radius: 50%;
        }

        .sell-hero::after {
          content: "";
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
          border-radius: 50%;
        }

        .sell-hero-icon {
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

        .sell-hero-title {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.7s ease forwards 0.1s;
        }

        .sell-hero-subtitle {
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.7s ease forwards 0.25s;
        }

        .sell-form-card {
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
          background: white;
        }

        .sell-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e4f1eb;
        }

        .sell-section-icon {
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

        .input-group-text {
          border-radius: 0 10px 10px 0;
          background: #f0f7f3;
          border: 1.5px solid #dce7e2;
          border-left: 0;
          color: #1b4332;
          font-weight: 600;
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
