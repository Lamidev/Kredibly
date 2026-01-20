const cron = require('node-cron');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification'); // Assuming you have this
const BusinessProfile = require('../models/BusinessProfile');
const whatsappController = require('../controllers/whatsapp/whatsappController'); // Or wherever your controller is

// Run every hour
// For demo/testing, you might want to run it every minute: '* * * * *'
const startTicketCleanup = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('🧹 Running Support Ticket Cleanup...');
        try {
            // Logic:
            // 1. Find tickets that are 'replied' (Waiting for user)
            // 2. But haven't been updated in X hours (e.g., 48 hours)
            // 3. Mark them as 'resolved'
            
            const HOURS_LIMIT = 24;
            const thresholdDate = new Date(Date.now() - (HOURS_LIMIT * 60 * 60 * 1000));

            // Find stale tickets
            const staleTickets = await SupportTicket.find({
                status: 'replied',
                updatedAt: { $lt: thresholdDate }
            });

            if (staleTickets.length > 0) {
                console.log(`Found ${staleTickets.length} stale tickets to auto-resolve.`);
                
                for (const ticket of staleTickets) {
                    ticket.status = 'resolved';
                    await ticket.save();

                    // Optional: Notify User via WhatsApp or Notification
                    // "Your ticket has been auto-closed due to inactivity."
                    if (ticket.businessId) {
                         const biz = await BusinessProfile.findById(ticket.businessId);
                         if (biz && biz.whatsappNumber) {
                             const text = `👋 Hi ${biz.displayName}, your support ticket #${ticket._id.toString().slice(-6)} has been automatically closed due to inactivity. Feel free to open a new one if you still need help!`;
                             await whatsappController.sendWhatsAppMessage(biz.whatsappNumber, text);
                         }
                    }
                }
            }

        } catch (err) {
            console.error('Error in Ticket Cleanup Cron:', err);
        }
    });

    console.log('⏰ Ticket Cleanup Scheduler Started (Checks every hour)');
};

module.exports = { startTicketCleanup };
