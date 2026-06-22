import React from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsProvider } from '../../../context/SettingsContext';
import CheckoutModal from '../../../components/payment/CheckoutModal';
import PasswordConfirmModal from '../../../components/payment/PasswordConfirmModal';
import { useSettings } from '../../../context/SettingsContext';
import { toast } from 'sonner';
import axios from 'axios';

/**
 * Inner wrapper that can access the SettingsContext
 * to render the shared modals (Checkout + Password Confirm).
 */
const SettingsModals = () => {
    const {
        showCheckout, setShowCheckout, selectedPlan,
        showPasswordModal, setShowPasswordModal, handlePayoutSave,
        currentUser, API_URL,
    } = useSettings();

    return (
        <>
            {showCheckout && (
                <CheckoutModal
                    plan={selectedPlan}
                    billingCycle="monthly"
                    userEmail={currentUser?.email}
                    onClose={() => setShowCheckout(false)}
                    onSuccess={async (reference) => {
                        try {
                            await axios.post(
                                `${API_URL}/payments/verify`,
                                { reference: reference.reference, plan: selectedPlan },
                                { withCredentials: true }
                            );
                            setTimeout(() => window.location.reload(), 2000);
                        } catch {
                            toast.error('Verification failed. Contact support.');
                        }
                    }}
                />
            )}
            <PasswordConfirmModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={handlePayoutSave}
            />
        </>
    );
};

/**
 * SettingsLayout
 * Wraps all /settings/* routes with SettingsProvider so all sub-pages
 * can share form state via useSettings().
 */
const SettingsLayout = () => {
    return (
        <SettingsProvider>
            <div className="animate-fade-in" style={{ maxWidth: '860px' }}>
                <Outlet />
            </div>
            <SettingsModals />
        </SettingsProvider>
    );
};

export default SettingsLayout;
