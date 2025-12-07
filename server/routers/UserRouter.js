const router = require("express").Router();
const userController = require("../controllers/UserController");
const inputValidator = require("../middlewares/inputValidator/InputValidator");
const { isAuth } = require("../middlewares/auth/auth");

// /api/users

router.post("/register", inputValidator.newUser(), userController.register);
router.post("/login", userController.login);
router.get("/logout/:userID", userController.logout);
router.post("/refreshtoken", userController.refreshToken);
router.put("/:userID", isAuth, userController.changeInformation);
router.get("/loggedUser", isAuth, userController.getUserInformation);
router.put("/profile/change-password", isAuth, userController.changePassword);
router.post("/reset-password", userController.resetPassword);
router.post("/verify-password", userController.verifyPassword);
module.exports = router;