import RolePanel from "@/components/RolePanel";

export default function SellerPanelProfilePage() {
  return (
    <RolePanel
      role="seller"
      title="Seller Dashboard"
      subtitle="Manage crop listings, respond to buyers, and monitor your trade pipeline."
      cards={[
        { label: "Live Listings", value: "9", className: "stat-soft-green" },
        { label: "Buyer Inquiries", value: "27", className: "stat-soft-blue" },
        { label: "Completed Orders", value: "11", className: "stat-soft-slate" },
      ]}
    />
  );
}
