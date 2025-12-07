const asyncHandler = require("express-async-handler");
const CustomError = require("../helpers/errors/CustomError");
const Classroom = require("../models/Classroom");
const User = require("../models/User");
const Post = require("../models/Post");
const Homework = require("../models/Homework");
const Slot = require("../models/Slot");

const createClassroom = asyncHandler(async (req, res, next) => {
    try {
        const classroom = new Classroom({ ...req.body, teacher: req.user.id });
        const savedClassroom = await classroom.save();
        return res.status(200).json({
            success: true,
            classroom: savedClassroom,
        });
    } catch (error) {
        return res.status(500).json({
            errors: error
        });
    }
});


const joinClassroom = asyncHandler(async (req, res, next) => {
    try {
        const accessCode = req.params.code;
        const classroom = await Classroom.findOne({ accessCode });

        if (!classroom) {
            return res.status(400).json({
                errors: [{ path: "classroomCode", msg: "Classroom not found. Please check the access code." }]
            });
        }
        if (classroom.students.includes(req.user.id)) {
            return res.status(400).json({
                errors: [{ path: "classroomCode", msg: "You have already joined this classroom." }]
            });
        }
        classroom.students.push(req.user.id);
        await classroom.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error joining classroom:", error);
        return res.status(500).json({
            errors: [{ path: "classroomCode", msg: "Something went wrong. Please try again later." }]
        });
    }
});


const getClassroomInfo = asyncHandler(async (req, res) => {
    try {
        const { classroomID } = req.params;

        const classroom = await Classroom.findById(classroomID)
            .populate({
                path: "teacher",
                select: "name lastname",
            })
            .populate({
                path: "students",
                select: "name lastname email",
            })
            .populate("homeworks")
            .populate({
                path: "slots",
                populate: {
                    path: "posts",
                    populate: {
                        path: "author",
                        select: "name lastname",
                    },
                },
            });

        if (!classroom) {
            return res.status(404).json({ message: "Classroom not found" });
        }
        console.log(classroom)
        return res.status(200).json({ data: classroom });

    } catch (error) {
        console.error("Error fetching classroom info:", error);
        return res.status(500).json({ message: "Something went wrong while fetching classroom info" });
    }
});


const removeStudent = asyncHandler(async (req, res) => {
    try {
        const { classroomID, studentID } = req.params;
        const classroom = await Classroom.findById(classroomID);
        const studentIndex = classroom.students.indexOf(studentID);
        if (studentIndex === -1) {
            return res.status(404).json({ success: false, message: "Student not found in classroom" });
        }
        classroom.students.splice(classroom.students.indexOf(studentID), 1);
        await classroom.save();
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error fetching classroom info:", error);
        return res.status(500).json({ message: "Something went wrong while removing student from class" });
    }
});

const changeInformation = asyncHandler(async (req, res) => {
    try {
        const { title, subtitle } = req.body;
        const { classroom } = req;

        if (classroom.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized!" })
        }
        if (title) classroom.title = title;
        if (subtitle) classroom.subtitle = subtitle;
        await classroom.save();
        return res.status(200).json({ classroom });
    } catch (error) {
        console.error("Error updating classroom info:", error);
        return res.status(500).json({ message: "Something went wrong while updating classroom info" });
    }

});

const deleteClassroom = asyncHandler(async (req, res) => {
    try {
        const { classroom } = req;
        if (classroom.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized!" });
        }
        const slots = await Slot.find({ _id: { $in: classroom.slots } });
        for (const slot of slots) {
            await Post.deleteMany({ _id: { $in: slot.posts } });
        }
        await Slot.deleteMany({ _id: { $in: classroom.slots } });
        await Classroom.findByIdAndDelete(classroom._id);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Classroom deleted successfully!"
        });
    } catch (error) {
        console.error("Error deleting classroom:", error);
        return res.status(500).json({ message: "Something went wrong while deleting classroom" });
    }
});



module.exports = {
    createClassroom,
    joinClassroom,
    getClassroomInfo,
    removeStudent,
    changeInformation,
    deleteClassroom,
};