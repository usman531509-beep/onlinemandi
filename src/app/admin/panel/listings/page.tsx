"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/panel/AdminShell";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

type Listing = {
  id: string;
  title: string;
  category: string;
  city: string;
  quantity: string;
  pricePerMaund: number;
  description: string;
  images: string[];
  extraInfo?: { label: string; value: string }[];
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "buyer" | "seller";
  } | null;
};

type Category = {
  id: string;
  name: string;
  subcategories?: {
    id: string;
    name: string;
    children?: {
      id: string;
      name: string;
    }[];
  }[];
  customFields?: {
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    options: string[];
    placeholder: string;
  }[];
};

const initialListingForm = {
  title: "",
  category: "",
  subcategory: "",
  childCategory: "",
  city: "",
  quantityValue: "",
  quantityUnit: "ton",
  pricePerMaund: "",
  description: "",
  extraInfo: [] as { label: string; value: string }[],
};

type QuantityUnit = "ton" | "maund" | "kg";

function parseQuantity(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { quantityValue: "", quantityUnit: "ton" as QuantityUnit };

  const match = trimmed.match(/^(.+?)\s*(ton|maund|kg)$/i);
  if (match) {
    return {
      quantityValue: match[1].trim(),
      quantityUnit: match[2].toLowerCase() as QuantityUnit,
    };
  }

  return { quantityValue: trimmed, quantityUnit: "ton" as QuantityUnit };
}

function formatQuantity(quantityValue: string, quantityUnit: string) {
  return `${quantityValue.trim()} ${quantityUnit}`.trim();
}

function filesToDataUrls(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        })
    )
  );
}

