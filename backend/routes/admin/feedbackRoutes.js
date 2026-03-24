const express = require("express");
const router = express.Router();
const Feedback = require("../../models/Feedback");

// GET ALL FEEDBACK (Admin Only)
router.get("/all", async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .populate("userId", "name email")
            .populate("businessId", "displayName plan")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: feedbacks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// UPDATE STATUS/NOTES
router.put("/:id/update", async (req, res) => {
    try {
        const { status, devNotes, priority } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, {
            status,
            devNotes,
            priority
        }, { new: true });

        res.json({ success: true, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE FEEDBACK
router.delete("/:id", async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Feedback removed from roadmap." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
