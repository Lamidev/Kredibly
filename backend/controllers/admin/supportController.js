const SupportTicket = require("../../models/SupportTicket");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { logActivity } = require("../../utils/activityLogger");
const whatsappController = require("../whatsapp/whatsappController");

exports.createTicket = async (req, res) => {
    try {
        const { message, businessId } = req.body;

        const newTicket = new SupportTicket({
            userId: req.user._id,
            businessId,
            message
        });

        await newTicket.save();

        // Fetch business name for better logging
        const biz = await BusinessProfile.findOne({ ownerId: req.user._id });
        const nameToShow = biz ? biz.displayName : req.user.name;

        // Log this activity for the founder to see
        await logActivity({
            userId: req.user._id,
            businessId,
            action: "SUPPORT_TICKET_CREATED",
            details: `${nameToShow} submitted a support request.`,
            entityType: "USER"
        });

        res.status(201).json({
            success: true,
            message: "Ticket submitted successfully. Kreddy and the team will get back to you shortly!",
            data: newTicket
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUsersTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin only
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({})
            .populate("userId", "name email")
            .populate("businessId", "displayName")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        await SupportTicket.findByIdAndUpdate(id, { status: "resolved" });
        res.status(200).json({ success: true, message: "Ticket marked as resolved." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.replyToTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.replies.push({
            message,
            sender: req.user.role === 'admin' ? "admin" : "user"
        });

        if (req.user.role === 'admin') {
            ticket.status = "replied";

            // Create notification for the user
            if (ticket.businessId) {
                await Notification.create({
                    businessId: ticket.businessId,
                    title: "Support Update 📩",
                    message: "The admin has replied to your support ticket. Check the Support Hub for details.",
                    type: "system"
                });

                // Also send WhatsApp notification via Kreddy
                const biz = await BusinessProfile.findById(ticket.businessId);
                if (biz && biz.whatsappNumber) {
                    const text = `👋 Hi ${biz.displayName}, Admin just replied to your support ticket! \n\n" ${message} "\n\nCheck your dashboard Support Hub to continue the conversation. 🚀`;
                    await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
                }
            }
        } else {
            ticket.status = "open";

            // Log for admin to see there's a new message
            await logActivity({
                userId: req.user._id,
                businessId: ticket.businessId,
                action: "SUPPORT_TICKET_REPLIED",
                details: `User replied to ticket #${ticket._id.toString().slice(-6)}`,
                entityType: "USER"
            });
        }

        await ticket.save();

        res.status(200).json({ success: true, message: "Reply sent successfully", data: ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
