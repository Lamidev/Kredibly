import { useState, useEffect } from "react";
import { Landmark, Search, CheckCircle2, Loader2, X, ShieldCheck } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

export default function BankSetupModal({ isOpen, onClose, onSuccess }) {
    const { profile, updateProfile } = useAuth();
    const [banks, setBanks] = useState([]);
    const [searchBank, setSearchBank] = useState("");
    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [banksLoading, setBanksLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchBanks = async () => {
            setBanksLoading(true);
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                const res = await axios.get(`${API_URL}/business/banks`, { withCredentials: true });
                if (res.data.success) {
                    const sorted = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
                    setBanks(sorted);
                }
            } catch (err) {
                console.error("Failed to fetch banks", err);
            } finally {
                setBanksLoading(false);
            }
        };
        fetchBanks();
    }, [isOpen]);

    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            resolveBankName();
        } else {
            setAccountName("");
        }
    }, [accountNumber, selectedBank]);

    const resolveBankName = async () => {
        setIsResolving(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.get(`${API_URL}/business/resolve-account/${selectedBank.code}/${accountNumber}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setAccountName(res.data.data.account_name);
                toast.success(`Account Verified: ${res.data.data.account_name}`);
            }
        } catch (err) {
            toast.error("Could not verify account name. Check the account number and bank.");
            setAccountName("");
        } finally {
            setIsResolving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedBank || !accountNumber || !accountName) {
            return toast.error("Please verify your bank details first.");
        }
        setSubmitting(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/business/payout-settings`, {
                bankName: selectedBank.name,
                bankCode: selectedBank.code,
                accountNumber,
                accountName
            }, { withCredentials: true });

            if (res.data.success) {
                toast.success("Payout bank account connected!");
                if (updateProfile) {
                    await updateProfile({
                        bankDetails: {
                            bankName: selectedBank.name,
                            bankCode: selectedBank.code,
                            accountNumber,
                            accountName
                        }
                    });
                }
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save bank details.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(searchBank.toLowerCase())).slice(0, 8);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                borderRadius: "28px",
                maxWidth: "480px",
                width: "100%",
                padding: "32px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        background: "#F1F5F9",
                        border: "none",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#64748B"
                    }}
                >
                    <X size={18} />
                </button>

                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ width: "56px", height: "56px", background: "rgba(109, 40, 217, 0.08)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--primary)" }}>
                        <Landmark size={28} />
                    </div>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", marginBottom: "6px" }}>Connect Payout Bank Account</h3>
                    <p style={{ fontSize: "0.88rem", color: "#64748B", margin: 0 }}>Customer payments will be swept directly to this bank account.</p>
                </div>

                <form onSubmit={handleSave}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0F172A", marginBottom: "8px", display: "block" }}>Select Bank</label>
                        <div style={{ position: "relative" }}>
                            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 2 }} />
                            <input
                                type="text"
                                style={{ width: "100%", height: "52px", paddingLeft: "48px", borderRadius: "14px", border: "1.5px solid #CBD5E1", fontSize: "0.95rem", fontWeight: 500, outline: "none" }}
                                placeholder={banksLoading ? "Loading banks..." : "Search Bank (e.g. GTB, Kuda, Access)"}
                                value={selectedBank ? selectedBank.name : searchBank}
                                onChange={e => { setSearchBank(e.target.value); setSelectedBank(null); }}
                                onClick={() => { if (selectedBank) setSelectedBank(null); }}
                                disabled={banksLoading}
                            />
                            {searchBank && !selectedBank && filteredBanks.length > 0 && (
                                <div style={{ position: "absolute", top: "58px", left: 0, right: 0, background: "white", border: "1px solid #CBD5E1", borderRadius: "14px", zIndex: 100, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", maxHeight: "220px", overflowY: "auto" }}>
                                    {filteredBanks.map(b => (
                                        <div
                                            key={b.code}
                                            onMouseDown={() => { setSelectedBank(b); setSearchBank(""); setAccountName(""); }}
                                            style={{ padding: "12px 18px", cursor: "pointer", borderBottom: "1px solid #F1F5F9", fontWeight: 500, fontSize: "0.9rem" }}
                                        >
                                            {b.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0F172A", marginBottom: "8px", display: "block" }}>10-Digit Account Number</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                style={{ width: "100%", height: "52px", paddingLeft: "16px", borderRadius: "14px", border: "1.5px solid #CBD5E1", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "0.15em", outline: "none" }}
                                placeholder="0123456789"
                                maxLength={10}
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").trim())}
                            />
                            {isResolving && <Loader2 size={18} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--primary)", animation: "spin 1s linear infinite" }} />}
                        </div>
                    </div>

                    {accountName && (
                        <div style={{ background: "#F0FDF4", padding: "14px 18px", borderRadius: "14px", border: "1px solid #BBF7D0", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "center" }}>
                            <CheckCircle2 size={18} color="#16A34A" />
                            <span style={{ fontWeight: 600, color: "#166534", fontSize: "0.9rem" }}>{accountName}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !accountName}
                        style={{
                            width: "100%",
                            height: "56px",
                            borderRadius: "16px",
                            background: accountName ? "var(--primary)" : "#E2E8F0",
                            color: accountName ? "white" : "#94A3B8",
                            fontWeight: 700,
                            fontSize: "1rem",
                            border: "none",
                            cursor: accountName ? "pointer" : "not-allowed",
                            transition: "all 0.2s"
                        }}
                    >
                        {submitting ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> : "Connect Account"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <ShieldCheck size={14} color="#10B981" /> Verified via NIBSS & Nomba Bank Gateway
                    </p>
                </div>
            </div>
        </div>
    );
}
