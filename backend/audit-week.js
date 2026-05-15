const mongoose = require('mongoose');
const Sale = require('./models/Sale');
const User = require('./models/User');
const Business = require('./models/BusinessProfile');
require('dotenv').config();

async function audit() {
    await mongoose.connect(process.env.MONGODB_URL);
    
    const user = await User.findOne({ name: /Akinyemi/i });
    if (!user) {
        console.log("User not found");
        process.exit();
    }
    
    const biz = await Business.findOne({ ownerId: user._id });
    if (!biz) {
        console.log("Business not found");
        process.exit();
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const sales = await Sale.find({ 
        businessId: biz._id, 
        "payments.date": { $gte: startOfWeek } 
    });

    let total = 0;
    console.log(`--- WEEKLY AUDIT FOR ${biz.displayName} (From Mon ${startOfWeek.toDateString()}) ---`);
    
    sales.forEach(s => {
        s.payments.forEach(p => {
            if (new Date(p.date) >= startOfWeek) {
                console.log(`₦${p.amount.toLocaleString()} | ${p.method} | ${new Date(p.date).toDateString()} | Invoice: #${s.invoiceNumber}`);
                total += p.amount;
            }
        });
    });

    console.log("--------------------------------------------------");
    console.log("CALCULATED TOTAL:", total);
    process.exit();
}

audit();
