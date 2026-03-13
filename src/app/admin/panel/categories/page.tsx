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
  description: string;
  createdAt: string;
};

function CategoriesContent({ sessionUser }: { sessionUser: SessionUser }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesMessage, setCategoriesMessage] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoriesMessage("");

    try {
      const response = await fetch("/api/categories");
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        categories?: Category[];
      };

      if (!response.ok || !data.ok) {
        setCategories([]);
        setCategoriesMessage(data.message || "Failed to load categories.");
        return;
      }

      setCategories(data.categories || []);
    } catch {
      setCategories([]);
      setCategoriesMessage("Network error while loading categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const onCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingCategory(true);
    setCategoriesMessage("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          name: categoryName,
          description: categoryDescription,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setCategoriesMessage(data.message || "Failed to create category.");
        return;
      }

      setCategoryName("");
      setCategoryDescription("");
      setCategoriesMessage("Category created successfully.");
      await loadCategories();
    } catch {
      setCategoriesMessage("Network error while creating category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || "");
    setCategoriesMessage("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
  };

  const onUpdateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategoryId) return;

    setIsUpdatingCategory(true);
    setCategoriesMessage("");

    try {
      const response = await fetch(`/api/categories/${editingCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          name: editCategoryName,
          description: editCategoryDescription,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setCategoriesMessage(data.message || "Failed to update category.");
        return;
      }

      setCategoriesMessage("Category updated successfully.");
      cancelEditCategory();
      await loadCategories();
    } catch {
      setCategoriesMessage("Network error while updating category.");
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const onDeleteCategory = async (categoryId: string) => {
    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) return;

    setIsDeletingCategoryId(categoryId);
    setCategoriesMessage("");

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setCategoriesMessage(data.message || "Failed to delete category.");
        return;
      }

      setCategoriesMessage("Category deleted successfully.");
      if (editingCategoryId === categoryId) cancelEditCategory();
      await loadCategories();
    } catch {
      setCategoriesMessage("Network error while deleting category.");
    } finally {
      setIsDeletingCategoryId(null);
    }
  };

  return (
    <>
      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="section-icon-bg">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h2 className="h4 fw-bold mb-0" style={{ color: "#1b4332" }}>Categories Management</h2>
              <p className="text-muted mb-0 small">Create, update, and delete listing categories.</p>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={() => setShowCreateCategoryModal(true)}>
              <i className="fa-solid fa-plus me-2"></i>Create Category
            </button>
            <button className="btn btn-outline-success" onClick={() => void loadCategories()}>
              <i className="fa-solid fa-rotate-right me-2"></i>Refresh
            </button>
          </div>
        </div>
      </section>

      {showCreateCategoryModal && (
        <div className="category-modal-backdrop" onClick={() => setShowCreateCategoryModal(false)}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-plus-circle" style={{ color: "#2a5d49" }}></i>
                  <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Create Category</h3>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateCategoryModal(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={onCreateCategory}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">Category Name</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Oil Seeds"
                      required
                      value={categoryName}
                      onChange={(event) => setCategoryName(event.target.value)}
                    />
                  </div>
                  <div className="col-md-7">
                    <label className="form-label">Description</label>
                    <input
                      className="form-control"
                      placeholder="Optional short description"
                      value={categoryDescription}
                      onChange={(event) => setCategoryDescription(event.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-success px-4" type="submit" disabled={isCreatingCategory}>
                      <i className="fa-solid fa-plus me-2"></i>
                      {isCreatingCategory ? "Creating..." : "Create Category"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {categoriesMessage && <div className="alert alert-info py-2 rounded-3">{categoriesMessage}</div>}

      <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCategories ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2"></i>Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted">
                    <i className="fa-regular fa-folder-open me-2"></i>No categories available.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td className="fw-semibold">{category.name}</td>
                    <td>{category.description || "-"}</td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => startEditCategory(category)}>
                          <i className="fa-solid fa-pen me-1"></i>Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => onDeleteCategory(category.id)}
                          disabled={isDeletingCategoryId === category.id}
                        >
                          {isDeletingCategoryId === category.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section >

      {editingCategoryId && (
        <div className="category-modal-backdrop" onClick={cancelEditCategory}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-pen-to-square" style={{ color: "#2a5d49" }}></i>
                  <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Edit Category</h3>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEditCategory}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <form onSubmit={onUpdateCategory}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">Category Name</label>
                    <input
                      className="form-control"
                      required
                      value={editCategoryName}
                      onChange={(event) => setEditCategoryName(event.target.value)}
                    />
                  </div>
                  <div className="col-md-7">
                    <label className="form-label">Description</label>
                    <input
                      className="form-control"
                      value={editCategoryDescription}
                      onChange={(event) => setEditCategoryDescription(event.target.value)}
                    />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-primary" type="submit" disabled={isUpdatingCategory}>
                      {isUpdatingCategory ? "Saving..." : "Update Category"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEditCategory}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div >
      )
      }

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

        .category-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 27, 21, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          padding: 2rem 1rem;
          overflow-y: auto;
        }

        .category-modal {
          width: min(760px, 100%);
          margin: auto;
          animation: modalSlideUp 0.2s ease-out;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default function AdminCategoriesPage() {
  return <AdminShell>{(sessionUser) => <CategoriesContent sessionUser={sessionUser} />}</AdminShell>;
}
