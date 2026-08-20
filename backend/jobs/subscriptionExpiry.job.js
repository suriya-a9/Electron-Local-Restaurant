const cron = require("node-cron");

const {
    expireOverdueSubscriptions,
} = require("../modules/admin/clientSubscriptions/clientSubscriptions.model");

const startSubscriptionExpiryJob = () => {
    // Runs every day at 00:05 server time
    cron.schedule("5 0 * * *", async () => {
        try {
            const expired = await expireOverdueSubscriptions();

            if (expired.length > 0) {
                console.log(
                    `[subscription-expiry-job] Marked ${expired.length} subscription(s) as expired:`,
                    expired.map((row) => row.id)
                );
            } else {
                console.log(
                    "[subscription-expiry-job] No subscriptions to expire."
                );
            }
        } catch (error) {
            console.error(
                "[subscription-expiry-job] Failed to run expiry sweep:",
                error
            );
        }
    });

    console.log("[subscription-expiry-job] Scheduled (daily at 00:05).");
};

module.exports = startSubscriptionExpiryJob;