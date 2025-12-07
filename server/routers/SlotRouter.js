const router = require("express").Router();
const { isAuth, isTeacher } = require("../middlewares/auth/auth");
const { classroomCheck, postCheck, slotCheck } = require("../middlewares/checkExist/CheckExist");
const slotController = require("../controllers/SlotController");

router.post("/:classroomID",
    isAuth,
    isTeacher,
    classroomCheck,
    slotController.createSlot)

router.put("/:slotID",
    isAuth,
    isTeacher,
    slotCheck,
    slotController.updateSlot)

module.exports = router