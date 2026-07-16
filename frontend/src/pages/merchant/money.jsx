import { useState, useEffect, useMemo } from "react";
import { useSales } from "../../context/SaleContext";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Trash2, Plus, Bot } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { KREDDY_CONFIG } from "../../config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;

const CATEGORIES = ["Logistics", "Deliveries", "Inventory", "Rent", "Salaries", "Other"];

// localStorage persistence key
const LS_KEY = "kredibly_expenses_v1";

const loadExpenses = () => {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
        return [];
    }
};

const saveExpenses = (list) => {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Money() {
    const { profile } = useAuth();
    const { sales, fetchSales, stats, loading } = useSales();
    const [expenses, setExpenses] = useState(loadExpenses);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Logistics");
    const [visibleReceipts, setVisibleReceipts] = useState(5);

    useEffect(() => { fetchSales(); }, []);

    // Persist expenses to localStorage whenever they change
    useEffect(() => { saveExpenses(expenses); }, [expenses]);

    // Income = all actual payments recorded across all sales (real, non-zero only)
    const totalIncome = useMemo(() =>
        sales.reduce((sum, sale) =>
            sum + (sale.payments || []).filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0), 0
        ), [sales]);

    const outstanding = stats?.outstanding ?? 0;

    const totalExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

    const netProfit = totalIncome - totalExpenses;

    // V2: Paystack removed. Squad stays dormant. Nomba is now primary.
    const INFRA_METHODS = ['Nomba', 'Squad', 'Bank Transfer', 'Card'];
    const infrastructureCollected = useMemo(() =>
        sales.reduce((sum, sale) =>
            sum + (sale.payments || []).filter(p => p.amount > 0 && INFRA_METHODS.some(m => (p.method || '').includes(m)))
                                       .reduce((s, p) => s + p.amount, 0), 0
        ), [sales]);

    // Flat list of all real payment receipts — latest first, non-zero only
    const paymentLedger = useMemo(() => {
        const rows = [];
        sales.forEach((sale) => {
            (sale.payments || []).filter(p => p.amount > 0).forEach((p) => {
                rows.push({
                    id: `${sale._id}-${p._id || Math.random()}`,
                    label: sale.customerName || 'Unknown',
                    invoice: sale.invoiceNumber,
                    amount: p.amount,
                    method: p.method || 'Cash',
                    date: p.date || sale.createdAt,
                });
            });
        });
        return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sales]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!title.trim() || !amount) return;
        const n = parseFloat(amount);
        if (isNaN(n) || n <= 0) { toast.error("Enter a valid amount"); return; }
        const entry = { id: Date.now(), title: title.trim(), amount: n, category, date: new Date().toISOString() };
        const updated = [entry, ...expenses];
        setExpenses(updated);
        setTitle("");
        setAmount("");
        toast.success(`₦${n.toLocaleString()} expense logged`);
    };

    const handleDelete = (id) => {
        setExpenses(expenses.filter((e) => e.id !== id));
        toast.success("Expense removed");
    };

    const Skeleton = ({ h = "40px", w = "100%" }) => (
        <div className="skeleton" style={{ height: h, width: w, borderRadius: "10px" }} />
    );

    return (
        <div style={{ paddingBottom: "60px" }} className="animate-fade-in">

            {/* Header */}
            <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 950, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.03em" }}>
                        Money
                    </h1>
                    <p style={{ color: "#64748B", fontWeight: 600, fontSize: "0.88rem", margin: 0 }}>
                        Real income from your invoices. Log expenses to see your net position.
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

            {/* 3 Snapshot Cards */}
            <div className="money-snap-grid">

                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "18px", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Total Collected</span>
                        <div style={{ background: "#D1FAE5", color: "#10B981", padding: "5px", borderRadius: "8px" }}><ArrowUpRight size={14} /></div>
                    </div>
                    {loading ? <Skeleton h="32px" /> : <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: "#0F172A" }}>{fmt(totalIncome)}</h2>}
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#10B981", fontWeight: 700 }}>
                        From {paymentLedger.length} payment{paymentLedger.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "18px", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Outstanding</span>
                        <div style={{ background: "#FEE2E2", color: "#EF4444", padding: "5px", borderRadius: "8px" }}><ArrowDownRight size={14} /></div>
                    </div>
                    {loading ? <Skeleton h="32px" /> : <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: outstanding > 0 ? "#EF4444" : "#10B981" }}>{fmt(outstanding)}</h2>}
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#94A3B8", fontWeight: 700 }}>Still owed by customers</p>
                </div>

                <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.02) 100%)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "18px", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#064E3B", textTransform: "uppercase" }}>Via Payment Link</span>
                        <div style={{ background: "#D1FAE5", color: "#10B981", padding: "5px", borderRadius: "8px" }}><ArrowUpRight size={14} /></div>
                    </div>
                    {loading ? <Skeleton h="32px" /> : <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, color: "#065F46" }}>{fmt(infrastructureCollected)}</h2>}
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#10B981", fontWeight: 700 }}>Collected via Nomba / Kredibly</p>
                </div>

            </div>

            {/* Income Ledger from real payments (Full-Width) */}
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "22px", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                    Payment Receipts
                </h3>
                <p style={{ margin: "-8px 0 16px", fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                    Every payment Kreddy has recorded across all your invoices.
                </p>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[1, 2, 3].map(i => <Skeleton key={i} h="56px" />)}
                    </div>
                ) : paymentLedger.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8" }}>
                        <ArrowUpRight size={28} style={{ opacity: 0.3, marginBottom: "10px" }} />
                        <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 600 }}>No payments recorded yet.</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>Payments appear here when Kreddy records them.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                        {paymentLedger.slice(0, visibleReceipts).map((row) => (
                            <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", borderRadius: "12px", padding: "11px 14px", border: "1px solid #E2E8F0" }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: "#1E293B" }}>{row.label}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#94A3B8" }}>
                                        {row.invoice} · {row.method} · {new Date(row.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                    </p>
                                </div>
                                <strong style={{ color: "#10B981", fontWeight: 900, fontSize: "0.88rem" }}>+{fmt(row.amount)}</strong>
                            </div>
                        ))}
                        {paymentLedger.length > visibleReceipts && (
                            <button
                                onClick={() => setVisibleReceipts(prev => prev + 5)}
                                style={{
                                    background: "white",
                                    border: "1px solid #E2E8F0",
                                    color: "var(--primary)",
                                    borderRadius: "14px",
                                    padding: "10px 20px",
                                    fontWeight: 800,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    margin: "12px auto 0",
                                    display: "block",
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
                                Load More Receipts
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .skeleton { background: linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%); background-size: 200% 100%; animation: sk 1.5s infinite; }
                @keyframes sk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            `}</style>
        </div>
    );
}
