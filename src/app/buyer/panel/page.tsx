import RolePanel from "@/components/RolePanel";

export default function BuyerPanelPage() {
  return (
    <RolePanel
      role="buyer"
      title="Buyer Dashboard"
      subtitle="Track requirements, negotiate with sellers, and manage your bulk purchases."
      cards={[
        { label: "Active Requirements", value: "—", className: "stat-soft-green" },
        { label: "Marketplace Listings", value: "—", className: "stat-soft-blue" },
        { label: "Deals Closed", value: "—", className: "stat-soft-amber" },
      ]}
    />
  );
}
