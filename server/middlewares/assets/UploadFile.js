const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { nanoid } = require("nanoid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const publicDir = path.join(__dirname, "../../../public");
    const classroomID = req.params?.classroomID || "unknown-classroom";
    const slotID = req.params?.slotID || "unknown-slot";
    const fileDir = path.join(publicDir, "uploads", classroomID, slotID);
    fs.mkdirSync(fileDir, { recursive: true });

    cb(null, fileDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname); 
    const sign = nanoid(3); 
    const userID = req.user?.id || "unknown";
    const classroomID = req.params?.classroomID || "unknown-classroom";
    const slotID = req.params?.slotID || "unknown-slot";
    const fileName = `${classroomID}-${slotID}-${userID}-${sign}${extension}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

module.exports = upload;
