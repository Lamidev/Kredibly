import { createContext, useContext, useState } from "react";
import axios from "axios";

const SaleContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7050/api";

export const SaleProvider = ({ children }) => {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(null);
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

    const createSale = async (saleData) => {
        try {
            const res = await axios.post(`${API_URL}/sales`, saleData, { withCredentials: true });
            if (res.data.success) {
                setSales([res.data.data, ...sales]);
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
                setSales(sales.map(s => s._id === saleId ? res.data.data : s));
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
                setSales(sales.map(s => s._id === saleId ? res.data.data : s));
                fetchStats();
                return res.data;
            }
        } catch (err) {
            throw err;
        }
    };

    return (
        <SaleContext.Provider value={{
            sales, stats, loading, fetchSales, fetchStats, createSale, addPayment, updateSale
        }}>
            {children}
        </SaleContext.Provider>
    );
};

export const useSales = () => useContext(SaleContext);
