"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  subcategories: CategorySub[];
};

type CategoryChild = {
  id: string;
  name: string;
};

type CategorySub = {
  id: string;
  name: string;
  children: CategoryChild[];
};

type CategoryNode = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  subcategories: CategorySub[];
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isSavingHierarchy, setIsSavingHierarchy] = useState(false);
  const [subcategoryModalMode, setSubcategoryModalMode] = useState<"create" | "edit" | null>(null);
  const [childModalMode, setChildModalMode] = useState<"create" | "edit" | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [childName, setChildName] = useState("");
  const [createSubcategories, setCreateSubcategories] = useState<CategorySub[]>([]);
  const [editSubcategories, setEditSubcategories] = useState<CategorySub[]>([]);

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

  const openCreateCategoryModal = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCreateSubcategories([]);
    setShowCreateCategoryModal(true);
  };

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

  const categoryTree = useMemo<CategoryNode[]>(() => {
    return categories.map((category, idx) => ({
      ...category,
      id: category.id || `category-${idx}`,
      subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
    }));
  }, [categories]);

  const selectedCategory = useMemo(
    () => categoryTree.find((category) => category.id === selectedCategoryId) || categoryTree[0],
    [categoryTree, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory) return undefined;
    return (
      selectedCategory.subcategories.find((subcategory) => subcategory.id === selectedSubId) ||
      selectedCategory.subcategories[0]
    );
  }, [selectedCategory, selectedSubId]);

  useEffect(() => {
    if (categoryTree.length === 0) return;
    if (!selectedCategoryId || !categoryTree.some((category) => category.id === selectedCategoryId)) {
      const firstCategory = categoryTree[0];
      setSelectedCategoryId(firstCategory.id);
      setSelectedSubId(firstCategory.subcategories[0]?.id ?? null);
      setSelectedChildId(firstCategory.subcategories[0]?.children[0]?.id ?? null);
    }
  }, [categoryTree, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategory) return;
    if (!selectedSubId || !selectedCategory.subcategories.some((subcategory) => subcategory.id === selectedSubId)) {
      const firstSubcategory = selectedCategory.subcategories[0];
      setSelectedSubId(firstSubcategory?.id ?? null);
      setSelectedChildId(firstSubcategory?.children[0]?.id ?? null);
    }
  }, [selectedCategory, selectedSubId]);

  useEffect(() => {
    if (!selectedSubcategory) return;
    if (!selectedChildId || !selectedSubcategory.children.some((child) => child.id === selectedChildId)) {
      setSelectedChildId(selectedSubcategory.children[0]?.id ?? null);
    }
  }, [selectedSubcategory, selectedChildId]);

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
          subcategories: createSubcategories
            .filter((subcategory) => subcategory.name.trim().length > 0)
            .map((subcategory) => ({
              name: subcategory.name.trim(),
              children: subcategory.children
                .filter((child) => child.name.trim().length > 0)
                .map((child) => ({ name: child.name.trim() })),
            })),
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
      setCreateSubcategories([]);
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
    setEditSubcategories(Array.isArray(category.subcategories) ? category.subcategories : []);
    setCategoriesMessage("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
    setEditSubcategories([]);
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
          subcategories: editSubcategories
            .filter((subcategory) => subcategory.name.trim().length > 0)
            .map((subcategory) => ({
              id: subcategory.id,
              name: subcategory.name.trim(),
              children: subcategory.children
                .filter((child) => child.name.trim().length > 0)
                .map((child) => ({ id: child.id, name: child.name.trim() })),
            })),
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
    setConfirmModal({
      isOpen: true,
      title: "Delete Category",
      message: "Are you sure you want to delete this category? This action cannot be undone.",
      onConfirm: async () => {
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
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const onDeleteCategoryDirect = async (categoryId: string) => {
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

  const saveCategoryHierarchy = async (category: Category, subcategories: CategorySub[]) => {
    setIsSavingHierarchy(true);
    setCategoriesMessage("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          name: category.name,
          description: category.description,
          subcategories,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setCategoriesMessage(data.message || "Failed to update category hierarchy.");
        return;
      }

      setCategoriesMessage("Category hierarchy updated successfully.");
      await loadCategories();
    } catch {
      setCategoriesMessage("Network error while updating category hierarchy.");
    } finally {
      setIsSavingHierarchy(false);
    }
  };

  const openCreateSubcategory = () => {
    setSubcategoryName("");
    setSubcategoryModalMode("create");
  };

  const openEditSubcategory = () => {
    if (!selectedSubcategory) return;
    setSubcategoryName(selectedSubcategory.name);
    setSubcategoryModalMode("edit");
  };

  const openCreateChild = () => {
    setChildName("");
    setChildModalMode("create");
  };

  const openEditChild = () => {
    const selectedChild = selectedSubcategory?.children.find((child) => child.id === selectedChildId);
    if (!selectedChild) return;
    setChildName(selectedChild.name);
    setChildModalMode("edit");
  };

  const submitSubcategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategory) return;
    const trimmedName = subcategoryName.trim();
    if (!trimmedName) return;

    const updatedSubcategories =
      subcategoryModalMode === "edit" && selectedSubcategory
        ? selectedCategory.subcategories.map((subcategory) =>
          subcategory.id === selectedSubcategory.id ? { ...subcategory, name: trimmedName } : subcategory
        )
        : [
          ...selectedCategory.subcategories,
          {
            id: "",
            name: trimmedName,
            children: [],
          },
        ];

    await saveCategoryHierarchy(selectedCategory, updatedSubcategories);
    setSubcategoryModalMode(null);
  };

  const submitChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategory || !selectedSubcategory) return;
    const trimmedName = childName.trim();
    if (!trimmedName) return;

    const updatedSubcategories = selectedCategory.subcategories.map((subcategory) => {
      if (subcategory.id !== selectedSubcategory.id) return subcategory;
      const updatedChildren =
        childModalMode === "edit" && selectedChildId
          ? subcategory.children.map((child) =>
            child.id === selectedChildId ? { ...child, name: trimmedName } : child
          )
          : [
            ...subcategory.children,
            {
              id: "",
              name: trimmedName,
            },
          ];
      return {
        ...subcategory,
        children: updatedChildren,
      };
    });

    await saveCategoryHierarchy(selectedCategory, updatedSubcategories);
    setChildModalMode(null);
  };

  const deleteSubcategory = async () => {
    if (!selectedCategory || !selectedSubcategory) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Subcategory",
      message: "Are you sure you want to delete this subcategory and all its child categories?",
      onConfirm: async () => {
        const updatedSubcategories = selectedCategory.subcategories.filter(
          (subcategory) => subcategory.id !== selectedSubcategory.id
        );
        await saveCategoryHierarchy(selectedCategory, updatedSubcategories);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const deleteChild = async () => {
    if (!selectedCategory || !selectedSubcategory || !selectedChildId) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Child Category",
      message: "Are you sure you want to delete this child category?",
      onConfirm: async () => {
        const updatedSubcategories = selectedCategory.subcategories.map((subcategory) => {
          if (subcategory.id !== selectedSubcategory.id) return subcategory;
          return {
            ...subcategory,
            children: subcategory.children.filter((child) => child.id !== selectedChildId),
          };
        });
        await saveCategoryHierarchy(selectedCategory, updatedSubcategories);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const addCreateSubcategory = () => {
    setCreateSubcategories((prev) => [
      ...prev,
      { id: "", name: "", children: [] },
    ]);
  };

  const updateCreateSubcategoryName = (index: number, value: string) => {
    setCreateSubcategories((prev) =>
      prev.map((subcategory, idx) => (idx === index ? { ...subcategory, name: value } : subcategory))
    );
  };

  const removeCreateSubcategory = (index: number) => {
    setCreateSubcategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addCreateChild = (subIndex: number) => {
    setCreateSubcategories((prev) =>
      prev.map((subcategory, idx) =>
        idx === subIndex
          ? { ...subcategory, children: [...subcategory.children, { id: "", name: "" }] }
          : subcategory
      )
    );
  };

  const updateCreateChildName = (subIndex: number, childIndex: number, value: string) => {
    setCreateSubcategories((prev) =>
      prev.map((subcategory, idx) => {
        if (idx !== subIndex) return subcategory;
        return {
          ...subcategory,
          children: subcategory.children.map((child, cIdx) => (cIdx === childIndex ? { ...child, name: value } : child)),
        };
      })
    );
  };

  const removeCreateChild = (subIndex: number, childIndex: number) => {
    setCreateSubcategories((prev) =>
      prev.map((subcategory, idx) => {
        if (idx !== subIndex) return subcategory;
        return {
          ...subcategory,
          children: subcategory.children.filter((_, cIdx) => cIdx !== childIndex),
        };
      })
    );
  };

  const addEditSubcategory = () => {
    setEditSubcategories((prev) => [
      ...prev,
      { id: "", name: "", children: [] },
    ]);
  };

  const updateEditSubcategoryName = (index: number, value: string) => {
    setEditSubcategories((prev) =>
      prev.map((subcategory, idx) => (idx === index ? { ...subcategory, name: value } : subcategory))
    );
  };

  const removeEditSubcategory = (index: number) => {
    setEditSubcategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addEditChild = (subIndex: number) => {
    setEditSubcategories((prev) =>
      prev.map((subcategory, idx) =>
        idx === subIndex
          ? { ...subcategory, children: [...subcategory.children, { id: "", name: "" }] }
          : subcategory
      )
    );
  };

  const updateEditChildName = (subIndex: number, childIndex: number, value: string) => {
    setEditSubcategories((prev) =>
      prev.map((subcategory, idx) => {
        if (idx !== subIndex) return subcategory;
        return {
          ...subcategory,
          children: subcategory.children.map((child, cIdx) => (cIdx === childIndex ? { ...child, name: value } : child)),
        };
      })
    );
  };

  const removeEditChild = (subIndex: number, childIndex: number) => {
    setEditSubcategories((prev) =>
      prev.map((subcategory, idx) => {
        if (idx !== subIndex) return subcategory;
        return {
          ...subcategory,
          children: subcategory.children.filter((_, cIdx) => cIdx !== childIndex),
        };
      })
    );
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
            <button className="btn btn-success" onClick={openCreateCategoryModal}>
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
                    <div className="subcategory-builder">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h4 className="h6 fw-bold mb-1">Subcategories</h4>
                          <p className="text-muted small mb-0">Add subcategories and optional child categories.</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={addCreateSubcategory}
                        >
                          <i className="fa-solid fa-plus me-2"></i>Add Subcategory
                        </button>
                      </div>
                      {createSubcategories.length === 0 ? (
                        <div className="subcategory-empty">No subcategories yet.</div>
                      ) : (
                        <div className="subcategory-list">
                          {createSubcategories.map((subcategory, index) => (
                            <div className="subcategory-card" key={`create-sub-${index}`}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0">Subcategory Name</label>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeCreateSubcategory(index)}
                                >
                                  Remove
                                </button>
                              </div>
                              <input
                                className="form-control mb-3"
                                placeholder="e.g. Basmati"
                                value={subcategory.name}
                                onChange={(event) => updateCreateSubcategoryName(index, event.target.value)}
                              />
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small text-muted">Child Categories</span>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => addCreateChild(index)}
                                >
                                  <i className="fa-solid fa-plus me-2"></i>Add Child
                                </button>
                              </div>
                              {subcategory.children.length === 0 ? (
                                <div className="subcategory-empty small">No child categories yet.</div>
                              ) : (
                                <div className="subcategory-children">
                                  {subcategory.children.map((child, childIndex) => (
                                    <div className="subcategory-child-row" key={`create-child-${index}-${childIndex}`}>
                                      <input
                                        className="form-control"
                                        placeholder="e.g. Super Kernel"
                                        value={child.name}
                                        onChange={(event) =>
                                          updateCreateChildName(index, childIndex, event.target.value)
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => removeCreateChild(index, childIndex)}
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

      <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white mb-4">
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
      </section>

      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <h3 className="h5 fw-bold mb-1" style={{ color: "#1b4332" }}>Category Hierarchy</h3>
            <p className="text-muted mb-0 small">Organize categories across three levels for consistent listing taxonomy.</p>
          </div>
          <div className="hierarchy-legend">
            Category <i className="fa-solid fa-chevron-right"></i> Subcategory{" "}
            <i className="fa-solid fa-chevron-right"></i> 3rd-level Child Category
          </div>
        </div>
        <div className="hierarchy-wrapper">
          {isLoadingCategories ? (
            <div className="text-center text-muted py-4">
              <i className="fa-solid fa-spinner fa-spin me-2"></i>Loading categories...
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fa-regular fa-folder-open me-2"></i>No categories available.
            </div>
          ) : (
            <div className="hierarchy-grid">
              <div className="hierarchy-column">
                <div className="hierarchy-title">Category</div>
                <div className="hierarchy-list">
                  {categoryTree.length === 0 ? (
                    <div className="hierarchy-empty">No categories yet.</div>
                  ) : (
                    categoryTree.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        className={`hierarchy-item ${selectedCategory?.id === category.id ? "active" : ""}`}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          const firstSub = category.subcategories[0];
                          setSelectedSubId(firstSub?.id ?? null);
                          setSelectedChildId(firstSub?.children[0]?.id ?? null);
                        }}
                      >
                        <div>
                          <div className="hierarchy-item-title">{category.name}</div>
                          <div className="hierarchy-item-desc">{category.description || "No description provided."}</div>
                        </div>
                        <span className="hierarchy-badge">{category.subcategories.length} subcategories</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="hierarchy-actions mt-3">
                  <button
                    className="btn btn-outline-success btn-sm w-100 mb-2"
                    onClick={() => selectedCategory && startEditCategory(selectedCategory)}
                    disabled={!selectedCategory}
                  >
                    <i className="fa-solid fa-pen me-2"></i>Edit Category
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm w-100"
                    type="button"
                    onClick={openCreateSubcategory}
                    disabled={!selectedCategory || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-layer-group me-2"></i>Add Subcategory
                  </button>
                </div>
              </div>
              <div className="hierarchy-column">
                <div className="hierarchy-title">Subcategory</div>
                <div className="hierarchy-list">
                  {!selectedCategory || selectedCategory.subcategories.length === 0 ? (
                    <div className="hierarchy-empty">Select a category to add subcategories.</div>
                  ) : (
                    selectedCategory.subcategories.map((subcategory) => (
                      <button
                        type="button"
                        key={subcategory.id}
                        className={`hierarchy-item ${selectedSubcategory?.id === subcategory.id ? "active" : ""}`}
                        onClick={() => {
                          setSelectedSubId(subcategory.id);
                          setSelectedChildId(subcategory.children[0]?.id ?? null);
                        }}
                      >
                        <div>
                          <div className="hierarchy-item-title">{subcategory.name}</div>
                          <div className="hierarchy-item-desc">Organize child types for this subcategory.</div>
                        </div>
                        <span className="hierarchy-badge">{subcategory.children.length} child types</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="hierarchy-actions mt-3">
                  <button
                    className="btn btn-outline-primary btn-sm w-100 mb-2"
                    type="button"
                    onClick={openEditSubcategory}
                    disabled={!selectedSubcategory || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-pen-to-square me-2"></i>Edit Subcategory
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm w-100 mb-2"
                    type="button"
                    onClick={deleteSubcategory}
                    disabled={!selectedSubcategory || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-trash me-2"></i>Delete Subcategory
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm w-100"
                    type="button"
                    onClick={openCreateChild}
                    disabled={!selectedSubcategory || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-tags me-2"></i>Add Child Category
                  </button>
                </div>
              </div>
              <div className="hierarchy-column">
                <div className="hierarchy-title">3rd-level Child Category</div>
                <div className="hierarchy-list">
                  {!selectedSubcategory || selectedSubcategory.children.length === 0 ? (
                    <div className="hierarchy-empty">Select a subcategory to add child categories.</div>
                  ) : (
                    selectedSubcategory.children.map((child) => (
                      <button
                        type="button"
                        key={child.id}
                        className={`hierarchy-item ${selectedChildId === child.id ? "active" : ""}`}
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        <div>
                          <div className="hierarchy-item-title">{child.name}</div>
                          <div className="hierarchy-item-desc">Child category classification.</div>
                        </div>
                        <span className="hierarchy-badge">Ready</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="hierarchy-actions mt-3">
                  <button
                    className="btn btn-outline-secondary btn-sm w-100 mb-2"
                    type="button"
                    onClick={openEditChild}
                    disabled={!selectedChildId || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-pen me-2"></i>Edit Child Category
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm w-100"
                    type="button"
                    onClick={deleteChild}
                    disabled={!selectedChildId || isSavingHierarchy}
                  >
                    <i className="fa-solid fa-trash me-2"></i>Delete Child Category
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedCategory && selectedSubcategory && (
            <div className="hierarchy-selection">
              <div>
                <div className="hierarchy-selection-label">Selected Path</div>
                <div className="hierarchy-selection-path">
                  {selectedCategory.name} / {selectedSubcategory.name} /{" "}
                  {selectedSubcategory.children.find((child) => child.id === selectedChildId)?.name || "Select a child"}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

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
                  <div className="col-12">
                    <div className="subcategory-builder">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h4 className="h6 fw-bold mb-1">Subcategories</h4>
                          <p className="text-muted small mb-0">Update subcategories and child categories.</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={addEditSubcategory}
                        >
                          <i className="fa-solid fa-plus me-2"></i>Add Subcategory
                        </button>
                      </div>
                      {editSubcategories.length === 0 ? (
                        <div className="subcategory-empty">No subcategories yet.</div>
                      ) : (
                        <div className="subcategory-list">
                          {editSubcategories.map((subcategory, index) => (
                            <div className="subcategory-card" key={`edit-sub-${subcategory.id || index}`}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label mb-0">Subcategory Name</label>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeEditSubcategory(index)}
                                >
                                  Remove
                                </button>
                              </div>
                              <input
                                className="form-control mb-3"
                                placeholder="e.g. Basmati"
                                value={subcategory.name}
                                onChange={(event) => updateEditSubcategoryName(index, event.target.value)}
                              />
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small text-muted">Child Categories</span>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => addEditChild(index)}
                                >
                                  <i className="fa-solid fa-plus me-2"></i>Add Child
                                </button>
                              </div>
                              {subcategory.children.length === 0 ? (
                                <div className="subcategory-empty small">No child categories yet.</div>
                              ) : (
                                <div className="subcategory-children">
                                  {subcategory.children.map((child, childIndex) => (
                                    <div className="subcategory-child-row" key={`edit-child-${subcategory.id}-${childIndex}`}>
                                      <input
                                        className="form-control"
                                        placeholder="e.g. Super Kernel"
                                        value={child.name}
                                        onChange={(event) =>
                                          updateEditChildName(index, childIndex, event.target.value)
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => removeEditChild(index, childIndex)}
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

      {subcategoryModalMode && selectedCategory && (
        <div className="category-modal-backdrop" onClick={() => setSubcategoryModalMode(null)}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-layer-group" style={{ color: "#2a5d49" }}></i>
                  <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>
                    {subcategoryModalMode === "create" ? "Add Subcategory" : "Edit Subcategory"}
                  </h3>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSubcategoryModalMode(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p className="text-muted small mb-3">Parent category: <strong>{selectedCategory.name}</strong></p>
              <form onSubmit={submitSubcategory}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Subcategory Name</label>
                    <input
                      className="form-control"
                      required
                      value={subcategoryName}
                      onChange={(event) => setSubcategoryName(event.target.value)}
                      placeholder="e.g. Basmati"
                    />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-success" type="submit" disabled={isSavingHierarchy}>
                      {isSavingHierarchy ? "Saving..." : "Save Subcategory"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setSubcategoryModalMode(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {childModalMode && selectedCategory && selectedSubcategory && (
        <div className="category-modal-backdrop" onClick={() => setChildModalMode(null)}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-tags" style={{ color: "#2a5d49" }}></i>
                  <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>
                    {childModalMode === "create" ? "Add Child Category" : "Edit Child Category"}
                  </h3>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setChildModalMode(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p className="text-muted small mb-3">
                Parent category: <strong>{selectedCategory.name}</strong> • Subcategory: <strong>{selectedSubcategory.name}</strong>
              </p>
              <form onSubmit={submitChild}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Child Category Name</label>
                    <input
                      className="form-control"
                      required
                      value={childName}
                      onChange={(event) => setChildName(event.target.value)}
                      placeholder="e.g. Super Kernel"
                    />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-success" type="submit" disabled={isSavingHierarchy}>
                      {isSavingHierarchy ? "Saving..." : "Save Child Category"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setChildModalMode(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
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

        .subcategory-builder {
          border: 1px solid #e5efe9;
          border-radius: 14px;
          padding: 16px;
          background: #f9fcfb;
        }

        .subcategory-empty {
          border: 1px dashed #d8e5de;
          border-radius: 12px;
          padding: 12px;
          color: #7a8f86;
          text-align: center;
          background: #ffffff;
        }

        .subcategory-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .subcategory-card {
          border: 1px solid #e2eee8;
          border-radius: 12px;
          padding: 12px;
          background: #ffffff;
        }

        .subcategory-children {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .subcategory-child-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .hierarchy-wrapper {
          background: linear-gradient(180deg, rgba(27, 67, 50, 0.06), rgba(255, 255, 255, 0.95));
          border: 1px solid #e1eee7;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 12px 32px rgba(27, 67, 50, 0.08);
        }

        .hierarchy-legend {
          font-size: 0.85rem;
          color: #527365;
          background: #f3f7f5;
          border-radius: 999px;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e0ebe5;
          font-weight: 600;
        }

        .hierarchy-wrapper {
          background: linear-gradient(180deg, rgba(27, 67, 50, 0.06), rgba(255, 255, 255, 0.95));
          border: 1px solid #e1eee7;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 12px 32px rgba(27, 67, 50, 0.08);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .hierarchy-legend {
          font-size: 0.85rem;
          color: #527365;
          background: #f3f7f5;
          border-radius: 999px;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e0ebe5;
          font-weight: 600;
        }

        .hierarchy-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(300px, 1fr));
          min-width: 950px;
        }

        .hierarchy-column {
          background: #ffffff;
          border: 1px solid #e2eee8;
          border-radius: 14px;
          padding: 14px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hierarchy-title {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
          font-weight: 700;
          color: #2d6a4f;
        }

        .hierarchy-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          overflow-y: auto;
          max-height: 350px;
          padding-right: 4px;
        }

        .hierarchy-list::-webkit-scrollbar {
          width: 4px;
        }

        .hierarchy-list::-webkit-scrollbar-track {
          background: #f1f6f4;
        }

        .hierarchy-list::-webkit-scrollbar-thumb {
          background: #2d6a4f;
          border-radius: 10px;
        }

        .hierarchy-actions {
          background: #f8fbf9;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e2eee8;
        }

        .hierarchy-item {
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 12px 14px;
          background: #f8fbf9;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .hierarchy-item:hover {
          transform: translateY(-2px);
          border-color: #d4e6dd;
          box-shadow: 0 8px 18px rgba(27, 67, 50, 0.12);
        }

        .hierarchy-item.active {
          background: #eaf5ef;
          border-color: #2d6a4f;
          box-shadow: 0 10px 20px rgba(27, 67, 50, 0.18);
        }

        .hierarchy-item-title {
          font-weight: 700;
          color: #1d3f30;
          word-break: break-word;
        }

        .hierarchy-item-desc {
          font-size: 0.78rem;
          color: #6d8077;
          word-break: break-word;
        }

        .hierarchy-badge {
          font-size: 0.72rem;
          color: #6d8077;
          background: #f1f6f4;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #e3ede7;
          font-weight: 600;
          white-space: nowrap;
        }

        .hierarchy-empty {
          font-size: 0.85rem;
          color: #7a8f86;
          background: #f6faf8;
          border: 1px dashed #d8e5de;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }

        .hierarchy-selection {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px dashed #d7e6dd;
        }

        .hierarchy-selection-label {
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2d6a4f;
          font-weight: 700;
        }

        .hierarchy-selection-path {
          background: #1b4332;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.85rem;
          word-break: break-all;
        }

        @media (max-width: 991px) {
          .category-modal {
            width: 95%;
            margin: 10px auto;
          }
          .hierarchy-grid {
            grid-template-columns: repeat(3, minmax(280px, 1fr));
            min-width: 860px;
          }
          .hierarchy-column {
            min-height: 400px;
          }
          .hierarchy-selection {
            flex-direction: column;
            align-items: flex-start;
          }
          .hierarchy-selection-path {
            margin-bottom: 10px;
          }
        }

        @media (max-width: 576px) {
          .card.p-4 {
            padding: 1.25rem !important;
          }
          .section-icon-bg {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
          .h4 { font-size: 1.25rem; }
          .btn { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
          .hierarchy-item { padding: 10px; }
          .hierarchy-badge { font-size: 0.65rem; }
          .subcategory-child-row {
            grid-template-columns: 1fr;
          }
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
