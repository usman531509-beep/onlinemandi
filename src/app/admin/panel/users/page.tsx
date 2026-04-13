"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/panel/AdminShell";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
};

type ListedUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "buyer" | "seller";
  assignedCategoryIds: string[];
  verificationStatus: "unsubmitted" | "pending" | "verified" | "rejected";
  sellerProfile: {
    businessName: string;
    cnicNumber: string;
    registeredMobileNumber: string;
    address: string;
    city: string;
    notes: string;
    submittedAt: string | null;
    documents: { name: string; fileUrl: string; uploadedAt: string }[];
  } | null;
  isActive: boolean;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

function UsersContent({ sessionUser }: { sessionUser: SessionUser }) {
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState<ListedUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningSeller, setAssigningSeller] = useState<ListedUser | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [assignModalMessage, setAssignModalMessage] = useState("");
  const [selectedSellerProfile, setSelectedSellerProfile] = useState<ListedUser | null>(null);
  const [profileModalMessage, setProfileModalMessage] = useState("");
  const [isUpdatingVerification, setIsUpdatingVerification] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    businessName: "",
    cnicNumber: "",
    registeredMobileNumber: "",
    city: "",
    address: "",
    notes: "",
  });
  const [deletingUser, setDeletingUser] = useState<ListedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterVerificationStatus, setFilterVerificationStatus] = useState("all");
  const [togglingUser, setTogglingUser] = useState<ListedUser | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "buyer" as "admin" | "buyer" | "seller",
    assignedCategoryIds: [] as string[],
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users?role=${sessionUser.role}&userId=${sessionUser.id}`);
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        users?: ListedUser[];
      };

      if (!response.ok || !data.ok) {
        setUsers([]);
        setMessage(data.message || "Failed to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setUsers([]);
      setMessage("Network error while loading users.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionUser.id, sessionUser.role]);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(`/api/categories?role=${sessionUser.role}&userId=${sessionUser.id}`);
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        categories?: Category[];
      };
      if (!response.ok || !data.ok) {
        setCategories([]);
        return;
      }
      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [sessionUser.id, sessionUser.role]);

  useEffect(() => {
    void Promise.all([loadUsers(), loadCategories()]);
  }, [loadCategories, loadUsers]);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const onCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          fullName: createForm.fullName,
          email: createForm.email,
          phoneNumber: createForm.phoneNumber,
          password: createForm.password,
          newUserRole: createForm.role,
          assignedCategoryIds: createForm.role === "seller" ? createForm.assignedCategoryIds : [],
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to create user.");
        return;
      }

      setCreateForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "buyer",
        assignedCategoryIds: [],
      });
      setMessage("User created successfully.");
      await loadUsers();
    } catch {
      setMessage("Network error while creating user.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditUserModal = (user: ListedUser) => {
    setSelectedEditUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      password: "",
    });
    setMessage("");
  };

  const closeEditUserModal = () => {
    setSelectedEditUser(null);
  };

  const onUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEditUser) return;
    setIsEditingUser(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users/${selectedEditUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          fullName: editForm.fullName,
          email: editForm.email,
          phoneNumber: editForm.phoneNumber,
          password: editForm.password || undefined,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to update user.");
        return;
      }

      setMessage("User updated successfully.");
      closeEditUserModal();
      await loadUsers();
    } catch {
      setMessage("Network error while updating user.");
    } finally {
      setIsEditingUser(false);
    }
  };

  const openAssignModal = (seller: ListedUser) => {
    setAssigningSeller(seller);
    setSelectedCategoryIds(seller.assignedCategoryIds || []);
    setAssignModalMessage("");
    setMessage("");
  };

  const closeAssignModal = () => {
    setAssigningSeller(null);
    setSelectedCategoryIds([]);
    setAssignModalMessage("");
  };

  const toggleAssignedCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const saveAssignedCategories = async () => {
    if (!assigningSeller) return;
    setIsAssigning(true);
    setMessage("");
    setAssignModalMessage("");

    try {
      const response = await fetch(`/api/users/${assigningSeller.id}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          categoryIds: selectedCategoryIds,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setAssignModalMessage(data.message || "Failed to update seller categories.");
        return;
      }

      setMessage("Seller categories updated successfully.");
      closeAssignModal();
      await loadUsers();
    } catch {
      setAssignModalMessage("Network error while updating seller categories.");
    } finally {
      setIsAssigning(false);
    }
  };

  const openSellerProfileModal = (seller: ListedUser) => {
    setSelectedSellerProfile(seller);
    setProfileModalMessage("");
  };

  const closeSellerProfileModal = () => {
    setSelectedSellerProfile(null);
    setProfileModalMessage("");
    setIsEditingProfile(false);
  };

  const startEditingProfile = () => {
    if (!selectedSellerProfile) return;
    setEditProfileForm({
      businessName: selectedSellerProfile.sellerProfile?.businessName || "",
      cnicNumber: selectedSellerProfile.sellerProfile?.cnicNumber || "",
      registeredMobileNumber: selectedSellerProfile.sellerProfile?.registeredMobileNumber || "",
      city: selectedSellerProfile.sellerProfile?.city || "",
      address: selectedSellerProfile.sellerProfile?.address || "",
      notes: selectedSellerProfile.sellerProfile?.notes || "",
    });
    setIsEditingProfile(true);
    setProfileModalMessage("");
  };

  const saveEditedProfile = async () => {
    if (!selectedSellerProfile) return;
    setIsSavingProfile(true);
    setProfileModalMessage("");

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          targetUserId: selectedSellerProfile.id,
          businessName: editProfileForm.businessName,
          cnicNumber: editProfileForm.cnicNumber,
          registeredMobileNumber: editProfileForm.registeredMobileNumber,
          city: editProfileForm.city,
          address: editProfileForm.address,
          notes: editProfileForm.notes,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setProfileModalMessage(data.message || "Failed to save profile.");
        return;
      }

      setProfileModalMessage("Profile updated successfully.");
      setIsEditingProfile(false);
      await loadUsers();
      setSelectedSellerProfile((prev) =>
        prev
          ? {
              ...prev,
              sellerProfile: prev.sellerProfile
                ? {
                    ...prev.sellerProfile,
                    businessName: editProfileForm.businessName,
                    cnicNumber: editProfileForm.cnicNumber,
                    registeredMobileNumber: editProfileForm.registeredMobileNumber,
                    city: editProfileForm.city,
                    address: editProfileForm.address,
                    notes: editProfileForm.notes,
                  }
                : {
                    businessName: editProfileForm.businessName,
                    cnicNumber: editProfileForm.cnicNumber,
                    registeredMobileNumber: editProfileForm.registeredMobileNumber,
                    city: editProfileForm.city,
                    address: editProfileForm.address,
                    notes: editProfileForm.notes,
                    submittedAt: null,
                    documents: [],
                  },
            }
          : prev
      );
    } catch {
      setProfileModalMessage("Network error while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updateSellerVerificationStatus = async (
    seller: ListedUser,
    status: "unsubmitted" | "pending" | "verified" | "rejected"
  ) => {
    setIsUpdatingVerification(true);
    setProfileModalMessage("");

    try {
      const response = await fetch(`/api/users/${seller.id}/verification`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          status,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        status?: "unsubmitted" | "pending" | "verified" | "rejected";
      };
      if (!response.ok || !data.ok) {
        setProfileModalMessage(data.message || "Failed to update verification status.");
        return;
      }

      setProfileModalMessage("Verification status updated.");
      await loadUsers();
      setSelectedSellerProfile((prev) => (prev ? { ...prev, verificationStatus: data.status || status } : prev));
    } catch {
      setProfileModalMessage("Network error while updating verification status.");
    } finally {
      setIsUpdatingVerification(false);
    }
  };

  const openDeleteUserModal = (user: ListedUser) => {
    setDeletingUser(user);
    setMessage("");
  };

  const closeDeleteUserModal = () => {
    setDeletingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/users?userId=${sessionUser.id}&targetUserId=${deletingUser.id}`,
        { method: "DELETE" }
      );
      const data = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to delete user.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      closeDeleteUserModal();
    } catch {
      setMessage("Network error while deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!togglingUser) return;
    setIsToggling(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users/${togglingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          isActive: !togglingUser.isActive,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || "Failed to update user status.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === togglingUser.id ? { ...u, isActive: !togglingUser.isActive } : u))
      );
      setTogglingUser(null);
      setMessage(`User ${!togglingUser.isActive ? "enabled" : "disabled"} successfully.`);
    } catch {
      setMessage("Network error while updating user status.");
    } finally {
      setIsToggling(false);
    }
  };

  const totals = useMemo(
    () => ({
      all: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      sellers: users.filter((user) => user.role === "seller").length,
      buyers: users.filter((user) => user.role === "buyer").length,
    }),
    [users]
  );

  const verificationBadgeClass = (status: ListedUser["verificationStatus"]) => {
    if (status === "verified") return "text-bg-success";
    if (status === "rejected") return "text-bg-danger";
    if (status === "pending") return "text-bg-warning";
    return "text-bg-secondary";
  };

  const statCounters = [
    { label: "Total", value: totals.all, icon: "fa-users", bg: "linear-gradient(135deg, #e7f9ef 0%, #d8f0e3 100%)" },
    { label: "Admins", value: totals.admins, icon: "fa-user-shield", bg: "linear-gradient(135deg, #edf4ff 0%, #e0edff 100%)" },
    { label: "Sellers", value: totals.sellers, icon: "fa-store", bg: "linear-gradient(135deg, #fff8e6 0%, #ffefcc 100%)" },
    { label: "Buyers", value: totals.buyers, icon: "fa-cart-shopping", bg: "linear-gradient(135deg, #eef2f6 0%, #e4e9ef 100%)" },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filterRole !== "all" && user.role !== filterRole) return false;
      if (filterVerificationStatus !== "all" && user.role === "seller" && user.verificationStatus !== filterVerificationStatus) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.fullName?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesPhone = user.phoneNumber?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [users, searchQuery, filterRole, filterVerificationStatus]);

  return (
    <>
      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div className="d-flex align-items-center gap-3">
            <div className="section-icon-bg">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <h1 className="h4 fw-bold mb-0" style={{ color: "#1b4332" }}>All Users</h1>
              <p className="text-muted mb-0 small">View users, assign seller categories, and verify seller identity profiles.</p>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-success" onClick={() => setShowCreateUserModal(true)}>
              <i className="fa-solid fa-plus me-2"></i>Create User
            </button>
            <button className="btn btn-outline-success" onClick={() => void Promise.all([loadUsers(), loadCategories()])}>
              <i className="fa-solid fa-rotate-right me-2"></i>Refresh
            </button>
          </div>
        </div>
      </section>

      {showCreateUserModal && (
        <div className="modal-backdrop-modern">
          <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center p-3">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={() => setShowCreateUserModal(false)}
            ></div>
            <div className="modal-card-modern card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: 800 }}>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-user-plus" style={{ color: "#2a5d49" }}></i>
                    <h2 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Create User</h2>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateUserModal(false)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <form onSubmit={(e) => { void onCreateUser(e); }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-control"
                        required
                        value={createForm.fullName}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={createForm.email}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-control"
                        required
                        value={createForm.phoneNumber}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        minLength={6}
                        required
                        value={createForm.password}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select text-capitalize"
                        value={createForm.role}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            role: event.target.value as "admin" | "buyer" | "seller",
                            assignedCategoryIds: event.target.value === "seller" ? prev.assignedCategoryIds : [],
                          }))
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                      </select>
                    </div>

                    {createForm.role === "seller" && (
                      <div className="col-12">
                        <label className="form-label">Assign Categories to Seller</label>
                        <div className="d-flex flex-wrap gap-2">
                          {isLoadingCategories ? (
                            <span className="text-muted small">Loading categories...</span>
                          ) : categories.length === 0 ? (
                            <span className="text-muted small">No categories available.</span>
                          ) : (
                            categories.map((category) => (
                              <label
                                key={category.id}
                                className="badge text-bg-light border px-3 py-2 user-select-none"
                                style={{ cursor: "pointer" }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input me-2"
                                  checked={createForm.assignedCategoryIds.includes(category.id)}
                                  onChange={() =>
                                    setCreateForm((prev) => ({
                                      ...prev,
                                      assignedCategoryIds: prev.assignedCategoryIds.includes(category.id)
                                        ? prev.assignedCategoryIds.filter((id) => id !== category.id)
                                        : [...prev.assignedCategoryIds, category.id],
                                    }))
                                  }
                                />
                                {category.name}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <button className="btn btn-success px-4" type="submit" disabled={isCreating}>
                        <i className="fa-solid fa-plus me-2"></i>
                        {isCreating ? "Creating..." : "Create User"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEditUser && (
        <div className="modal-backdrop-modern">
          <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center p-3">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={closeEditUserModal}
            ></div>
            <div className="modal-card-modern card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: 800 }}>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-pen-to-square" style={{ color: "#2a5d49" }}></i>
                    <h2 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Edit User</h2>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeEditUserModal}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <form onSubmit={(e) => { void onUpdateUser(e); }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-control"
                        required
                        value={editForm.fullName}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={editForm.email}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-control"
                        required
                        value={editForm.phoneNumber}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">New Password</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Leave blank to keep current"
                        minLength={6}
                        value={editForm.password}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, password: event.target.value }))}
                      />
                    </div>
                    <div className="col-12 mt-4">
                      <button className="btn btn-success px-4" type="submit" disabled={isEditingUser}>
                        <i className="fa-solid fa-floppy-disk me-2"></i>
                        {isEditingUser ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        {statCounters.map((counter) => (
          <div className="col-6 col-xl-3" key={counter.label}>
            <div className="card border-0 shadow-sm rounded-4 h-100 stat-counter-card" style={{ background: counter.bg }}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className="stat-counter-icon">
                  <i className={`fa-solid ${counter.icon}`}></i>
                </div>
                <div>
                  <p className="small text-uppercase mb-0" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", opacity: 0.65, fontWeight: 700 }}>{counter.label}</p>
                  <h3 className="fw-bold mb-0">{counter.value}</h3>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {message && <div className="alert alert-info py-2 rounded-3">{message}</div>}

      <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0"><i className="fa-solid fa-search text-muted"></i></span>
              <input type="text" className="form-control border-start-0 ps-0" placeholder="Search by name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterVerificationStatus} onChange={(e) => setFilterVerificationStatus(e.target.value)} disabled={filterRole !== "all" && filterRole !== "seller"}>
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="unsubmitted">Unsubmitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>User Info</th>
                <th className="d-none d-lg-table-cell">Email</th>
                <th className="d-none d-md-table-cell">Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th className="d-none d-sm-table-cell">Verification</th>
                <th className="d-none d-xl-table-cell">Assigned Categories</th>
                <th className="d-none d-lg-table-cell">Registered</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    <i className="fa-solid fa-spinner fa-spin me-2"></i>Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    <i className="fa-regular fa-folder-open me-2"></i>No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="fw-bold text-brand-dark">{user.fullName}</div>
                      <div className="d-lg-none small text-muted">{user.email}</div>
                      <div className="d-md-none small text-muted">{user.phoneNumber}</div>
                    </td>
                    <td className="d-none d-lg-table-cell">{user.email}</td>
                    <td className="d-none d-md-table-cell">{user.phoneNumber}</td>
                    <td>
                      <span className="badge text-bg-light border text-capitalize">{user.role}</span>
                    </td>
                    <td>
                      <div className="form-check form-switch p-0 m-0 d-flex justify-content-center">
                        <input
                          className="form-check-input ms-0"
                          type="checkbox"
                          role="switch"
                          checked={user.isActive}
                          onChange={() => setTogglingUser(user)}
                          style={{ cursor: "pointer", width: "2.5em", height: "1.25em" }}
                        />
                      </div>
                    </td>
                    <td className="d-none d-sm-table-cell">
                      {user.role === "seller" ? (
                        <span className={`badge text-capitalize ${verificationBadgeClass(user.verificationStatus)}`}>
                          {user.verificationStatus}
                        </span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="d-none d-xl-table-cell">
                      {user.role !== "seller" ? (
                        <span className="text-muted">-</span>
                      ) : user.assignedCategoryIds.length ? (
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "200px" }}>
                          {user.assignedCategoryIds.slice(0, 3).map((categoryId) => (
                            <span key={categoryId} className="badge text-bg-success-subtle border text-dark smaller">
                              {categoryNameById[categoryId] || "..."}
                            </span>
                          ))}
                          {user.assignedCategoryIds.length > 3 && (
                            <span className="badge text-bg-secondary-subtle border text-dark smaller">+{user.assignedCategoryIds.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="d-none d-lg-table-cell text-muted small">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex justify-content-end gap-2 text-nowrap">
                        <button className="btn btn-sm btn-outline-primary action-btn" onClick={() => openEditUserModal(user)} title="Edit">
                          <i className="fa-solid fa-pen-to-square"></i><span className="d-none d-xl-inline ms-1">Edit</span>
                        </button>
                        {user.role === "seller" && (
                          <>
                            <button className="btn btn-sm btn-outline-success action-btn" onClick={() => openAssignModal(user)} title="Assign">
                              <i className="fa-solid fa-tags"></i><span className="d-none d-xl-inline ms-1">Assign</span>
                            </button>
                            <button className="btn btn-sm btn-outline-primary action-btn" onClick={() => openSellerProfileModal(user)} title="Profile">
                              <i className="fa-solid fa-eye"></i><span className="d-none d-xl-inline ms-1">Profile</span>
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-outline-danger action-btn" onClick={() => openDeleteUserModal(user)} title="Delete">
                          <i className="fa-solid fa-trash-can"></i><span className="d-none d-xl-inline ms-1">Delete</span>
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

      {/* Mobile Card View */}
      <section className="d-md-none mb-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card border shadow-sm rounded-4 p-3 mb-3 bg-white border-start border-4" style={{ borderLeftColor: user.role === 'admin' ? '#1b4332' : user.role === 'seller' ? '#2a5d49' : '#e4f1eb' }}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h4 className="h6 fw-bold mb-0">{user.fullName}</h4>
                <div className="small text-muted">{user.email}</div>
              </div>
              <span className="badge text-bg-light border text-capitalize">{user.role}</span>
            </div>
            
            <div className="row g-2 mb-3">
              <div className="col-6">
                <small className="text-muted d-block smaller text-uppercase fw-bold">Phone</small>
                <span className="small">{user.phoneNumber || 'N/A'}</span>
              </div>
              <div className="col-6">
                <small className="text-muted d-block smaller text-uppercase fw-bold">Status</small>
                {user.role === "seller" ? (
                  <span className={`badge smaller text-capitalize ${verificationBadgeClass(user.verificationStatus)}`}>
                    {user.verificationStatus}
                  </span>
                ) : (
                  <span className="small text-muted">N/A</span>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 border-top pt-3">
              <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openEditUserModal(user)}>
                <i className="fa-solid fa-pen-to-square me-1"></i>Edit
              </button>
              {user.role === "seller" && (
                <>
                  <button className="btn btn-sm btn-outline-success flex-fill" onClick={() => openAssignModal(user)}>
                    <i className="fa-solid fa-tags me-1"></i>Assign
                  </button>
                  <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => openSellerProfileModal(user)}>
                    <i className="fa-solid fa-eye me-1"></i>Profile
                  </button>
                </>
              )}
              <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => openDeleteUserModal(user)}>
                <i className="fa-solid fa-trash-can me-1"></i>Delete
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && !isLoading && (
          <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
            <i className="fa-regular fa-folder-open text-muted d-block fs-2 mb-2 opacity-50"></i>
            <span className="text-muted">No users found.</span>
          </div>
        )}
      </section>

      {
        assigningSeller && (
          <div className="modal-backdrop-modern">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={closeAssignModal}
            ></div>
            <div className="modal-card-modern card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: 640 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-tags" style={{ color: "#2a5d49" }}></i>
                    <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>Assign Categories</h3>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={closeAssignModal}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <p className="text-muted mb-3">
                  Seller: <span className="fw-semibold">{assigningSeller.fullName}</span>
                </p>

                {assignModalMessage && <div className="alert alert-warning py-2 rounded-3">{assignModalMessage}</div>}

                <div className="d-flex flex-wrap gap-2 mb-4">
                  {categories.length === 0 ? (
                    <span className="text-muted">No categories available.</span>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="badge text-bg-light border px-3 py-2 user-select-none"
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => toggleAssignedCategory(category.id)}
                        />
                        {category.name}
                      </label>
                    ))
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={closeAssignModal}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={saveAssignedCategories} disabled={isAssigning}>
                    <i className="fa-solid fa-check me-2"></i>
                    {isAssigning ? "Saving..." : "Save Assignments"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        selectedSellerProfile && (
          <div className="modal-backdrop-modern">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={closeSellerProfileModal}
            ></div>
            <div
              className="modal-card-modern card border-0 shadow-lg rounded-4 w-100"
              style={{ maxWidth: 900, maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-id-card" style={{ color: "#2a5d49" }}></i>
                    <h3 className="h5 fw-bold mb-0" style={{ color: "#1b4332" }}>
                      {isEditingProfile ? "Edit Seller Profile" : "Seller Verification Profile"}
                    </h3>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {!isEditingProfile && (
                      <button className="btn btn-sm btn-outline-success" onClick={startEditingProfile}>
                        <i className="fa-solid fa-pen-to-square me-1"></i>Edit
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-secondary" onClick={closeSellerProfileModal}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                      <small className="text-muted d-block mb-1">Seller</small>
                      <div className="fw-semibold">{selectedSellerProfile.fullName}</div>
                      <div className="small text-muted">{selectedSellerProfile.email}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                      <small className="text-muted d-block mb-1">Verification Status</small>
                      <span className={`badge text-capitalize ${verificationBadgeClass(selectedSellerProfile.verificationStatus)}`}>
                        {selectedSellerProfile.verificationStatus}
                      </span>
                      <div className="small text-muted mt-2">
                        Submitted:{" "}
                        {selectedSellerProfile.sellerProfile?.submittedAt
                          ? new Date(selectedSellerProfile.sellerProfile.submittedAt).toLocaleString()
                          : "Not submitted"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Business / Farm Name</label>
                    {isEditingProfile ? (
                      <input
                        className="form-control"
                        value={editProfileForm.businessName}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Business / Farm Name"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.businessName || <span className="text-muted">Not provided</span>}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">CNIC / Identity Number</label>
                    {isEditingProfile ? (
                      <input
                        className="form-control"
                        value={editProfileForm.cnicNumber}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, cnicNumber: e.target.value }))}
                        placeholder="CNIC Number"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.cnicNumber || <span className="text-muted">Not provided</span>}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Registered Mobile Number</label>
                    {isEditingProfile ? (
                      <input
                        className="form-control"
                        value={editProfileForm.registeredMobileNumber}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, registeredMobileNumber: e.target.value }))}
                        placeholder="Mobile Number"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.registeredMobileNumber || (
                          <span className="text-muted">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">City</label>
                    {isEditingProfile ? (
                      <input
                        className="form-control"
                        value={editProfileForm.city}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.city || <span className="text-muted">Not provided</span>}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Address</label>
                    {isEditingProfile ? (
                      <input
                        className="form-control"
                        value={editProfileForm.address}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Address"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.address || <span className="text-muted">Not provided</span>}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label small text-muted mb-1">Additional Info</label>
                    {isEditingProfile ? (
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editProfileForm.notes}
                        onChange={(e) => setEditProfileForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes"
                      />
                    ) : (
                      <div className="border rounded-3 p-2 px-3">
                        {selectedSellerProfile.sellerProfile?.notes || <span className="text-muted">Not provided</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="h6 fw-semibold mb-2"><i className="fa-solid fa-paperclip me-2" style={{ color: "#2a5d49" }}></i>Uploaded Documents</h4>
                  {!selectedSellerProfile.sellerProfile?.documents?.length ? (
                    <div className="text-muted">No documents uploaded.</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-3">
                      {selectedSellerProfile.sellerProfile.documents.map((document, index) => {
                        const isImage = document.fileUrl.startsWith("data:image/") || document.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                        const isIdDoc = document.name === "CNIC Front" || document.name === "CNIC Back";

                        return isImage ? (
                          <div
                            key={`${document.fileUrl}-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedPreviewImage(document.fileUrl)}
                            className={`text-decoration-none border rounded-3 p-2 document-preview-card ${isIdDoc ? 'border-success bg-success bg-opacity-10' : ''}`}
                            style={{ width: 140, cursor: "pointer", transition: "transform 0.15s ease" }}
                          >
                            <Image
                              src={document.fileUrl}
                              alt={document.name}
                              className="rounded-2 w-100"
                              style={{ height: 90, objectFit: "cover" }}
                              width={140}
                              height={90}
                              unoptimized
                            />
                            <div className={`small text-truncate text-center mt-2 ${isIdDoc ? 'fw-bold text-success' : 'text-dark'}`} title={document.name}>
                              {document.name}
                            </div>
                          </div>
                        ) : (
                          <a
                            key={`${document.fileUrl}-${index}`}
                            href={document.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none border rounded-3 p-2 document-preview-card"
                            style={{ width: 140, display: "block", transition: "transform 0.15s ease" }}
                          >
                            <div className="d-flex align-items-center justify-content-center bg-light rounded-2 text-muted" style={{ height: 90 }}>
                              <i className="fa-solid fa-file-lines me-2"></i>PDF
                            </div>
                            <div className="small text-truncate text-center mt-2 text-dark" title={document.name}>
                              {document.name}
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedPreviewImage && (
                  <div className="position-fixed inset-0 d-flex justify-content-center align-items-center" style={{ background: "rgba(0,0,0,0.85)", zIndex: 1100, top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setSelectedPreviewImage(null)}>
                    <div className="position-relative" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
                      <button className="btn btn-dark position-absolute top-0 end-0 m-3 rounded-circle" style={{ width: 40, height: 40 }} onClick={(e) => { e.stopPropagation(); setSelectedPreviewImage(null); }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                      <Image
                        src={selectedPreviewImage}
                        alt="Document Preview"
                        className="img-fluid rounded-3"
                        style={{ objectFit: "contain", maxHeight: "85vh" }}
                        width={1200}
                        height={1200}
                        unoptimized
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}

                {profileModalMessage && <div className="alert alert-info py-2 rounded-3">{profileModalMessage}</div>}

                <div className="d-flex justify-content-end gap-2">
                  {isEditingProfile ? (
                    <>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setIsEditingProfile(false)}
                        disabled={isSavingProfile}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => void saveEditedProfile()}
                        disabled={isSavingProfile}
                      >
                        <i className="fa-solid fa-floppy-disk me-2"></i>
                        {isSavingProfile ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => void updateSellerVerificationStatus(selectedSellerProfile, "rejected")}
                        disabled={isUpdatingVerification}
                      >
                        <i className="fa-solid fa-xmark me-2"></i>Reject
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => void updateSellerVerificationStatus(selectedSellerProfile, "verified")}
                        disabled={isUpdatingVerification}
                      >
                        <i className="fa-solid fa-check me-2"></i>
                        {isUpdatingVerification ? "Updating..." : "Mark Verified"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {deletingUser && (
        <div className="modal-backdrop-modern">
          <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center p-3">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={closeDeleteUserModal}
            ></div>
            <div className="modal-card-modern card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: 450 }}>
              <div className="card-body p-4 text-center">
                <div className="mb-4">
                  <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 text-danger mb-3" style={{ width: 64, height: 64 }}>
                    <i className="fa-solid fa-triangle-exclamation fs-2"></i>
                  </div>
                  <h3 className="h5 fw-bold mb-2">Confirm Delete</h3>
                  <p className="text-muted mb-0">
                    Are you sure you want to delete <strong>{deletingUser.fullName}</strong>?
                    <br />
                    <small className="text-danger mt-2 d-inline-block">This will also delete all their listings and requirements. This action cannot be undone.</small>
                  </p>
                </div>

                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light px-4" onClick={closeDeleteUserModal} disabled={isDeleting}>
                    Cancel
                  </button>
                  <button className="btn btn-danger px-4" onClick={() => { void handleDeleteUser(); }} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {togglingUser && (
        <div className="modal-backdrop-modern">
          <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center p-3">
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              onClick={() => setTogglingUser(null)}
            ></div>
            <div className="modal-card-modern card border-0 shadow-lg rounded-4 w-100" style={{ maxWidth: 450 }}>
              <div className="card-body p-4 text-center">
                <div className="mb-4">
                  <div className={`mx-auto d-flex align-items-center justify-content-center rounded-circle mb-3 ${togglingUser.isActive ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'}`} style={{ width: 64, height: 64 }}>
                    <i className={`fa-solid ${togglingUser.isActive ? 'fa-user-slash' : 'fa-user-check'} fs-2`}></i>
                  </div>
                  <h3 className="h5 fw-bold mb-2">{togglingUser.isActive ? "Disable User?" : "Enable User?"}</h3>
                  <p className="text-muted mb-0">
                    Are you sure you want to <strong>{togglingUser.isActive ? "disable" : "enable"}</strong> account for <strong>{togglingUser.fullName}</strong>?
                    {togglingUser.isActive && (
                      <><br /><small className="text-danger mt-2 d-inline-block">They will be unable to log in until re-enabled.</small></>
                    )}
                  </p>
                </div>

                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light px-4" onClick={() => setTogglingUser(null)} disabled={isToggling}>
                    Cancel
                  </button>
                  <button className={`btn px-4 ${togglingUser.isActive ? 'btn-warning' : 'btn-success'}`} onClick={() => { void handleToggleUserStatus(); }} disabled={isToggling}>
                    {isToggling ? "Processing..." : togglingUser.isActive ? "Confirm Disable" : "Confirm Enable"}
                  </button>
                </div>
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

        .stat-counter-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(27,67,50,0.06) !important;
          overflow: hidden;
          position: relative;
        }

        .stat-counter-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(27,67,50,0.1) !important;
        }

        .stat-counter-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 1rem;
          background: rgba(27,67,50,0.08);
          color: #1b4332;
          flex-shrink: 0;
        }

        .modal-backdrop-modern {
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

        .modal-card-modern {
          position: relative;
          z-index: 2;
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

export default function AdminUsersPage() {
  return <AdminShell>{(sessionUser) => <UsersContent sessionUser={sessionUser} />}</AdminShell>;
}
