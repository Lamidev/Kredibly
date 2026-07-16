import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSales } from "../../context/SaleContext";
import { Search, CheckCircle, Clock, X, MessageCircle, ChevronRight, AlertTriangle, Send, FileText, Trash2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { KREDDY_CONFIG } from "../../config";
import { useAuth } from "../../context/AuthContext";

// ─── Responsive hook ─────────────────────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 640px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isMobile;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const timeAgo = (d) => {
    const mins = Math.floor((Date.now() - new Date(d)) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return fmtDate(d);
};

const getStatusLabel = (sale) => {
    if (sale.status === "paid" || sale.lifecycleStatus === "PAID")
        return { text: "Paid", bg: "#D1FAE5", color: "#065F46" };
    if (sale.lifecycleStatus === "EXTENSION_REQUESTED")
        return { text: "Extension Request", bg: "#FEF3C7", color: "#92400E" };
    if (sale.lifecycleStatus === "PARTIALLY_PAID" || sale.status === "partial")
        return { text: "Partial", bg: "#DBEAFE", color: "#1E40AF" };
    if (sale.lifecycleStatus === "VIEWED")
        return { text: "Viewed", bg: "#EDE9FE", color: "#5B21B6" };
    if (sale.lifecycleStatus === "DELIVERED")
        return { text: "Sent", bg: "#F1F5F9", color: "#475569" };
    return { text: "Pending", bg: "#FFF7ED", color: "#9A3412" };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Workspace() {
    const { profile } = useAuth();
    const isMobile = useIsMobile();
    const { sales, fetchSales, deleteSale, loading } = useSales();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'payments'
    const [selectedLane, setSelectedLane] = useState("waitingForMe");

    useEffect(() => { fetchSales(); }, []);

    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    const confirmDeleteSale = async () => {
        if (!invoiceToDelete) return;
        try {
            await deleteSale(invoiceToDelete._id);
            setSelected(null);
            setInvoiceToDelete(null);
            toast.success("Invoice deleted successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete invoice");
        }
    };

    // Group real sales into lanes by lifecycle
    const lanes = useMemo(() => {
        const filtered = search
            ? sales.filter((s) =>
                  s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                  s.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
              )
            : sales;

        const waitingForMe = [];
        const waitingCustomer = [];
        const done = [];

        filtered.forEach((sale) => {
            const paid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
            const isCompleted = paid >= sale.totalAmount || sale.status === "paid" || sale.lifecycleStatus === "PAID";

            if (isCompleted) {
                done.push(sale);
            } else if (sale.lifecycleStatus === "EXTENSION_REQUESTED" || sale.lifecycleStatus === "PENDING_APPROVAL") {
                waitingForMe.push(sale);
            } else {
                waitingCustomer.push(sale);
            }
        });

        return { waitingForMe, waitingCustomer, done };
    }, [sales, search]);

    const openTalkToKreddy = (sale) => {
        const msg = `Send reminder to ${sale.customerName} for invoice ${sale.invoiceNumber}`;
        window.open(KREDDY_CONFIG.getLink(msg), "_blank", "noopener,noreferrer");
    };

    const LANE_CONFIG = [
        { key: "waitingForMe",    label: "Needs Your Action",    color: "#EF4444", bg: "#FEE2E2", hint: "Extension requests and approvals", icon: AlertTriangle },
        { key: "waitingCustomer", label: "Waiting on Customer",  color: "#3B82F6", bg: "#DBEAFE", hint: "Invoice sent, awaiting payment", icon: Send },
        { key: "done",            label: "Done",                 color: "#10B981", bg: "#D1FAE5", hint: "Fully paid", icon: CheckCircle },
    ];

    const Skeleton = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: "82px", borderRadius: "16px" }} />
            ))}
        </div>
    );

    return (
        <div style={{ paddingBottom: "60px" }} className="animate-fade-in">

            {/* Header */}
            <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 950, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.03em" }}>
                        Workspace
                    </h1>
                    <p style={{ color: "#64748B", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                        All active invoices grouped by what needs to happen next.
                    </p>
                </div>
                <button
                    onClick={() => {
                        const msg = profile?.firstMerchantGreetingSent ? "Hi Kreddy" : "Hello";
                        window.open(KREDDY_CONFIG.getLink(msg), '_blank', 'noopener,noreferrer');
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "white",
                        border: "1.5px solid rgba(109,40,217,0.18)",
                        borderRadius: "40px",
                        padding: "6px 14px 6px 8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(109,40,217,0.08)",
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = "#F5F0FF";
                        e.currentTarget.style.borderColor = "rgba(109,40,217,0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(109,40,217,0.15)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "rgba(109,40,217,0.18)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(109,40,217,0.08)";
                    }}
                >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                            width: "28px", height: "28px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6D28D9, #7C3AED)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Bot size={14} color="white" />
                        </div>
                        <span style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: "#10B981", border: "1.5px solid white",
                            animation: "kreddy-pulse 2s infinite"
                        }} />
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4C1D95", whiteSpace: "nowrap" }}>
                        {profile?.firstMerchantGreetingSent ? "Open Kreddy" : "Open WhatsApp"}
                    </span>
                </button>
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "10px 14px", maxWidth: "320px", marginBottom: "32px" }}>
                <Search size={16} color="#64748B" style={{ marginRight: "10px", flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Search customer or invoice..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ border: "none", background: "transparent", fontSize: "0.83rem", width: "100%", outline: "none", color: "#1E293B" }}
                />
            </div>

            {/* Mobile Tab Selector */}
            {isMobile && (
                <div style={{ display: "flex", background: "#F1F5F9", borderRadius: "14px", padding: "4px", gap: "4px", marginBottom: "20px" }}>
                    {LANE_CONFIG.map(({ key, label }) => {
                        const items = lanes[key] || [];
                        const isActive = selectedLane === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedLane(key)}
                                style={{
                                    flex: 1,
                                    background: isActive ? "white" : "transparent",
                                    color: isActive ? "#0F172A" : "#64748B",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "10px 4px",
                                    fontSize: "0.75rem",
                                    fontWeight: isActive ? 800 : 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <span style={{ whiteSpace: "nowrap" }}>
                                    {key === "waitingForMe" ? "Action" : key === "waitingCustomer" ? "Waiting" : "Done"}
                                </span>
                                <span style={{
                                    fontSize: "0.65rem",
                                    background: isActive ? "#EDE9FE" : "#E2E8F0",
                                    color: isActive ? "#4C1D95" : "#475569",
                                    padding: "1px 6px",
                                    borderRadius: "10px",
                                    fontWeight: 800
                                }}>
                                    {items.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Lanes */}
            <div className="workspace-kanban">
                {LANE_CONFIG.filter(({ key }) => !isMobile || selectedLane === key).map(({ key, label, hint, icon: IconComponent }) => {
                    const items = lanes[key] || [];
                    return (
                        <div key={key} style={{ background: "#F8FAFC", borderRadius: "24px", padding: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#F1F5F9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <IconComponent size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 900, color: "#0F172A" }}>
                                            {label}
                                        </h3>
                                        <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>{hint}</span>
                                    </div>
                                    <span style={{ marginLeft: "auto", background: "#F1F5F9", color: "#475569", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
                                        {items.length}
                                    </span>
                                </div>
                            </div>

                            {loading ? <Skeleton /> : items.length === 0 ? (
                                <div style={{ textAlign: "center", background: "white", border: "1px dashed #E2E8F0", borderRadius: "16px", padding: "28px 0" }}>
                                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#94A3B8", fontWeight: 700 }}>
                                        Nothing here
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {items.map((sale) => {
                                        const badge = getStatusLabel(sale);
                                        const paid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
                                        const balance = sale.totalAmount - paid;
                                        return (
                                            <div
                                                key={sale._id}
                                                onClick={() => { setSelected(sale); setActiveTab("activity"); }}
                                                style={{
                                                    background: "white",
                                                    border: "1px solid #E2E8F0",
                                                    borderRadius: "16px",
                                                    padding: "16px",
                                                    cursor: "pointer",
                                                    position: "relative",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "10px",
                                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(76, 29, 149, 0.04)";
                                                    e.currentTarget.style.borderColor = "rgba(76, 29, 149, 0.2)";
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.02)";
                                                    e.currentTarget.style.borderColor = "#E2E8F0";
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                                                        {sale.customerName || "Unknown"}
                                                    </h4>
                                                    <span style={{
                                                        fontSize: "0.65rem",
                                                        fontWeight: 950,
                                                        padding: "3px 8px",
                                                        borderRadius: "20px",
                                                        background: badge.bg,
                                                        color: badge.color,
                                                        flexShrink: 0,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}>
                                                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: badge.color }} />
                                                        {badge.text}
                                                    </span>
                                                </div>

                                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 550 }}>
                                                    {sale.invoiceNumber} · {sale.description || "—"}
                                                </p>

                                                {/* Mini sleek progress bar for partial payments */}
                                                {paid > 0 && balance > 0 && (
                                                    <div style={{ margin: "2px 0" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>
                                                            <span>Paid {Math.round((paid / sale.totalAmount) * 100)}%</span>
                                                            <span>{fmt(paid)} of {fmt(sale.totalAmount)}</span>
                                                        </div>
                                                        <div style={{ width: "100%", height: "5px", background: "#F1F5F9", borderRadius: "10px", overflow: "hidden" }}>
                                                            <div style={{ width: `${(paid / sale.totalAmount) * 100}%`, height: "100%", background: "#4C1D95", borderRadius: "10px" }} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginTop: "2px" }}>
                                                    <strong style={{ color: balance > 0 ? "#EF4444" : "#10B981", fontWeight: 900 }}>
                                                        {balance > 0 ? `${fmt(balance)} owed` : "✓ Cleared"}
                                                    </strong>
                                                    <span style={{ color: "#94A3B8", fontWeight: 650, fontSize: "0.7rem" }}>
                                                        {timeAgo(sale.updatedAt || sale.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Detail Drawer */}
            {createPortal(
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className="details-drawer-backdrop"
                            style={{
                                alignItems: isMobile ? "flex-end" : "stretch",
                            }}
                        >
                            <motion.div
                                key="workspace-drawer"
                                initial={isMobile ? { y: "100%" } : { x: "100%" }}
                                animate={isMobile ? { y: 0 } : { x: 0 }}
                                exit={isMobile ? { y: "100%" } : { x: "100%" }}
                                transition={{ type: "spring", damping: 28, stiffness: 240 }}
                                onClick={(e) => e.stopPropagation()}
                                className="details-drawer"
                                style={{
                                    height: isMobile ? "92dvh" : "100%",
                                    overflowY: "auto",
                                    borderRadius: isMobile ? "20px 20px 0 0" : 0,
                                    borderLeft: isMobile ? "none" : "1px solid #E2E8F0",
                                    borderTop: isMobile ? "1px solid #E2E8F0" : "none",
                                }}
                            >
                                {/* Drawer Header */}
                                <div className="details-drawer-header">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h4 style={{ margin: "0 0 2px", fontSize: "1.1rem", fontWeight: 900, color: "#0F172A" }}>
                                                {selected.customerName}
                                            </h4>
                                            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                                                {selected.invoiceNumber} · {fmtDate(selected.createdAt)}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => setInvoiceToDelete(selected)} style={{ background: "#FEF2F2", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444", flexShrink: 0 }} title="Delete Invoice">
                                                <Trash2 size={15} />
                                            </button>
                                            <button onClick={() => setSelected(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B", flexShrink: 0 }}>
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount summary */}
                                    <div className="drawer-summary-grid">
                                        {[
                                            { label: "Total", value: fmt(selected.totalAmount), color: "#0F172A" },
                                            { label: "Paid", value: fmt((selected.payments || []).reduce((s, p) => s + p.amount, 0)), color: "#10B981" },
                                            { label: "Balance", value: fmt(selected.totalAmount - (selected.payments || []).reduce((s, p) => s + p.amount, 0)), color: "#EF4444" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} style={{ background: "#F8FAFC", borderRadius: "12px", padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                                                <p style={{ margin: 0, fontSize: "0.65rem", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
                                                <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 900, color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #F1F5F9" }}>
                                    {["activity", "payments"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{ flex: 1, padding: "12px 16px", background: "none", border: "none", fontWeight: 700, fontSize: "0.82rem", color: activeTab === tab ? "var(--primary)" : "#64748B", borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize" }}
                                        >
                                            {tab === "activity" ? "Timeline" : "Payments"}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="details-drawer-body">
                                    {activeTab === "activity" ? (
                                        <div style={{ position: "relative", paddingLeft: "16px", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "18px" }}>
                                            {/* Created event always shows */}
                                            <DrawerEvent dot="#94A3B8" title="Invoice Created" sub={fmtDate(selected.createdAt)} />

                                            {selected.customerDeliveredAt && (
                                                <DrawerEvent dot="#6366F1" title="Sent to Customer" sub={fmtDate(selected.customerDeliveredAt)} />
                                            )}
                                            {selected.viewedAt && (
                                                <DrawerEvent dot="#3B82F6" title="Customer Viewed Invoice" sub={fmtDate(selected.viewedAt)} />
                                            )}
                                            {selected.extensionRequestedAt && (
                                                <DrawerEvent dot="#F59E0B" title={`Extension Requested${selected.requestedExtensionDays ? ` (+${selected.requestedExtensionDays} days)` : ""}`} sub={fmtDate(selected.extensionRequestedAt)} />
                                            )}
                                            {selected.extensionApprovedAt && (
                                                <DrawerEvent dot="#10B981" title="Extension Approved" sub={fmtDate(selected.extensionApprovedAt)} />
                                            )}
                                            {(selected.payments || []).map((p, i) => (
                                                <DrawerEvent key={i} dot="#10B981" title={`Payment: ${fmt(p.amount)}`} sub={`${fmtDate(p.date || selected.createdAt)} · ${p.method || p.channel || "Cash"}`} />
                                            ))}
                                            {(selected.status === "paid" || selected.lifecycleStatus === "PAID") && (
                                                <DrawerEvent dot="#10B981" title="✓ Fully Settled" sub="" />
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {(selected.payments || []).length === 0 ? (
                                                <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.83rem", padding: "32px 0", fontWeight: 600 }}>
                                                    No payments recorded yet.
                                                </p>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {selected.payments.map((p, i) => (
                                                        <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <div>
                                                                 <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: "#1E293B" }}>{p.method || "Cash"}</p>
                                                                 <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#94A3B8" }}>{fmtDate(p.date || selected.createdAt)}</p>
                                                            </div>
                                                            <strong style={{ color: "#10B981", fontWeight: 900 }}>{fmt(p.amount)}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                {(() => {
                                    const paid = (selected.payments || []).reduce((s, p) => s + p.amount, 0);
                                    const bal = selected.totalAmount - paid;
                                    const isCleared = bal <= 0 || selected.status === "paid" || selected.lifecycleStatus === "PAID";
                                    if (isCleared) return null;
                                    return (
                                        <div className="details-drawer-footer">
                                            <button
                                                onClick={() => openTalkToKreddy(selected)}
                                                style={{
                                                    width: "100%",
                                                    background: "#4C1D95",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "14px",
                                                    padding: "13px",
                                                    fontWeight: 800,
                                                    fontSize: "0.88rem",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "8px",
                                                    transition: "background 0.2s ease"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#3B1670"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#4C1D95"}
                                            >
                                                <MessageCircle size={17} /> Send Reminder via Kreddy
                                            </button>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {invoiceToDelete && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setInvoiceToDelete(null)}
                        style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: "white", borderRadius: "24px", padding: "28px", maxWidth: "380px", width: "100%", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}
                        >
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <Trash2 size={24} />
                            </div>
                            <h4 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 900, color: "#0F172A" }}>Delete Invoice?</h4>
                            <p style={{ margin: "0 0 24px", fontSize: "0.83rem", color: "#64748B", lineHeight: 1.5, fontWeight: 650 }}>
                                This will permanently delete invoice <strong style={{ color: "#0F172A" }}>{invoiceToDelete.invoiceNumber}</strong> for {invoiceToDelete.customerName} and remove all associated payments.
                            </p>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={() => setInvoiceToDelete(null)}
                                    style={{ flex: 1, background: "#F1F5F9", color: "#475569", border: "none", borderRadius: "14px", padding: "12px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteSale}
                                    style={{ flex: 1, background: "#EF4444", color: "white", border: "none", borderRadius: "14px", padding: "12px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            <style>{`
                .workspace-kanban { /* Kanban styles */ }
                .details-drawer-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); zIndex: 1000; }
                .details-drawer {
                    width: 100%;
                    max-width: 440px;
                    height: 100%;
                    background: white;
                    border-left: 1px solid #E2E8F0;
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 480px) {
                    .details-drawer {
                        max-width: 100% !important;
                        height: 90% !important;
                        margin-top: auto;
                        border-top-left-radius: 20px;
                        border-top-right-radius: 20px;
                    }
                    .details-drawer-backdrop { align-items: flex-end; }
                }
            `}</style>
        </div>
    );
}

function DrawerEvent({ dot, title, sub }) {
    return (
        <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "-21px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", background: dot, border: "2px solid white", boxShadow: "0 0 0 1px #E2E8F0" }} />
            <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>{title}</p>
            {sub && <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>{sub}</span>}
        </div>
    );
}
