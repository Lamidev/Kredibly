const SupportTicket = require("../../models/SupportTicket");
const BusinessProfile = require("../../models/BusinessProfile");
const Notification = require("../../models/Notification");
const { logActivity } = require("../../utils/activityLogger");
const whatsappController = require("../whatsapp/whatsappController");

const { sendNewTicketEmail, sendSupportReplyEmail } = require("../../emailLogic/emails"); // Assuming you'll add this next

exports.createTicket = async (req, res) => {
    try {
        const { message, businessId } = req.body;

        const newTicket = new SupportTicket({
            userId: req.user._id,
            businessId,
            message,
            source: "dashboard",
            status: "open"
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
            details: `${nameToShow} submitted a support request via Dashboard.`,
            entityType: "USER"
        });

        // Notify Super Admin Instantly via Email
        try {
            const adminEmail = process.env.ADMIN_EMAIL || "support@usekredibly.com"; 
            await sendNewTicketEmail(adminEmail, nameToShow, message, newTicket._id);
        } catch (emailErr) {
            console.error("Failed to send admin alert email:", emailErr);
        }

        res.status(201).json({
            success: true,
            message: "Ticket submitted successfully. Our team will get back to you shortly!",
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
            .populate("businessId", "displayName plan whatsappNumber")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await SupportTicket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.status = "resolved";
        await ticket.save();

        // Notify User via Dashboard
        if (ticket.businessId) {
            await Notification.create({
                businessId: ticket.businessId,
                title: "Ticket Resolved",
                message: `Your support ticket #${ticket._id.toString().slice(-6)} has been marked as resolved.`,
                type: "system"
            });

            // Only notify on WhatsApp if ticket originated on WhatsApp
            if (ticket.source === "whatsapp") {
                const biz = await BusinessProfile.findById(ticket.businessId);
                if (biz && biz.whatsappNumber) {
                    const text = `Ticket #${ticket._id.toString().slice(-6)} has been marked as resolved. If you need anything else, feel free to reach out anytime.`;
                    await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
                }
            }
        }

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

        const isOwner = req.user._id.toString() === ticket.userId.toString();
        const sender = (req.user.role === 'admin' && !isOwner) ? "admin" : "user";

        ticket.replies.push({
            message,
            sender
        });

        if (sender === 'admin') {
            ticket.status = "replied";

            if (ticket.businessId) {
                await Notification.create({
                    businessId: ticket.businessId,
                    title: "Support Update",
                    message: `Our team replied to your support ticket: "${message.substring(0, 50)}..."`,
                    type: "system"
                });

                const biz = await BusinessProfile.findById(ticket.businessId).populate('ownerId');
                
                if (biz) {
                    const shortId = ticket._id.toString().slice(-6);
                    const userName = biz.displayName || "there";

                    // Channel Routing
                    if (ticket.source === "whatsapp") {
                        // Deliver directly to WhatsApp via Kreddy
                        if (biz.whatsappNumber) {
                            const text = `Update on Ticket #${shortId}:\n\n${message}\n\n— Kredibly Support Team`;
                            await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
                        }
                    } else {
                        // Ticket created on Dashboard => Email user via Resend (Kreddy stays silent on WhatsApp)
                        const userEmail = biz.ownerId?.email;
                        if (userEmail) {
                            await sendSupportReplyEmail(
                                userEmail, 
                                userName, 
                                message, 
                                `Ticket #${shortId}`
                            );
                        }
                    }
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

exports.markSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await SupportTicket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        if (ticket.status === 'replied') {
            ticket.status = 'open';
            await ticket.save();

            // Clear corresponding notifications
            if (ticket.businessId) {
                await Notification.deleteMany({
                    businessId: ticket.businessId,
                    title: "Support Update"
                });
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await SupportTicket.findByIdAndDelete(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        res.status(200).json({ success: true, message: "Ticket deleted permanently." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
