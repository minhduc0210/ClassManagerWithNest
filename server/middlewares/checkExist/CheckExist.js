const asyncHandler = require("express-async-handler");
const Post = require("../../models/Post");
const Classroom = require("../../models/Classroom");
const Homework = require("../../models/Homework");
const Slot = require("../../models/Slot");

const checkDocumentById = (Model, paramName, resourceName) => 
  asyncHandler(async (req, res, next) => {
    try {
      const id = req.params[paramName];
      const document = await Model.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: `${resourceName} not found` });
      }

      req[resourceName.toLowerCase()] = document;
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

const slotCheck = checkDocumentById(Slot, "slotID", "Slot");
const postCheck = checkDocumentById(Post, "postID", "Post");
const classroomCheck = checkDocumentById(Classroom, "classroomID", "Classroom");
const homeworkCheck = checkDocumentById(Homework, "homeworkID", "Homework");

module.exports = { postCheck, classroomCheck, homeworkCheck, slotCheck };
