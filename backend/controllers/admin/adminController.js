const User = require("../../models/User");
const BusinessProfile = require("../../models/BusinessProfile");
const Sale = require("../../models/Sale");
const ActivityLog = require("../../models/ActivityLog");
const Waitlist = require("../../models/Waitlist");
const Notification = require("../../models/Notification");
const SupportTicket = require("../../models/SupportTicket");
const Payment = require("../../models/Payment");

exports.getGlobalStats = async (req, res) => {
    try {
        // Only count production businesses
        const productionBusinessFilter = { isBetaTester: { $ne: true } };
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalBusinesses = await BusinessProfile.countDocuments(productionBusinessFilter);

        // Filter sales to exclude those from beta testers for more accurate counts
        const productionSales = await Sale.find({}).populate('businessId', 'isBetaTester');
        const salesCount = productionSales.filter(s => !s.businessId?.isBetaTester).length;
        const totalSalesCount = salesCount;

        // 1. Merchant Platform Volume (Money flowing through merchants)
        const sales = await Sale.find({ "payments.0": { $exists: true } })
            .populate('businessId', 'displayName isBetaTester')
            .sort({ "payments.date": -1 })
            .limit(100);

        let totalPlatformVolume = 0;
        let totalVerifiedVolume = 0;
        let totalOutstanding = 0;

        const verifiedMethods = ['Paystack', 'Nomba', 'Squad', 'Kredibly Online'];
        const testPatterns = [/test/i, /^T_/i, /^SANDBOX/i, /^KREDDY_TEST/i];

        // We need all sales for volume stats, but the limited 'sales' above is for the feed.
        // Let's fetch all for stats but keep it efficient.
        const allSalesForStats = await Sale.find({}).populate('businessId', 'isBetaTester');

        allSalesForStats.forEach(s => {
            const isTestMerchant = s.businessId?.isBetaTester === true;
            const payments = s.payments || [];
            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const verifiedPaid = payments
                .filter(p => {
                    const isMethodMatch = verifiedMethods.includes(p.method);
                    const isTestReference = p.reference && testPatterns.some(ptrn => ptrn.test(p.reference));
                    return isMethodMatch && !isTestReference && !isTestMerchant;
                })
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            totalPlatformVolume += totalPaid;
            totalVerifiedVolume += verifiedPaid;
            totalOutstanding += Math.max(0, (s.totalAmount || 0) - totalPaid);
        });

        // 2. Kredibly Revenue (Subscription payments)
        const allPayments = await Payment.find({ status: 'success' })
            .populate('businessId', 'displayName isBetaTester')
            .sort({ createdAt: -1 })
            .limit(50);

        // For lifetime revenue stats, we still need the total sum
        const totalKrediblyRevenueRes = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalKrediblyRevenue = totalKrediblyRevenueRes[0]?.total || 0;

        // Pulse: High-value platform events
        const importantActions = [
            'SIGNUP', 'WHATSAPP_SALE_CREATED', 'PAYMENT_RECEIVED', 'SUBSCRIPTION_PAID', 
            'SUPPORT_TICKET_CREATED', 'PROFILE_UPDATED', 'KYC_VERIFIED', 'KYC_HOLD', 
            'ESCROW_HOLD', 'WHATSAPP_MSG_RECEIVED', 'INVOICE_VIEWED'
        ];
        const logs = await ActivityLog.find({ 
            action: { $in: importantActions } 
        })
            .populate('businessId', 'displayName isBetaTester')
            .sort({ createdAt: -1 })
            .limit(100);

        // 3. GENERATE UNIFIED ACTIVITY STREAM (Fully Aligned with Mission Control)
        const feed = [];

        // A. Add High-Value Logs
        logs.filter(l => !l.businessId?.isBetaTester).forEach(l => {
            feed.push({
                _id: l._id,
                type: 'LOG',
                action: l.action,
                details: l.details,
                createdAt: l.createdAt,
                merchant: l.businessId?.displayName || 'Admin'
            });
        });

        // B. Add Verified Sales (The raw ledger)
        sales.filter(s => !s.businessId?.isBetaTester).forEach(s => {
            s.payments.filter(p => verifiedMethods.includes(p.method)).forEach(p => {
                const isTest = p.reference && testPatterns.some(ptrn => ptrn.test(p.reference));
                if (isTest) return;

                feed.push({
                    _id: p._id || `${s._id}-${p.reference}`,
                    type: 'SALE',
                    action: `PAYMENT_${p.method.toUpperCase()}`,
                    details: `₦${p.amount.toLocaleString()} received via ${p.method} for #${s.invoiceNumber}`,
                    createdAt: p.date || s.createdAt,
                    merchant: s.businessId?.displayName || 'Unknown'
                });
            });
        });

        // C. Add Subscriptions
        allPayments.filter(p => !p.businessId?.isBetaTester).forEach(p => {
            const isTest = p.paystackRef && testPatterns.some(ptrn => ptrn.test(p.paystackRef));
            if (isTest) return;

            feed.push({
                _id: p._id,
                type: 'SUB',
                action: 'SUBSCRIPTION_PAID',
                details: `Plan: ${p.plan} (₦${p.amount.toLocaleString()})`,
                createdAt: p.paidAt || p.createdAt,
                merchant: p.businessId?.displayName || 'Merchant'
            });
        });

        // D. DEDUPLICATE (Pulse Logic)
        const feedSeen = new Set();
        const globalActivities = feed.filter(item => {
            let key;
            if (item.type === 'SALE') {
                key = `SALE-${item._id}`; // Use the unique payment ID
            } else {
                key = `${item.type}-${item._id}`;
            }
            if (feedSeen.has(key)) return false;
            feedSeen.add(key);
            return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100);

        // 4. Platform Escrow (Held funds)
        const totalEscrowBalanceRes = await BusinessProfile.aggregate([
            { $group: { _id: null, total: { $sum: "$heldBalance" } } }
        ]);
        const totalEscrowBalance = totalEscrowBalanceRes[0]?.total || 0;

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBusinesses,
                totalIncomplete: Math.max(0, totalUsers - totalBusinesses),
                totalSalesCount,
                totalPlatformVolume, // Gross recorded (manual + online)
                totalVerifiedVolume, // Real money (Online only)
                totalOutstanding,
                totalRevenue: totalKrediblyRevenue, // Subscription revenue (Paystack verified)
                totalEscrowBalance
            },
            activities: globalActivities
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select("-password");
        const businesses = await BusinessProfile.find({});

        // Combine data for a clearer overview
        const userList = users.map(u => {
            const biz = businesses.find(b => b.ownerId.toString() === u._id.toString());
            return {
                ...u._doc,
                business: biz || null
            };
        });

        res.status(200).json({ success: true, data: userList });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getWaitlistEntries = async (req, res) => {
    try {
        const entries = await Waitlist.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteWaitlistEntry = async (req, res) => {
    try {
        const { id } = req.params;
        await Waitlist.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Entry removed from waitlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Find business associated with user
        const business = await BusinessProfile.findOne({ ownerId: id });
        
        if (business) {
            // 2. Cascade delete all related platform data
            await Sale.deleteMany({ businessId: business._id });
            await ActivityLog.deleteMany({ businessId: business._id });
            await Notification.deleteMany({ businessId: business._id });
            await SupportTicket.deleteMany({ businessId: business._id });
            
            // 3. Delete the business profile
            await BusinessProfile.findByIdAndDelete(business._id);
        }

        // 4. Delete the user (this covers users who might not have completed onboarding yet)
        await User.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "User and all associated data purged successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCoupons = async (req, res) => {
    try {
        const Coupon = require("../../models/Coupon");
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const Coupon = require("../../models/Coupon");
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const testPatterns = [/test/i, /^T_/i, /^SANDBOX/i, /^KREDDY_TEST/i];

        const payments = await Payment.find({})
            .populate('businessId', 'displayName isBetaTester')
            .sort({ createdAt: -1 });

        const filtered = payments.filter(p => {
            const isTestRef = p.paystackRef && testPatterns.some(ptrn => ptrn.test(p.paystackRef));
            const isTestMerchant = p.businessId?.isBetaTester === true;
            return !isTestRef && !isTestMerchant;
        });

        res.status(200).json({ success: true, data: filtered });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        await Payment.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Subscription record removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getInvoicePayments = async (req, res) => {
    try {
        const testPatterns = [/test/i, /^T_/i, /^SANDBOX/i, /^KREDDY_TEST/i];

        const sales = await Sale.find({ 
            "payments.0": { $exists: true } 
        })
            .select("customerName invoiceNumber businessId payments")
            .populate("businessId", "displayName logoUrl isBetaTester")
            .sort({ "payments.date": -1 });

        // Flatten the payments into a single list
        const flattened = [];
        sales.forEach(sale => {
            // Skip Beta/Test merchants
            if (sale.businessId?.isBetaTester) return;

            sale.payments.forEach(payment => {
                // Skip Test references
                const isTest = payment.reference && testPatterns.some(ptrn => ptrn.test(payment.reference));
                if (isTest) return;

                flattened.push({
                    _id: payment._id,
                    saleId: sale._id,
                    invoiceNumber: sale.invoiceNumber,
                    customerName: sale.customerName,
                    merchantName: sale.businessId?.displayName || "Unknown Merchant",
                    merchantLogo: sale.businessId?.logoUrl,
                    amount: payment.amount,
                    method: payment.method,
                    reference: payment.reference,
                    date: payment.date
                });
            });
        });

        // Sort by date descending first so newest entries win deduplication
        flattened.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Deduplicate: Group by reference if available, otherwise by invoice+amount+minute-window
        // This catches duplicates even if they arrived milliseconds apart
        const seen = new Set();
        const deduplicated = flattened.filter(p => {
            let key;
            if (p.reference) {
                key = p.reference; // Most reliable: unique transaction reference
            } else {
                // Round timestamp to nearest minute to catch near-simultaneous duplicates
                const minuteWindow = Math.floor(new Date(p.date).getTime() / 60000);
                key = `${p.invoiceNumber}-${p.amount}-${minuteWindow}`;
            }
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        res.status(200).json({ success: true, data: deduplicated.slice(0, 100) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteInvoicePayment = async (req, res) => {
    try {
        const { saleId, paymentId } = req.params;
        const sale = await Sale.findById(saleId);
        if (!sale) return res.status(404).json({ message: "Invoice not found" });

        sale.payments = sale.payments.filter(p => p._id && p._id.toString() !== paymentId);
        await sale.save();

        res.status(200).json({ success: true, message: "Payment removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * 🛡️ MANUAL KYC VERIFICATION (Admin Mission Control)
 * This allows the founder to verify a merchant who sent their NIN via WhatsApp.
 */
exports.manualVerifyMerchant = async (req, res) => {
    try {
        const { id } = req.params;
        const business = await BusinessProfile.findById(id);
        if (!business) return res.status(404).json({ message: "Merchant profile not found" });

        if (business.kyc?.status === 'verified') {
            return res.status(400).json({ message: "Merchant is already verified" });
        }

        // 1. Flip Status
        business.kyc.status = 'verified';
        business.kyc.tier = 2;
        business.kyc.verifiedAt = new Date();
        business.kyc.method = 'none'; // Mark as manual/none (as opposed to automated bvn)
        
        // 🔓 Clear any security locks (bank changes) as identity is now proven
        if (business.bankDetails) {
            business.bankDetails.bankDetailsLockUntil = null;
        }

        await business.save();

        // 2. Trigger Escrow Release
        let releaseCount = 0;
        let releasedAmount = 0;
        if (business.heldBalance > 0) {
            const { releaseMerchantEscrow } = require("../../utils/payouts");
            const result = await releaseMerchantEscrow(business._id);
            releaseCount = result.count || 0;
            releasedAmount = result.amount || 0;
        }

        // 3. Log Activity
        await ActivityLog.create({
            businessId: business._id,
            action: 'PROFILE_UPDATED',
            details: `KYC manually verified by Admin. ${releaseCount} escrowed payments released (₦${releasedAmount.toLocaleString()}).`
        });

        // 4. Notify Merchant
        await Notification.create({
            businessId: business._id,
            title: 'Account Verified! ✅',
            message: `Your identity has been verified manually. Your held funds (₦${releasedAmount.toLocaleString()}) have been released to your bank account.`,
            type: 'system'
        });

        res.status(200).json({ 
            success: true, 
            message: `Merchant ${business.displayName} verified successfully. ${releaseCount} payments released.` 
        });

    } catch (error) {
        console.error("Manual Verify Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const Coupon = require("../../models/Coupon");
        const { code, discountType, discountAmount, usageLimit, expiryDate } = req.body;
        
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: "Coupon code already exists" });

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountAmount),
            maxUses: usageLimit ? Number(usageLimit) : null,
            expiresAt: expiryDate ? new Date(expiryDate) : null
        });

        await coupon.save();
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MISSION CONTROL & BACKGROUND JOBS
exports.getMissionControlFeed = async (req, res) => {
    try {
        const BackgroundJob = require("../../models/BackgroundJob");
        const Payment = require("../../models/Payment");
        const Sale = require("../../models/Sale");
        const ActivityLog = require("../../models/ActivityLog");

        // 1. Fetch Stats for Hero Section (Today Only + Granular Channels)
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        
        const jobStats = await BackgroundJob.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            { $group: { 
                _id: { status: "$status", channel: "$metadata.channel" }, 
                count: { $sum: 1 } 
            } }
        ]);
        
        const statsObj = { pending: 0, wa_sent: 0, email_sent: 0, failed: 0, processing: 0 };
        jobStats.forEach(s => { 
            const status = s._id.status;
            const channel = s._id.channel;
            
            if (status === 'completed') {
                if (channel === 'whatsapp') statsObj.wa_sent += s.count;
                else statsObj.email_sent += s.count;
            } else {
                statsObj[status] = (statsObj[status] || 0) + s.count;
            }
        });

        const testPatterns = [/test/i, /^T_/i, /^SANDBOX/i, /^KREDDY_TEST/i];

        // 2. Fetch Aggregated Feed (Filtered for Significance)
        const [jobs, logs, subs, sales] = await Promise.all([
            // Show only Failed or Processing jobs (The ones needing attention)
            BackgroundJob.find({ status: { $in: ['failed', 'processing'] } }).sort({ createdAt: -1 }).limit(20).populate("businessId", "displayName isBetaTester"),
            
            // Show more high-value logs
            ActivityLog.find({ 
                action: { $in: ['SIGNUP', 'PROFILE_UPDATED', 'ACCOUNT_VERIFIED', 'PAYMENT_RECEIVED', 'SUBSCRIPTION_PAID'] } 
            }).sort({ createdAt: -1 }).limit(50).populate("businessId", "displayName isBetaTester"),
            
            Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(30).populate("businessId", "displayName isBetaTester"),
            Sale.find({ "payments.0": { $exists: true } }).sort({ "payments.date": -1 }).limit(50).populate("businessId", "displayName isBetaTester")
        ]);

        // 3. Format Unified Feed
        const feed = [];

        // Filter out Test Data
        const filteredSubs = subs.filter(s => {
            const isTestRef = s.paystackRef && testPatterns.some(p => p.test(s.paystackRef));
            return !isTestRef && !s.businessId?.isBetaTester;
        });

        const filteredSales = sales.filter(s => !s.businessId?.isBetaTester);

        // Add Background Jobs (Purple) - Only production
        jobs.filter(j => !j.businessId?.isBetaTester).forEach(j => {
            feed.push({
                _id: j._id,
                type: 'JOB',
                event: j.type,
                status: j.status,
                merchant: j.businessId?.displayName || "System",
                details: j.error ? `Error: ${j.error}` : `Attempt ${j.attempts}`,
                timestamp: j.createdAt,
                color: 'purple'
            });
        });

        // Add Merchant Logs (Gray) - Only production
        logs.filter(l => !l.businessId?.isBetaTester).forEach(l => {
            feed.push({
                _id: l._id,
                type: 'LOG',
                event: l.action,
                merchant: l.businessId?.displayName || "Admin",
                details: l.details,
                timestamp: l.createdAt,
                color: 'gray'
            });
        });

        // Add Subscriptions (Blue)
        filteredSubs.forEach(p => {
            feed.push({
                _id: p._id,
                type: 'SUB',
                event: 'SUBSCRIPTION_PAID',
                merchant: p.businessId?.displayName || "Unknown",
                details: `Plan: ${p.plan} (₦${p.amount.toLocaleString()})`,
                timestamp: p.paidAt || p.createdAt,
                color: 'blue'
            });
        });

        // Add Customer Payments (Green) - Only show verified online payments
        const verifiedMethods = ['Nomba', 'Paystack', 'Squad', 'Kredibly Online'];
        filteredSales.forEach(s => {
            s.payments.filter(p => verifiedMethods.includes(p.method)).forEach(p => {
                // Skip Test references
                const isTest = p.reference && testPatterns.some(ptrn => ptrn.test(p.reference));
                if (isTest) return;

                feed.push({
                    _id: p._id,
                    type: 'SALE',
                    event: `PAYMENT_${p.method.toUpperCase()}`,
                    merchant: s.businessId?.displayName || "Unknown",
                    details: `₦${p.amount.toLocaleString()} received via ${p.method} for #${s.invoiceNumber}`,
                    timestamp: p.date,
                    color: 'green'
                });
            });
        });

        // Deduplicate the feed before slicing — catches duplicate payment events
        const feedSeen = new Set();
        const dedupedFeed = feed.filter(item => {
            let key;
            if (item.type === 'SALE') {
                const minuteWindow = Math.floor(new Date(item.timestamp).getTime() / 60000);
                key = `SALE-${item.details}-${minuteWindow}`;
            } else {
                key = `${item.type}-${item._id}`;
            }
            if (feedSeen.has(key)) return false;
            feedSeen.add(key);
            return true;
        });

        // Final Sort
        dedupedFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({
            success: true,
            stats: statsObj,
            feed: dedupedFeed.slice(0, 50)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.retryBackgroundJob = async (req, res) => {
    try {
        const BackgroundJob = require("../../models/BackgroundJob");
        const job = await BackgroundJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });

        job.status = "pending";
        job.attempts = 0;
        job.error = null;
        job.scheduledFor = new Date();
        await job.save();

        res.status(200).json({ success: true, message: "Job scheduled for immediate retry" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.cancelBackgroundJob = async (req, res) => {
    try {
        const BackgroundJob = require("../../models/BackgroundJob");
        const job = await BackgroundJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });

        job.status = "failed";
        job.error = "Cancelled by Admin";
        await job.save();

        res.status(200).json({ success: true, message: "Job cancelled" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBackgroundJob = async (req, res) => {
    try {
        const BackgroundJob = require("../../models/BackgroundJob");
        await BackgroundJob.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Job record deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDetailedDispatchReport = async (req, res) => {
    try {
        const BackgroundJob = require("../../models/BackgroundJob");
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);

        const jobs = await BackgroundJob.find({ 
            createdAt: { $gte: todayStart },
            type: "MORNING_SUMMARY"
        }).populate("businessId", "displayName whatsappNumber");

        // Simple aggregation logic
        const report = jobs.map(j => ({
            id: j._id,
            merchant: j.businessId?.displayName || "System",
            channel: j.metadata?.channel || "unknown",
            status: j.status,
            error: j.error,
            completedAt: j.completedAt,
            attempts: j.attempts
        }));

        res.status(200).json({ 
            success: true, 
            data: report 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
