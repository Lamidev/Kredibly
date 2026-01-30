const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * STRATEGY: 
 * If mongodump is available, use it.
 * Otherwise, log a warning and recommend MongoDB Atlas backups.
 */
const startBackupScheduler = () => {
    // Run every day at Midnight (00:00)
    cron.schedule('0 0 * * *', () => {
        console.log("💾 Starting daily database backup...");
        
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const fileName = `kredibly_backup_${new Date().toISOString().split('T')[0]}.gz`;
        const filePath = path.join(backupDir, fileName);

        // Check for mongodump command
        exec('mongodump --version', (err) => {
            if (err) {
                console.warn("⚠️ mongodump not found. Cannot perform automated local backup.");
                console.info("💡 Recommendation: Use MongoDB Atlas automated backups for production.");
                return;
            }

            const dbUrl = process.env.MONGODB_URL;
            const cmd = `mongodump --uri="${dbUrl}" --archive="${filePath}" --gzip`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ Backup failed: ${error.message}`);
                    return;
                }
                console.log(`✅ Backup successful: ${fileName}`);
                
                // Keep only last 7 days of local backups
                // (Logic to delete old files could go here)
            });
        });
    });

    console.log("📅 Database Backup Scheduler active (Daily at 00:00)");
};

module.exports = { startBackupScheduler };
