import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, X, TrendingUp, Clock, CheckCircle2, Activity, Bot, MessageCircle, ChevronDown, Check, Plus } from "lucide-react";
import { KREDDY_CONFIG } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const statusLabel = (sale) => {
    const lc = sale.lifecycleStatus;
    if (lc === "EXTENSION_REQUESTED") return { text: "Extension Requested", color: "#F59E0B" };
    if (lc === "PAID") return { text: "Paid", color: "#10B981" };
    if (lc === "PARTIALLY_PAID") return { text: "Partial", color: "#6366F1" };
    if (lc === "DELIVERED") return { text: "Sent — Awaiting", color: "#64748B" };
    if (lc === "VIEWED") return { text: "Viewed — Awaiting", color: "#3B82F6" };
    return { text: lc?.replace(/_/g, " ") || sale.status, color: "#94A3B8" };
};

// ─── Component ────────────────────────────────────────────────────────────────

import BankSetupModal from "../../components/dashboard/BankSetupModal";

export default function Dashboard() {
    const { stats, sales, fetchSales, fetchStats, loading } = useSales();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [timelineFilter, setTimelineFilter] = useState("all");
    const [showHealthModal, setShowHealthModal] = useState(false);
    const [visibleEvents, setVisibleEvents] = useState(5);
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [isSetupPopoverOpen, setIsSetupPopoverOpen] = useState(false);

    const hasBank = !!(profile?.bankDetails?.accountNumber && profile?.bankDetails?.bankCode);
    const hasLogo = !!profile?.logoUrl;
    const hasStaff = !!(profile?.staffNumbers && profile.staffNumbers.length > 0);
    const isMultiUserPlan = profile?.plan === 'oga' || profile?.plan === 'chairman';

    const setupItems = useMemo(() => {
        const items = [
            {
                id: 'bank',
                title: 'Payout Bank Account',
                desc: 'Required to receive automated payments',
                completed: hasBank,
                action: () => setIsBankModalOpen(true),
                actionLabel: 'Add Bank'
            },
            {
                id: 'logo',
                title: 'Invoice Brand Logo',
                desc: 'Appears on customer PDF receipts',
                completed: hasLogo,
                action: () => navigate('/settings'),
                actionLabel: 'Upload Logo'
            }
        ];

        if (isMultiUserPlan) {
            items.push({
                id: 'staff',
                title: 'Staff WhatsApp Access',
                desc: 'Grant team members sales recording access',
                completed: hasStaff,
                action: () => navigate('/settings'),
                actionLabel: 'Manage Staff'
            });
        }

        return items;
    }, [hasBank, hasLogo, hasStaff, isMultiUserPlan, navigate]);

    const completedSetupCount = useMemo(() => {
        return setupItems.filter(i => i.completed).length;
    }, [setupItems]);

    useEffect(() => {
        if (isSetupPopoverOpen && window.innerWidth <= 640) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            document.body.classList.add('setup-sheet-open');
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.classList.remove('setup-sheet-open');
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.classList.remove('setup-sheet-open');
        };
    }, [isSetupPopoverOpen]);

    useEffect(() => {
        setVisibleEvents(5);
    }, [timelineFilter]);

    useEffect(() => {
        fetchSales();
        fetchStats();
    }, []);

    // ── Derived Metrics (all from real data) ────────────────────────────────

    const collectedToday = useMemo(() => {
        const todayStr = new Date().toDateString();
        return sales.reduce((sum, sale) => {
            const paymentsToday = (sale.payments || []).filter(
                (p) => new Date(p.date || sale.createdAt).toDateString() === todayStr
            );
            return sum + paymentsToday.reduce((s, p) => s + p.amount, 0);
        }, 0);
    }, [sales]);

    // "Waiting For You" = invoices where merchant needs to act
    const waitingForYou = useMemo(() => {
        return sales.filter(
            (s) =>
                s.lifecycleStatus === "EXTENSION_REQUESTED" ||
                s.lifecycleStatus === "PENDING_APPROVAL"
        );
    }, [sales]);

    // Overdue = past dueDate and not paid
    const overdueSales = useMemo(() => {
        const now = new Date();
        return sales.filter((s) => {
            if (s.status === "paid" || s.lifecycleStatus === "PAID") return false;
            if (!s.dueDate) return false;
            return new Date(s.dueDate) < now;
        });
    }, [sales]);

    // Collection rate: revenue / totalAmount (only where totalAmount > 0)
    const collectionRate = useMemo(() => {
        const total = stats?.totalAmount || sales.reduce((s, x) => s + x.totalAmount, 0);
        const rev = stats?.revenue || 0;
        if (!total) return null;
        return Math.round((rev / total) * 100);
    }, [stats, sales]);

    // Avg payment delay: average days from createdAt to first payment, for paid sales
    const avgPaymentDelay = useMemo(() => {
        const paidSales = sales.filter(
            (s) => s.status === "paid" && s.payments?.length
        );
        if (!paidSales.length) return null;
        const totalDays = paidSales.reduce((sum, s) => {
            const created = new Date(s.createdAt).getTime();
            const firstPay = new Date(s.payments[0].date || s.createdAt).getTime();
            return sum + Math.max(0, (firstPay - created) / (1000 * 60 * 60 * 24));
        }, 0);
        return (totalDays / paidSales.length).toFixed(1);
    }, [sales]);

    // Health status derived from real data
    const healthStatus = useMemo(() => {
        if (collectionRate === null) return { label: "No data yet", color: "#94A3B8" };
        if (overdueSales.length > 3 || collectionRate < 50)
            return { label: "At Risk", color: "#EF4444" };
        if (overdueSales.length > 1 || collectionRate < 75)
            return { label: "Monitor", color: "#F59E0B" };
        return { label: "Stable", color: "#10B981" };
    }, [collectionRate, overdueSales]);

    // ── Timeline: built from real recent sales events ────────────────────────

    const timelineEvents = useMemo(() => {
        const events = [];

        sales.forEach((sale) => {
            const name = sale.customerName || "Unknown";
            const inv = sale.invoiceNumber || "";

            // Invoice creation
            events.push({
                id: `${sale._id}-created`,
                ts: new Date(sale.createdAt),
                text: `Invoice ${inv} created for ${name}`,
                subtext: fmt(sale.totalAmount),
                category: "invoices",
            });

            // Delivery
            if (sale.customerDeliveredAt) {
                events.push({
                    id: `${sale._id}-delivered`,
                    ts: new Date(sale.customerDeliveredAt),
                    text: `Invoice ${inv} sent to ${name}`,
                    category: "invoices",
                });
            }

            // Payments — skip zero-amount entries (webhook placeholders)
            (sale.payments || []).filter(p => p.amount > 0).forEach((p, i) => {
                events.push({
                    id: `${sale._id}-pay-${i}`,
                    ts: new Date(p.date || sale.createdAt),
                    text: `Payment received from ${name}`,
                    subtext: fmt(p.amount),
                    category: "payments",
                });
            });

            // Extension request
            if (sale.extensionRequestedAt) {
                events.push({
                    id: `${sale._id}-ext`,
                    ts: new Date(sale.extensionRequestedAt),
                    text: `${name} requested a payment extension`,
                    category: "tasks",
                });
            }

            // Extension approved
            if (sale.extensionApprovedAt) {
                events.push({
                    id: `${sale._id}-extok`,
                    ts: new Date(sale.extensionApprovedAt),
                    text: `Extension approved for ${name}`,
                    category: "tasks",
                });
            }
        });

        return events.sort((a, b) => b.ts - a.ts);
    }, [sales]);

    const filteredEvents = useMemo(() => {
        return timelineFilter === "all"
            ? timelineEvents
            : timelineEvents.filter((ev) => ev.category === timelineFilter);
    }, [timelineEvents, timelineFilter]);

    const displayedEvents = useMemo(() => {
        return filteredEvents.slice(0, visibleEvents);
    }, [filteredEvents, visibleEvents]);

    // ── Greeting ─────────────────────────────────────────────────────────────

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good Morning";
        if (h < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const Skeleton = ({ w = "100%", h = "1.8rem" }) => (
        <div className="skeleton" style={{ width: w, height: h, borderRadius: "8px" }} />
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "60px" }}>

            <BankSetupModal
                isOpen={isBankModalOpen}
                onClose={() => setIsBankModalOpen(false)}
                onSuccess={() => fetchStats()}
            />





            {/* Greeting + Kreddy strip */}
            <div className="kreddy-greeting-row" style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                {/* Left: Heading */}
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 950, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.04em" }}>
                        {greeting()}, {profile?.displayName || "Oga"}
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
                        Here is what Kreddy knows about your business right now.
                    </p>
                </div>

                {/* Right: Actions (Setup Progress Pill + Kreddy Button) */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flexShrink: 0 }}>
                    {/* Setup Progress Pill & Popover / Mobile Drawer */}
                    {completedSetupCount < setupItems.length && (
                        <>
                            <button
                                onClick={() => setIsSetupPopoverOpen(!isSetupPopoverOpen)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "rgba(76, 29, 149, 0.08)",
                                    border: "1px solid rgba(76, 29, 149, 0.25)",
                                    borderRadius: "40px",
                                    padding: "6px 14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)" }}>
                                    Complete setup ({completedSetupCount}/{setupItems.length})
                                </span>
                                <ChevronDown size={14} color="var(--primary)" style={{ transform: isSetupPopoverOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                            </button>

                            {isSetupPopoverOpen && (
                                <>
                                    {/* Backdrop overlay (mobile & desktop click-away) */}
                                    <div
                                        onClick={() => setIsSetupPopoverOpen(false)}
                                        onTouchMove={(e) => e.preventDefault()}
                                        style={{
                                            position: "fixed",
                                            inset: 0,
                                            backgroundColor: "rgba(15, 23, 42, 0.4)",
                                            backdropFilter: "blur(2px)",
                                            zIndex: 9998,
                                            touchAction: "none"
                                        }}
                                    />

                                    {/* Popover / Sheet Container */}
                                    <div
                                        className="setup-popover-container"
                                        style={{
                                            position: "fixed",
                                            zIndex: 9999,
                                            background: "white",
                                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>Account Setup Checklist</h4>
                                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>Complete these optional items anytime</p>
                                            </div>
                                            <button onClick={() => setIsSetupPopoverOpen(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {setupItems.map(item => (
                                                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#F8FAFC", padding: "12px 14px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: item.completed ? "#94A3B8" : "#0F172A", textDecoration: item.completed ? "line-through" : "none" }}>
                                                            {item.title}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748B", fontWeight: 400 }}>
                                                            {item.desc}
                                                        </p>
                                                    </div>

                                                    {item.completed ? (
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: "4px", background: "#DCFCE7", padding: "4px 10px", borderRadius: "20px" }}>
                                                            <Check size={14} /> Done
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setIsSetupPopoverOpen(false);
                                                                item.action();
                                                            }}
                                                            style={{
                                                                background: "var(--primary)",
                                                                border: "none",
                                                                borderRadius: "100px",
                                                                padding: "8px 16px",
                                                                fontSize: "0.78rem",
                                                                fontWeight: 700,
                                                                color: "white",
                                                                cursor: "pointer",
                                                                whiteSpace: "nowrap",
                                                                boxShadow: "0 4px 12px rgba(76, 29, 149, 0.25)",
                                                                transition: "all 0.2s ease"
                                                            }}
                                                        >
                                                            {item.actionLabel}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Compact Kreddy pill */}
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
                        {/* Mini avatar */}
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
                        {/* Label */}
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4C1D95", whiteSpace: "nowrap" }}>
                            {profile?.firstMerchantGreetingSent ? "Open Kreddy" : "Open WhatsApp"}
                        </span>
                    </button>
                </div>
            </div>
            <style>{`
                .setup-popover-container {
                    bottom: 0;
                    left: 0;
                    right: 0;
                    border-top-left-radius: 24px;
                    border-top-right-radius: 24px;
                    padding: 24px 20px 32px;
                    animation: setupSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @media (min-width: 641px) {
                    .setup-popover-container {
                        bottom: auto;
                        top: 95px;
                        right: 40px;
                        left: auto;
                        width: 340px;
                        border-radius: 20px;
                        border: 1px solid #E2E8F0;
                        padding: 20px;
                        animation: setupFadeIn 0.2s ease-out;
                    }
                }
                @keyframes setupSlideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes setupFadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes kreddy-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.3); }
                }
                @media (max-width: 640px) {
                    html.setup-sheet-open,
                    body.setup-sheet-open {
                        overflow: hidden !important;
                        height: 100vh !important;
                        touch-action: none !important;
                    }
                    body.setup-sheet-open .support-hub-container {
                        opacity: 0 !important;
                        pointer-events: none !important;
                        visibility: hidden !important;
                        transition: opacity 0.2s ease, visibility 0.2s ease;
                    }
                }
            `}</style>

            {/* ── 4 Snapshot Cards ─────────────────────────────────────────── */}
            <div className="dash-snap-grid">

                {/* 1. Collected Today */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "20px 24px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Collected Today
                    </span>
                    <div style={{ marginTop: "10px" }}>
                        {loading ? <Skeleton /> : (
                            <h2 style={{ fontSize: "1.7rem", fontWeight: 950, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
                                {fmt(collectedToday)}
                            </h2>
                        )}
                    </div>
                    {!loading && collectedToday === 0 && (
                        <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "6px", fontWeight: 600 }}>
                            No payments recorded today yet
                        </p>
                    )}
                </div>

                {/* 2. Outstanding */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "20px 24px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Outstanding
                    </span>
                    <div style={{ marginTop: "10px" }}>
                        {loading ? <Skeleton /> : (
                            <h2 style={{ fontSize: "1.7rem", fontWeight: 950, color: stats?.outstanding > 0 ? "#EF4444" : "#10B981", margin: 0, letterSpacing: "-0.02em" }}>
                                {fmt(stats?.outstanding)}
                            </h2>
                        )}
                    </div>
                    {!loading && stats?.outstanding === 0 && (
                        <p style={{ fontSize: "0.75rem", color: "#10B981", marginTop: "6px", fontWeight: 700 }}>
                            All invoices cleared 🎉
                        </p>
                    )}
                </div>

                {/* 3. Waiting For You */}
                <div
                    onClick={() => navigate("/workspace")}
                    style={{
                        background: waitingForYou.length > 0 ? "#FFFBEB" : "white",
                        border: `1px solid ${waitingForYou.length > 0 ? "#FDE68A" : "#E2E8F0"}`,
                        borderRadius: "20px", padding: "20px 24px", cursor: "pointer",
                        transition: "transform 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    title="Go to Workspace to act on these"
                >
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Waiting For You
                    </span>
                    <div style={{ marginTop: "10px" }}>
                        {loading ? <Skeleton /> : (
                            <h2 style={{ fontSize: "1.7rem", fontWeight: 950, color: waitingForYou.length > 0 ? "#D97706" : "#10B981", margin: 0, letterSpacing: "-0.02em" }}>
                                {waitingForYou.length}
                            </h2>
                        )}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "6px", fontWeight: 600 }}>
                        {waitingForYou.length === 0
                            ? "No pending decisions"
                            : `${waitingForYou.length} invoice${waitingForYou.length > 1 ? "s need" : " needs"} your action`}
                    </p>
                </div>

                {/* 4. Health (clickable) */}
                <div
                    onClick={() => setShowHealthModal(true)}
                    style={{
                        background: "white", border: "1px solid #E2E8F0",
                        borderRadius: "20px", padding: "20px 24px", cursor: "pointer",
                        transition: "transform 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    title="Click to see health breakdown"
                >
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Business Health
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                        <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: healthStatus.color, boxShadow: `0 0 8px ${healthStatus.color}80` }} />
                        {loading ? <Skeleton w="80px" /> : (
                            <h2 style={{ fontSize: "1.7rem", fontWeight: 950, color: healthStatus.color, margin: 0, letterSpacing: "-0.02em" }}>
                                {healthStatus.label}
                            </h2>
                        )}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "6px", fontWeight: 600 }}>
                        Tap to see breakdown
                    </p>
                </div>

            </div>

            {/* ── Main 2-column grid ───────────────────────────────────────── */}
            <div className="dash-main-grid">

                {/* Business Timeline */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                            Business Timeline
                        </h3>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {["all", "payments", "invoices", "tasks"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setTimelineFilter(f)}
                                    style={{
                                        border: "none",
                                        background: timelineFilter === f ? "var(--primary)" : "#F1F5F9",
                                        color: timelineFilter === f ? "white" : "#64748B",
                                        padding: "4px 10px", borderRadius: "8px",
                                        fontSize: "0.7rem", fontWeight: 800,
                                        cursor: "pointer", textTransform: "capitalize"
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                    <div className="skeleton" style={{ width: "9px", height: "9px", borderRadius: "50%", flexShrink: 0, marginTop: "6px" }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: "14px", width: "70%", borderRadius: "6px", marginBottom: "6px" }} />
                                        <div className="skeleton" style={{ height: "10px", width: "40%", borderRadius: "6px" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayedEvents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8" }}>
                            <Activity size={28} style={{ opacity: 0.3, marginBottom: "12px" }} />
                            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
                                {timelineFilter === "all"
                                    ? "No business activity yet. Ask Kreddy to record your first sale."
                                    : `No ${timelineFilter} events yet`}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ position: "relative", paddingLeft: "18px", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "20px" }}>
                                {displayedEvents.map((ev) => (
                                    <div key={ev.id} style={{ position: "relative" }}>
                                        <div style={{
                                            position: "absolute", left: "-23px", top: "5px",
                                            width: "9px", height: "9px", borderRadius: "50%",
                                            background: ev.category === "payments" ? "#10B981"
                                                : ev.category === "invoices" ? "var(--primary)"
                                                : "#F59E0B",
                                            border: "2px solid white",
                                            boxShadow: "0 0 0 1px #E2E8F0"
                                        }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>
                                                    {ev.text}
                                                </p>
                                                <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>
                                                    {timeAgo(ev.ts)}
                                                </span>
                                            </div>
                                            {ev.subtext && (
                                                <strong style={{ fontSize: "0.82rem", color: "#0F172A", flexShrink: 0, fontWeight: 800 }}>
                                                    {ev.subtext}
                                                </strong>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredEvents.length > visibleEvents && (
                                <button
                                    onClick={() => setVisibleEvents(prev => prev + 5)}
                                    style={{
                                        background: "white",
                                        border: "1px solid #E2E8F0",
                                        color: "var(--primary)",
                                        borderRadius: "12px",
                                        padding: "8px 16px",
                                        fontSize: "0.78rem",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        marginTop: "8px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "var(--primary)";
                                        e.currentTarget.style.background = "#F9F5FF";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#E2E8F0";
                                        e.currentTarget.style.background = "white";
                                    }}
                                >
                                    Load More Activity
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Waiting For You — Action Cards from real data */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                        Needs Your Attention
                    </h3>
                    <p style={{ margin: "0 0 20px 0", fontSize: "0.8rem", color: "#64748B", fontWeight: 600, lineHeight: 1.5 }}>
                        These are items Kreddy is waiting on your decision before it can continue.
                    </p>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[1, 2].map(i => (
                                <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "16px" }} />
                            ))}
                        </div>
                    ) : waitingForYou.length === 0 && overdueSales.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8" }}>
                            <CheckCircle2 size={28} color="#10B981" style={{ marginBottom: "12px" }} />
                            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#10B981" }}>
                                You're all caught up!
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#94A3B8", fontWeight: 500 }}>
                                No pending decisions right now.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* Extension requests from real sales */}
                            {waitingForYou.map((sale) => (
                                <div
                                    key={sale._id}
                                    style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "16px", padding: "14px 16px", display: "flex", gap: "12px" }}
                                >
                                    <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: "0 0 3px", fontSize: "0.83rem", fontWeight: 800, color: "#92400E" }}>
                                            Extension Request — {sale.customerName}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#B45309", lineHeight: 1.4 }}>
                                            {sale.invoiceNumber} · {fmt(sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0))} outstanding
                                            {sale.requestedExtensionDays ? ` · +${sale.requestedExtensionDays} days requested` : ""}
                                        </p>
                                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                            <button
                                                onClick={() => toast.success(`Extension approved for ${sale.customerName}. Tell Kreddy to confirm.`)}
                                                style={{ background: "#D97706", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => toast.info(`Declined. Tell Kreddy to notify ${sale.customerName}.`)}
                                                style={{ background: "white", border: "1px solid #FDE68A", color: "#92400E", borderRadius: "8px", padding: "6px 12px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Overdue invoices */}
                            {overdueSales.slice(0, 3).map((sale) => (
                                <div
                                    key={`overdue-${sale._id}`}
                                    style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "16px", padding: "14px 16px", display: "flex", gap: "12px" }}
                                >
                                    <Clock size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: "0 0 3px", fontSize: "0.83rem", fontWeight: 800, color: "#991B1B" }}>
                                            Overdue — {sale.customerName}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#B91C1C", lineHeight: 1.4 }}>
                                            {sale.invoiceNumber} · {fmt(sale.totalAmount - (sale.payments || []).reduce((s, p) => s + p.amount, 0))} still owed
                                            {sale.dueDate ? ` · Due ${new Date(sale.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(waitingForYou.length + overdueSales.length) > 4 && (
                        <button
                            onClick={() => navigate("/workspace")}
                            style={{ marginTop: "16px", background: "none", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: "12px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", width: "100%" }}
                        >
                            View all {waitingForYou.length + overdueSales.length} items in Workspace →
                        </button>
                    )}
                </div>

            </div>

            {/* ── Health Center Modal ────────────────────────────────────────── */}
            <AnimatePresence>
                {showHealthModal && (
                    <div
                        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}
                        onClick={() => setShowHealthModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ padding: "32px", maxWidth: "420px", width: "100%", background: "white", borderRadius: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.2)" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 950, color: "#0F172A" }}>
                                        Business Health
                                    </h4>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                                        Calculated from your real invoice data
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowHealthModal(false)}
                                    style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Status badge */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "14px 16px", marginBottom: "16px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: healthStatus.color, boxShadow: `0 0 8px ${healthStatus.color}80` }} />
                                <span style={{ fontWeight: 900, fontSize: "1rem", color: healthStatus.color }}>{healthStatus.label}</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 650, color: "#64748B" }}>Collection Rate</span>
                                    <strong style={{ color: collectionRate >= 75 ? "#10B981" : collectionRate >= 50 ? "#F59E0B" : "#EF4444", fontWeight: 900 }}>
                                        {collectionRate !== null ? `${collectionRate}%` : "—"}
                                    </strong>
                                </div>
                                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 650, color: "#64748B" }}>Avg Payment Delay</span>
                                    <strong style={{ color: "#1E293B", fontWeight: 900 }}>
                                        {avgPaymentDelay !== null ? `${avgPaymentDelay} days` : "—"}
                                    </strong>
                                </div>
                                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 650, color: "#64748B" }}>Overdue Invoices</span>
                                    <strong style={{ color: overdueSales.length > 0 ? "#EF4444" : "#10B981", fontWeight: 900 }}>
                                        {overdueSales.length === 0 ? "None" : `${overdueSales.length} overdue`}
                                    </strong>
                                </div>
                                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 650, color: "#64748B" }}>Total Invoices</span>
                                    <strong style={{ color: "#1E293B", fontWeight: 900 }}>
                                        {stats?.totalSales || sales.length}
                                    </strong>
                                </div>
                                <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 650, color: "#64748B" }}>Total Collected (All Time)</span>
                                    <strong style={{ color: "#10B981", fontWeight: 900 }}>
                                        {fmt(stats?.revenue)}
                                    </strong>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