function ListingsContent({ sessionUser }: { sessionUser: SessionUser }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

  const [listingForm, setListingForm] = useState(initialListingForm);
  const [listingImages, setListingImages] = useState<string[]>([]);

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialListingForm);
  const [editImages, setEditImages] = useState<string[]>([]);
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

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const categoryOptions = useMemo(() => categories.map((category) => category.name), [categories]);

  const findHierarchy = useCallback((categoryName: string) => {
    for (const cat of categories) {
      if (cat.name === categoryName) return { category: cat.name, sub: "", child: "" };
      for (const sub of cat.subcategories || []) {
        if (sub.name === categoryName) return { category: cat.name, sub: sub.name, child: "" };
        for (const child of sub.children || []) {
          if (child.name === categoryName) return { category: cat.name, sub: sub.name, child: child.name };
        }
      }
    }
    return { category: categoryName, sub: "", child: "" };
  }, [categories]);

  const getSubcategoryOptions = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat?.subcategories?.map(s => s.name) || [];
  };

  const getChildCategoryOptions = (catName: string, subName: string) => {
    const cat = categories.find(c => c.name === catName);
    const sub = cat?.subcategories?.find(s => s.name === subName);
    return sub?.children?.map(c => c.name) || [];
  };

  useEffect(() => {
    if (!categoryOptions.length) return;

    setListingForm((prev) => {
      const catName = prev.category || categoryOptions[0];
      const cat = categories.find(c => c.name === catName);
      const extraInfo = (cat?.customFields || []).map(f => ({ label: f.label, value: "" }));
      return { ...prev, category: catName, extraInfo };
    });
    setEditForm((prev) => ({ ...prev, category: prev.category || categoryOptions[0] }));
  }, [categoryOptions, categories]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = (await response.json()) as { ok: boolean; categories?: Category[] };
      if (response.ok && data.ok) setCategories(data.categories || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    setMessage("");
    try {
      const response = await fetch(`/api/listings?role=${sessionUser.role}&userId=${sessionUser.id}`);
      const data = (await response.json()) as { ok: boolean; message?: string; listings?: Listing[] };
      if (!response.ok || !data.ok) {
        setListings([]);
        setMessage(data.message || "Failed to load listings.");
        return;
      }
      setListings(data.listings || []);
    } catch {
      setListings([]);
      setMessage("Network error while loading listings.");
    } finally {
      setIsLoadingListings(false);
    }
  }, [sessionUser.id, sessionUser.role]);

  useEffect(() => {
    void Promise.all([loadCategories(), loadListings()]);
  }, [loadCategories, loadListings]);

  const onCreateListingImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const dataUrls = await filesToDataUrls(files);
      setListingImages((prev) => [...prev, ...dataUrls].slice(0, 8));
      event.target.value = "";
    } catch {
      setMessage("Could not read one or more images.");
    }
  };

  const onEditListingImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const dataUrls = await filesToDataUrls(files);
      setEditImages((prev) => [...prev, ...dataUrls].slice(0, 8));
      event.target.value = "";
    } catch {
      setMessage("Could not read one or more images.");
    }
  };

  const removeCreateImage = (index: number) => setListingImages((prev) => prev.filter((_, idx) => idx !== index));
  const removeEditImage = (index: number) => setEditImages((prev) => prev.filter((_, idx) => idx !== index));

  const addExtraInfo = (isEdit: boolean) => {
    const newItem = { label: "", value: "" };
    if (isEdit) {
      setEditForm(prev => ({ ...prev, extraInfo: [...(prev.extraInfo || []), newItem] }));
    } else {
      setListingForm(prev => ({ ...prev, extraInfo: [...(prev.extraInfo || []), newItem] }));
    }
  };

  const removeExtraInfo = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditForm(prev => ({ ...prev, extraInfo: (prev.extraInfo || []).filter((_, i) => i !== index) }));
    } else {
      setListingForm(prev => ({ ...prev, extraInfo: (prev.extraInfo || []).filter((_, i) => i !== index) }));
    }
  };

  const updateExtraInfo = (index: number, key: "label" | "value", value: string, isEdit: boolean) => {
    const update = (prev: typeof initialListingForm) => {
      const newList = [...(prev.extraInfo || [])];
      newList[index] = { ...newList[index], [key]: value };
      return { ...prev, extraInfo: newList };
    };
    if (isEdit) {
      setEditForm(prev => update(prev));
    } else {
      setListingForm(prev => update(prev));
    }
  };

  const startEditListing = (listing: Listing) => {
    const parsedQuantity = parseQuantity(listing.quantity);
    const hierarchy = findHierarchy(listing.category);

    setEditingListingId(listing.id);
    setEditForm({
      title: listing.title,
      category: hierarchy.category,
      subcategory: hierarchy.sub,
      childCategory: hierarchy.child,
      city: listing.city,
      quantityValue: parsedQuantity.quantityValue,
      quantityUnit: parsedQuantity.quantityUnit,
      pricePerMaund: String(listing.pricePerMaund),
      description: listing.description,
      extraInfo: listing.extraInfo || [],
    });
    setEditImages(listing.images || []);
  };

  const cancelEditListing = () => {
    setEditingListingId(null);
    setEditForm(initialListingForm);
    setEditImages([]);
  };

  const onCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingListing(true);
    setMessage("");
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          title: listingForm.title,
          category: listingForm.childCategory || listingForm.subcategory || listingForm.category,
          city: listingForm.city,
          quantity: formatQuantity(listingForm.quantityValue, listingForm.quantityUnit),
          pricePerMaund: Number(listingForm.pricePerMaund),
          description: listingForm.description,
          images: listingImages,
          extraInfo: listingForm.extraInfo,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to create listing.");
        return;
      }
      setListingForm((prev) => ({ ...initialListingForm, category: prev.category, subcategory: prev.subcategory, childCategory: prev.childCategory, extraInfo: [] }));
      setListingImages([]);
      setMessage("Listing created successfully.");
      await loadListings();
    } catch {
      setMessage("Network error while creating listing.");
    } finally {
      setIsCreatingListing(false);
    }
  };

  const onUpdateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingListingId) return;
    setIsUpdatingListing(true);
    setMessage("");
    try {
      const response = await fetch(`/api/listings/${editingListingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          title: editForm.title,
          category: editForm.childCategory || editForm.subcategory || editForm.category,
          city: editForm.city,
          quantity: formatQuantity(editForm.quantityValue, editForm.quantityUnit),
          pricePerMaund: Number(editForm.pricePerMaund),
          description: editForm.description,
          images: editImages,
          extraInfo: editForm.extraInfo,
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to update listing.");
        return;
      }
      cancelEditListing();
      setMessage("Listing updated successfully.");
      await loadListings();
    } catch {
      setMessage("Network error while updating listing.");
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const onDeleteListing = async (listingId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Listing",
      message: "Are you sure you want to delete this listing? This action cannot be undone.",
      onConfirm: async () => {
        setMessage("");
        try {
          const response = await fetch(`/api/listings/${listingId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: sessionUser.id, role: sessionUser.role }),
          });
          const data = (await response.json()) as { ok: boolean; message?: string };
          if (!response.ok || !data.ok) {
            setMessage(data.message || "Failed to delete listing.");
            return;
          }
          setMessage("Listing deleted successfully.");
          await loadListings();
        } catch {
          setMessage("Network error while deleting listing.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

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
      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="section-icon-bg">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h2 className="h4 fw-bold mb-0" style={{ color: "#1b4332" }}>Listings</h2>
              <p className="text-muted mb-0 small">Create, update, delete, and inspect all marketplace listings.</p>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={() => setShowCreateListingModal(true)}>
              <i className="fa-solid fa-plus me-2"></i>Create Listing
            </button>
            <button className="btn btn-outline-success" onClick={() => void Promise.all([loadCategories(), loadListings()])}>
              <i className="fa-solid fa-rotate-right me-2"></i>Refresh
            </button>
          </div>
        </div>
      </section>

      {showCreateListingModal && (
        <div className="category-modal-backdrop" onClick={() => setShowCreateListingModal(false)}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-plus-circle" style={{ color: "#2a5d49" }}></i>
                  <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Create New Listing</h3>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateListingModal(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={onCreateListing}>
                <div className="row g-3">
                  <div className="col-12"><label className="form-label">Title</label><input className="form-control" required value={listingForm.title} onChange={(e) => setListingForm((p) => ({ ...p, title: e.target.value }))} /></div>

                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <select className="form-select" required value={listingForm.category} onChange={(e) => {
                      const catName = e.target.value;
                      const cat = categories.find(c => c.name === catName);
                      const extraInfo = (cat?.customFields || []).map(f => ({ label: f.label, value: "" }));
                      setListingForm((p) => ({ ...p, category: catName, subcategory: "", childCategory: "", extraInfo }));
                    }}>
                      <option value="">Select Category</option>
                      {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Subcategory</label>
                    <select
                      className="form-select"
                      value={listingForm.subcategory}
                      disabled={!listingForm.category || getSubcategoryOptions(listingForm.category).length === 0}
                      onChange={(e) => setListingForm((p) => ({ ...p, subcategory: e.target.value, childCategory: "" }))}
                    >
                      <option value="">Select Subcategory</option>
                      {getSubcategoryOptions(listingForm.category).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Child Category</label>
                    <select
                      className="form-select"
                      value={listingForm.childCategory}
                      disabled={!listingForm.subcategory || getChildCategoryOptions(listingForm.category, listingForm.subcategory).length === 0}
                      onChange={(e) => setListingForm((p) => ({ ...p, childCategory: e.target.value }))}
                    >
                      <option value="">Select Child Category</option>
                      {getChildCategoryOptions(listingForm.category, listingForm.subcategory).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  {(() => {
                    const cat = categories.find(c => c.name === listingForm.category);
                    return (cat?.customFields || []).map((field, idx) => (
                      <div className="col-md-4" key={field.id}>
                        <label className="form-label">{field.label}{field.required && <span className="text-danger"> *</span>}</label>
                        {field.fieldType === "select" ? (
                          <select className="form-select" required={field.required} value={listingForm.extraInfo?.[idx]?.value || ""} onChange={(e) => updateExtraInfo(idx, "value", e.target.value, false)}>
                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input className="form-control" type={field.fieldType === "number" ? "number" : "text"} required={field.required} placeholder={field.placeholder || ""} value={listingForm.extraInfo?.[idx]?.value || ""} onChange={(e) => updateExtraInfo(idx, "value", e.target.value, false)} />
                        )}
                      </div>
                    ));
                  })()}
                  <div className="col-md-4"><label className="form-label">City</label><input className="form-control" required value={listingForm.city} onChange={(e) => setListingForm((p) => ({ ...p, city: e.target.value }))} /></div>
                  <div className="col-md-4">
                    <label className="form-label">Quantity</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={listingForm.quantityValue}
                        onChange={(e) => setListingForm((p) => ({ ...p, quantityValue: e.target.value }))}
                      />
                      <select
                        className="form-select"
                        style={{ maxWidth: 120 }}
                        value={listingForm.quantityUnit}
                        onChange={(e) => setListingForm((p) => ({ ...p, quantityUnit: e.target.value as QuantityUnit }))}
                      >
                        <option value="ton">ton</option>
                        <option value="maund">maund</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4"><label className="form-label">Price / Maund</label><input className="form-control" type="number" required value={listingForm.pricePerMaund} onChange={(e) => setListingForm((p) => ({ ...p, pricePerMaund: e.target.value }))} /></div>
                  <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={listingForm.description} onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))}></textarea></div>

                  <div className="col-12">
                    <label className="form-label">Upload Images (multiple)</label>
                    <input type="file" className="form-control" multiple accept="image/*" onChange={onCreateListingImagesChange} />
                    {listingImages.length > 0 && (
                      <div className="image-preview-grid mt-3">
                        {listingImages.map((image, idx) => (
                          <div className="thumb-wrap" key={`${image}-${idx}`}>
                            <Image src={image} alt={`Preview ${idx + 1}`} className="thumb" width={120} height={72} unoptimized />
                            <button type="button" className="remove-image-btn" onClick={() => removeCreateImage(idx)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-12"><button className="btn btn-success px-4" type="submit" disabled={isCreatingListing}><i className="fa-solid fa-plus me-2"></i>{isCreatingListing ? "Creating..." : "Create Listing"}</button></div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editingListingId && (
        <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 fw-bold mb-0">Edit Listing</h3>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEditListing}>Cancel</button>
          </div>
          <form onSubmit={onUpdateListing}>
            <div className="row g-3">
              <div className="col-12"><label className="form-label">Title</label><input className="form-control" required value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></div>

              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select className="form-select" required value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value, subcategory: "", childCategory: "" }))}>
                  <option value="">Select Category</option>
                  {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={editForm.subcategory}
                  disabled={!editForm.category || getSubcategoryOptions(editForm.category).length === 0}
                  onChange={(e) => setEditForm((p) => ({ ...p, subcategory: e.target.value, childCategory: "" }))}
                >
                  <option value="">Select Subcategory</option>
                  {getSubcategoryOptions(editForm.category).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Child Category</label>
                <select
                  className="form-select"
                  value={editForm.childCategory}
                  disabled={!editForm.subcategory || getChildCategoryOptions(editForm.category, editForm.subcategory).length === 0}
                  onChange={(e) => setEditForm((p) => ({ ...p, childCategory: e.target.value }))}
                >
                  <option value="">Select Child Category</option>
                  {getChildCategoryOptions(editForm.category, editForm.subcategory).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              {(() => {
                const cat = categories.find(c => c.name === editForm.category);
                return (cat?.customFields || []).map((field, idx) => (
                  <div className="col-md-4" key={field.id}>
                    <label className="form-label">{field.label}{field.required && <span className="text-danger"> *</span>}</label>
                    {field.fieldType === "select" ? (
                      <select className="form-select" required={field.required} value={editForm.extraInfo?.[idx]?.value || ""} onChange={(e) => updateExtraInfo(idx, "value", e.target.value, true)}>
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input className="form-control" type={field.fieldType === "number" ? "number" : "text"} required={field.required} placeholder={field.placeholder || ""} value={editForm.extraInfo?.[idx]?.value || ""} onChange={(e) => updateExtraInfo(idx, "value", e.target.value, true)} />
                    )}
                  </div>
                ));
              })()}
              <div className="col-md-4"><label className="form-label">City</label><input className="form-control" required value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} /></div>
              <div className="col-md-4">
                <label className="form-label">Quantity</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editForm.quantityValue}
                    onChange={(e) => setEditForm((p) => ({ ...p, quantityValue: e.target.value }))}
                  />
                  <select
                    className="form-select"
                    style={{ maxWidth: 120 }}
                    value={editForm.quantityUnit}
                    onChange={(e) => setEditForm((p) => ({ ...p, quantityUnit: e.target.value as QuantityUnit }))}
                  >
                    <option value="ton">ton</option>
                    <option value="maund">maund</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4"><label className="form-label">Price / Maund</label><input className="form-control" type="number" required value={editForm.pricePerMaund} onChange={(e) => setEditForm((p) => ({ ...p, pricePerMaund: e.target.value }))} /></div>
              <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}></textarea></div>

              {editForm.extraInfo?.map((info, idx) => (
                <div key={idx} className="col-12">
                  <div className="d-flex gap-2">
                    <input className="form-control" placeholder="Title (e.g. Color)" value={info.label} onChange={(e) => updateExtraInfo(idx, "label", e.target.value, true)} />
                    <input className="form-control" placeholder="Information" value={info.value} onChange={(e) => updateExtraInfo(idx, "value", e.target.value, true)} />
                    <button type="button" className="btn btn-outline-danger" onClick={() => removeExtraInfo(idx, true)}>×</button>
                  </div>
                </div>
              ))}

              <div className="col-12">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => addExtraInfo(true)}>
                  <i className="fa-solid fa-plus me-1"></i>Add Extra Info
                </button>
              </div>

              <div className="col-12">
                <label className="form-label">Update Images</label>
                <input type="file" className="form-control" multiple accept="image/*" onChange={onEditListingImagesChange} />
                {editImages.length > 0 && (
                  <div className="image-preview-grid mt-3">
                    {editImages.map((image, idx) => (
                      <div className="thumb-wrap" key={`${image}-${idx}`}>
                        <Image src={image} alt={`Edit ${idx + 1}`} className="thumb" width={120} height={72} unoptimized />
                        <button type="button" className="remove-image-btn" onClick={() => removeEditImage(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-12"><button className="btn btn-primary" type="submit" disabled={isUpdatingListing}>{isUpdatingListing ? "Saving..." : "Update Listing"}</button></div>
            </div>
          </form>
        </section>
      )}

      {message && <div className="alert alert-info py-2 rounded-3">{message}</div>}

      <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white">
        {isLoadingListings ? (
          <div className="p-4 text-center text-muted"><i className="fa-solid fa-spinner fa-spin me-2"></i>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="p-4 text-center text-muted"><i className="fa-regular fa-folder-open me-2"></i>No listings found.</div>
        ) : (
          <div className="listing-list">
            {listings.map((listing) => (
              <div role="button" tabIndex={0} key={listing.id} className="listing-row" onClick={() => setSelectedListing(listing)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedListing(listing); } }}>
                <div className="listing-row-left">
                  {listing.images?.[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} width={58} height={58} className="listing-row-thumb" unoptimized />
                  ) : (
                    <div className="listing-row-thumb listing-row-thumb-empty"><i className="fa-regular fa-image"></i></div>
                  )}
                  <div className="text-start">
                    <div className="fw-semibold">{listing.title}</div>
                    <small className="text-muted">{listing.city} | {listing.quantity}</small>
                  </div>
                </div>
                <div className="listing-row-right">
                  <span className="badge text-bg-light border me-2">{listing.category}</span>
                  <strong className="text-success me-3">PKR {listing.pricePerMaund.toLocaleString()}</strong>
                  <span className="d-flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => startEditListing(listing)}>Edit</button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDeleteListing(listing.id)}>Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedListing && (
        <div className="category-modal-backdrop" onClick={() => setSelectedListing(null)}>
          <div className="category-modal listing-detail-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h5 fw-bold mb-0">{selectedListing.title}</h3>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedListing(null)}>Close</button>
              </div>
              {selectedListing.images?.length > 0 ? (
                <div className="mb-4">
                  <div className="modal-gallery-grid">
                    {selectedListing.images.slice(0, 10).map((img, idx) => (
                      <Image
                        key={`${img}-${idx}`}
                        src={img}
                        alt={`${selectedListing.title} ${idx + 1}`}
                        className="modal-gallery-thumb"
                        width={140}
                        height={92}
                        unoptimized
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-main-image mb-4"><i className="fa-regular fa-image me-2"></i>No images uploaded</div>
              )}
              <div className="row g-3 mb-3">
                <div className="col-md-4"><div className="detail-item"><small>Category</small><p className="mb-0 fw-semibold">{selectedListing.category}</p></div></div>
                <div className="col-md-4"><div className="detail-item"><small>City</small><p className="mb-0 fw-semibold">{selectedListing.city}</p></div></div>
                <div className="col-md-4"><div className="detail-item"><small>Quantity</small><p className="mb-0 fw-semibold">{selectedListing.quantity}</p></div></div>
              </div>
              <div className="detail-item mb-3"><small>Description</small><p className="mb-0">{selectedListing.description || "No description provided."}</p></div>

              {selectedListing.extraInfo && selectedListing.extraInfo.length > 0 && (
                <div className="row g-3 mb-3">
                  {selectedListing.extraInfo.map((info, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="detail-item">
                        <small>{info.label}</small>
                        <p className="mb-0 fw-semibold">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div><small className="text-muted d-block">Price / Maund</small><strong className="text-success">PKR {selectedListing.pricePerMaund.toLocaleString()}</strong></div>
                <div className="text-end">
                  <small className="text-muted d-block">Created By</small>
                  <strong>{selectedListing.createdBy?.fullName || "-"}</strong>
                  <small className="d-block text-muted text-capitalize">{selectedListing.createdBy?.role || "-"}</small>
                  <small className="d-block text-muted">{selectedListing.createdBy?.email || "-"}</small>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted d-block">Created Date</small>
                <span>{new Date(selectedListing.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1">
                <small className="text-muted d-block">Listing ID</small>
                <span className="small">{selectedListing.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .section-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 1.2rem;
          background: linear-gradient(135deg, #e4f1eb 0%, #d3ece1 100%);
          color: #1b4332;
          flex-shrink: 0;
        }
        .listing-list { display:flex; flex-direction:column; }
        .listing-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 18px; border:0; border-bottom:1px solid rgba(27,67,50,0.06);
          background:#fff; transition: all 0.2s ease; cursor: pointer;
        }
        .listing-row:last-child { border-bottom:0; }
        .listing-row:hover { background: rgba(228,241,235,0.35); }
        .listing-row-left { display:flex; align-items:center; gap:14px; min-width:0; }
        .listing-row-right { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:8px; margin-left:12px; }
        .listing-row-thumb { width:58px; height:58px; border-radius:12px; object-fit:cover; border:1px solid rgba(27,67,50,0.1); flex-shrink:0; transition: transform 0.2s ease; }
        .listing-row:hover .listing-row-thumb { transform: scale(1.04); }
        .listing-row-thumb-empty { display:grid; place-items:center; color:#7b8f84; background:#f2f7f4; }
        .image-preview-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap:8px; }
        .thumb { width:100%; height:72px; object-fit:cover; border-radius:10px; border:1px solid rgba(27,67,50,0.1); }
        .thumb-wrap { position:relative; }
        .remove-image-btn { position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; border:0; background:rgba(220,53,69,.95); color:#fff; font-weight:700; line-height:1; display:grid; place-items:center; cursor:pointer; transition: transform 0.15s ease; }
        .remove-image-btn:hover { transform: scale(1.1); }
        .modal-gallery-grid { display:grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap:8px; }
        .modal-gallery-thumb { width:100%; height:82px; object-fit:cover; border-radius:10px; border:1px solid rgba(27,67,50,0.1); }
        .category-modal-backdrop {
          position:fixed; inset:0; background:rgba(15,27,21,.4);
          backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px);
          z-index:1000; display:flex; padding:2rem 1rem; overflow-y:auto;
        }
        .category-modal { width:min(760px,100%); margin:auto; animation: modalSlideUp 0.2s ease-out; }
        .listing-detail-modal { max-height:none; }
        .detail-item { border:1px solid rgba(27,67,50,0.1); border-radius:12px; background:#f8fcfa; padding:12px 14px; }
        .detail-item small { display:block; color:#60776c; margin-bottom:4px; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; }
        .empty-main-image { border:1px dashed rgba(27,67,50,0.15); border-radius:12px; background:#f5faf7; color:#6f8379; height:180px; display:flex; align-items:center; justify-content:center; font-weight:500; }
        @keyframes modalSlideUp {
          from { opacity:0; transform:translateY(12px) scale(0.98); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
        @media (max-width:767px) {
          .listing-row { flex-direction:column; align-items:flex-start; gap:10px; }
          .listing-row-right { width:100%; justify-content:flex-start; margin-left:0; }
          .modal-gallery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </>
  );
}

export default function AdminListingsPage() {
  return <AdminShell>{(sessionUser) => <ListingsContent sessionUser={sessionUser} />}</AdminShell>;
}
