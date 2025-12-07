const asyncHandler = require("express-async-handler");
const Slot = require("../models/Slot");
const Classroom = require("../models/Classroom");

const createSlot = asyncHandler(async (req, res) => {
    try {
        const { title, content, startTime, endTime } = req.body;
        const classroom = req.classroom;
        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        const latestSlot = await Slot.findOne().sort({ startTime: -1 }).limit(1);

        if (latestSlot && (new Date(latestSlot.startTime) > new Date(startTime) || new Date(latestSlot.endTime) > new Date(endTime))) {
            return res.status(400).json({
                status: 400,
                message: "Cannot create slot because a later slot already exists.",
            });
        }
        const newSlot = await Slot.create({
            title,
            content,
            startTime,
            endTime,
        });
        classroom.slots.push(newSlot._id);
        await classroom.save();
        res.status(201).json({
            status: 201,
            message: "Slot created successfully",
            slot: newSlot,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

const updateSlot = asyncHandler(async (req, res) => {
    const { slotID } = req.params;
    const { title, content, startTime, endTime } = req.body;

    try {
        let slot = req.slot
        slot.title = title || slot.title;
        slot.content = content || slot.content;
        slot.startTime = startTime || slot.startTime;
        slot.endTime = endTime || slot.endTime;
        const updatedSlot = await slot.save();
        res.status(200).json({
            status: 200,
            message: "Slot updated successfully",
            slot: updatedSlot,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = { createSlot, updateSlot };
