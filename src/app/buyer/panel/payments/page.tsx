"use client";

import RolePanel from "@/components/RolePanel";

export default function BuyerPaymentsPage() {
    return (
        <RolePanel
            role="buyer"
            title="Buyer Dashboard"
            subtitle="Track requirements, negotiate with sellers, and manage your bulk purchases."
            cards={[
                { label: "Active Requirements", value: "6", className: "stat-soft-amber" },
                { label: "Quotes Received", value: "18", className: "stat-soft-green" },
                { label: "Deals Closed", value: "4", className: "stat-soft-blue" },
            ]}
        />
    );
}
