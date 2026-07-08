import { useState, useEffect, useMemo } from "react";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { Bot, MessageCircle, TrendingUp, Clock, AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { KREDDY_CONFIG } from "../../config";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Kreddy() {
    const { sales, fetchSales, stats, loading } = useSales();
    const { profile, updateProfile } = useAuth();
    const [commandText, setCommandText] = useState("");
    const [updatingPersonality, setUpdatingPersonality] = useState(false);

    useEffect(() => { fetchSales(); }, []);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good Morning";
        if (h < 17) return "Good Afternoon";
        return "Good Evening";
    };

    // ── All metrics derived from real sales ────────────────────────────────

    // Yesterday's collections
    const collectedYesterday = useMemo(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toDateString();
        return sales.reduce((sum, sale) =>
            sum + (sale.payments || []).filter(p => new Date(p.date || sale.createdAt).toDateString() === yStr)
                                       .reduce((s, p) => s + p.amount, 0), 0);
    }, [sales]);

    // Overdue sales
    const overdueSales = useMemo(() => {
        const now = new Date();
        return sales.filter(s => {
            const paid = (s.payments || []).reduce((sum, p) => sum + p.amount, 0);
            if (paid >= s.totalAmount || s.status === "paid" || s.lifecycleStatus === "PAID") return false;
            return s.dueDate && new Date(s.dueDate) < now;
        });
    }, [sales]);

    // Extension requests pending
    const extensionRequests = useMemo(() =>
        sales.filter(s => s.lifecycleStatus === "EXTENSION_REQUESTED"), [sales]);

    // Avg days to pay (fully paid sales only)
    const avgDaysToPay = useMemo(() => {
        const paid = sales.filter(s => s.payments?.length && (s.status === "paid" || s.lifecycleStatus === "PAID"));
        if (!paid.length) return null;
        const total = paid.reduce((sum, s) => {
            const created = new Date(s.createdAt).getTime();
            const firstPay = new Date(s.payments[0].date || s.createdAt).getTime();
            return sum + Math.max(0, (firstPay - created) / 86400000);
        }, 0);
        return (total / paid.length).toFixed(1);
    }, [sales]);

    // Best paying customer (highest total paid)
    const topCustomer = useMemo(() => {
        const map = {};
        sales.forEach(sale => {
            const name = sale.customerName;
            if (!name) return;
            const paid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
            map[name] = (map[name] || 0) + paid;
        });
        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
        return sorted[0] ? { name: sorted[0][0], total: sorted[0][1] } : null;
    }, [sales]);

    // Customer most overdue (highest outstanding + oldest dueDate)
    const mostOverdue = useMemo(() => {
        if (!overdueSales.length) return null;
        const sorted = [...overdueSales].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const s = sorted[0];
        const balance = s.totalAmount - (s.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return { name: s.customerName, balance, invoiceNumber: s.invoiceNumber };
    }, [overdueSales]);

    // Total invoices
    const totalInvoices = stats?.totalSales || sales.length;
    const outstanding = stats?.outstanding || 0;

    const enableReminders = profile?.assistantSettings?.enableReminders ?? true;
    const reminderTemplate = profile?.assistantSettings?.reminderTemplate || 'friendly';

    const handlePersonalityChange = async (fields) => {
        setUpdatingPersonality(true);
        try {
            const currentSettings = profile?.assistantSettings || {};
            await updateProfile({
                assistantSettings: {
                    ...currentSettings,
                    ...fields
                }
            });
            toast.success("Kreddy's personality updated!");
        } catch {
            toast.error("Failed to update Kreddy's personality");
        } finally {
            setUpdatingPersonality(false);
        }
    };

    const openKreddy = (msg) => {
        if (!msg.trim()) return;
        window.open(KREDDY_CONFIG.getLink(msg.trim()), "_blank", "noopener,noreferrer");
    };

    const handleCommandSubmit = (e) => {
        if (e.key === 'Enter' && commandText.trim()) {
            openKreddy(commandText);
            setCommandText("");
        }
    };

    return (
        <div style={{ paddingBottom: "60px" }} className="animate-fade-in">

            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 950, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.03em" }}>
                    Kreddy
                </h1>
                <p style={{ color: "#64748B", fontWeight: 600, fontSize: "0.88rem" }}>
                    Your AI business assistant. Chat, configure reminders, and monitor operations.
                </p>
            </div>

            {/* 🔍 Kreddy Search/Command Input */}
            <div style={{ position: "relative", marginBottom: "24px", maxWidth: "600px" }}>
                <input
                    type="text"
                    placeholder='Ask or tell Kreddy: "Who still owes me?" or "Add fuel expense"...'
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    onKeyDown={handleCommandSubmit}
                    style={{
                        width: "100%",
                        background: "white",
                        border: "1.5px solid #E2E8F0",
                        borderRadius: "16px",
                        padding: "16px 54px 16px 20px",
                        fontSize: "0.95rem",
                        color: "#1E293B",
                        outline: "none",
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(15,23,42,0.03)",
                        boxSizing: "border-box"
                    }}
                />
                <button
                    onClick={() => { openKreddy(commandText); setCommandText(""); }}
                    style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                >
                    <Send size={16} />
                </button>
            </div>

            {/* Morning Brief — real data */}
            <div style={{ background: "linear-gradient(135deg, rgba(76,29,149,0.05) 0%, rgba(124,58,237,0.02) 100%)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "24px", padding: "28px", marginBottom: "24px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                    <Bot size={28} />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 950, color: "var(--primary)" }}>
                        {greeting()}, {profile?.displayName || "Oga"}
                    </h3>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: "14px", width: i === 1 ? "90%" : "65%", borderRadius: "6px" }} />)}
                        </div>
                    ) : (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.7, fontWeight: 600 }}>
                            {collectedYesterday > 0
                                ? `Yesterday you collected ${fmt(collectedYesterday)}. `
                                : "No payments were recorded yesterday. "}
                            {outstanding > 0
                                ? `You currently have ${fmt(outstanding)} outstanding across ${totalInvoices} invoice${totalInvoices !== 1 ? "s" : ""}.`
                                : totalInvoices > 0
                                    ? `All ${totalInvoices} invoice${totalInvoices !== 1 ? "s" : ""} are fully settled — great work.`
                                    : "No invoices recorded yet. Talk to Kreddy to get started."}
                            {overdueSales.length > 0
                                ? ` ${overdueSales.length} invoice${overdueSales.length > 1 ? "s are" : " is"} overdue and need your attention.`
                                : ""}
                            {mostOverdue ? ` ${mostOverdue.name} has the oldest outstanding balance.` : ""}
                        </p>
                    )}
                    <button
                        onClick={() => openKreddy("Give me my morning business brief")}
                        style={{ marginTop: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", padding: "9px 16px", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}
                    >
                        <MessageCircle size={15} /> Talk to Kreddy
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "20px" }}>

                {/* Business Metrics (real) */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "22px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                        Business Snapshot
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <MetricRow icon={<TrendingUp size={16} color="#10B981" />} label="Total Collected (All Time)" value={fmt(stats?.revenue)} loading={loading} />
                        <MetricRow icon={<Clock size={16} color="#F59E0B" />} label="Avg. Days to Payment" value={avgDaysToPay !== null ? `${avgDaysToPay} days` : "—"} loading={loading} />
                        <MetricRow icon={<AlertTriangle size={16} color="#EF4444" />} label="Overdue Invoices" value={overdueSales.length === 0 ? "None" : `${overdueSales.length} overdue`} valueColor={overdueSales.length > 0 ? "#EF4444" : "#10B981"} loading={loading} />
                        <MetricRow icon={<CheckCircle2 size={16} color="#6366F1" />} label="Best Customer" value={topCustomer ? `${topCustomer.name} (${fmt(topCustomer.total)})` : "—"} loading={loading} />
                    </div>
                </div>

                {/* Action Suggestions — real data */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "22px" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                        Ask Kreddy To…
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Contextual suggestions from real data */}
                        {mostOverdue && (
                            <SuggestionRow
                                label={`Send reminder to ${mostOverdue.name}`}
                                sub={`${mostOverdue.invoiceNumber} · ${fmt(mostOverdue.balance)} owed`}
                                urgent
                                onAct={() => openKreddy(`Send payment reminder to ${mostOverdue.name} for invoice ${mostOverdue.invoiceNumber}`)}
                            />
                        )}
                        {extensionRequests.slice(0, 2).map(s => (
                            <SuggestionRow
                                key={s._id}
                                label={`Handle extension request — ${s.customerName}`}
                                sub={`${s.invoiceNumber}${s.requestedExtensionDays ? ` · +${s.requestedExtensionDays} days` : ""}`}
                                onAct={() => openKreddy(`Help me review the extension request from ${s.customerName} for invoice ${s.invoiceNumber}`)}
                            />
                        ))}

                        {/* Static useful actions that are always relevant */}
                        <SuggestionRow
                            label="Record a new sale"
                            sub="Create a new invoice via WhatsApp"
                            onAct={() => openKreddy("I want to record a new sale")}
                        />
                        <SuggestionRow
                            label="Check who owes me money"
                            sub="Get a summary of all outstanding balances"
                            onAct={() => openKreddy("Show me all customers with outstanding balances")}
                        />
                        <SuggestionRow
                            label="Send bulk reminders"
                            sub="Nudge all overdue customers at once"
                            onAct={() => openKreddy("Send reminders to all customers with overdue invoices")}
                        />
            </div>
                </div>
            </div>

            {/* 🤖 Kreddy Personality Configuration (Infused from settings) */}
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "24px", maxWidth: "600px", marginTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <Bot size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                        Kreddy Reminder Personality
                    </h3>
                </div>

                {/* Smart reminders toggle */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0",
                    gap: "12px", flexWrap: "nowrap", marginBottom: "20px"
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, color: "#1E293B", marginBottom: "2px", margin: 0, fontSize: "0.85rem" }}>Smart Reminder Drafts</p>
                        <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
                            Kreddy will prepare draft reminders for you to send when a balance is due.
                        </p>
                    </div>
                    <div style={{ position: "relative", display: "inline-block", width: "56px", height: "30px", flexShrink: 0 }}>
                        <input
                            type="checkbox"
                            id="kreddy-reminder-toggle"
                            checked={enableReminders}
                            disabled={updatingPersonality}
                            onChange={(e) => handlePersonalityChange({ enableReminders: e.target.checked })}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <label htmlFor="kreddy-reminder-toggle" style={{
                            position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: enableReminders ? "var(--primary)" : "#CBD5E1", borderRadius: "34px", transition: ".4s"
                        }}>
                            <span style={{
                                position: "absolute", height: "22px", width: "22px", left: "4px", bottom: "4px",
                                backgroundColor: "white", borderRadius: "50%", transition: ".4s",
                                transform: enableReminders ? "translateX(26px)" : "translateX(0)",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }} />
                        </label>
                    </div>
                </div>

                {/* Friendly vs Formal options */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    {[
                        { id: 'friendly', title: 'Friendly', desc: 'Soft, professional tone. Best for regulars.' },
                        { id: 'formal', title: 'Formal', desc: 'Strict & clear tone. Best for overdue accounts.' },
                    ].map(opt => {
                        const isChosen = reminderTemplate === opt.id;
                        return (
                            <button
                                key={opt.id}
                                disabled={updatingPersonality}
                                onClick={() => handlePersonalityChange({ reminderTemplate: opt.id })}
                                style={{
                                    padding: '16px', borderRadius: '16px', border: '2px solid',
                                    borderColor: isChosen ? 'var(--primary)' : '#F1F5F9',
                                    background: isChosen ? 'rgba(76, 29, 149, 0.02)' : 'white',
                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isChosen ? 'var(--primary)' : '#CBD5E1' }} />
                                    <p style={{ margin: 0, fontWeight: 900, color: isChosen ? 'var(--primary)' : '#475569', fontSize: '0.85rem' }}>{opt.title}</p>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 600, lineHeight: 1.4 }}>{opt.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginBottom: "40px" }} />

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .skeleton { background: linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%); background-size: 200% 100%; animation: sk 1.5s infinite; }
                @keyframes sk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            `}</style>
        </div>
    );
}

function MetricRow({ icon, label, value, valueColor = "#0F172A", loading }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "13px", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {icon}
                </div>
                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 650 }}>{label}</span>
            </div>
            {loading
                ? <div className="skeleton" style={{ width: "70px", height: "16px", borderRadius: "6px" }} />
                : <strong style={{ fontSize: "0.85rem", fontWeight: 900, color: valueColor }}>{value}</strong>
            }
        </div>
    );
}

function SuggestionRow({ label, sub, urgent, onAct }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: urgent ? "#FEF2F2" : "#F8FAFC",
            border: `1px solid ${urgent ? "#FECACA" : "#E2E8F0"}`,
            borderRadius: "13px", padding: "12px 14px", gap: "12px"
        }}>
            <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: urgent ? "#991B1B" : "#1E293B", lineHeight: 1.3 }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: urgent ? "#B91C1C" : "#94A3B8", fontWeight: 600 }}>{sub}</p>
            </div>
            <button
                onClick={onAct}
                style={{ background: urgent ? "#EF4444" : "#0F172A", color: "white", border: "none", borderRadius: "10px", padding: "7px 13px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
            >
                Ask Kreddy
            </button>
        </div>
    );
}
