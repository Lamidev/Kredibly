/**
 * SettingsContext
 * Provides shared form state, save handlers, and profile data
 * to all /settings/* sub-pages so each page is lightweight.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import { isValidNigerianPhone, formatPhoneForDB } from '../utils/validation';
import { API_URL } from '../config';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const { user: currentUser, profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ── Form state (shared across all settings pages) ─────────────────────────
    const [form, setForm] = useState({
        displayName: profile?.displayName || '',
        whatsappNumber: profile?.whatsappNumber || '',
        enableReminders: profile?.assistantSettings?.enableReminders ?? true,
        reminderTemplate: profile?.assistantSettings?.reminderTemplate || 'friendly',
        bankName: profile?.bankDetails?.bankName || '',
        bankCode: '',
        accountNumber: profile?.bankDetails?.accountNumber || '',
        accountName: profile?.bankDetails?.accountName || '',
        logoUrl: profile?.logoUrl || '',
        staffNumbers: profile?.staffNumbers || [],
        prefersGatewayFeeAbsorption: profile?.prefersGatewayFeeAbsorption ?? true,
    });

    // Re-sync form if profile loads after mount
    useEffect(() => {
        if (profile) {
            setForm(prev => ({
                ...prev,
                displayName: profile.displayName || prev.displayName,
                whatsappNumber: profile.whatsappNumber || prev.whatsappNumber,
                enableReminders: profile.assistantSettings?.enableReminders ?? prev.enableReminders,
                reminderTemplate: profile.assistantSettings?.reminderTemplate || prev.reminderTemplate,
                bankName: profile.bankDetails?.bankName || prev.bankName,
                accountNumber: profile.bankDetails?.accountNumber || prev.accountNumber,
                accountName: profile.bankDetails?.accountName || prev.accountName,
                logoUrl: profile.logoUrl || prev.logoUrl,
                staffNumbers: profile.staffNumbers || prev.staffNumbers,
                prefersGatewayFeeAbsorption: profile.prefersGatewayFeeAbsorption ?? prev.prefersGatewayFeeAbsorption,
            }));
        }
    }, [profile]);

    // ── Saving ─────────────────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        if (!isValidNigerianPhone(form.whatsappNumber)) {
            setSaving(false);
            return toast.error('Invalid WhatsApp number format');
        }
        try {
            await updateProfile({
                displayName: form.displayName,
                whatsappNumber: formatPhoneForDB(form.whatsappNumber),
                assistantSettings: {
                    enableReminders: form.enableReminders,
                    reminderTemplate: form.reminderTemplate,
                },
                logoUrl: form.logoUrl,
                staffNumbers: form.staffNumbers,
                prefersGatewayFeeAbsorption: form.prefersGatewayFeeAbsorption,
            });
            toast.success('Settings saved!');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // ── Logo upload ────────────────────────────────────────────────────────────
    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/common/upload-logo`, formData, { withCredentials: true });
            if (res.data.success) {
                const newLogoUrl = res.data.url;
                setForm(prev => ({ ...prev, logoUrl: newLogoUrl }));
                await updateProfile({ logoUrl: newLogoUrl });
                toast.success('Logo uploaded & saved!');
            }
        } catch {
            toast.error('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    // ── Banks ──────────────────────────────────────────────────────────────────
    const [banks, setBanks] = useState([]);
    const [fetchingBanks, setFetchingBanks] = useState(false);

    useEffect(() => {
        const fetchBanks = async () => {
            setFetchingBanks(true);
            try {
                const res = await axios.get(`${API_URL}/business/banks`, { withCredentials: true });
                if (res.data.success) {
                    const list = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
                    setBanks(list);
                    if (form.bankName && !form.bankCode) {
                        const match = list.find(b => b.name === form.bankName);
                        if (match) setForm(prev => ({ ...prev, bankCode: match.code }));
                    }
                }
            } catch { /* silent */ }
            finally { setFetchingBanks(false); }
        };
        fetchBanks();
    }, []);

    // ── Account resolution ─────────────────────────────────────────────────────
    const [resolving, setResolving] = useState(false);
    const [isEditingPayout, setIsEditingPayout] = useState(!profile?.bankDetails?.accountNumber);

    useEffect(() => {
        const resolve = async () => {
            if (!isEditingPayout) return;
            if (form.accountNumber.length === 10 && form.bankCode) {
                setResolving(true);
                try {
                    const res = await axios.get(`${API_URL}/business/resolve-account/${form.bankCode}/${form.accountNumber}`, { withCredentials: true });
                    if (res.data.success) {
                        setForm(prev => ({ ...prev, accountName: res.data.data.account_name }));
                    } else {
                        setForm(prev => ({ ...prev, accountName: '' }));
                        toast.error(res.data.message || 'Could not verify account name.');
                    }
                } catch (err) {
                    setForm(prev => ({ ...prev, accountName: '' }));
                    toast.error(err.response?.data?.message || 'Invalid account number for this bank.');
                } finally { setResolving(false); }
            } else if (form.accountNumber.length > 0 && form.accountNumber.length < 10) {
                if (form.accountName) setForm(prev => ({ ...prev, accountName: '' }));
            }
        };
        resolve();
    }, [form.accountNumber, form.bankCode, isEditingPayout]);

    // ── Payout save (password-protected) ──────────────────────────────────────
    const [isPayoutSaving, setIsPayoutSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handlePayoutSave = async (password) => {
        setIsPayoutSaving(true);
        try {
            const res = await axios.post(`${API_URL}/business/payout-settings`, {
                bankCode: form.bankCode,
                accountNumber: form.accountNumber,
                bankName: form.bankName,
                password,
            }, { withCredentials: true });
            if (res.data.success) {
                const updated = res.data.data?.bankDetails || {};
                setForm(prev => ({ ...prev, accountName: updated.accountName || '' }));
                toast.success(res.data.message);
                setShowPasswordModal(false);
                setIsEditingPayout(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save payout settings');
            throw err;
        } finally { setIsPayoutSaving(false); }
    };

    // ── Bank lock countdown ────────────────────────────────────────────────────
    const [lockCountdown, setLockCountdown] = useState('');
    useEffect(() => {
        const lockUntil = profile?.bankDetails?.bankDetailsLockUntil;
        if (!lockUntil || new Date(lockUntil) <= new Date()) { setLockCountdown(''); return; }
        const timer = setInterval(() => {
            const diff = new Date(lockUntil) - new Date();
            if (diff <= 0) { setLockCountdown(''); clearInterval(timer); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setLockCountdown(`${h}h ${m}m ${s}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [profile?.bankDetails?.bankDetailsLockUntil]);

    // ── KYC ───────────────────────────────────────────────────────────────────
    const [kycType, setKycType] = useState(profile?.kyc?.method && profile.kyc.method !== 'none' ? profile.kyc.method : 'bvn');
    const [idNumber, setIdNumber] = useState('');
    const [dob, setDob] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyKYC = async () => {
        if (!idNumber || idNumber.length < 10) return toast.error('Please enter a valid ID number');
        setIsVerifying(true);
        try {
            const res = await axios.post(`${API_URL}/business/kyc/verify`, { type: kycType, idNumber, dob }, { withCredentials: true });
            if (res.data.success) {
                toast.success('Identity Verified Successfully!');
                await updateProfile({});
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed. Check your details.');
        } finally { setIsVerifying(false); }
    };

    // ── Push notifications ─────────────────────────────────────────────────────
    const [pushStatus, setPushStatus] = useState(() => {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    });
    const [isSubscribing, setIsSubscribing] = useState(false);
    const { subscribeToPushNotifications, unsubscribeFromPushNotifications } = useAuth();

    const handlePushToggle = async () => {
        setIsSubscribing(true);
        try {
            if (pushStatus === 'granted') {
                await unsubscribeFromPushNotifications();
                setPushStatus('default');
                toast.success('Notifications turned off.');
            } else {
                await subscribeToPushNotifications();
                setPushStatus(Notification.permission);
                if (Notification.permission === 'granted') toast.success('Notifications enabled!');
            }
        } catch { toast.error('Action failed'); }
        finally { setIsSubscribing(false); }
    };

    // ── Staff ─────────────────────────────────────────────────────────────────
    const [newStaffPhone, setNewStaffPhone] = useState('');
    const staffLimit = profile?.plan === 'chairman' ? 'Up to 3 Staff' : (profile?.plan === 'oga' ? 'Up to 1 Staff' : 'Owner Only');

    const addStaff = () => {
        if (!newStaffPhone) return;
        const planLimit = profile?.plan === 'chairman' ? 3 : (profile?.plan === 'oga' ? 1 : 0);
        if (form.staffNumbers.length >= planLimit) {
            return toast.error(`Plan Limit Reached: Your ${profile?.plan?.toUpperCase()} Plan allows only ${planLimit} staff.`);
        }
        if (!isValidNigerianPhone(newStaffPhone)) return toast.error('Invalid staff phone number');
        const formatted = formatPhoneForDB(newStaffPhone);
        if (form.staffNumbers.includes(formatted)) return toast.error('Number already added');
        setForm({ ...form, staffNumbers: [...form.staffNumbers, formatted] });
        setNewStaffPhone('');
    };

    const removeStaff = (phone) => setForm({ ...form, staffNumbers: form.staffNumbers.filter(p => p !== phone) });

    // ── Checkout ──────────────────────────────────────────────────────────────
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('oga');

    // ── Checkout success handler (redirected back from payment) ───────────────
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('checkout') === 'success') {
            toast.success('Payment Received! Validating your upgrade...');
            navigate('/settings/plan', { replace: true });
            import('canvas-confetti').then(m => m.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } }));
        }
    }, [location, navigate]);

    return (
        <SettingsContext.Provider value={{
            form, setForm, saving, handleSave,
            uploading, handleLogoUpload,
            banks, fetchingBanks,
            resolving, isEditingPayout, setIsEditingPayout,
            isPayoutSaving, showPasswordModal, setShowPasswordModal, handlePayoutSave,
            lockCountdown,
            kycType, setKycType, idNumber, setIdNumber, dob, setDob, isVerifying, handleVerifyKYC,
            pushStatus, isSubscribing, handlePushToggle,
            newStaffPhone, setNewStaffPhone, staffLimit, addStaff, removeStaff,
            showCheckout, setShowCheckout, selectedPlan, setSelectedPlan,
            profile, currentUser, API_URL,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
    return ctx;
};
