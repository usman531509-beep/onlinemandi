"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserRole = "admin" | "buyer" | "seller";

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
};

type Listing = {
  id: string;
  title: string;
  category: string;
  grade?: string;
  moisture?: string;
  delivery?: string;
  city: string;
  quantity: string;
  pricePerMaund: number;
  description: string;
  images: string[];
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  } | null;
};

type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

type SellerProfileDocument = {
  name: string;
  fileUrl: string;
  uploadedAt: string;
};

type SellerProfile = {
  businessName: string;
  cnicNumber: string;
  registeredMobileNumber: string;
  address: string;
  city: string;
  notes: string;
  submittedAt: string | null;
  documents: SellerProfileDocument[];
};

type RolePanelProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  cards: Array<{ label: string; value: string; className: string }>;
};

type BroadcastItem = {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  category: string;
  grade: string;
  requirementDetails: string;
  requiredQuantity: string;
  targetPricePerMaund: string;
  city: string;
  deliveryLocation: string;
  paymentTerms: string;
  status: string;
  createdAt: string;
};

type PaymentTransaction = {
  _id: string;
  userEmail: string;
  userName?: string;
  planId?: {
    _id: string;
    name: string;
  };
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: "completed" | "failed" | "pending";
  paymentDate: string;
};

type PanelTab = "overview" | "listings" | "profile" | "categories" | "broadcastings" | "payments";

const initialListingForm = {
  title: "",
  category: "",
  grade: "",
  moisture: "",
  delivery: "",
  city: "",
  quantityValue: "",
  quantityUnit: "ton",
  pricePerMaund: "",
  description: "",
};

