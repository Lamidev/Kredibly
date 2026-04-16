const mongoose = require("mongoose");
require("dotenv").config({ path: ".env", override: true });

const BackgroundJobSchema = new mongoose.Schema({
    type: String,
    status: String,
    businessId: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    completedAt: Date,
    error: String
});
const BackgroundJob = mongoose.model("BackgroundJob", BackgroundJobSchema);

async function checkJobs() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");

        const ReminderSchema = new mongoose.Schema({
            description: String,
            status: String,
            triggerDate: Date,
            whatsappNumber: String,
            deliveredAt: Date
        });
        const Reminder = mongoose.model("Reminder", ReminderSchema);

        const yesterdayStart = new Date("2026-04-14T15:00:00Z"); // 4 PM WAT
        const yesterdayEnd = new Date("2026-04-14T19:00:00Z"); // 8 PM WAT

        const reminders = await Reminder.find({
            triggerDate: { $gte: yesterdayStart, $lte: yesterdayEnd }
        });

        console.log(`Found ${reminders.length} reminders from yesterday between 4pm-8pm WAT.`);
        reminders.forEach(r => {
            console.log(`- Reminder [${r._id}]: Desc="${r.description}", Status=${r.status}, TriggerDate=${r.triggerDate}, DeliveredAt=${r.deliveredAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkJobs();
