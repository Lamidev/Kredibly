import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/check-auth`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                setProfile(res.data.profile);
            }
        } catch (err) {
            // Not authenticated, silent fail
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                setProfile(res.data.profile);
                return res.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
            throw err;
        }
    };

    const registerUser = async (name, email, password) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
            throw err;
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
            setUser(null);
            setProfile(null);
        } catch (err) {
            // Logout failed
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const res = await axios.post(`${API_URL}/business/profile`, profileData, { withCredentials: true });
            if (res.data.success) {
                setProfile(res.data.data);
                return res.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Profile update failed");
            throw err;
        }
    };

    const verifyEmail = async (code) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/verify-email`, { code });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed");
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{
            user, profile, loading, error,
            login, registerUser, verifyEmail, logout, updateProfile, checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
