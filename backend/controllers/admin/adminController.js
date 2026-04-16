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
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalBusinesses = await BusinessProfile.countDocuments();
        const totalSalesCount = await Sale.countDocuments();

        // 1. Merchant Platform Volume (Money flowing through merchants)
        const sales = await Sale.find({});
        let totalPlatformVolume = 0;
        let totalOutstanding = 0;

        sales.forEach(s => {
            const paid = (s.payments || [])
                .filter(p => p.method === 'Paystack')
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            totalPlatformVolume += paid;
            totalOutstanding += Math.max(0, (s.totalAmount || 0) - paid);
        });

        // 2. Kredibly Revenue (Subscription payments)
        const allPayments = await Payment.find({ status: 'success' });
        const totalKrediblyRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

        // Filter Pulse for high-value activities only
        const importantActions = ['SIGNUP', 'WHATSAPP_SALE_CREATED', 'PAYMENT_RECEIVED', 'SUBSCRIPTION_PAID', 'SUPPORT_TICKET_CREATED', 'PROFILE_UPDATED'];
        const globalActivities = await ActivityLog.find({ 
            action: { $in: importantActions } 
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBusinesses,
                totalIncomplete: Math.max(0, totalUsers - totalBusinesses),
                totalSalesCount,
                totalPlatformVolume,
                totalOutstanding,
                totalKrediblyRevenue
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
        const payments = await Payment.find({})
            .populate('businessId', 'displayName')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
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
        const sales = await Sale.find({ 
            "payments.method": "Paystack" 
        })
            .select("customerName invoiceNumber businessId payments")
            .populate("businessId", "displayName logoUrl")
            .sort({ "payments.date": -1 });

        // Flatten the payments into a single list
        const flattened = [];
        sales.forEach(sale => {
            sale.payments.forEach(payment => {
                if (payment.method === 'Paystack') {
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
                }
            });
        });

        // Sort by date descending
        flattened.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ success: true, data: flattened.slice(0, 100) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteInvoicePayment = async (req, res) => {
    try {
        const { saleId, paymentId } = req.params;
        const sale = await Sale.findById(saleId);
        if (!sale) return res.status(404).json({ message: "Invoice not found" });

        sale.payments = sale.payments.filter(p => p._id.toString() !== paymentId);
        await sale.save();

        res.status(200).json({ success: true, message: "Payment removed successfully" });
    } catch (error) {
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

        // 2. Fetch Aggregated Feed (Filtered for Significance)
        const [jobs, logs, subs, sales] = await Promise.all([
            // Show only Failed or Processing jobs (The ones needing attention)
            BackgroundJob.find({ status: { $in: ['failed', 'processing'] } }).sort({ createdAt: -1 }).limit(20).populate("businessId", "displayName"),
            
            // Show only high-value logs
            ActivityLog.find({ 
                action: { $in: ['SIGNUP', 'PROFILE_UPDATED', 'ACCOUNT_VERIFIED'] } 
            }).sort({ createdAt: -1 }).limit(15).populate("businessId", "displayName"),
            
            Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(10).populate("businessId", "displayName"),
            Sale.find({ "payments.0": { $exists: true } }).sort({ "payments.date": -1 }).limit(10).populate("businessId", "displayName")
        ]);

        // 3. Format Unified Feed
        const feed = [];

        // Add Background Jobs (Purple)
        jobs.forEach(j => {
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

        // Add Merchant Logs (Gray)
        logs.forEach(l => {
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
        subs.forEach(p => {
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

        // Add Customer Payments (Green)
        sales.forEach(s => {
            s.payments.forEach(p => {
                feed.push({
                    _id: p._id,
                    type: 'SALE',
                    event: 'CUSTOMER_PAYMENT',
                    merchant: s.businessId?.displayName || "Unknown",
                    details: `Amount: ₦${p.amount.toLocaleString()} for Invoice ${s.invoiceNumber}`,
                    timestamp: p.date,
                    color: 'green'
                });
            });
        });

        // Final Sort
        feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({
            success: true,
            stats: statsObj,
            feed: feed.slice(0, 100)
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
