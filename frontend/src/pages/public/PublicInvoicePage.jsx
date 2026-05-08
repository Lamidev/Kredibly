import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Download, 
    Share2, 
    Calendar, 
    Clock, 
    Building2, 
    CheckCircle2, 
    ShieldCheck as ShieldCheckIcon, 
    AlertCircle, 
    Loader2,
    FileText,
    Image as ImageIcon,
    ArrowRight,
    CheckCircle,
    CreditCard,
    Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PaymentSuccessModal from '../../components/payment/PaymentSuccessModal';
import { initiateSocketConnection, disconnectSocket, listenToEvent, stopListeningToEvent } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import TransactionSlip from '../../components/payment/TransactionSlip';
import ShareActionSheet from '../../components/payment/ShareActionSheet';

const PublicInvoicePage = () => {
    const { id } = useParams();
    const { profile } = useAuth();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [paymentMode, setPaymentMode] = useState('full');
    const [customAmount, setCustomAmount] = useState('');
    const [customAmountDisplay, setCustomAmountDisplay] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
    const [recentPaymentDate, setRecentPaymentDate] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [generating, setGenerating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('nomba'); // Default to Nomba
    const [nombaData, setNombaData] = useState(null);
    const [loadingNomba, setLoadingNomba] = useState(false);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isAutoVerifying, setIsAutoVerifying] = useState(false);
    const [modalDismissed, setModalDismissed] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [shareMenuType, setShareMenuType] = useState('invoice'); // 'invoice' or 'slip'
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
    
    // 🛡️ Refs for stale closure protection & deduplication
    const saleRef = useRef(sale);
    const isProcessingSuccess = useRef(false);

    useEffect(() => {
        saleRef.current = sale;
        // Reset success flag if invoice is not paid (e.g. on new invoice load)
        if (sale && calcCurrentBalance(sale) > 0) {
            isProcessingSuccess.current = false;
        }
    }, [sale]);

    // ─── DERIVED STATE & HELPERS ───
    const calcCurrentBalance = (s) => {
        if (!s) return 0;
        const paid = s.paidAmount || s.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const bal = s.totalAmount - paid;
        return bal < 1 ? 0 : bal;
    };
    
    // 🛡️ Pre-initialize derived values used in hooks
    const balance = calcCurrentBalance(sale);
    const isPaid = sale ? (balance <= 0) : false;
    const settlementDate = isPaid && sale.payments?.length > 0 
        ? new Date(sale.payments[sale.payments.length - 1].date)
        : (sale?.createdAt ? new Date(sale.createdAt) : new Date());
    const isOverdue = sale && !isPaid && sale.dueDate && new Date(sale.dueDate) < new Date();
    const isDebtRecovery = sale && !isPaid && (sale.status === 'partial' || isOverdue);

    const handleManualVerification = () => runPaymentVerification(false);

    /**
     * 🛡️ UNIFIED PAYMENT VERIFICATION LOGIC
     * Defined early to avoid TDZ (Temporal Dead Zone) in useEffect hooks.
     */
    const runPaymentVerification = async (silent = false) => {
        if (!nombaData?.reference || (verifyingPayment && !silent)) return;
        
        if (!silent) {
            setVerifyingPayment(true);
            setIsAutoVerifying('manual'); // Mark as manual verification
        }

        try {
            const res = await axios.post(`${API_URL}/payments/verify-nomba-payment`, {
                accountRef: nombaData.reference,
                saleId: sale._id
            });
            
            if (res.data.success) {
                // Refresh sale data to reflect updated ledger
                const saleRes = await axios.get(`${API_URL}/sales/${id}`);
                if (saleRes.data.success) {
                    const latestSale = saleRes.data.data;
                    const finalBalance = latestSale.totalAmount - (latestSale.paidAmount || latestSale.payments?.reduce((s, p) => s + p.amount, 0) || 0);
                    
                    // Only update state if something actually changed (prevents unnecessary re-renders)
                    const currentSale = saleRef.current || sale;
                    const oldPaid = currentSale.paidAmount || currentSale.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                    const newPaid = latestSale.paidAmount || latestSale.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                    
                    if (newPaid > oldPaid) {
                        // 🛡️ PREVENT REPEATED SUCCESS UI
                        if (isProcessingSuccess.current && finalBalance <= 0) {
                            console.log("ℹ️ Success already being processed. Skipping redundant trigger.");
                            return;
                        }

                        console.log(`✅ ${silent ? 'Auto' : 'Manual'} verification found NEW payment!`);
                        setSale(latestSale);
                        
                        const lastPayment = latestSale.payments?.length > 0 
                            ? latestSale.payments[latestSale.payments.length - 1] 
                            : null;
                        
                        // 📝 Capture transaction details for the Slip (Always capture, even for partial)
                        setCurrentTransaction({
                            amount: lastPayment?.amount || (latestSale.totalAmount - (latestSale.paidAmount || 0)),
                            reference: lastPayment?.reference || nombaData?.reference || `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                            date: new Date(),
                            balance: finalBalance,
                            isFullyPaid: finalBalance <= 0
                        });

                        if (finalBalance <= 0) {
                            isProcessingSuccess.current = true;
                            // 🛡️ Show the premium verification overlay immediately
                            setIsAutoVerifying('manual');
                            
                            setLastPaymentAmount(lastPayment?.amount || (latestSale.totalAmount - (latestSale.paidAmount || 0)));
                            setRecentPaymentDate(new Date());
                            setCustomAmount('');
                            setCustomAmountDisplay('');
                            setNombaData(null); 

                            // Give the user a moment to see the "Verifying" state
                            setTimeout(() => {
                                setIsAutoVerifying(false);
                                setShowSuccessModal(true);
                                
                                // Celebrate full settlement
                                confetti({
                                    particleCount: 200,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#4C1D95', '#10B981', '#F59E0B']
                                });
                            }, 2500);
                        } else {
                            // Partial Payment Success Flow
                            setIsAutoVerifying('manual');
                            setLastPaymentAmount(lastPayment?.amount || 0);
                            
                            // 🛡️ Clear Nomba VA & amount fields even for partial payments
                            setNombaData(null); 
                            setCustomAmount('');
                            setCustomAmountDisplay('');

                            setTimeout(() => {
                                setIsAutoVerifying(false);
                                setShowSuccessModal(true);
                                toast.success(`Partial Payment Received!`, { id: 'payment-update' });
                            }, 2000);
                        }
                    }
                }
            } else if (!silent) {
                toast.error(res.data.message || "Payment not seen yet. Please wait a moment.");
                setIsAutoVerifying(false);
            }
        } catch (err) {
            if (!silent) {
                console.error("Verification error:", err);
                toast.error("Status check failed. Please try again or wait for automatic update.");
                setIsAutoVerifying(false);
            }
        } finally {
            if (!silent) setVerifyingPayment(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        const fetchSale = async () => {
            try {
                const res = await axios.get(`${API_URL}/sales/${id}`);
                
                if (res.data.success) {
                    setSale(res.data.data);
                } else {
                    setSale(null);
                }
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setSale(null);
            } finally {
                setLoading(false);
            }
        };
        fetchSale();
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    // 🔄 Smart Polling Fallback: Proactively check Nomba status every 25s if webhook/socket fails
    useEffect(() => {
        if (!nombaData || !sale || !id || showSuccessModal || isPaid) return;

        console.log("🔄 Starting smart polling for Nomba status...");
        
        const pollInterval = setInterval(async () => {
            // Extra safety: Check state again before hitting API
            if (nombaData && !verifyingPayment && !isProcessingSuccess.current && !isPaid) {
                // We perform a 'silent' check (no UI overlay) to keep it smooth
                await runPaymentVerification(true);
            }
        }, 25000); // Check every 25s as a fail-safe

        return () => {
            console.log("🛑 Stopping smart polling...");
            clearInterval(pollInterval);
        };
    }, [nombaData, sale?._id, showSuccessModal, isPaid, id]);

    // 🔌 Real-time Socket Setup for live payment verification
    useEffect(() => {
        if (!sale || !sale._id || loading) return;
        
        const businessId = sale.businessId?._id || sale.businessId;
        // Pass both businessId and the current invoice ID/number to the socket
        initiateSocketConnection(String(businessId).toLowerCase(), id);

        const onSaleUpdated = async (data) => {
            console.log("🔌 Socket Update Received:", data);
            
            // 🛡️ Deduplication: If we are already verifying or just finished, ignore socket duplicate
            if (isProcessingSuccess.current || showSuccessModal) {
                console.log("ℹ️ Skipping socket update: Already in success flow.");
                return;
            }

            if (data && data.invoiceId && (data.invoiceId === id || data.invoiceId === sale.invoiceNumber)) {
                try {
                    // 🛡️ Trigger the premium verification overlay immediately
                    setIsAutoVerifying('auto');
                    
                    const res = await axios.get(`${API_URL}/sales/${id}`);
                    if (res.data.success) {
                        const latestSale = res.data.data;
                        const oldPaid = sale.paidAmount || sale.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                        const newPaid = latestSale.paidAmount || latestSale.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                        
                        // 🛡️ Only proceed if the balance actually changed (deduplication)
                        if (newPaid <= oldPaid) {
                            console.log("ℹ️ Socket event received but balance unchanged. Skipping update.");
                            return;
                        }

                        const newBalance = latestSale.totalAmount - newPaid;

                        setSale(latestSale);
                        
                        // Clear Nomba VA whenever a payment is received (partial or full)
                        setNombaData(null); 
                        setCustomAmount('');
                        setCustomAmountDisplay('');
                        
                        // 📝 Capture transaction details for the Slip (Always)
                        const lastPayment = latestSale.payments?.length > 0 
                            ? latestSale.payments[latestSale.payments.length - 1] 
                            : null;

                        setCurrentTransaction({
                            amount: lastPayment?.amount || data.amountPaid || 0,
                            reference: lastPayment?.reference || data.reference || `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                            date: new Date(),
                            balance: newBalance,
                            isFullyPaid: newBalance <= 0
                        });

                        setLastPaymentAmount(lastPayment?.amount || data.amountPaid || 0);
                        setRecentPaymentDate(new Date());

                        // Show verifying overlay for effect
                        setIsAutoVerifying(true);
                        
                        // Give the user 2.5s of "Verification" bliss
                        setTimeout(() => {
                            setIsAutoVerifying(false);
                            setShowSuccessModal(true);
                            
                            if (newBalance <= 0) {
                                // 🎊 Celebrate full payment with confetti!
                                confetti({
                                    particleCount: 150,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#4C1D95', '#10B981', '#F59E0B']
                                });
                            } else {
                                toast.success(`Payment Received: ₦${(data.amountPaid || 0).toLocaleString()} 💰`, { id: 'payment-update' });
                            }
                        }, 2500);
                    }
                } catch (err) {
                    console.error("Socket fetch detail error:", err);
                }
            }
        };

        const onMerchantUpdated = async (data) => {
            console.log("🏢 Merchant Settings Updated:", data);
            try {
                const res = await axios.get(`${API_URL}/sales/${id}`);
                if (res.data.success) {
                    setSale(res.data.data);
                    // Reset custom amount and Nomba data if settings changed (fees might differ now)
                    setNombaData(null);
                    setCustomAmount('');
                    setCustomAmountDisplay('');
                }
            } catch (err) {
                console.error("Failed to refresh sale on merchant update", err);
            }
        };

        listenToEvent("sale_updated", onSaleUpdated);
        listenToEvent("merchant_updated", onMerchantUpdated);

        return () => {
            stopListeningToEvent("sale_updated", onSaleUpdated);
            stopListeningToEvent("merchant_updated", onMerchantUpdated);
            disconnectSocket();
        };
    }, [id, sale?._id, loading]);

    // 🏆 INITIAL MOUNT SUCCESS CHECK: If it's already paid on load
    useEffect(() => {
        if (!sale || loading) return;
        
        const bal = calcCurrentBalance(sale);
        if (sale.payments?.length > 0) {
            const lastPayment = sale.payments[sale.payments.length - 1];
            
            // 🛡️ Ensure Transaction Slip is always ready for the last payment
            if (!currentTransaction) {
                setCurrentTransaction({
                    amount: lastPayment.amount,
                    reference: lastPayment.reference || 'SYSTEM',
                    date: new Date(lastPayment.date),
                    balance: bal,
                    isFullyPaid: bal <= 0
                });
            }

            if (!showSuccessModal && !modalDismissed) {
                // Show modal automatically only if the last payment was within the last 10 minutes
                const isRecent = (new Date() - new Date(lastPayment.date)) < (10 * 60 * 1000);
                if (isRecent) {
                    isProcessingSuccess.current = true;
                    setLastPaymentAmount(lastPayment.amount);
                    setRecentPaymentDate(new Date(lastPayment.date));
                    setShowSuccessModal(true);
                }
            }
        }
    }, [sale?._id, loading]);

    // ⏱️ COUNTDOWN TIMER LOGIC
    useEffect(() => {
        if (!nombaData || !nombaData.expiresAt) return;

        const target = new Date(nombaData.expiresAt).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("Expired");
                setNombaData(null); // Clear expired data
                return;
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [nombaData]);

    const handleShare = () => {
        setShareMenuType('invoice');
        setIsShareMenuOpen(true);
    };

    const handleShareSlip = () => {
        setShareMenuType('slip');
        setIsShareMenuOpen(true);
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-download-target');
        if (!element) return;
        
        setGenerating('pdf');
        toast.loading('Preparing official PDF...', { id: 'pdf-gen' });
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('receipt-download-target');
                    if (el) el.style.position = 'static';
                }
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`Receipt_KR-${sale.invoiceNumber}.pdf`);
            toast.success('Official PDF saved!', { id: 'pdf-gen' });
        } catch (err) {
            console.error("PDF Generate Error:", err);
            toast.error("PDF generation failed: " + err.message, { id: 'pdf-gen' });
        } finally {
            setGenerating(false);
            // 🛡️ Ensure loading state is cleared if not already replaced by success/error
            setTimeout(() => toast.dismiss('pdf-gen'), 3000);
        }
    };

    const handleDownloadImage = async (isSlip = false) => {
        const targetId = isSlip ? 'transaction-slip-target' : 'receipt-download-target';
        const element = document.getElementById(targetId);
        if (!element) return;
        
        setGenerating('image');
        toast.loading(isSlip ? 'Generating transaction slip...' : 'Capturing invoice image...', { id: 'image-gen' });
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2, // 🛡️ Reduced from 3 to 2 for better compatibility
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                scrollY: -window.scrollY, // 🛡️ Offset scroll for better capture
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById(targetId);
                    if (el) el.style.position = 'static';
                }
            });
            
            const link = document.createElement('a');
            link.download = isSlip ? `Receipt_${sale.invoiceNumber}.png` : `Invoice_KR-${sale.invoiceNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success(isSlip ? 'Transaction slip saved!' : 'Image saved to downloads!', { id: 'image-gen' });
        } catch (err) {
            console.error("Image Generate Error:", err);
            toast.error("Image capture failed: " + err.message, { id: 'image-gen' });
        } finally {
            setGenerating(false);
            // 🛡️ Ensure loading state is cleared
            setTimeout(() => toast.dismiss('image-gen'), 2000);
        }
    };

    const handleShareImage = async (isSlip = false, forceDownload = false) => {
        const targetId = isSlip ? 'transaction-slip-target' : 'receipt-download-target';
        const element = document.getElementById(targetId);
        if (!element) return;

        const merchantPhone = sale?.businessId?.whatsappNumber || sale?.businessId?.phoneNumber;
        const cleanPhone = merchantPhone ? merchantPhone.replace(/\D/g, '') : '';
        const amountText = currentTransaction ? `₦${currentTransaction.amount.toLocaleString()}` : `₦${lastPaymentAmount?.toLocaleString()}`;
        const text = isSlip 
            ? `Hi ${sale?.businessId?.displayName}, I've just made a payment of ${amountText} for Invoice #${sale?.invoiceNumber}. \n\nView my verified receipt here: ${window.location.origin}/i/${sale?.invoiceNumber}`
            : `Hi ${sale?.businessId?.displayName}, I'm sharing the details of Invoice #${sale?.invoiceNumber}. \n\nView it here: ${window.location.origin}/i/${sale?.invoiceNumber}`;

        setGenerating('share');
        toast.loading('Preparing image for sharing...', { id: 'share-gen' });

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                scrollY: -window.scrollY,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById(targetId);
                    if (el) el.style.position = 'static';
                }
            });

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            const fileName = isSlip ? `Receipt_${sale.invoiceNumber}.png` : `Invoice_KR-${sale.invoiceNumber}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            // 📱 Check for Native File Sharing Support
            const canShare = navigator.canShare && navigator.canShare({ files: [file] });

            if (!canShare) {
                // FALLBACK 1: Try sharing as text/link only if files aren't supported
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: isSlip ? `Receipt from ${sale?.businessId?.displayName}` : `Invoice from ${sale?.businessId?.displayName}`,
                            text: text,
                            url: `${window.location.origin}/i/${sale?.invoiceNumber}`
                        });
                        toast.success('Link shared successfully!');
                        setGenerating(false);
                        return;
                    } catch (sErr) {
                        console.warn("Text share failed", sErr);
                    }
                }

                // FALLBACK 2: Download directly
                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                toast.success(isSlip ? 'Transaction slip saved!' : 'Invoice saved!', { id: 'share-gen' });
                
                // If they specifically wanted to share to WhatsApp but files aren't supported, open the link after download
                if (!forceDownload && cleanPhone) {
                    setTimeout(() => {
                        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                        window.open(whatsappUrl, '_blank');
                    }, 1000);
                }
            } else {
                // 🚀 MOBILE NATIVE SHARE (Opens System Share Sheet with Image Attached)
                try {
                    await navigator.share({
                        files: [file],
                        title: isSlip ? `Receipt from ${sale?.businessId?.displayName}` : `Invoice from ${sale?.businessId?.displayName}`,
                        text: text
                    });
                    toast.success('Shared successfully!', { id: 'share-gen' });
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') {
                        toast.dismiss('share-gen');
                        return;
                    }
                    console.warn("Native share failed, downloading instead:", shareErr);
                    // Final fallback
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            }
        } catch (err) {
            console.error("Share Error:", err);
            toast.error("Sharing failed. Please try saving as image instead.", { id: 'share-gen' });
        } finally {
            setGenerating(false);
            toast.dismiss('share-gen');
        }
    };

    const handleNombaInitialization = async () => {
        const amountToPay = paymentMode === 'full'
            ? (sale.totalAmount - (sale.paidAmount || 0))
            : parseFloat(customAmount);

        if (!amountToPay || amountToPay <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (amountToPay > balance) {
            toast.error(`Amount exceeds remaining balance (₦${balance.toLocaleString()})`);
            return;
        }

        try {
            setLoadingNomba(true);
            const res = await axios.post(`${API_URL}/payments/initialize-nomba-account`, {
                invoiceId: id,
                amount: amountToPay
            });

            if (res.data.success) {
                setNombaData(res.data.data);
            }
        } catch (err) {
            console.error('Nomba Initialization failed:', err);
            const msg = err.response?.data?.message || 'Bank transfer temporarily unavailable. Please use card payment below.';
            toast.error(msg);
        } finally {
            setLoadingNomba(false);
        }
    };

    // 🔄 AUTO-RESET: Clear Nomba data if user changes amount or mode
    useEffect(() => {
        if (nombaData) setNombaData(null);
    }, [paymentMode, customAmount]);

    const handlePaystackPayment = async (paymentChannel) => {
        const amountToPay = paymentMode === 'full' 
            ? (sale.totalAmount - (sale.paidAmount || 0)) 
            : parseFloat(customAmount);

        if (!amountToPay || amountToPay <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amountToPay > balance) {
            toast.error(`Amount exceeds remaining balance (₦${balance.toLocaleString()})`);
            return;
        }

        try {
            setVerifying(true);
            
            // Robust Email Fallback: Strip special characters and spaces
            const safeName = (sale.customerName || "Guest").toLowerCase().replace(/[^a-z0-9]/g, '');
            const fallbackEmail = `${safeName || 'customer'}@usekredibly.com`;
            
            // Clean the customer email: strip spaces. If it doesn't look like an email, use fallback.
            let finalEmail = sale.customerEmail ? sale.customerEmail.trim() : "";
            if (!finalEmail.includes('@') || finalEmail.includes(' ')) {
                finalEmail = fallbackEmail;
            }

            const res = await axios.post(`${API_URL}/business/paystack/initialize`, {
                saleId: sale._id,
                amount: amountToPay,
                email: finalEmail,
                paymentChannel: paymentChannel
            });

            // Restrict channels so Paystack natively forces the right flow
            const channels = paymentChannel === 'card' ? ['card'] : ['bank', 'bank_transfer', 'ussd'];

            const handler = window.PaystackPop.setup({
                key: res.data.publicKey,
                email: res.data.email, // 💎 MUST MATCH BACKEND CHOICE
                amount: Math.round(amountToPay * 100), // 💎 BACKUP VALIDATOR (Kobo)
                accessCode: res.data.accessCode, // 💎 ALL-IN-ONE TOKEN (Fees, Settlements, Reference)
                callback: function(response) {
                    setVerifying(true);
                    
                    // 1. 🛡️ VERIFY ON BACKEND
                    axios.post(`${API_URL}/payments/verify-invoice`, {
                        reference: response.reference,
                        invoiceId: id
                    }).then(function(verifyRes) {
                        if (verifyRes.data.success) {
                            // 🏆 SUCCESS: Show modal FIRST to build trust immediately
                            // 🏆 SUCCESS: Show modal FIRST to build trust immediately
                            setLastPaymentAmount(verifyRes.data.originalAmount || amountToPay);
                            setRecentPaymentDate(new Date());
                            setCustomAmount('');
                            setCustomAmountDisplay('');

                            // 📝 Capture transaction details for the Slip
                            setCurrentTransaction({
                                amount: verifyRes.data.originalAmount || amountToPay,
                                reference: response.reference || `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                                date: new Date(),
                                balance: sale.totalAmount - (sale.paidAmount + (verifyRes.data.originalAmount || amountToPay)),
                                isFullyPaid: (sale.totalAmount - (sale.paidAmount + (verifyRes.data.originalAmount || amountToPay))) <= 0
                            });

                            setShowSuccessModal(true);
                            
                            // 2. 🔄 Refresh local sale data (Background Task)
                            axios.get(`${API_URL}/sales/${id}`).then(function(refreshRes) {
                                if (refreshRes.data.success) {
                                    setSale(refreshRes.data.data);
                                }
                            }).catch(function(refreshErr) {
                                console.warn("Background refresh lagged, but payment is confirmed.");
                            });
                        } else {
                            toast.error(verifyRes.data.message || "Payment verification failed. Please contact the merchant! 🛡️");
                        }
                    }).catch(function(err) {
                        console.error("Verification error:", err);
                        // 🚨 REASSURANCE: Don't panic the customer
                        toast.error("Verification taking longer than usual... 🛡️ Don't worry, we are securing your payment. Please refresh the page in 10 seconds!", { duration: 6000 });
                    }).finally(function() {
                        setVerifying(false);
                    });
                },
                onClose: function() {
                    setVerifying(false);
                    toast("Payment window closed", { icon: '🛡️' });
                }
            });
            handler.openIframe();
            
            setVerifying(true);
        } catch (err) {
            console.error("Paystack initialization failed:", err);
            setVerifying(false);
            toast.error(`Payment Error: ${err.message || "Failed to start"}`);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FDFCFE' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '24px' }}>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: 0, border: '4px solid #F3E8FF', borderRadius: '50%', borderTopColor: '#4C1D95' }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/krediblyrevamped.png" alt="" style={{ height: '24px', opacity: 0.3 }} />
                </div>
            </div>
            <p style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(76, 29, 149, 0.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Secure Connection</p>
        </div>
    );

    if (!sale) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', background: '#FDFCFE' }}>
            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <AlertCircle size={32} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Invoice Not Found</h2>
            <p style={{ color: '#64748B', maxWidth: '300px', marginBottom: '24px' }}>This link may have expired or the invoice record might have been removed.</p>
            <Link to="/" style={{ textDecoration: 'none', color: '#4C1D95', fontWeight: 700 }}>Return to Kredibly</Link>
        </div>
    );

    // 🎨 Design Tokens for the Premium Invoice
    const primaryColor = sale?.businessId?.brandColor || '#4C1D95';
    const secondaryColor = '#0F172A';
    const mutedColor = '#64748B';

    // 🧮 Option X Fee Calculation Logic (Customer only covers DVA collection fee)
    // 🛡️ SYNC WITH backend/config/financials.js (1% Fee Model)
    const rawInputAmount = paymentMode === 'full' ? balance : (parseFloat(customAmount) || 0);
    let calculatedGatewayFee = 0;
    let finalTotalToPay = rawInputAmount;

    if (rawInputAmount > 0) {
        let gross = rawInputAmount;
        if (rawInputAmount <= 1000) {
            gross = rawInputAmount + 10;
        } else if (rawInputAmount >= 100000) {
            gross = rawInputAmount + 1000;
        } else {
            gross = rawInputAmount / 0.99;
        }
        
        // 🛡️ SYNC WITH BACKEND: Round to nearest 10
        finalTotalToPay = Math.round(gross / 10) * 10;
        calculatedGatewayFee = finalTotalToPay - rawInputAmount;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FDFCFE', color: '#0F172A', fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
                  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                `}
            </style>

            {/* 🛡️ Premium Verifying Payment Overlay */}
            <AnimatePresence mode="wait">
                {isAutoVerifying && (
                    <motion.div 
                        key="verification-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            backdropFilter: 'blur(24px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                            pointerEvents: 'all'
                        }}
                    >
                        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px', width: '90%' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 40px' }}>
                                {/* Spinning Pulse Outer */}
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(16, 185, 129, 0.3)', borderRadius: '50%' }} 
                                />
                                {/* Inner Orbit */}
                                <motion.div 
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    style={{ position: 'absolute', inset: '10px', border: '4px solid transparent', borderTopColor: '#10B981', borderRadius: '50%' }} 
                                />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <ShieldCheckIcon size={48} color="#10B981" />
                                    </motion.div>
                                </div>
                            </div>
                            
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 950, color: 'white', marginBottom: '12px', letterSpacing: '-0.04em' }}>
                                    {isAutoVerifying === 'auto' ? 'Payment Detected!' : 'Checking Transfer'}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, fontSize: '15px' }}>
                                    <Loader2 size={16} className="spin-animation" />
                                    <span>{isAutoVerifying === 'auto' ? 'Finalizing secure settlement...' : 'Verifying with banking network...'}</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="printable-receipt" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <div id="receipt-download-target" style={{ width: '700px', background: 'white', padding: '64px', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
                    {/* Security Watermark Texture */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: `linear-gradient(90deg, ${primaryColor}, #0F172A)` }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none', background: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)' }} />

                    {/* Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                        <div>
                            {sale?.businessId?.logoUrl ? (
                                <img src={sale.businessId.logoUrl} alt={sale.businessId.displayName} style={{ height: '56px', objectFit: 'contain', marginBottom: '16px' }} />
                            ) : (
                                <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 900, color: primaryColor, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                                    {sale?.businessId?.displayName}
                                </h1>
                            )}
                            <div style={{ color: mutedColor, fontSize: '13px', fontWeight: 600 }}>
                                <p style={{ margin: 0 }}>Official Merchant Record</p>
                                <p style={{ margin: '2px 0 0' }}>{sale?.businessId?.email || `Verified by ${sale?.businessId?.displayName}`}</p>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '14px', fontWeight: 800, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>
                                {isPaid ? 'Official Receipt' : 'Electronic Invoice'}
                            </h2>
                            <p style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 900, color: secondaryColor, margin: 0 }}>
                                #{sale?.invoiceNumber}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ fontWeight: 600, color: mutedColor }}>Issued:</span>
                                    <span style={{ fontWeight: 800 }}>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ fontWeight: 600, color: mutedColor }}>Status:</span>
                                    <span style={{ fontWeight: 900, color: isPaid ? '#10B981' : '#F59E0B' }}>{isPaid ? 'PAID' : 'PENDING'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Summary Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', marginBottom: '48px', alignItems: 'flex-end' }}>
                        <div style={{ borderLeft: `4px solid ${primaryColor}`, paddingLeft: '24px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 900, color: mutedColor, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Billed To</p>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 800, color: secondaryColor, margin: 0 }}>{sale?.customerName}</h3>
                            <p style={{ fontSize: '13px', color: mutedColor, fontWeight: 600, marginTop: '4px' }}>Payment Reference: {sale.invoiceNumber}</p>
                        </div>
                        
                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                            <p style={{ fontSize: '11px', fontWeight: 900, color: mutedColor, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Amount Summary</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: mutedColor }}>Total Value</span>
                                <span style={{ fontSize: '13px', fontWeight: 800 }}>₦{sale.totalAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: mutedColor }}>Paid to Date</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>₦{sale.paidAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: secondaryColor }}>Balance Due</span>
                                <span style={{ fontSize: '20px', fontWeight: 950, color: balance > 0 ? '#EF4444' : '#10B981' }}>₦{balance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    {sale?.description && (
                        <div style={{ marginBottom: '48px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 900, color: mutedColor, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Description of Services</p>
                            <div style={{ padding: '20px', background: '#FDFCFE', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                <p style={{ fontSize: '15px', color: '#334155', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>{sale.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Payment History Timeline */}
                    <div style={{ marginBottom: '64px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 900, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Verified Payment Log</p>
                            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
                                    <th style={{ padding: '12px 0', fontSize: '12px', color: mutedColor, fontWeight: 700 }}>DATE</th>
                                    <th style={{ padding: '12px 0', fontSize: '12px', color: mutedColor, fontWeight: 700 }}>REFERENCE</th>
                                    <th style={{ padding: '12px 0', fontSize: '12px', color: mutedColor, fontWeight: 700, textAlign: 'right' }}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #F8FAFC' }}>
                                    <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600 }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px 0', fontSize: '12px', color: mutedColor, fontWeight: 700 }}>Record Created</td>
                                    <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 800, textAlign: 'right' }}>-</td>
                                </tr>
                                {(sale?.payments || []).map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                        <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600 }}>{new Date(p.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px 0', fontSize: '12px', fontWeight: 800, color: primaryColor, fontFamily: 'monospace' }}>{p.reference || 'SYSTEM'}</td>
                                        <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 900, color: '#10B981', textAlign: 'right' }}>+ ₦{p.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Official Seal - Relocated to avoid obstructing dynamic payment log */}
                    {isPaid && (
                        <div style={{ 
                            position: 'absolute',
                            bottom: '150px',
                            left: '64px',
                            width: '120px',
                            height: '120px',
                            border: `4px double ${primaryColor}`, 
                            borderRadius: '50%', 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'rotate(-15deg)', 
                            opacity: 0.3,
                            background: 'transparent',
                            boxShadow: `0 4px 15px rgba(0,0,0,0.02)`,
                            zIndex: 10,
                            pointerEvents: 'none'
                        }}>
                            <span style={{ color: primaryColor, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>OFFICIALLY</span>
                            <span style={{ color: primaryColor, fontSize: '20px', fontWeight: 950, textTransform: 'uppercase', margin: '-3px 0' }}>SETTLED</span>
                            <div style={{ height: '2px', width: '70%', background: primaryColor, margin: '4px 0' }} />
                            <span style={{ color: primaryColor, fontSize: '8px', fontWeight: 800 }}>{settlementDate.toLocaleDateString()}</span>
                        </div>
                    )}

                    {/* Institutional Footer */}
                    <div style={{ marginTop: '40px', padding: '32px 0 0', borderTop: '2px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '16px', opacity: 0.6 }} />
                            <div style={{ width: '1px', height: '12px', background: '#E2E8F0' }} />
                            <span style={{ fontSize: '10px', fontWeight: 900, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Ledger</span>
                        </div>
                        <p style={{ fontSize: '11px', color: mutedColor, fontWeight: 700, margin: 0 }}>
                            Digitally Signed Document • Verified by Kredibly Infrastructure
                        </p>
                    </div>
                </div>
            </div>

            <div className="no-print">
                {/* Modern Gradient Background */}
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '600px', background: 'linear-gradient(180deg, #FDFCFE 0%, #F5F3FF 100%)', pointerEvents: 'none', zIndex: -1 }} />
                <div style={{ position: 'fixed', top: '100px', left: '-50px', width: '300px', height: '300px', background: 'rgba(124, 58, 237, 0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

                {/* Institutional Navbar */}
                <nav style={{ maxWidth: '42rem', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, padding: '24px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        {sale?.businessId?.plan === 'chairman' ? (
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '24px', opacity: 0.9 }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {sale?.businessId?.logoUrl ? (
                                    <img src={sale.businessId.logoUrl} alt={sale.businessId.displayName} style={{ height: '28px', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 900, color: primaryColor, letterSpacing: '-0.02em' }}>{sale?.businessId?.displayName}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {sale.businessId?.plan === 'chairman' && (
                            <div style={{ padding: '8px 16px', background: 'white', borderRadius: '100px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <ShieldCheckIcon size={14} color="#10B981" />
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Business</span>
                            </div>
                        )}
                        <button 
                            onClick={handleShare}
                            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '50%', border: '1px solid #E2E8F0', color: '#475569', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </nav>

                <main className="invoice-main-content" style={{ maxWidth: '42rem', margin: '0 auto', position: 'relative', zIndex: 10, paddingBottom: '80px' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        
                        {/* Status Hero */}
                        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '0' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: isPaid ? '#ECFDF5' : '#F5F3FF', borderRadius: '100px', border: `1px solid ${isPaid ? '#D1FAE5' : '#E9E3FF'}`, marginBottom: '24px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPaid ? '#10B981' : primaryColor }} />
                                <span style={{ fontSize: '10px', fontWeight: 900, color: isPaid ? '#065F46' : primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {isPaid ? 'Transaction Settled' : (sale.invoiceType === 'record' ? 'Verified Record' : 'Payment Awaiting')}
                                </span>
                            </div>

                            <h1 style={{ fontSize: 'clamp(2.5rem, 12vw, 64px)', fontFamily: 'Outfit', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', margin: '0 0 16px 0', lineHeight: 1 }}>
                                ₦{isPaid ? (sale.totalAmount || 0).toLocaleString() : (balance || 0).toLocaleString()}
                            </h1>
                            
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
                                {isPaid 
                                    ? `Official settlement record for invoice #${sale.invoiceNumber}.` 
                                    : `Requested by ${sale.businessId?.displayName} for #${sale.invoiceNumber}.`
                                }
                            </p>
                        </div>

                        {/* Recent Payment Banner (If any) */}
                        {!isPaid && sale.payments?.length > 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'white', border: '1px solid #10B981', borderRadius: '24px', padding: '16px 20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.05)' }}>
                                <div style={{ width: '40px', height: '40px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#065F46' }}>Partial Payment Received</p>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#059669' }}>₦{sale.paidAmount.toLocaleString()} already logged. Balance: ₦{balance.toLocaleString()}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Main Interactive Card */}
                        <div className="glass-card" style={{ borderRadius: '32px', overflow: 'hidden', background: 'white', border: '1px solid #F1F5F9', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.04)' }}>
                            {/* Merchant Header */}
                            <div style={{ padding: '32px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '80px', height: '80px', background: '#F8FAFC', borderRadius: '24px', overflow: 'hidden', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sale.businessId?.logoUrl ? (
                                        <img src={sale.businessId.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Building2 size={32} color={primaryColor} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontFamily: 'Outfit', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{sale.businessId?.displayName}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 900, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>Verified Merchant</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>• {sale.businessId?.entityType || 'Business'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: isMobile ? '24px 16px' : '32px' }}>
                                {/* Invoice Summary Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                    <div>
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Customer</label>
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: 0 }}>{sale.customerName}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Ref Number</label>
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: 0 }}>#{sale.invoiceNumber}</p>
                                    </div>
                                </div>

                                {/* Description Box */}
                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <FileText size={14} color="#94A3B8" />
                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Description</span>
                                    </div>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#475569', lineHeight: 1.6, margin: 0 }}>{sale.description}</p>
                                </div>

                                {/* Dates & Timeline */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid #F8FAFC', borderBottom: '1px solid #F8FAFC', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', background: '#F5F3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Issued</p>
                                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#334155' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {sale.dueDate && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Due Date</p>
                                                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: isOverdue ? '#EF4444' : '#334155' }}>{new Date(sale.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div style={{ width: '32px', height: '32px', background: isOverdue ? '#FEF2F2' : '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOverdue ? '#EF4444' : '#94A3B8' }}>
                                                <Clock size={16} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Verified Payment Ledger */}
                                {sale.payments?.length > 0 && (
                                    <div style={{ marginBottom: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Verified Payment Ledger</p>
                                            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
                                        </div>
                                        <div style={{ background: '#F8FAFC', borderRadius: '20px', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                                            {sale.payments.map((p, idx) => (
                                                <div key={idx} style={{ 
                                                    padding: isMobile ? '20px 16px' : '12px 16px', 
                                                    borderBottom: idx === sale.payments.length - 1 ? 'none' : '1px solid #EEF2F6', 
                                                    display: 'flex', 
                                                    flexDirection: isMobile ? 'column' : 'row',
                                                    justifyContent: 'space-between', 
                                                    alignItems: isMobile ? 'flex-start' : 'center',
                                                    gap: isMobile ? '16px' : '0'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', border: '1px solid #E2E8F0' }}>
                                                            <CheckCircle size={16} />
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: isMobile ? '15px' : '12px', fontWeight: 800, color: '#1E293B' }}>₦{p.amount.toLocaleString()}</p>
                                                            <p style={{ margin: '2px 0 0', fontSize: isMobile ? '12px' : '10px', fontWeight: 600, color: '#64748B', wordBreak: 'break-all' }}>{new Date(p.date).toLocaleDateString()} • {p.reference || (p.method === 'Initial' ? 'Opening Balance' : 'Verified Settlement')}</p>
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', background: '#ECFDF5', padding: '4px 10px', borderRadius: '100px' }}>Verified Settlement</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Area */}
                                {!isPaid && sale.invoiceType !== 'record' ? (
                                    <div style={{ marginTop: '32px' }}>
                                        {/* Payment Mode Selector */}
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                            <button 
                                                onClick={() => { setPaymentMode('full'); setNombaData(null); }}
                                                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: paymentMode === 'full' ? primaryColor : '#E2E8F0', background: paymentMode === 'full' ? '#F5F3FF' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                            >
                                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'full' ? primaryColor : '#94A3B8', textTransform: 'uppercase' }}>Full Amount</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800, color: paymentMode === 'full' ? primaryColor : '#475569' }}>₦{balance.toLocaleString()}</p>
                                            </button>
                                            <button 
                                                onClick={() => { setPaymentMode('partial'); setNombaData(null); }}
                                                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', borderColor: paymentMode === 'partial' ? primaryColor : '#E2E8F0', background: paymentMode === 'partial' ? '#F5F3FF' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                            >
                                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'partial' ? primaryColor : '#94A3B8', textTransform: 'uppercase' }}>Installment</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800, color: paymentMode === 'partial' ? primaryColor : '#475569' }}>Other</p>
                                            </button>
                                        </div>

                                        {/* Custom Amount Input */}
                                        <AnimatePresence mode="wait">
                                            {paymentMode === 'partial' && (
                                                <motion.div 
                                                    key="custom-amount-input"
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '24px' }}>
                                                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '20px', border: '2px solid #E2E8F0' }}>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Enter Amount (₦)</label>
                                                        <input 
                                                            type="text" value={customAmountDisplay} placeholder="₦0.00"
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, '');
                                                                const numVal = parseInt(val) || 0;
                                                                
                                                                if (numVal > balance) {
                                                                    val = Math.floor(balance).toString();
                                                                    toast.error(`Maximum allowed: ₦${balance.toLocaleString()}`, { id: 'bal-limit' });
                                                                }

                                                                setCustomAmount(val);
                                                                setCustomAmountDisplay(val ? `₦${parseInt(val).toLocaleString()}` : '');
                                                                setNombaData(null);
                                                            }}
                                                            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '24px', fontWeight: 900, color: '#0F172A', outline: 'none' }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Payment Button / DVA Card */}
                                        <div key="payment-action-area" style={{ marginTop: '8px' }}>
                                            {!nombaData && (sale?.businessId?.prefersGatewayFeeAbsorption === false || String(sale?.businessId?.prefersGatewayFeeAbsorption) === 'false') && rawInputAmount > 0 && (
                                                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>
                                                        <span>Invoice Amount</span>
                                                        <span>₦{rawInputAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontWeight: 600 }}>
                                                        <span>Processing Fee</span>
                                                        <span>₦{calculatedGatewayFee.toLocaleString()}</span>
                                                    </div>
                                                    <div style={{ height: '1px', background: '#E2E8F0', margin: '12px 0' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 800, fontSize: '14px' }}>
                                                        <span>Total to Pay</span>
                                                        <span>₦{finalTotalToPay.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {nombaData ? (
                                                <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                                    <div style={{ 
                                                        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', 
                                                        padding: isMobile ? '32px 16px' : '40px', 
                                                        borderRadius: '32px', 
                                                        color: 'white', 
                                                        position: 'relative', 
                                                        overflow: 'hidden', 
                                                        boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.4)' 
                                                    }}>
                                                        {/* Decorative Background Elements */}
                                                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
                                                        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                                                        
                                                        {/* 📡 Live Status Header */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '10px', 
                                                                background: 'rgba(16, 185, 129, 0.1)', 
                                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                padding: '8px 16px',
                                                                borderRadius: '100px',
                                                            }}>
                                                                <div className="pulse-dot" style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} />
                                                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Transfer</span>
                                                            </div>
                                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '100px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Clock size={14} color="#FCA5A5" />
                                                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#FCA5A5', fontFamily: 'monospace' }}>{timeLeft || '44:59'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Financial Details */}
                                                        <div style={{ marginBottom: isMobile ? '32px' : '40px', position: 'relative', zIndex: 10 }}>
                                                            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Settlement Value</p>
                                                            <h2 style={{ 
                                                                fontSize: isMobile ? 'clamp(32px, 9vw, 40px)' : '48px', 
                                                                fontWeight: 950, 
                                                                margin: 0, 
                                                                fontFamily: 'Outfit', 
                                                                letterSpacing: '-0.04em', 
                                                                color: '#F8FAFC',
                                                                lineHeight: 1.1
                                                            }}>
                                                                ₦{nombaData.amount.toLocaleString()}
                                                            </h2>
                                                            {nombaData.gatewayFee > 0 && (
                                                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                                                                    Includes ₦{nombaData.gatewayFee.toLocaleString()} secure processing fee
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Bank Details Terminal */}
                                                        <div style={{ 
                                                            background: 'rgba(255, 255, 255, 0.03)', 
                                                            borderRadius: '24px', 
                                                            padding: isMobile ? '24px 12px' : '32px', 
                                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                                            position: 'relative',
                                                            zIndex: 10
                                                        }}>
                                                            <div style={{ marginBottom: '24px' }}>
                                                                <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Destination Bank</p>
                                                                <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#F1F5F9' }}>{nombaData.bankName}</p>
                                                            </div>
                                                            
                                                            <div style={{ marginBottom: '24px' }}>
                                                                <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Account Number</p>
                                                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '20px' : '0' }}>
                                                                    <p style={{ 
                                                                        margin: 0, 
                                                                        fontSize: isMobile ? 'clamp(24px, 7.5vw, 32px)' : '36px', 
                                                                        fontWeight: 950, 
                                                                        color: 'white', 
                                                                        letterSpacing: '1px', 
                                                                        fontFamily: 'Outfit', 
                                                                        lineHeight: 1 
                                                                    }}>{nombaData.accountNumber}</p>
                                                                    <button 
                                                                        onClick={() => { navigator.clipboard.writeText(nombaData.accountNumber); toast.success('Copied to clipboard!'); }} 
                                                                        style={{ 
                                                                            padding: '14px 24px', 
                                                                            background: 'white', 
                                                                            color: '#0F172A', 
                                                                            border: 'none', 
                                                                            borderRadius: '16px', 
                                                                            fontSize: '14px', 
                                                                            fontWeight: 900, 
                                                                            cursor: 'pointer',
                                                                            width: isMobile ? '100%' : 'auto',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '8px',
                                                                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                                                        }}
                                                                    >
                                                                        <Copy size={16} />
                                                                        {isMobile ? 'Copy Account Number' : 'Copy'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                                <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Account Name</p>
                                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#94A3B8', wordBreak: 'break-word', lineHeight: 1.4 }}>{nombaData.accountName || `${sale?.businessId?.displayName?.toUpperCase()}`}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={handleManualVerification} disabled={verifyingPayment}
                                                        style={{ 
                                                            width: '100%', 
                                                            padding: '18px', 
                                                            background: verifyingPayment ? '#F1F5F9' : '#F8FAFC', 
                                                            color: verifyingPayment ? '#94A3B8' : primaryColor, 
                                                            borderRadius: '16px', 
                                                            border: `2px solid ${verifyingPayment ? '#E2E8F0' : primaryColor + '20'}`, 
                                                            marginTop: '16px', 
                                                            fontWeight: 900, 
                                                            fontSize: '15px', 
                                                            cursor: verifyingPayment ? 'not-allowed' : 'pointer', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    >
                                                        {verifyingPayment ? <Loader2 size={18} className="spin-animation" /> : <CheckCircle size={18} />}
                                                        <span>{verifyingPayment ? 'Searching for transfer...' : 'I have completed transfer'}</span>
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <motion.button 
                                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                    onClick={handleNombaInitialization} disabled={loadingNomba}
                                                    style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)', color: 'white', borderRadius: '20px', border: 'none', fontWeight: 900, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 15px 30px -5px rgba(76, 29, 149, 0.4)' }}
                                                >
                                                    {loadingNomba ? <Loader2 size={22} className="spin-animation" /> : <Building2 size={22} />}
                                                    <span>{loadingNomba ? 'Preparing...' : `Pay ₦${((sale?.businessId?.prefersGatewayFeeAbsorption === false || String(sale?.businessId?.prefersGatewayFeeAbsorption) === 'false') ? finalTotalToPay : rawInputAmount).toLocaleString()} via Transfer`}</span>
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Success State View */
                                    <div style={{ textAlign: 'center', padding: '32px 0 0' }}>
                                        <div style={{ width: '64px', height: '64px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', margin: '0 auto 24px' }}>
                                            <CheckCircle size={32} />
                                        </div>
                                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Payment Fully Settled</h4>
                                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '0' }}>This transaction is verified and logged on the Kredibly ledger.</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Branding Footer */}
                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'white', borderRadius: '100px', border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <img src="/krediblyrevamped.png" alt="" style={{ height: '14px', opacity: 0.6 }} />
                                <div style={{ width: '1px', height: '12px', background: '#E2E8F0' }} />
                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Infrastructure</span>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .invoice-main-content { padding: 24px 12px 0; }
                @media (min-width: 768px) { .invoice-main-content { padding: 40px 16px 0; } }
                @media (max-width: 480px) { .spin-animation { width: 16px !important; height: 16px !important; } }
                .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05); }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.02); }
                .pulse-dot { animation: pulse-animation 2s infinite; }
                @keyframes pulse-animation {
                    0% { transform: scale(0.95); opacity: 0.7; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); opacity: 0.7; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            ` }} />

            {/* Hidden Transaction Slip for Capture */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, display: 'inline-block', overflow: 'hidden', height: 'auto' }}>
                {currentTransaction && (
                    <div key={`slip-${currentTransaction.reference}`}>
                        <TransactionSlip 
                            amount={currentTransaction.amount}
                            businessName={sale?.businessId?.displayName}
                            customerName={sale?.customerName}
                            reference={currentTransaction.reference}
                            date={currentTransaction.date}
                            balance={currentTransaction.balance}
                            isFullyPaid={currentTransaction.isFullyPaid}
                            logoUrl={sale?.businessId?.logoUrl}
                        />
                    </div>
                )}
            </div>

            <PaymentSuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    setModalDismissed(true);
                }}
                amountPaid={lastPaymentAmount}
                balanceRemaining={sale ? sale.totalAmount - sale.paidAmount : 0}
                onDownloadReceipt={handleDownloadPDF}
                onDownloadImage={() => handleDownloadImage(true)}
                shareUrl={window.location.origin + "/i/" + (sale?.invoiceNumber || id)}
                shareText={`I've just made a payment of ₦${lastPaymentAmount?.toLocaleString()} to ${sale?.businessId?.displayName}! View my verified receipt here:`}
            />

            <ShareActionSheet 
                isOpen={isShareMenuOpen}
                onClose={() => setIsShareMenuOpen(false)}
                title={shareMenuType === 'slip' ? "Share Transaction Slip" : (isPaid ? "Share Official Receipt" : "Share Invoice Details")}
                subtitle={shareMenuType === 'slip' ? "Send a verified image of your payment to the merchant" : "Share this record as a high-quality image or PDF"}
                onShareImage={(forceDownload = false) => handleShareImage(shareMenuType === 'slip', forceDownload)}
                canShareToApps={false}
                onDownloadPDF={handleDownloadPDF}
                onCopyLink={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                    setIsShareMenuOpen(false);
                }}
            />
        </div>
    );
};

export default PublicInvoicePage;
