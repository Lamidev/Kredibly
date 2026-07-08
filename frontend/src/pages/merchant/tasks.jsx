import { useState, useEffect, useMemo } from "react";
import { useSales } from "../../context/SaleContext";
import { CheckCircle, Clock, Trash2, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Persistence ──────────────────────────────────────────────────────────────

const LS_KEY = "kredibly_tasks_v1";
const loadTasks = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } };
const saveTasks = (list) => localStorage.setItem(LS_KEY, JSON.stringify(list));

// ─── Component ────────────────────────────────────────────────────────────────

export default function Tasks() {
    const { sales, fetchSales } = useSales();
    const [manualTasks, setManualTasks] = useState(loadTasks);
    const [newText, setNewText] = useState("");

    useEffect(() => { fetchSales(); }, []);
    useEffect(() => { saveTasks(manualTasks); }, [manualTasks]);

    // Auto-generate tasks from real sales data (overdue, extension requests)
    const autoTasks = useMemo(() => {
        const now = new Date();
        const items = [];

        sales.forEach((sale) => {
            const paid = (sale.payments || []).reduce((s, p) => s + p.amount, 0);
            const balance = sale.totalAmount - paid;
            if (balance <= 0 || sale.status === "paid" || sale.lifecycleStatus === "PAID") return;

            // Overdue invoice
            if (sale.dueDate && new Date(sale.dueDate) < now) {
                items.push({
                    id: `auto-overdue-${sale._id}`,
                    type: "overdue",
                    text: `Follow up with ${sale.customerName} — ${sale.invoiceNumber} is overdue`,
                    sub: `₦${balance.toLocaleString()} still owed · Due ${new Date(sale.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
                });
            }

            // Extension request
            if (sale.lifecycleStatus === "EXTENSION_REQUESTED") {
                items.push({
                    id: `auto-ext-${sale._id}`,
                    type: "extension",
                    text: `Approve or decline extension — ${sale.customerName}`,
                    sub: `${sale.invoiceNumber}${sale.requestedExtensionDays ? ` · +${sale.requestedExtensionDays} days requested` : ""}`,
                });
            }
        });

        return items;
    }, [sales]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newText.trim()) return;
        const task = { id: Date.now(), text: newText.trim(), done: false, createdAt: new Date().toISOString() };
        const updated = [task, ...manualTasks];
        setManualTasks(updated);
        setNewText("");
        toast.success("Task added");
    };

    const handleToggle = (id) => {
        setManualTasks(manualTasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const handleDelete = (id) => {
        setManualTasks(manualTasks.filter(t => t.id !== id));
        toast.success("Task removed");
    };

    const pending = manualTasks.filter(t => !t.done);
    const done = manualTasks.filter(t => t.done);

    return (
        <div style={{ paddingBottom: "60px" }} className="animate-fade-in">

            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 950, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.03em" }}>
                    Tasks
                </h1>
                <p style={{ color: "#64748B", fontWeight: 600, fontSize: "0.88rem" }}>
                    Action items from your invoices, plus your own notes and follow-ups.
                </p>
            </div>

            {/* Add task */}
            <form onSubmit={handleAdd} style={{ display: "flex", gap: "10px", marginBottom: "28px", maxWidth: "520px" }}>
                <input
                    type="text"
                    placeholder="Add a task (e.g. Call supplier, Check bank…)"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "0.85rem", outline: "none", color: "#1E293B", background: "white", transition: "border-color 0.2s" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--primary)"}
                    onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                />
                <button type="submit" style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: "14px", padding: "12px 20px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, transition: "background 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#3B1670"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
                >
                    <Plus size={16} /> Add
                </button>
            </form>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>

                {/* Kreddy Auto-Tasks from real data */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "22px" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} color="#F59E0B" />
                        From Your Invoices
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                        Automatically generated from overdue payments and pending decisions.
                    </p>

                    {autoTasks.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0", color: "#94A3B8" }}>
                            <CheckCircle size={24} color="#10B981" style={{ marginBottom: "10px" }} />
                            <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#10B981" }}>All clear!</p>
                            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#94A3B8" }}>No overdue invoices or pending decisions.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {autoTasks.map((task, idx) => (
                                <div key={task.id} style={{
                                    display: "flex", gap: "12px", alignItems: "flex-start",
                                    padding: "16px 0",
                                    borderBottom: idx === autoTasks.length - 1 ? "none" : "1px solid #F1F5F9"
                                }}>
                                    <div style={{
                                        width: "8px", height: "8px", borderRadius: "50%",
                                        background: task.type === "overdue" ? "#EF4444" : "#F59E0B",
                                        marginTop: "6px", flexShrink: 0
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 750, color: "#1E293B", lineHeight: 1.4 }}>
                                            {task.text}
                                        </p>
                                        <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                                            {task.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Manual Tasks */}
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "22px" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 900, color: "#0F172A" }}>
                        My Tasks
                        {pending.length > 0 && (
                            <span style={{ marginLeft: "8px", background: "#F1F5F9", color: "#64748B", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "20px" }}>
                                {pending.length} pending
                            </span>
                        )}
                    </h3>
                    <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                        Personal reminders and follow-ups you've added.
                    </p>

                    {manualTasks.length === 0 ? (
                        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#CBD5E1", padding: "28px 0", fontWeight: 600 }}>
                            Add your first task above ↑
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                            {/* Pending first */}
                            {pending.map((task) => (
                                <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
                            ))}
                            {/* Divider if both exist */}
                            {pending.length > 0 && done.length > 0 && (
                                <div style={{ fontSize: "0.7rem", color: "#CBD5E1", fontWeight: 700, textAlign: "center", padding: "4px 0" }}>
                                    — Completed —
                                </div>
                            )}
                            {done.map((task) => (
                                <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

function TaskRow({ task, onToggle, onDelete }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "white", border: "1px solid #E2E8F0",
            borderRadius: "14px", padding: "12px 16px",
            opacity: task.done ? 0.6 : 1, transition: "all 0.25s ease",
            boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
        }}>
            <button
                onClick={() => onToggle(task.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: task.done ? "#10B981" : "#CBD5E1", flexShrink: 0, padding: 0, display: "flex", alignItems: "center" }}
            >
                <CheckCircle size={20} fill={task.done ? "#10B981" : "none"} />
            </button>
            <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "#1E293B", flex: 1, textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>
                {task.text}
            </p>
            <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", color: "#EF4444", opacity: 0.6, cursor: "pointer", padding: 4, flexShrink: 0, transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
