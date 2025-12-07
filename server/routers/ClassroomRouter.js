const router = require("express").Router();
const classroomController = require("../controllers/ClassroomController");
const inputValidator = require("../middlewares/inputValidator/InputValidator");
const { isAuth, isTeacher, isStudent } = require("../middlewares/auth/auth");
const { classroomCheck } = require("../middlewares/checkExist/CheckExist");

router.post(
  "/create",
  inputValidator.newClassroom(),
  isAuth,
  isTeacher,
  classroomController.createClassroom
);

router.post(
  "/join/:code",
  isAuth,
  isStudent,
  classroomController.joinClassroom
);

router.get("/:classroomID", isAuth, classroomController.getClassroomInfo);

router.patch(
  "/:classroomID/:studentID",
  isAuth,
  isTeacher,
  classroomCheck,
  classroomController.removeStudent
);

router.put(
  "/:classroomID",
  isAuth,
  isTeacher,
  classroomCheck,
  classroomController.changeInformation
);

router.delete(
  "/:classroomID",
  isAuth,
  isTeacher,
  classroomCheck,
  classroomController.deleteClassroom
);

module.exports = router;