import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("kredibly_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [profile, setProfile] = useState(() => {
        const savedProfile = localStorage.getItem("kredibly_profile");
        return savedProfile ? JSON.parse(savedProfile) : null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Automatically attach Bearer token to all outgoing requests if present
        const reqInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("kredibly_token");
                if (token && !config.headers["Authorization"]) {
                    config.headers["Authorization"] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Handle expired/unauthorized token globally
        const resInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    console.warn("🔐 Session expired or unauthorized. Logging out...");
                    setUser(null);
                    setProfile(null);
                    localStorage.removeItem("kredibly_user");
                    localStorage.removeItem("kredibly_profile");
                    localStorage.removeItem("kredibly_token");
                }
                return Promise.reject(error);
            }
        );

        checkAuth();

        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem("kredibly_token");
            
            // If we have no saved session at all, skip the network call
            if (!token && !localStorage.getItem("kredibly_user")) {
                setLoading(false);
                return;
            }

            const res = await axios.get(`${API_URL}/auth/check-auth`, { 
                withCredentials: true,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.data.success) {
                setUser(res.data.user);
                setProfile(res.data.profile);
                localStorage.setItem("kredibly_user", JSON.stringify(res.data.user));
                if (res.data.profile) {
                    localStorage.setItem("kredibly_profile", JSON.stringify(res.data.profile));
                } else {
                    // Profile is null — clear stale localStorage profile so routing is correct
                    localStorage.removeItem("kredibly_profile");
                }
            } else {
                // Server explicitly said "not authenticated"
                setUser(null);
                setProfile(null);
                localStorage.removeItem("kredibly_user");
                localStorage.removeItem("kredibly_profile");
                localStorage.removeItem("kredibly_token");
            }
        } catch (err) {
            const status = err.response?.status;
            
            // ONLY clear session if the server explicitly said "unauthorized"
            // For network errors, timeouts, or server downtime — keep the user logged in
            if (status === 401 || status === 403) {
                setUser(null);
                setProfile(null);
                localStorage.removeItem("kredibly_user");
                localStorage.removeItem("kredibly_profile");
                localStorage.removeItem("kredibly_token");
            }
            // For any other error (network, 500, timeout), keep the hydrated state
            // The user stays on the dashboard and we retry on the next navigation
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
                localStorage.setItem("kredibly_user", JSON.stringify(res.data.user));
                if (res.data.profile) {
                    localStorage.setItem("kredibly_profile", JSON.stringify(res.data.profile));
                }
                if (res.data.token) {
                    localStorage.setItem("kredibly_token", res.data.token);
                }
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
            localStorage.removeItem("kredibly_user");
            localStorage.removeItem("kredibly_profile");
            localStorage.removeItem("kredibly_token");
        } catch (err) {
            // Logout failed
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const res = await axios.post(`${API_URL}/business/profile`, profileData, { withCredentials: true });
            if (res.data.success) {
                setProfile(res.data.data);
                // 🛡️ Persist to localStorage so profile survives browser refresh/reopen.
                // Without this, the hydration on app reload would find null in localStorage,
                // and if checkAuth had any delay/error, the user would be routed to /onboarding.
                if (res.data.data) {
                    localStorage.setItem("kredibly_profile", JSON.stringify(res.data.data));
                }
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
            const res = await axios.post(`${API_URL}/auth/verify-email`, { code }, { withCredentials: true });
            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem("kredibly_token", res.data.token);
                }
                await checkAuth();
            }
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed");
            throw err;
        }
    };

    const resendVerificationCode = async (email) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/resend-verification`, { email });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend code");
            throw err;
        }
    };

    const forgotPassword = async (email) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Forgot password failed");
            throw err;
        }
    };

    const resetPassword = async (token, password) => {
        try {
            setError(null);
            const res = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || "Reset password failed");
            throw err;
        }
    };

    const subscribeToPushNotifications = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn("Push notifications are not supported on this browser");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.log("Push notification permission denied");
                return;
            }

            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.warn("VAPID Public Key is missing in environment variables");
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Save subscription to backend
            await axios.post(`${API_URL}/auth/push-subscription`, { subscription }, { withCredentials: true });
            console.log("Successfully subscribed to push notifications");
            
        } catch (error) {
            console.error("Error subscribing to push notifications:", error);
        }
    };

    const unsubscribeFromPushNotifications = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();
                // Notify backend to remove the subscription
                await axios.post(`${API_URL}/auth/push-unsubscribe`, { endpoint }, { withCredentials: true });
                console.log("Successfully unsubscribed from push notifications");
            }
        } catch (error) {
            console.error("Error unsubscribing from push notifications:", error);
        }
    };

    // Helper for VAPID key conversion
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    return (
        <AuthContext.Provider value={{
            user, profile, loading, error,
            login, registerUser, verifyEmail, resendVerificationCode, logout, updateProfile, checkAuth,
            forgotPassword, resetPassword,
            subscribeToPushNotifications, unsubscribeFromPushNotifications
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context || {
        user: null,
        profile: null,
        loading: true,
        error: null,
        login: async () => {},
        registerUser: async () => {},
        verifyEmail: async () => {},
        resendVerificationCode: async () => {},
        logout: () => {},
        updateProfile: async () => {},
        checkAuth: async () => {},
        forgotPassword: async () => {},
        resetPassword: async () => {},
        subscribeToPushNotifications: async () => {},
        unsubscribeFromPushNotifications: async () => {}
    };
};
