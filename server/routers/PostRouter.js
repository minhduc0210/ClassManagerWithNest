const router = require("express").Router();
const { isAuth } = require("../middlewares/auth/auth");
const postController = require("../controllers/PostController");
const uploadFile = require("../middlewares/assets/UploadFile");
const { classroomCheck, postCheck, slotCheck } = require("../middlewares/checkExist/CheckExist");

router.get("/download/:filename",
    // isAuth,
    postController.sendPostFile
);

router.get(
    "/:classroomID",
    isAuth,
    classroomCheck,
    postController.getPostsByClassroom
);

router.get(
    "/:classroomID/:slotID",
    isAuth,
    classroomCheck,
    slotCheck,
    postController.getPostsBySlot
);

router.post(
    "/:classroomID/:slotID",
    isAuth,
    classroomCheck,
    slotCheck,
    uploadFile.single("post_file"),
    postController.createPost
);

router.delete(
    "/:slotID/:postID",
    isAuth,
    slotCheck,
    postCheck,
    postController.deletePost
);

router.patch(
    "/:classroomID/:slotID/:postID",
    isAuth,
    classroomCheck,
    slotCheck,
    postCheck,
    uploadFile.single("post_file"),
    postController.updatePost
);



module.exports = router;