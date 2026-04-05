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

        // Notify Super Admin Instantly via Email
        // In production, this would be an env var like process.env.ADMIN_EMAIL
        // For now, using a placeholder or assuming it goes to the maintainer
        try {
            const adminEmail = process.env.ADMIN_EMAIL || "support@usekredibly.com"; 
            await sendNewTicketEmail(adminEmail, nameToShow, message, newTicket._id);
        } catch (emailErr) {
            console.error("Failed to send admin alert email:", emailErr);
            // Don't fail the request if email fails
        }

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
        const ticket = await SupportTicket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.status = "resolved";
        await ticket.save();

        // Notify User via Dashboard
        if (ticket.businessId) {
            await Notification.create({
                businessId: ticket.businessId,
                title: "Ticket Resolved ✅",
                message: "Your support ticket has been marked as resolved by the admin. We hope we solved your issue!",
                type: "system"
            });

            // Notify User via WhatsApp (Kreddy)
            const biz = await BusinessProfile.findById(ticket.businessId);
            if (biz && biz.whatsappNumber) {
                const text = `🎉 Hi ${biz.displayName}, your support ticket regarding "${ticket.message.substring(0, 30)}..." has been resolved! \n\nIf you need anything else, just ask Kreddy. Happy selling! 🚀`;
                await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
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

        // Robust sender detection: 
        // 1. If user is an admin and NOT the owner of the ticket => 'admin'
        // 2. Otherwise => 'user'
        const isOwner = req.user._id.toString() === ticket.userId.toString();
        const sender = (req.user.role === 'admin' && !isOwner) ? "admin" : "user";

        ticket.replies.push({
            message,
            sender
        });

        if (sender === 'admin') {
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
                const biz = await BusinessProfile.findById(ticket.businessId).populate('ownerId');
                
                if (biz) {
                    // PLAN-BASED ROUTING
                    const plan = biz.plan || 'hustler';
                    const isHustler = plan === 'hustler';

                    if (isHustler) {
                         // Email Only for Hustlers (Protect Premium Exclusivity)
                         if (biz.ownerId && biz.ownerId.email) {
                             await sendSupportReplyEmail(
                                 biz.ownerId.email, 
                                 biz.displayName, 
                                 message, 
                                 ticket.message.substring(0, 30) + "..."
                             );
                         }
                    } else {
                         // Premium WhatsApp Alerts for Oga/Chairman
                         if (biz.whatsappNumber) {
                             const planTitle = plan === 'chairman' ? 'Chairman' : 'Oga';
                             const nameToUse = biz.assistantSettings?.preferredName || biz.displayName;
                             
                             let text = "";
                             if (plan === 'chairman') {
                                 text = `🦁 *Chairman ${nameToUse}, Urgent Support Update!* \n\nI have a priority response from the team regarding your ticket: \n\n" *${message}* "\n\nYou can reply directly to me here, or check your Support Hub! 💎`;
                             } else {
                                 text = `🚀 *High power, Oga ${nameToUse}!* \n\nThe team has sent a sharp response to your issue: \n\n" *${message}* "\n\nRecord is safe and we're moving! Check your Support Hub for more. 🛡️`;
                             }
                             
                             await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
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
                    title: "Support Update 📩"
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
