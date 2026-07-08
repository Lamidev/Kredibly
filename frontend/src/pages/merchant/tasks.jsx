import { useState, useEffect, useMemo } from "react";
import { useSales } from "../../context/SaleContext";
import { CheckCircle, Clock, Trash2, Plus, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { listenToEvent, stopListeningToEvent } from "../../utils/socket";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Tasks() {
    const { sales, fetchSales } = useSales();
    const [dbReminders, setDbReminders] = useState([]);
    const [newText, setNewText] = useState("");

    const fetchReminders = async () => {
        try {
            const res = await axios.get(`${API_URL}/business/reminders`, { withCredentials: true });
            if (res.data.success) {
                // Filter only standalone tasks/reminders (exclude customer auto payment reminders)
                const tasksOnly = res.data.data.filter(r => r.recipientType === "merchant");
                setDbReminders(tasksOnly);
            }
        } catch (err) {
            console.error("Failed to fetch reminders", err);
        }
    };

    useEffect(() => {
        fetchSales();
        fetchReminders();

        const handleSocketTaskUpdate = () => {
            fetchReminders();
        };

        listenToEvent("task_updated", handleSocketTaskUpdate);
        return () => {
            stopListeningToEvent("task_updated", handleSocketTaskUpdate);
        };
    }, []);

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

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newText.trim()) return;

        try {
            const payload = {
                description: newText.trim(),
                type: "task",
                triggerDate: new Date().toISOString(), // Default trigger date is immediately set so it shows on the list
            };

            const res = await axios.post(`${API_URL}/business/reminders`, payload, { withCredentials: true });
            if (res.data.success) {
                setDbReminders(prev => [res.data.data, ...prev]);
                setNewText("");
                toast.success("Task added! 🚀");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add task");
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const res = await axios.delete(`${API_URL}/business/reminders/${id}`, { withCredentials: true });
            if (res.data.success) {
                setDbReminders(prev => prev.filter(r => r._id !== id));
                toast.success("Task completed! 🎉");
            }
        } catch (err) {
            toast.error("Failed to complete task");
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await axios.delete(`${API_URL}/business/reminders/${id}`, { withCredentials: true });
            if (res.data.success) {
                setDbReminders(prev => prev.filter(r => r._id !== id));
                toast.success("Task deleted");
            }
        } catch (err) {
            toast.error("Failed to delete task");
        }
    };

    const pending = dbReminders.filter(t => {
        if (t.status === "delivered") return false;
        // Auto-complete/hide tasks whose trigger date is older than 24 hours (so old reminders don't stack up as pending)
        if (t.triggerDate && new Date(t.triggerDate) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return false;
        }
        return true;
    });

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

                {/* Manual Tasks (Now real backend reminders) */}
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
                        Personal reminders and follow-ups synced with Kreddy on WhatsApp.
                    </p>

                    {pending.length === 0 ? (
                        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#CBD5E1", padding: "28px 0", fontWeight: 600 }}>
                            Add your first task above ↑
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                            {pending.map((task) => (
                                <TaskRow key={task._id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
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
    const triggerDateFriendly = useMemo(() => {
        if (!task.triggerDate) return "";
        const dateObj = new Date(task.triggerDate);
        return dateObj.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }, [task.triggerDate]);

    const isDone = task.status === "delivered";

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "white", border: "1px solid #E2E8F0",
            borderRadius: "14px", padding: "12px 16px",
            opacity: isDone ? 0.6 : 1, transition: "all 0.25s ease",
            boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
        }}>
            <button
                onClick={() => onToggle(task._id, task.status)}
                style={{ background: "none", border: "none", cursor: "pointer", color: isDone ? "#10B981" : "#CBD5E1", flexShrink: 0, padding: 0, display: "flex", alignItems: "center" }}
            >
                <CheckCircle size={20} fill={isDone ? "#10B981" : "none"} />
            </button>
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "#1E293B", textDecoration: isDone ? "line-through" : "none", lineHeight: 1.4 }}>
                    {task.description}
                </p>
                {task.triggerDate && !isDone && (
                    <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} /> Notify: {triggerDateFriendly} {task.recurrence !== "none" ? `(${task.recurrence})` : ""}
                    </p>
                )}
            </div>
            <button onClick={() => onDelete(task._id)} style={{ background: "none", border: "none", color: "#EF4444", opacity: 0.6, cursor: "pointer", padding: 4, flexShrink: 0, transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
