import { createContext, useContext, useState } from "react";
import axios from "axios";

const SaleContext = createContext();
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

export const SaleProvider = ({ children }) => {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/sales`, { withCredentials: true });
            if (res.data.success) setSales(res.data.data);
        } catch (err) {
            // Silently fail
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/dashboard-stats`, { withCredentials: true });
            if (res.data.success) setStats(res.data.data);
        } catch (err) {
            // Silently fail
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/analytics`, { withCredentials: true });
            if (res.data.success) setAnalytics(res.data.data);
        } catch (err) {
            // Silently fail
        }
    };

    const createSale = async (saleData) => {
        try {
            const res = await axios.post(`${API_URL}/sales`, saleData, { withCredentials: true });
            if (res.data.success) {
                setSales(prev => [res.data.data, ...prev]);
                fetchStats();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    const addPayment = async (saleId, paymentData) => {
        try {
            const res = await axios.post(`${API_URL}/sales/${saleId}/payment`, paymentData, { withCredentials: true });
            if (res.data.success) {
                setSales(prev => prev.map(s => s._id === saleId ? res.data.data : s));
                fetchStats();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    const updateSale = async (saleId, updateData) => {
        try {
            const res = await axios.put(`${API_URL}/sales/${saleId}`, updateData, { withCredentials: true });
            if (res.data.success) {
                setSales(prev => prev.map(s => s._id === saleId ? res.data.data : s));
                fetchStats();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    const deleteSale = async (saleId) => {
        try {
            const res = await axios.delete(`${API_URL}/sales/${saleId}`, { withCredentials: true });
            if (res.data.success) {
                setSales(prev => prev.filter(s => s._id !== saleId));
                fetchStats();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    const migrateInvoices = async () => {
        try {
            const res = await axios.post(`${API_URL}/sales/migrate-invoices`, {}, { withCredentials: true });
            if (res.data.success) {
                await fetchSales();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    return (
        <SaleContext.Provider value={{
            sales, stats, analytics, loading, fetchSales, fetchStats, fetchAnalytics, createSale, addPayment, updateSale, deleteSale, migrateInvoices
        }}>
            {children}
        </SaleContext.Provider>
    );
};

export const useSales = () => useContext(SaleContext);