const initialProfileForm = {
  businessName: "",
  cnicNumber: "",
  registeredMobileNumber: "",
  address: "",
  city: "",
  notes: "",
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
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

export default function RolePanel({ role, title, subtitle, cards }: RolePanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  const [activeTab, setActiveTab] = useState<PanelTab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsMessage, setListingsMessage] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesMessage, setCategoriesMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<string | null>(null);

  const [listingForm, setListingForm] = useState(initialListingForm);
  const [listingImages, setListingImages] = useState<string[]>([]);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialListingForm);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [profileDocs, setProfileDocs] = useState<SellerProfileDocument[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unsubmitted");

  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [isLoadingBroadcasts, setIsLoadingBroadcasts] = useState(false);
  const [broadcastsMessage, setBroadcastsMessage] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    category: "",
    grade: "",
    requirementDetails: "",
    requiredQuantity: "",
    targetPricePerMaund: "",
    city: "",
    deliveryLocation: "",
    paymentTerms: "Cash on Delivery",
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentsMessage, setPaymentsMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const [broadcastCount, setBroadcastCount] = useState(0);

  const hasAccess = sessionUser?.role === role;
  const canCreateListing = role === "admin" || role === "seller";
  const canManageCategories = role === "admin";

  const listingTitle = useMemo(() => {
    if (role === "admin") return "All Listings";
    if (role === "seller") return "My Listings";
    return "Marketplace Listings";
  }, [role]);

  useEffect(() => {
    if (role === "seller") {
      if (pathname === "/seller/panel/profile") {
        setActiveTab("profile");
        return;
      }
      if (pathname === "/seller/panel/listings") {
        setActiveTab("listings");
        return;
      }
      if (pathname === "/seller/panel/broadcastings") {
        setActiveTab("broadcastings");
        return;
      }
      if (pathname === "/seller/panel/payments") {
        setActiveTab("payments");
        return;
      }
      setActiveTab("overview");
      return;
    }
    if (role === "buyer") {
      if (pathname === "/buyer/panel/broadcastings") {
        setActiveTab("broadcastings");
        return;
      }
      if (pathname === "/buyer/panel/payments") {
        setActiveTab("payments");
        return;
      }
      setActiveTab("overview");
      return;
    }
  }, [pathname, role]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => category.name);
  }, [categories]);

  const resolveListingCategory = useCallback(
    (value: string) => {
      if (categoryOptions.includes(value)) return value;
      if (categoryOptions.length) return categoryOptions[0];
      return value;
    },
    [categoryOptions]
  );

  useEffect(() => {
    if (!categoryOptions.length) return;

    setListingForm((prev) => {
      if (categoryOptions.includes(prev.category)) return prev;
      return { ...prev, category: categoryOptions[0] };
    });

    setEditForm((prev) => {
      if (categoryOptions.includes(prev.category)) return prev;
      return { ...prev, category: categoryOptions[0] };
    });
  }, [categoryOptions]);

  useEffect(() => {
    const raw = localStorage.getItem("mandi:sessionUser");
    if (!raw) {
      setIsSessionReady(true);
      return;
    }

    try {
      setSessionUser(JSON.parse(raw) as SessionUser);
    } catch {
      localStorage.removeItem("mandi:sessionUser");
    } finally {
      setIsSessionReady(true);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoriesMessage("");

    try {
      const query =
        sessionUser && hasAccess
          ? `?role=${encodeURIComponent(sessionUser.role)}&userId=${encodeURIComponent(sessionUser.id)}`
          : "";
      const response = await fetch(`/api/categories${query}`);
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
  }, [hasAccess, sessionUser]);

  const loadListings = useCallback(async () => {
    if (!sessionUser || !hasAccess) return;

    setIsLoadingListings(true);
    setListingsMessage("");

    try {
      const response = await fetch(`/api/listings?role=${sessionUser.role}&userId=${sessionUser.id}`);
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        listings?: Listing[];
      };

      if (!response.ok || !data.ok) {
        setListings([]);
        setListingsMessage(data.message || "Failed to load listings.");
        return;
      }

      setListings(data.listings || []);
    } catch {
      setListings([]);
      setListingsMessage("Network error while loading listings.");
    } finally {
      setIsLoadingListings(false);
    }
  }, [hasAccess, sessionUser]);

  const loadSellerProfile = useCallback(async () => {
    if (!sessionUser || !hasAccess || sessionUser.role !== "seller") return;

    setIsLoadingProfile(true);
    setProfileMessage("");

    try {
      const query = `?role=${encodeURIComponent(sessionUser.role)}&userId=${encodeURIComponent(sessionUser.id)}`;
      const response = await fetch(`/api/users/profile${query}`);
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        verificationStatus?: VerificationStatus;
        profile?: SellerProfile;
      };

      if (!response.ok || !data.ok || !data.profile) {
        setProfileMessage(data.message || "Failed to load profile.");
        return;
      }

      setVerificationStatus(data.verificationStatus || "unsubmitted");
      setProfileForm({
        businessName: data.profile.businessName || "",
        cnicNumber: data.profile.cnicNumber || "",
        registeredMobileNumber: data.profile.registeredMobileNumber || "",
        address: data.profile.address || "",
        city: data.profile.city || "",
        notes: data.profile.notes || "",
      });
      setProfileDocs(data.profile.documents || []);
    } catch {
      setProfileMessage("Network error while loading profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [hasAccess, sessionUser]);

  const loadBroadcasts = useCallback(async () => {
    if (!sessionUser || !hasAccess) return;

    setIsLoadingBroadcasts(true);
    setBroadcastsMessage("");

    try {
      // Sellers see all active broadcasts; buyers see only their own
      const query = role === "buyer" ? `?userId=${encodeURIComponent(sessionUser.id)}` : "";
      const response = await fetch(`/api/broadcasts${query}`);
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        broadcasts?: BroadcastItem[];
      };

      if (!response.ok || !data.ok) {
        setBroadcasts([]);
        setBroadcastsMessage(data.message || "Failed to load broadcasts.");
        return;
      }

      setBroadcasts(data.broadcasts || []);
    } catch {
      setBroadcasts([]);
      setBroadcastsMessage("Network error while loading broadcasts.");
    } finally {
      setIsLoadingBroadcasts(false);
    }
  }, [hasAccess, sessionUser, role]);

  const loadPayments = useCallback(async () => {
    if (!sessionUser?.email) return;
    setIsLoadingPayments(true);
    setPaymentsMessage("");
    try {
      const response = await fetch(`/api/user/payments?email=${encodeURIComponent(sessionUser.email)}`);
      const data = await response.json();
      if (response.ok && data.ok) {
        setPayments(data.payments || []);
      } else {
        setPaymentsMessage("Failed to load payments.");
      }
    } catch {
      setPaymentsMessage("Network error while loading payments.");
    } finally {
      setIsLoadingPayments(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (activeTab === "listings") {
      void loadListings();
      void loadCategories();
    }

    if (activeTab === "profile" && role === "seller") {
      void loadSellerProfile();
    }

    if (activeTab === "categories" && canManageCategories) {
      void loadCategories();
    }

    if (activeTab === "broadcastings") {
      void loadBroadcasts();
      void loadCategories();
    }

    if (activeTab === "payments") {
      void loadPayments();
    }

    // Load subscription info on overview
    if (activeTab === "overview" && sessionUser?.email) {
      fetch(`/api/user/subscription?email=${encodeURIComponent(sessionUser.email)}`)
        .then(r => r.json())
        .then(data => { if (data.ok) setActiveSubscription(data.subscription); })
        .catch(() => { });
      // Also load usage counts
      fetch(`/api/listings?role=${sessionUser.role}&userId=${sessionUser.id}`)
        .then(r => r.json())
        .then(data => { if (data.ok) setListingCount(data.listings?.length || 0); })
        .catch(() => { });
      if (role === "buyer") {
        fetch(`/api/broadcasts?userId=${sessionUser.id}`)
          .then(r => r.json())
          .then(data => { if (data.ok) setBroadcastCount(data.broadcasts?.length || 0); })
          .catch(() => { });
      }
    }
  }, [activeTab, canManageCategories, loadCategories, loadListings, loadSellerProfile, loadBroadcasts, loadPayments, role, sessionUser]);

  const onCreateListingImagesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const dataUrls = await filesToDataUrls(files);
      setListingImages((prev) => [...prev, ...dataUrls].slice(0, 8));
      event.target.value = "";
    } catch {
      setListingsMessage("Could not read one or more images.");
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
      setListingsMessage("Could not read one or more images.");
    }
  };

  const removeCreateImage = (index: number) => {
    setListingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onProfileDocumentsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const dataUrls = await filesToDataUrls(files);
      const now = new Date().toISOString();
      const prepared = dataUrls.map((fileUrl, index) => ({
        name: files[index]?.name || `Document ${profileDocs.length + index + 1}`,
        fileUrl,
        uploadedAt: now,
      }));

      setProfileDocs((prev) => [...prev, ...prepared].slice(0, 10));
      event.target.value = "";
    } catch {
      setProfileMessage("Could not read one or more documents.");
    }
  };

  const removeProfileDocument = (index: number) => {
    setProfileDocs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser || sessionUser.role !== "seller") return;

    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          businessName: profileForm.businessName,
          cnicNumber: profileForm.cnicNumber,
          registeredMobileNumber: profileForm.registeredMobileNumber,
          address: profileForm.address,
          city: profileForm.city,
          notes: profileForm.notes,
          documents: profileDocs.map((doc) => ({ name: doc.name, fileUrl: doc.fileUrl })),
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        verificationStatus?: VerificationStatus;
        profile?: SellerProfile;
      };
      if (!response.ok || !data.ok) {
        setProfileMessage(data.message || "Failed to save profile.");
        return;
      }

      if (data.profile) {
        setProfileForm({
          businessName: data.profile.businessName || "",
          cnicNumber: data.profile.cnicNumber || "",
          registeredMobileNumber: data.profile.registeredMobileNumber || "",
          address: data.profile.address || "",
          city: data.profile.city || "",
          notes: data.profile.notes || "",
        });
        setProfileDocs(data.profile.documents || []);
      }
      setVerificationStatus(data.verificationStatus || "pending");
      await loadSellerProfile();
      setProfileMessage("Profile saved successfully. Sent for admin verification.");
    } catch {
      setProfileMessage("Network error while saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser) return;

    setIsCreatingListing(true);
    setListingsMessage("");

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          title: listingForm.title,
          category: listingForm.category,
          grade: listingForm.grade,
          moisture: listingForm.moisture,
          delivery: listingForm.delivery,
          city: listingForm.city,
          quantity: formatQuantity(listingForm.quantityValue, listingForm.quantityUnit),
          pricePerMaund: Number(listingForm.pricePerMaund),
          description: listingForm.description,
          images: listingImages,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setListingsMessage(data.message || "Failed to create listing.");
        return;
      }

      setListingForm((prev) => ({ ...initialListingForm, category: prev.category }));
      setListingImages([]);
      setListingsMessage("Listing created successfully.");
      await loadListings();
    } catch {
      setListingsMessage("Network error while creating listing.");
    } finally {
      setIsCreatingListing(false);
    }
  };

  const onCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser || !canManageCategories) return;

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
    if (!sessionUser || !editingCategoryId) return;

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
    if (!sessionUser) return;
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

  const canMutateListing = (listing: Listing) => {
    if (!sessionUser) return false;
    if (sessionUser.role === "admin") return true;
    return sessionUser.role === "seller" && listing.createdBy?.id === sessionUser.id;
  };

  const startEditListing = (listing: Listing) => {
    const parsedQuantity = parseQuantity(listing.quantity);
    setEditingListingId(listing.id);
    setEditForm({
      title: listing.title,
      category: resolveListingCategory(listing.category),
      grade: listing.grade || "Unspecified",
      moisture: listing.moisture || "Not specified",
      delivery: listing.delivery || "Negotiable",
      city: listing.city,
      quantityValue: parsedQuantity.quantityValue,
      quantityUnit: parsedQuantity.quantityUnit,
      pricePerMaund: String(listing.pricePerMaund),
      description: listing.description,
    });
    setEditImages(listing.images || []);
    setListingsMessage("");
  };

  const cancelEditListing = () => {
    setEditingListingId(null);
    setEditForm(initialListingForm);
    setEditImages([]);
  };

  const onUpdateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser || !editingListingId) return;

    setIsUpdatingListing(true);
    setListingsMessage("");

    try {
      const response = await fetch(`/api/listings/${editingListingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
          title: editForm.title,
          category: editForm.category,
          grade: editForm.grade,
          moisture: editForm.moisture,
          delivery: editForm.delivery,
          city: editForm.city,
          quantity: formatQuantity(editForm.quantityValue, editForm.quantityUnit),
          pricePerMaund: Number(editForm.pricePerMaund),
          description: editForm.description,
          images: editImages,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setListingsMessage(data.message || "Failed to update listing.");
        return;
      }

      setListingsMessage("Listing updated successfully.");
      cancelEditListing();
      await loadListings();
    } catch {
      setListingsMessage("Network error while updating listing.");
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const onDeleteListing = async (listingId: string) => {
    if (!sessionUser) return;
    const confirmed = window.confirm("Delete this listing? This action cannot be undone.");
    if (!confirmed) return;

    setListingsMessage("");

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUser.id,
          role: sessionUser.role,
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setListingsMessage(data.message || "Failed to delete listing.");
        return;
      }

      setListingsMessage("Listing deleted successfully.");
      await loadListings();
    } catch {
      setListingsMessage("Network error while deleting listing.");
    }
  };

  const openListingDetails = (listing: Listing) => {
    setSelectedListing({
      ...listing,
      category: resolveListingCategory(listing.category),
    });
  };

  const closeListingDetails = () => {
    setSelectedListing(null);
  };

  const navItems =
    role === "seller"
      ? [
        { id: "overview", label: "Dashboard Overview", icon: "fa-solid fa-chart-line", href: "/seller/panel" },
        { id: "profile", label: "Verification Profile", icon: "fa-solid fa-id-card", href: "/seller/panel/profile" },
        { id: "listings", label: "My Crop Listings", icon: "fa-solid fa-wheat-awn", href: "/seller/panel/listings" },
        { id: "broadcastings", label: "Buyer Broadcastings", icon: "fa-solid fa-tower-broadcast", href: "/seller/panel/broadcastings" },
        { id: "payments", label: "My Payments", icon: "fa-solid fa-file-invoice-dollar", href: "/seller/panel/payments" },
      ]
      : role === "buyer"
        ? [
          { id: "overview", label: "Buyer Dashboard", icon: "fa-solid fa-chart-line", href: "/buyer/panel" },
          { id: "broadcastings", label: "My Broadcastings", icon: "fa-solid fa-bullhorn", href: "/buyer/panel/broadcastings" },
          { id: "payments", label: "My Payments", icon: "fa-solid fa-file-invoice-dollar", href: "/buyer/panel/payments" },
        ]
        : [
          { id: "overview", label: "System Overview", icon: "fa-solid fa-server", href: "/admin/panel" },
          { id: "categories", label: "Manage Categories", icon: "fa-solid fa-layer-group", href: "/admin/panel/categories" },
        ];

  return (
    <main className="panel-page py-4 py-md-5">
      <div className="container-fluid panel-shell position-relative">
        {!isSessionReady ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white">
            <h1 className="h5 fw-bold mb-2">Loading panel...</h1>
            <p className="text-muted mb-0">Preparing your dashboard.</p>
          </div>
        ) : !sessionUser ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white">
            <h1 className="h4 fw-bold">You are not logged in</h1>
            <p className="text-muted mb-4">Please login first to access your dashboard.</p>
            <Link href="/auth" className="btn btn-success px-4">
              Go to Login
            </Link>
          </div>
        ) : !hasAccess ? (
          <div className="card border shadow-sm p-4 p-md-5 text-center rounded-4 bg-white">
            <h1 className="h4 fw-bold">Access restricted</h1>
            <p className="text-muted mb-4">This panel is for {role} users only.</p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link href="/" className="btn btn-outline-secondary">
                Back Home
              </Link>
              <Link href={`/${sessionUser.role}/panel`} className="btn btn-success">
                Go to My Panel
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4 align-items-start panel-grid dashboard-frame">
            <div className="col-12 col-xl-2 col-lg-3 dashboard-sidebar-col">
              <aside className={`panel-sidebar panel-sidebar-${role} card border rounded-4 sticky-lg-top bg-white shadow-sm`}>
                <div className="sidebar-top p-4 border-bottom">
                  <p className="small text-uppercase mb-2 sidebar-label">{role} panel</p>
                  <h3 className="h6 fw-bold mb-3">Navigation</h3>
                  <nav className="sidebar-nav" aria-label={`${role} navigation`}>
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`sidebar-btn ${pathname === item.href || activeTab === item.id ? "active" : ""}`}
                        onClick={() => {
                          if (item.href) {
                            router.push(item.href);
                          } else {
                            setActiveTab(item.id as PanelTab);
                          }
                        }}
                      >
                        <i className={item.icon}></i>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="sidebar-user p-4 border-bottom">
                  <div className="user-chip mb-3">
                    <span>{initials(sessionUser.fullName)}</span>
                  </div>
                  <p className="small text-muted mb-1">Signed in as</p>
                  <h3 className="h6 fw-bold mb-1 text-truncate">{sessionUser.fullName}</h3>
                  <p className="small text-muted mb-3 text-truncate">{sessionUser.email}</p>
                  <span className="role-pill text-capitalize">{sessionUser.role}</span>
                </div>

                <div className="p-4 pt-3 d-grid gap-2 sidebar-actions">
                  <Link href="/" className="btn btn-outline-secondary">
                    Back Home
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      localStorage.removeItem("mandi:sessionUser");
                      window.location.href = "/auth";
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>Logout
                  </button>
                </div>
              </aside>
            </div>

            <div className="col-12 col-xl-10 col-lg-9 dashboard-main-col">
              <header className="dashboard-topbar card border shadow-sm rounded-4 bg-white mb-4 px-3 px-md-4 py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="topbar-dot"></span>
                    <span className="fw-semibold text-capitalize">
                      {activeTab === "overview"
                        ? "Dashboard"
                        : activeTab === "listings"
                          ? "Listings"
                          : activeTab === "profile"
                            ? "Profile"
                            : activeTab === "broadcastings"
                              ? "Broadcastings"
                              : activeTab === "payments"
                                ? "My Payments"
                                : "Categories"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3 small text-muted">
                    <i className="fa-solid fa-rotate-right"></i>
                    <span>{sessionUser.fullName}</span>
                    <span className="fw-semibold text-capitalize">{sessionUser.role}</span>
                  </div>
                </div>
              </header>

              {activeTab === "overview" ? (
                <>
                  <section className="panel-hero rounded-4 p-4 p-md-5 mb-4 position-relative overflow-hidden">
                    <div className="hero-decoration"></div>
                    <div className="position-relative">
                      <p className="mb-2 small text-uppercase hero-subtitle">
                        <i className="fa-solid fa-gauge-high me-2"></i>OnlineMandi {role} panel
                      </p>
                      <h1 className="display-6 fw-bold mb-2">{title}</h1>
                      <p className="mb-0 hero-text">{subtitle}</p>
                    </div>
                  </section>

                  <section className="card border shadow-sm rounded-4 p-4 mb-4 section-card bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h2 className="h4 fw-bold mb-0">Account Summary</h2>
                      <span className="text-muted small">Updated just now</span>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="summary-box">
                          <small>Name</small>
                          <p className="mb-0 fw-semibold">{sessionUser.fullName}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="summary-box">
                          <small>Email</small>
                          <p className="mb-0 fw-semibold text-truncate">{sessionUser.email}</p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="summary-box">
                          <small>Role</small>
                          <p className="mb-0 text-capitalize fw-semibold">{sessionUser.role}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="row g-3">
                    {cards.map((card) => (
                      <div className="col-md-4" key={card.label}>
                        <div className={`card border-0 shadow-sm h-100 stat-card ${card.className}`}>
                          <div className="card-body">
                            <p className="small text-uppercase opacity-75 mb-2">{card.label}</p>
                            <h3 className="display-6 fw-bold mb-0">{card.value}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Current Plan Card */}
                  <section className="card border shadow-sm rounded-4 p-4 mt-4 bg-white">
                    <h2 className="h5 fw-bold mb-3">
                      <i className="fa-solid fa-crown text-warning me-2"></i>Current Plan
                    </h2>
                    {activeSubscription ? (
                      <div>
                        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fs-6">
                            <i className="fa-solid fa-circle-check me-2"></i>
                            {activeSubscription.planId?.name || "Subscribed"}
                          </span>
                          <span className="text-muted small">
                            Rs {activeSubscription.planId?.price?.toLocaleString() || "—"} / {activeSubscription.planId?.interval === "one-time" ? "lifetime" : activeSubscription.planId?.interval}
                          </span>
                          {activeSubscription.endDate && (
                            <span className="text-muted small">
                              <i className="fa-solid fa-calendar me-1"></i>Renews: {new Date(activeSubscription.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="row g-3">
                          {role === "seller" && (
                            <div className="col-md-6">
                              <div className="border rounded-3 p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small fw-semibold"><i className="fa-solid fa-list me-2 text-success"></i>Listings</span>
                                  <span className="small fw-bold">{listingCount} / {activeSubscription.planId?.listingLimit ?? 10}</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${Math.min((listingCount / (activeSubscription.planId?.listingLimit || 10)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )}
                          {role === "buyer" && (
                            <div className="col-md-6">
                              <div className="border rounded-3 p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small fw-semibold"><i className="fa-solid fa-bullhorn me-2 text-primary"></i>Broadcasts</span>
                                  <span className="small fw-bold">{broadcastCount} / {activeSubscription.planId?.broadcastLimit ?? 5}</span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div
                                    className="progress-bar bg-primary"
                                    style={{ width: `${Math.min((broadcastCount / (activeSubscription.planId?.broadcastLimit || 5)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <i className="fa-solid fa-tag fa-2x text-muted opacity-50 mb-2"></i>
                        <p className="text-muted mb-2">You are on the <strong>Free Plan</strong>.</p>
                        <p className="text-muted small mb-3">Upgrade to unlock more listings, broadcasts, and premium features.</p>
                        <a href="/#pricing-section" className="btn btn-success btn-sm px-4 fw-bold">
                          <i className="fa-solid fa-arrow-up-right-from-square me-2"></i>View Plans
                        </a>
                      </div>
                    )}
                  </section>
                </>
              ) : activeTab === "listings" ? (
                <>
                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                      <div>
                        <h2 className="h4 fw-bold mb-1">{listingTitle}</h2>
                        <p className="text-muted mb-0">
                          {role === "admin"
                            ? "Create listings and monitor all sellers in one place."
                            : role === "seller"
                              ? "Create and track your own crop listings."
                              : "Browse marketplace listings posted by sellers and admins."}
                        </p>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {canCreateListing && (
                          <button className="btn btn-success" onClick={() => {
                            if (activeSubscription) {
                              setShowCreateListingModal(true);
                            } else {
                              setShowUpgradeModal(true);
                            }
                          }}>
                            <i className="fa-solid fa-plus me-2"></i>Create Listing
                          </button>
                        )}
                        <button className="btn btn-outline-success" onClick={() => void loadListings()}>
                          <i className="fa-solid fa-rotate-right me-2"></i>Refresh
                        </button>
                      </div>
                    </div>
                  </section>

                  {canCreateListing && showCreateListingModal && (
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
                              <div className="col-md-6">
                                <label className="form-label">Title</label>
                                <input
                                  className="form-control"
                                  required
                                  placeholder="e.g. 200 Tons Basmati Rice"
                                  value={listingForm.title}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, title: event.target.value }))}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">Category</label>
                                <select
                                  className="form-select"
                                  value={listingForm.category}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, category: event.target.value }))}
                                  disabled={!categoryOptions.length}
                                >
                                  {categoryOptions.length ? (
                                    categoryOptions.map((option) => <option key={option}>{option}</option>)
                                  ) : (
                                    <option value="">No categories available</option>
                                  )}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Grade</label>
                                <input
                                  className="form-control"
                                  value={listingForm.grade}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, grade: event.target.value }))}
                                  placeholder=""
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Moisture</label>
                                <input
                                  className="form-control"
                                  value={listingForm.moisture}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, moisture: event.target.value }))}
                                  placeholder=""
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Delivery</label>
                                <input
                                  className="form-control"
                                  value={listingForm.delivery}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, delivery: event.target.value }))}
                                  placeholder=""
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">City</label>
                                <input
                                  className="form-control"
                                  required
                                  value={listingForm.city}
                                  onChange={(event) => setListingForm((prev) => ({ ...prev, city: event.target.value }))}
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Quantity</label>
                                <div className="input-group">
                                  <input
                                    className="form-control"
                                    type="number"
                                    min="0"
                                    step="any"
                                    required
                                    placeholder="e.g. 120"
                                    value={listingForm.quantityValue}
                                    onChange={(event) =>
                                      setListingForm((prev) => ({ ...prev, quantityValue: event.target.value }))
                                    }
                                  />
                                  <select
                                    className="form-select"
                                    style={{ maxWidth: 120 }}
                                    value={listingForm.quantityUnit}
                                    onChange={(event) =>
                                      setListingForm((prev) => ({
                                        ...prev,
                                        quantityUnit: event.target.value as QuantityUnit,
                                      }))
                                    }
                                  >
                                    <option value="ton">ton</option>
                                    <option value="maund">maund</option>
                                    <option value="kg">kg</option>
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label">Price / Maund</label>
                                <input
                                  className="form-control"
                                  type="number"
                                  required
                                  value={listingForm.pricePerMaund}
                                  onChange={(event) =>
                                    setListingForm((prev) => ({ ...prev, pricePerMaund: event.target.value }))
                                  }
                                />
                              </div>
                              <div className="col-12">
                                <label className="form-label">Description</label>
                                <textarea
                                  className="form-control"
                                  rows={3}
                                  value={listingForm.description}
                                  onChange={(event) =>
                                    setListingForm((prev) => ({ ...prev, description: event.target.value }))
                                  }
                                ></textarea>
                              </div>
                              <div className="col-12">
                                <label className="form-label">Upload Images (multiple)</label>
                                <input
                                  type="file"
                                  className="form-control"
                                  multiple
                                  accept="image/*"
                                  onChange={onCreateListingImagesChange}
                                />
                                {listingImages.length > 0 && (
                                  <div className="image-preview-grid mt-3">
                                    {listingImages.map((image, index) => (
                                      <div className="thumb-wrap" key={`${image}-${index}`}>
                                        <Image
                                          src={image}
                                          alt={`Preview ${index + 1}`}
                                          className="thumb"
                                          width={120}
                                          height={72}
                                          unoptimized
                                        />
                                        <button
                                          type="button"
                                          className="remove-image-btn"
                                          onClick={() => removeCreateImage(index)}
                                          aria-label="Remove image"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="col-12">
                                <button className="btn btn-success px-4" type="submit" disabled={isCreatingListing}>
                                  {isCreatingListing ? "Creating..." : "Create Listing"}
                                </button>
                              </div>
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
                        <button className="btn btn-sm btn-outline-secondary" onClick={cancelEditListing}>
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={onUpdateListing}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Title</label>
                            <input
                              className="form-control"
                              required
                              value={editForm.title}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Category</label>
                            <select
                              className="form-select"
                              value={editForm.category}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))}
                              disabled={!categoryOptions.length}
                            >
                              {categoryOptions.length ? (
                                categoryOptions.map((option) => <option key={option}>{option}</option>)
                              ) : (
                                <option value="">No categories available</option>
                              )}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Grade</label>
                            <input
                              className="form-control"
                              value={editForm.grade}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, grade: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Moisture</label>
                            <input
                              className="form-control"
                              value={editForm.moisture}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, moisture: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Delivery</label>
                            <input
                              className="form-control"
                              value={editForm.delivery}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, delivery: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">City</label>
                            <input
                              className="form-control"
                              required
                              value={editForm.city}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                            />
                          </div>
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
                                onChange={(event) =>
                                  setEditForm((prev) => ({ ...prev, quantityValue: event.target.value }))
                                }
                              />
                              <select
                                className="form-select"
                                style={{ maxWidth: 120 }}
                                value={editForm.quantityUnit}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    quantityUnit: event.target.value as QuantityUnit,
                                  }))
                                }
                              >
                                <option value="ton">ton</option>
                                <option value="maund">maund</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Price / Maund</label>
                            <input
                              className="form-control"
                              type="number"
                              required
                              value={editForm.pricePerMaund}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, pricePerMaund: event.target.value }))}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={editForm.description}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                            ></textarea>
                          </div>
                          <div className="col-12">
                            <label className="form-label">Update Images (multiple)</label>
                            <input
                              type="file"
                              className="form-control"
                              multiple
                              accept="image/*"
                              onChange={onEditListingImagesChange}
                            />
                            {editImages.length > 0 && (
                              <div className="image-preview-grid mt-3">
                                {editImages.map((image, index) => (
                                  <div className="thumb-wrap" key={`${image}-${index}`}>
                                    <Image
                                      src={image}
                                      alt={`Edit ${index + 1}`}
                                      className="thumb"
                                      width={120}
                                      height={72}
                                      unoptimized
                                    />
                                    <button
                                      type="button"
                                      className="remove-image-btn"
                                      onClick={() => removeEditImage(index)}
                                      aria-label="Remove image"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="col-12">
                            <button className="btn btn-primary px-4" type="submit" disabled={isUpdatingListing}>
                              {isUpdatingListing ? "Saving..." : "Update Listing"}
                            </button>
                          </div>
                        </div>
                      </form>
                    </section>
                  )}

                  {listingsMessage && <div className="alert alert-info py-2 rounded-3">{listingsMessage}</div>}

                  <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white">
                    {isLoadingListings ? (
                      <div className="p-4 text-center text-muted">Loading listings...</div>
                    ) : listings.length === 0 ? (
                      <div className="p-4 text-center text-muted">No listings found.</div>
                    ) : (
                      <div className="listing-list">
                        {listings.map((listing) => (
                          <div
                            role="button"
                            tabIndex={0}
                            key={listing.id}
                            className="listing-row"
                            onClick={() => openListingDetails(listing)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openListingDetails(listing);
                              }
                            }}
                          >
                            <div className="listing-row-left">
                              {listing.images?.[0] ? (
                                <Image
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  width={58}
                                  height={58}
                                  className="listing-row-thumb"
                                  unoptimized
                                />
                              ) : (
                                <div className="listing-row-thumb listing-row-thumb-empty">
                                  <i className="fa-regular fa-image"></i>
                                </div>
                              )}
                              <div className="text-start">
                                <div className="fw-semibold">{listing.title}</div>
                                <small className="text-muted">
                                  {listing.city} | {listing.quantity}
                                </small>
                              </div>
                            </div>

                            <div className="listing-row-right">
                              <span className="badge text-bg-light border me-2">{resolveListingCategory(listing.category)}</span>
                              <strong className="text-success me-3">
                                PKR {listing.pricePerMaund.toLocaleString()}
                              </strong>
                              {canMutateListing(listing) && (
                                <span className="d-flex gap-2" onClick={(event) => event.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => startEditListing(listing)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => onDeleteListing(listing.id)}
                                  >
                                    Delete
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : activeTab === "profile" ? (
                <>
                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                      <div>
                        <h2 className="h4 fw-bold mb-1">Seller Verification Profile</h2>
                        <p className="text-muted mb-0">
                          Upload identity documents and business details for admin verification.
                        </p>
                      </div>
                      <span
                        className={`badge fs-6 text-capitalize ${verificationStatus === "verified"
                          ? "text-bg-success"
                          : verificationStatus === "rejected"
                            ? "text-bg-danger"
                            : verificationStatus === "pending"
                              ? "text-bg-warning"
                              : "text-bg-secondary"
                          }`}
                      >
                        {verificationStatus}
                      </span>
                    </div>
                  </section>

                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <form onSubmit={onSaveProfile}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Business / Farm Name</label>
                          <input
                            className="form-control"
                            value={profileForm.businessName}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, businessName: event.target.value }))
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">CNIC / Identity Number</label>
                          <input
                            className="form-control"
                            value={profileForm.cnicNumber}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, cnicNumber: event.target.value }))}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Registered Mobile Number</label>
                          <input
                            className="form-control"
                            value={profileForm.registeredMobileNumber}
                            onChange={(event) =>
                              setProfileForm((prev) => ({ ...prev, registeredMobileNumber: event.target.value }))
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">City</label>
                          <input
                            className="form-control"
                            value={profileForm.city}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Address</label>
                          <input
                            className="form-control"
                            value={profileForm.address}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Additional Information</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={profileForm.notes}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, notes: event.target.value }))}
                          ></textarea>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Identity Documents (multiple)</label>
                          <input
                            type="file"
                            className="form-control"
                            multiple
                            accept="image/*,.pdf"
                            onChange={onProfileDocumentsChange}
                          />
                          {profileDocs.length > 0 && (
                            <div className="image-preview-grid mt-3">
                              {profileDocs.map((doc, index) => (
                                <div className="thumb-wrap" key={`${doc.fileUrl}-${index}`}>
                                  {doc.fileUrl.startsWith("data:image/") ? (
                                    <Image
                                      src={doc.fileUrl}
                                      alt={doc.name}
                                      className="thumb"
                                      width={120}
                                      height={72}
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="thumb d-flex align-items-center justify-content-center bg-light text-muted">
                                      <i className="fa-solid fa-file-lines me-1"></i> PDF
                                    </div>
                                  )}
                                  <div className="small text-truncate mt-1 px-1" title={doc.name}>
                                    {doc.name}
                                  </div>
                                  <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => removeProfileDocument(index)}
                                    aria-label="Remove document"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-12">
                          <button className="btn btn-success px-4" type="submit" disabled={isSavingProfile || isLoadingProfile}>
                            {isSavingProfile ? "Saving..." : "Save Profile"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </section>

                  {profileMessage && <div className="alert alert-info py-2 rounded-3">{profileMessage}</div>}
                </>
              ) : activeTab === "categories" ? (
                <>
                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                      <h2 className="h4 fw-bold mb-0">Categories Management</h2>
                      <button className="btn btn-outline-success" onClick={() => void loadCategories()}>
                        <i className="fa-solid fa-rotate-right me-2"></i>Refresh
                      </button>
                    </div>
                    <p className="text-muted mb-0">Create and manage crop categories available for listings.</p>
                  </section>

                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <h3 className="h5 fw-bold mb-3">Create Category</h3>
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
                          <button className="btn btn-success" type="submit" disabled={isCreatingCategory}>
                            {isCreatingCategory ? "Creating..." : "Create Category"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </section>

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
                                Loading categories...
                              </td>
                            </tr>
                          ) : categories.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-muted">
                                No categories available.
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
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEditCategory(category)}
                                    >
                                      Edit
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
                </>
              ) : activeTab === "broadcastings" ? (
                <>
                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                      <div>
                        <h2 className="h4 fw-bold mb-1">
                          {role === "buyer" ? "My Broadcastings" : "Buyer Broadcastings"}
                        </h2>
                        <p className="text-muted mb-0">
                          {role === "buyer"
                            ? "Your posted requirements visible to all sellers."
                            : "Requirements posted by buyers across Pakistan."}
                        </p>
                      </div>
                      {role === "buyer" && (
                        <button type="button" className="btn btn-success" onClick={() => {
                          if (activeSubscription) {
                            setShowBroadcastModal(true);
                          } else {
                            setShowUpgradeModal(true);
                          }
                        }}>
                          <i className="fa-solid fa-plus me-2"></i>Post New Requirement
                        </button>
                      )}
                    </div>
                  </section>

                  {broadcastsMessage && <div className="alert alert-info py-2 rounded-3">{broadcastsMessage}</div>}

                  {isLoadingBroadcasts ? (
                    <div className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Loading broadcastings...
                    </div>
                  ) : broadcasts.length === 0 ? (
                    <div className="card border shadow-sm rounded-4 p-5 text-center bg-white">
                      <i className="fa-solid fa-bullhorn fa-3x text-muted mb-3"></i>
                      <h5 className="fw-bold">No broadcastings yet</h5>
                      <p className="text-muted mb-0">
                        {role === "buyer"
                          ? "You haven't posted any requirements yet."
                          : "No buyer requirements have been posted yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {broadcasts.map((b) => (
                        <div className="col-md-6" key={b.id}>
                          <div className="card border shadow-sm rounded-4 h-100 bg-white">
                            <div className="card-body p-4">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="badge text-bg-success text-capitalize">{b.category}</span>
                                <small className="text-muted">
                                  {new Date(b.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                </small>
                              </div>
                              <h6 className="fw-bold mb-2">{b.requirementDetails}</h6>
                              <div className="row g-2 mb-3">
                                {b.grade && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">Grade</small>
                                    <span className="fw-semibold">{b.grade}</span>
                                  </div>
                                )}
                                {b.requiredQuantity && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">Quantity</small>
                                    <span className="fw-semibold">{b.requiredQuantity}</span>
                                  </div>
                                )}
                                {b.targetPricePerMaund && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">Target Price</small>
                                    <span className="fw-semibold">PKR {b.targetPricePerMaund}/Maund</span>
                                  </div>
                                )}
                                {b.city && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">City</small>
                                    <span className="fw-semibold">{b.city}</span>
                                  </div>
                                )}
                                {b.deliveryLocation && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">Delivery</small>
                                    <span className="fw-semibold">{b.deliveryLocation}</span>
                                  </div>
                                )}
                                {b.paymentTerms && (
                                  <div className="col-6">
                                    <small className="text-muted d-block">Payment</small>
                                    <span className="fw-semibold">{b.paymentTerms}</span>
                                  </div>
                                )}
                              </div>
                              {role === "seller" && (
                                <div className="border-top pt-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="broadcast-avatar">
                                      {b.buyerName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("")}
                                    </div>
                                    <div>
                                      <p className="mb-0 fw-semibold small">{b.buyerName}</p>
                                      <p className="mb-0 text-muted small">{b.buyerPhone}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : activeTab === "payments" ? (
                <>
                  <section className="card border shadow-sm rounded-4 p-4 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                      <h2 className="h4 fw-bold mb-0">My Payments</h2>
                      <button className="btn btn-outline-success" onClick={() => void loadPayments()}>
                        <i className="fa-solid fa-rotate-right me-2"></i>Refresh
                      </button>
                    </div>
                    <p className="text-muted mb-0">View your subscription and checkout history.</p>
                  </section>

                  {paymentsMessage && <div className="alert alert-info py-2 rounded-3">{paymentsMessage}</div>}

                  <section className="card border shadow-sm rounded-4 p-0 overflow-hidden bg-white">
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Date</th>
                            <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Customer</th>
                            <th className="py-3 px-4 fw-semibold text-muted small text-uppercase">Plan</th>
                            <th className="py-3 px-4 fw-semibold text-muted small text-uppercase text-end">Amount</th>
                            <th className="py-3 px-4 fw-semibold text-muted small text-uppercase text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingPayments ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5 text-muted">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                Loading payments...
                              </td>
                            </tr>
                          ) : payments.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5">
                                <i className="fa-solid fa-receipt fa-3x text-muted mb-3 opacity-50"></i>
                                <h5>No active subscriptions</h5>
                                <p className="text-muted mb-0">You have no recorded payments.</p>
                              </td>
                            </tr>
                          ) : (
                            payments.map((payment) => (
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
                                <td className="py-3 px-4 text-end">
                                  <span className="fw-bold text-dark">{payment.amount.toLocaleString()}</span>
                                  <span className="text-muted ms-1 small text-uppercase">{payment.currency}</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {payment.status === "completed" ? (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i className="fa-solid fa-check-circle me-1"></i> Completed</span>
                                  ) : payment.status === "pending" ? (
                                    <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1"><i className="fa-solid fa-clock me-1"></i> Pending</span>
                                  ) : (
                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i className="fa-solid fa-times-circle me-1"></i> Failed</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          </div>
        )
        }
      </div >

      {showBroadcastModal && (
        <div className="category-modal-backdrop" onClick={() => setShowBroadcastModal(false)}>
          <div className="category-modal listing-detail-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold mb-0">Post New Requirement</h3>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowBroadcastModal(false)}>
                  Close
                </button>
              </div>
              <form onSubmit={async (event) => {
                event.preventDefault();
                if (!sessionUser) return;
                setIsSubmittingBroadcast(true);
                try {
                  const response = await fetch("/api/broadcasts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: sessionUser.id, ...broadcastForm }),
                  });
                  const data = await response.json();
                  if (response.ok && data.ok) {
                    setBroadcastForm({
                      category: "",
                      grade: "",
                      requirementDetails: "",
                      requiredQuantity: "",
                      targetPricePerMaund: "",
                      city: "",
                      deliveryLocation: "",
                      paymentTerms: "Cash on Delivery",
                    });
                    setShowBroadcastModal(false);
                    setBroadcastsMessage("Requirement broadcasted successfully!");
                    void loadBroadcasts();
                  } else {
                    setBroadcastsMessage(data.message || "Failed to post requirement.");
                  }
                } catch {
                  setBroadcastsMessage("Network error. Please try again.");
                } finally {
                  setIsSubmittingBroadcast(false);
                }
              }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      required
                      value={broadcastForm.category}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="" disabled>Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Grade <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. A-Grade, Premium"
                      required
                      value={broadcastForm.grade}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, grade: e.target.value }))}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">What are you looking for? <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Need 100 Tons Super Basmati Rice"
                      required
                      value={broadcastForm.requirementDetails}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, requirementDetails: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Quantity Required</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 50 Tons"
                      value={broadcastForm.requiredQuantity}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, requiredQuantity: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Target Price (PKR/Maund)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Your budget"
                      value={broadcastForm.targetPricePerMaund}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, targetPricePerMaund: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lahore"
                      required
                      value={broadcastForm.city}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Delivery Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Detailed address"
                      value={broadcastForm.deliveryLocation}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, deliveryLocation: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Payment Terms</label>
                    <select
                      className="form-select"
                      value={broadcastForm.paymentTerms}
                      onChange={(e) => setBroadcastForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                    >
                      <option>Cash on Delivery</option>
                      <option>Bank Transfer (Advance)</option>
                      <option>50% Advance / 50% Delivery</option>
                    </select>
                  </div>
                  <div className="col-12 mt-3">
                    <button type="submit" className="btn btn-success btn-lg w-100" disabled={isSubmittingBroadcast}>
                      {isSubmittingBroadcast ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Broadcasting...</>
                      ) : (
                        <><i className="fa-solid fa-paper-plane me-2"></i>Broadcast Requirement to All Sellers</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {
        editingCategoryId && (
          <div className="category-modal-backdrop" onClick={cancelEditCategory}>
            <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h5 fw-bold mb-0">Edit Category</h3>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEditCategory}>
                    Close
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
          </div>
        )
      }

      {
        selectedListing && (
          <div className="category-modal-backdrop" onClick={closeListingDetails}>
            <div className="category-modal listing-detail-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()}>
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h5 fw-bold mb-0">{selectedListing.title}</h3>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeListingDetails}>
                    Close
                  </button>
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
                  <div className="empty-main-image mb-4">
                    <i className="fa-regular fa-image me-2"></i>No images uploaded
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>Category</small>
                      <p className="mb-0 fw-semibold">{selectedListing.category}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>City</small>
                      <p className="mb-0 fw-semibold">{selectedListing.city}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>Quantity</small>
                      <p className="mb-0 fw-semibold">{selectedListing.quantity}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>Grade</small>
                      <p className="mb-0 fw-semibold">{selectedListing.grade || "Unspecified"}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>Moisture</small>
                      <p className="mb-0 fw-semibold">{selectedListing.moisture || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="detail-item">
                      <small>Delivery</small>
                      <p className="mb-0 fw-semibold">{selectedListing.delivery || "Negotiable"}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-item mb-3">
                  <small>Description</small>
                  <p className="mb-0">{selectedListing.description || "No description provided."}</p>
                </div>

                <div className="d-flex justify-content-between align-items-center border-top pt-3">
                  <div>
                    <small className="text-muted d-block">Price / Maund</small>
                    <strong className="text-success">PKR {selectedListing.pricePerMaund.toLocaleString()}</strong>
                  </div>
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
                <div className="mt-3 d-flex justify-content-end">
                  <div className="d-flex gap-2">
                    {canMutateListing(selectedListing) && (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          closeListingDetails();
                          startEditListing(selectedListing);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {canMutateListing(selectedListing) && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          closeListingDetails();
                          void onDeleteListing(selectedListing.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <style jsx>{`
        .panel-page {
          min-height: 100vh;
          background: linear-gradient(145deg, #f0f7f3 0%, #f8faf9 40%, #fdfefe 70%, #faf6e8 100%);
        }

        .panel-shell {
          padding-left: 1rem;
          padding-right: 1rem;
        }

        .panel-grid {
          max-width: 1700px;
          margin-left: auto;
          margin-right: auto;
        }

        .dashboard-frame {
          align-items: stretch;
        }

        .dashboard-sidebar-col {
          display: flex;
        }

        .dashboard-main-col {
          display: flex;
          flex-direction: column;
        }

        .panel-sidebar {
          top: 1rem;
          width: 100%;
          min-height: calc(100vh - 2rem);
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.45) !important;
          box-shadow: 0 8px 32px rgba(27,67,50,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
          overflow: hidden;
        }

        .sidebar-top {
          position: relative;
        }

        .sidebar-top::before {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(27,67,50,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .sidebar-actions {
          margin-top: auto;
          border-top: 1px solid rgba(27,67,50,0.08);
          background: rgba(246,251,249,0.5);
        }

        .dashboard-topbar {
          border-color: rgba(27,67,50,0.08) !important;
          background: rgba(255,255,255,0.72) !important;
          backdrop-filter: blur(12px) saturate(1.4);
          -webkit-backdrop-filter: blur(12px) saturate(1.4);
          box-shadow: 0 2px 12px rgba(27,67,50,0.04);
        }

        .topbar-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #27ae60 0%, #1b4332 100%);
          box-shadow: 0 0 0 3px rgba(39,174,96,0.15);
          animation: topbarPulse 3s ease-in-out infinite;
        }

        @keyframes topbarPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(39,174,96,0.15); }
          50% { box-shadow: 0 0 0 5px rgba(39,174,96,0.08); }
        }

        .sidebar-label {
          color: #6b7f74;
          letter-spacing: 0.1em;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .sidebar-nav {
          display: grid;
          gap: 6px;
        }

        .sidebar-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: 1px solid rgba(27,67,50,0.1);
          background: rgba(255,255,255,0.6);
          border-radius: 12px;
          text-align: left;
          padding: 11px 14px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #1b4332;
          text-decoration: none;
          line-height: 1.2;
          appearance: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .sidebar-btn::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #1b4332;
          border-radius: 0 3px 3px 0;
          transform: scaleY(0);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-btn i {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(27,67,50,0.06);
          font-size: 0.85rem;
          color: #2a5d49;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .sidebar-btn:visited,
        .sidebar-btn:focus,
        .sidebar-btn:active {
          color: #1b4332;
          text-decoration: none;
        }

        .sidebar-btn:hover {
          background: rgba(228,241,235,0.6);
          border-color: rgba(27,67,50,0.15);
          color: #1b4332;
          transform: translateX(2px);
        }

        .sidebar-btn:hover::before {
          transform: scaleY(0.6);
        }

        .sidebar-btn:hover i {
          background: rgba(27,67,50,0.1);
        }

        .sidebar-btn.active {
          background: linear-gradient(135deg, #1b4332 0%, #264f3e 100%);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 6px 20px rgba(27, 67, 50, 0.25), 0 2px 6px rgba(27, 67, 50, 0.15);
        }

        .sidebar-btn.active::before {
          transform: scaleY(0);
        }

        .sidebar-btn.active i {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }

        .panel-sidebar-seller .sidebar-nav {
          gap: 6px;
        }

        .panel-sidebar-seller .sidebar-btn {
          border-radius: 12px;
          padding: 12px 14px;
        }

        .panel-sidebar-seller .sidebar-btn span {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .user-chip {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 1rem;
          background: linear-gradient(135deg, #1b4332 0%, #2a5d49 100%);
          color: #fff;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 4px 12px rgba(27, 67, 50, 0.2);
        }

        .broadcast-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 0.75rem;
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
          color: #fff;
          flex-shrink: 0;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          background: linear-gradient(135deg, #e4f1eb 0%, #d3ece1 100%);
          border: 1px solid rgba(27,67,50,0.12);
          color: #1b4332;
        }

        .role-pill::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #27ae60;
          box-shadow: 0 0 0 2px rgba(39,174,96,0.2);
        }

        .panel-hero {
          background: linear-gradient(135deg, #1b4332 0%, #264f3e 30%, #2a6b4e 70%, #1e5a3c 100%);
          border: none;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .hero-decoration {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }

        .hero-decoration::after {
          content: "";
          position: absolute;
          bottom: -100px;
          left: -150px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }

        .hero-subtitle {
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .hero-text {
          max-width: 700px;
          color: rgba(255,255,255,0.75);
        }

        .panel-hero :global(.btn-outline-success) {
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }

        .panel-hero :global(.btn-outline-success:hover) {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.5);
          color: #fff;
        }

        .summary-box {
          border: 1px solid rgba(27,67,50,0.1);
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          padding: 16px;
          transition: all 0.2s ease;
        }

        .summary-box:hover {
          box-shadow: 0 4px 16px rgba(27,67,50,0.06);
        }

        .summary-box small {
          color: #60776c;
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-card {
          border-radius: 18px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #1f2d26;
          border: 1px solid rgba(27,67,50,0.06) !important;
          position: relative;
          overflow: hidden;
        }

        .stat-card::after {
          content: "";
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(27,67,50,0.04);
          pointer-events: none;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(27,67,50,0.12), 0 4px 8px rgba(27,67,50,0.06);
        }

        .listing-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(27,67,50,0.08) !important;
        }

        .listing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(27,67,50,0.1);
        }

        .listing-list {
          display: flex;
          flex-direction: column;
        }

        .listing-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border: 0;
          border-bottom: 1px solid rgba(27,67,50,0.06);
          background: #fff;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .listing-row:last-child {
          border-bottom: 0;
        }

        .listing-row:hover {
          background: rgba(228,241,235,0.35);
        }

        .listing-row-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .listing-row-right {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-left: 12px;
        }

        .listing-row-thumb {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid rgba(27,67,50,0.1);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .listing-row:hover :global(.listing-row-thumb) {
          transform: scale(1.04);
        }

        .listing-row-thumb-empty {
          display: grid;
          place-items: center;
          color: #7b8f84;
          background: #f2f7f4;
        }

        .modal-gallery-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }

        .modal-gallery-thumb {
          width: 100%;
          height: 82px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid rgba(27,67,50,0.1);
        }

        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
          gap: 8px;
        }

        .thumb {
          width: 100%;
          height: 72px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid rgba(27,67,50,0.1);
        }

        .thumb-wrap {
          position: relative;
        }

        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 0;
          background: rgba(220, 53, 69, 0.95);
          color: #fff;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 0;
          transition: all 0.18s ease;
        }

        .remove-image-btn:hover {
          background: #c82333;
          transform: scale(1.1);
        }

        .stat-soft-blue {
          background: linear-gradient(135deg, #edf4ff 0%, #e0edff 100%);
        }

        .stat-soft-green {
          background: linear-gradient(135deg, #e7f9ef 0%, #d8f0e3 100%);
        }

        .stat-soft-slate {
          background: linear-gradient(135deg, #eef2f6 0%, #e4e9ef 100%);
        }

        .stat-soft-amber {
          background: linear-gradient(135deg, #fff8e6 0%, #ffefcc 100%);
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

        .listing-detail-modal {
          /* specific width overrides can go here if needed, else it inherits */
        }

        .empty-main-image {
          border: 1px dashed rgba(27,67,50,0.15);
          border-radius: 12px;
          background: #f5faf7;
          color: #6f8379;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .detail-item {
          border: 1px solid rgba(27,67,50,0.1);
          border-radius: 12px;
          background: #f8fcfa;
          padding: 12px 14px;
        }

        .detail-item small {
          display: block;
          color: #60776c;
          margin-bottom: 4px;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        :global(.form-control:focus),
        :global(.form-select:focus) {
          border-color: rgba(27,67,50,0.3);
          box-shadow: 0 0 0 3px rgba(27,67,50,0.08);
        }

        :global(.form-label) {
          font-weight: 600;
          font-size: 0.82rem;
          color: #3a5a4a;
          letter-spacing: 0.02em;
        }

        :global(.btn-success) {
          background: linear-gradient(135deg, #1b4332 0%, #2a5d49 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(27,67,50,0.2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :global(.btn-success:hover) {
          background: linear-gradient(135deg, #163b2b 0%, #234e3e 100%);
          box-shadow: 0 4px 16px rgba(27,67,50,0.3);
          transform: translateY(-1px);
        }

        :global(.btn-outline-success) {
          color: #1b4332;
          border-color: rgba(27,67,50,0.2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :global(.btn-outline-success:hover) {
          background: #1b4332;
          border-color: #1b4332;
          box-shadow: 0 4px 14px rgba(27,67,50,0.2);
          transform: translateY(-1px);
        }

        :global(.table thead th) {
          background: linear-gradient(180deg, #f4f9f6 0%, #eef5f1 100%);
          border-bottom: 2px solid rgba(27,67,50,0.1);
          color: #3a5a4a;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 14px 16px;
        }

        :global(.table tbody tr) {
          transition: background-color 0.2s ease;
        }

        :global(.table tbody tr:hover) {
          background-color: rgba(228,241,235,0.35);
        }

        :global(.table tbody td) {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(27,67,50,0.05);
          font-size: 0.9rem;
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

        @media (max-width: 991px) {
          .panel-sidebar {
            position: static !important;
            min-height: auto;
          }

          .panel-hero h1 {
            font-size: 1.8rem;
          }
        }

        @media (max-width: 767px) {
          .listing-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .listing-row-right {
            width: 100%;
            justify-content: flex-start;
            margin-left: 0;
          }

          .modal-gallery-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1200px) {
          .panel-shell {
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
      `}</style>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="category-modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="category-modal card border shadow-sm rounded-4 bg-white" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="fa-solid fa-crown text-warning me-2"></i>Upgrade Required
              </h5>
              <button
                type="button"
                className="btn-close shadow-none"
                onClick={() => setShowUpgradeModal(false)}
                aria-label="Close"
              ></button>
            </div>

            <div className="card-body p-4 text-center">
              <div className="mb-4 mt-2">
                <i className="fa-solid fa-unlock-keyhole fa-4x text-success opacity-75"></i>
              </div>
              <h4 className="fw-bolder mb-3">Unlock Premium Features</h4>
              <p className="text-muted mb-4">
                You need an active subscription plan to {role === "seller" ? "create new listings" : "post broadcast requirements"}.
                Upgrade now to reach more verified users and grow your business!
              </p>

              <div className="d-grid gap-3 mt-4">
                <Link href="/#pricing-section" className="btn btn-success btn-lg fw-bold rounded-3">
                  <i className="fa-solid fa-rocket me-2"></i>View Pricing Plans
                </Link>
                <button type="button" className="btn btn-light" onClick={() => setShowUpgradeModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main >
  );
}
