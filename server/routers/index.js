const router = require("express").Router();
const userRouter = require("./UserRouter");
const classroomRouter = require("./ClassroomRouter");
const postRouter = require("./PostRouter");
const slotRouter = require("./SlotRouter");
// Use router
router.use("/users", userRouter);
router.use("/classrooms", classroomRouter);
router.use("/posts", postRouter);
router.use("/slots", slotRouter);

module.exports = router;