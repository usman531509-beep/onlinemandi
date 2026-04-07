"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/panel/AdminShell";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

type Category = {
  id: string;
  name: string;
  group: string;
};

function SettingsContent({ sessionUser }: { sessionUser: SessionUser }) {
  const [freeListingLimit, setFreeListingLimit] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettingsAndData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [limitRes, visibilityRes, catsRes] = await Promise.all([
        fetch("/api/settings?key=freeListingLimit", { cache: "no-store" }),
        fetch("/api/settings?key=homePageCategories", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" })
      ]);

      const limitData = await limitRes.json();
      const visibilityData = await visibilityRes.json();
      const catsData = await catsRes.json();

      if (limitData.ok && limitData.setting) {
        setFreeListingLimit(limitData.setting.value);
      }
      
      if (visibilityData.ok && visibilityData.setting) {
        setSelectedCategoryIds(visibilityData.setting.value || []);
      }

      if (catsData.ok && catsData.categories) {
        setCategories(catsData.categories);
      }
    } catch (err) {
      setMessage("Network error while loading settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettingsAndData();
  }, [loadSettingsAndData]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      // Save Free Listing Limit
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          key: "freeListingLimit",
          value: freeListingLimit,
        }),
      });

      // Save Home Page Categories
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          key: "homePageCategories",
          value: selectedCategoryIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to save visibility settings.");
        return;
      }

      setMessage("Settings updated successfully.");
    } catch {
      setMessage("Network error while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group categories by their group name
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <>
      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="section-icon-bg bg-primary bg-opacity-10 text-primary p-3 rounded-circle" style={{ width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-gear fs-4"></i>
            </div>
            <div>
              <h2 className="h4 fw-bold mb-0" style={{ color: "#1b4332" }}>System Settings</h2>
              <p className="text-muted mb-0 small">Configure global platform behavior and visibility.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-12">
            <section className="card border shadow-sm rounded-4 p-4 bg-white">
                <h3 className="h5 fw-bold mb-4">Registration & Marketplace Defaults</h3>
                
                {message && (
                  <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} py-2`}>
                    {message}
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-5">
                      <div className="spinner-border text-success" role="status"></div>
                      <p className="text-muted mt-2">Loading settings...</p>
                  </div>
                ) : (
                  <form onSubmit={onSave} className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Free Listing Limit</label>
                      <p className="text-muted small mb-2">How many free listings can a user create before requiring a subscription plan?</p>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={freeListingLimit}
                        onChange={(e) => setFreeListingLimit(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <hr className="my-4" />

                    <div className="col-12">
                        <label className="form-label fw-bold d-block mb-1 ">Home Page Visibility</label>
                        <p className="text-muted small mb-4">Select categories you want to display on the home page icons section. If none selected, all categories will be shown.</p>
                        
                        <div className="row g-4">
                            {Object.entries(groupedCategories).map(([groupName, cats]) => (
                                <div className="col-md-6 col-xl-4" key={groupName}>
                                    <div className="p-3 border rounded-3 bg-light h-100">
                                        <h4 className="h6 fw-bold mb-3 text-uppercase small" style={{ color: "#2d6a4f", letterSpacing: "0.5px" }}>
                                            <i className="fa-solid fa-folder-tree me-2"></i>{groupName}
                                        </h4>
                                        <div className="d-flex flex-column gap-2">
                                            {cats.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                                                <label className="d-flex align-items-center gap-2 cursor-pointer py-1" key={cat.id} style={{ cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="form-check-input mt-0"
                                                        checked={selectedCategoryIds.includes(cat.id)}
                                                        onChange={() => toggleCategory(cat.id)}
                                                    />
                                                    <span className="small">{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-12 mt-5">
                      <button type="submit" className="btn btn-success px-5 py-2 fw-semibold" disabled={isSaving}>
                        {isSaving ? (
                          <><i className="fa-solid fa-spinner fa-spin me-2"></i>Saving All Settings...</>
                        ) : (
                          <><i className="fa-solid fa-floppy-disk me-2"></i>Update All Settings</>
                        )}
                      </button>
                    </div>
                  </form>
                )}
            </section>
        </div>
      </div>
    </>
  );
}

export default function AdminSettingsPage() {
  return <AdminShell>{(sessionUser) => <SettingsContent sessionUser={sessionUser} />}</AdminShell>;
}
