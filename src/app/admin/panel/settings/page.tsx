"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/panel/AdminShell";
import { useTranslation } from "@/lib/i18n";

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

const AVAILABLE_ICONS = [
  // Crops & Grains
  { value: "fa-wheat-awn", label: "Wheat / Grain" },
  { value: "fa-bowl-rice", label: "Rice / Chawal" },
  { value: "fa-seedling", label: "Maize / Corn" },
  { value: "fa-plant-wilt", label: "Sugarcane / Crop" },
  { value: "fa-leaf", label: "Cotton / Leaf" },
  { value: "fa-pagelines", label: "Barley / Oats", brand: true },
  { value: "fa-spa", label: "Mustard / Canola" },
  { value: "fa-tree", label: "Tree / Timber" },
  // Fruits
  { value: "fa-lemon", label: "Citrus / Kinnow" },
  { value: "fa-apple-whole", label: "Apple / Seb" },
  { value: "fa-cherry", label: "Cherry / Berries" },
  { value: "fa-stroopwafel", label: "Watermelon / Melon" },
  { value: "fa-circle", label: "Mango / Orange" },
  { value: "fa-wine-glass", label: "Grapes / Angoor" },
  { value: "fa-fan", label: "Banana / Kela" },
  { value: "fa-droplet", label: "Pomegranate / Anaar" },
  // Vegetables
  { value: "fa-carrot", label: "Carrot / Gajar" },
  { value: "fa-pepper-hot", label: "Chilli / Mirch" },
  { value: "fa-fire", label: "Tomato / Tamatar" },
  { value: "fa-circle-dot", label: "Potato / Aloo" },
  { value: "fa-ring", label: "Onion / Piaz" },
  { value: "fa-sun", label: "Pumpkin / Kaddu" },
  { value: "fa-broccoli", label: "Broccoli / Gobi" },
  { value: "fa-cubes-stacked", label: "Okra / Bhindi" },
  { value: "fa-clover", label: "Spinach / Palak" },
  // Pulses & Spices
  { value: "fa-jar", label: "Pulses / Dalain" },
  { value: "fa-mortar-pestle", label: "Spices / Masala" },
  { value: "fa-bowl-food", label: "Chana / Beans" },
  // Dry Fruits & Nuts
  { value: "fa-cashew", label: "Nuts / Dry Fruit" },
  { value: "fa-cookie", label: "Peanut / Moongphali" },
  // Livestock & Dairy
  { value: "fa-cow", label: "Cow / Dairy" },
  { value: "fa-fish", label: "Fish / Machhi" },
  { value: "fa-egg", label: "Egg / Poultry" },
  { value: "fa-drumstick-bite", label: "Meat / Gosht" },
  // General Trade
  { value: "fa-truck-ramp-box", label: "Truck / Trade" },
  { value: "fa-box-open", label: "Box / Package" },
  { value: "fa-basket-shopping", label: "Basket / Market" },
  { value: "fa-store", label: "Store / Dukaan" },
  { value: "fa-weight-hanging", label: "Weight / Wazn" },
];

function SettingsContent({ sessionUser }: { sessionUser: SessionUser }) {
  const { t } = useTranslation();
  const [freeListingLimit, setFreeListingLimit] = useState<number>(5);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettingsAndData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [limitRes, visibilityRes, iconsRes, catsRes] = await Promise.all([
        fetch("/api/settings?key=freeListingLimit", { cache: "no-store" }),
        fetch("/api/settings?key=homePageCategories", { cache: "no-store" }),
        fetch("/api/settings?key=categoryIcons", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" })
      ]);

      const limitData = await limitRes.json();
      const visibilityData = await visibilityRes.json();
      const iconsData = await iconsRes.json();
      const catsData = await catsRes.json();

      if (limitData.ok && limitData.setting) {
        setFreeListingLimit(limitData.setting.value);
      }

      if (visibilityData.ok && visibilityData.setting) {
        setSelectedCategoryIds(visibilityData.setting.value || []);
      }

      if (iconsData.ok && iconsData.setting) {
        setCategoryIcons(iconsData.setting.value || {});
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
      const limitResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          key: "freeListingLimit",
          value: freeListingLimit,
        }),
      });

      const limitData = await limitResponse.json();
      if (!limitResponse.ok || !limitData.ok) {
        setMessage(limitData.message || "Failed to save free listing limit.");
        return;
      }

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

      // Save Category Icons
      const iconsResponse = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          key: "categoryIcons",
          value: categoryIcons,
        }),
      });

      const iconsData = await iconsResponse.json();
      if (!iconsResponse.ok || !iconsData.ok) {
        setMessage(iconsData.message || "Failed to save category icons.");
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
    const groupKey = cat.group || "Ungrouped";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(cat);
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
              <h2 className="h4 fw-bold mb-0" style={{ color: "#1b4332" }}>{t("settings.title")}</h2>
              <p className="text-muted mb-0 small">{t("settings.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-12">
            <section className="card border shadow-sm rounded-4 p-4 bg-white">
                <h3 className="h5 fw-bold mb-4">{t("settings.registrationDefaults")}</h3>
                
                {message && (
                  <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} py-2`}>
                    {message}
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-5">
                      <div className="spinner-border text-success" role="status"></div>
                      <p className="text-muted mt-2">{t("settings.loadingSettings")}</p>
                  </div>
                ) : (
                  <form onSubmit={onSave} className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">{t("settings.freeListingLimit")}</label>
                      <p className="text-muted small mb-2">{t("settings.freeListingLimitDesc")}</p>
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
                        <label className="form-label fw-bold d-block mb-1 ">{t("settings.homePageVisibility")}</label>
                        <p className="text-muted small mb-4">{t("settings.homePageVisibilityDesc")}</p>
                        
                        <div className="row g-4">
                            {Object.entries(groupedCategories).map(([groupName, cats]) => (
                                <div className="col-md-6 col-xl-4" key={groupName}>
                                    <div className="p-3 border rounded-3 bg-light h-100">
                                        <h4 className="h6 fw-bold mb-3 text-uppercase small" style={{ color: "#2d6a4f", letterSpacing: "0.5px" }}>
                                            <i className="fa-solid fa-folder-tree me-2"></i>{groupName}
                                        </h4>
                                        <div className="d-flex flex-column gap-2">
                                            {cats.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                                                <div className="d-flex align-items-center gap-2 py-1" key={cat.id}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input mt-0 flex-shrink-0"
                                                        checked={selectedCategoryIds.includes(cat.id)}
                                                        onChange={() => toggleCategory(cat.id)}
                                                        id={`cat-${cat.id}`}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor={`cat-${cat.id}`} className="small mb-0 flex-grow-1" style={{ cursor: 'pointer' }}>{cat.name}</label>
                                                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                        <i className={`${categoryIcons[cat.id] === "fa-pagelines" ? "fa-brands" : "fa-solid"} ${categoryIcons[cat.id] || "fa-basket-shopping"} text-muted`} style={{ width: 18, textAlign: "center" }}></i>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ width: 110, fontSize: "0.75rem", padding: "2px 6px" }}
                                                            value={categoryIcons[cat.id] || ""}
                                                            onChange={(e) => setCategoryIcons(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                        >
                                                            <option value="">Default</option>
                                                            {AVAILABLE_ICONS.map(icon => (
                                                                <option key={icon.value} value={icon.value}>{icon.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
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
                          <><i className="fa-solid fa-spinner fa-spin me-2"></i>{t("settings.savingAll")}</>
                        ) : (
                          <><i className="fa-solid fa-floppy-disk me-2"></i>{t("settings.updateAll")}</>
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
