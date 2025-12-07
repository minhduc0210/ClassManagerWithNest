const asyncHandler = require("express-async-handler");
const CustomError = require("../helpers/errors/CustomError");
const Classroom = require("../models/Classroom");
const Post = require("../models/Post");
const path = require("path");
const fs = require("fs");
const Slot = require("../models/Slot");

const createPost = asyncHandler(async (req, res, next) => {
  try {
    const { classroomID, slotID } = req.params
    const classroom = await Classroom.findById(classroomID).select("slots");
    if (!classroom.slots.includes(slotID)) {
      return res.status(400).json({ message: "Slot does not belong to this classroom" });
    }
    const { title, content } = req.body;
    const slot = req.slot;
    const newPost = await Post({ title, content });
    newPost.author = req.user.id;
    req.file ? (newPost.file = req.file.filename) : null;
    await newPost.save();
    await slot.posts.push(newPost._id);
    await slot.save();
    return res.status(200).json({ success: true, data: newPost });
  } catch (error) {
    return res.status(500).json({ message: error })
  }
});

const deletePost = asyncHandler(async (req, res, next) => {
  try {
    const slot = req.slot;
    const post = req.post;
    console.log(post)
    if (req.user.id !== post.author.toString()) {
      return res.status(401).json({ message: "You are not authorized!" });
    }
    if (!slot || !post) {
      return res.status(404).json({ message: "slot or post not found" });
    }
    const postIndex = slot.posts.findIndex(postId => postId.toString() === post._id.toString());
    if (postIndex === -1) {
      return res.status(404).json({ message: "Post not found in slot posts" });
    }
    slot.posts.splice(postIndex, 1);
    await slot.save();
    await Post.findByIdAndDelete(post._id);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


const updatePost = asyncHandler(async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const post = req.post;
    if (title) post.title = title;
    if (content) post.content = content;
    if (req.file) post.file = req.file.filename
    await post.save();
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ message: error })
  }
});

const getPostsByClassroom = asyncHandler(async (req, res, next) => {
  try {
    const posts = await Classroom.findById(req.classroom._id)
      .select("posts")
      .populate({
        path: "posts",
        select: "-__v",
        populate: { path: "author", select: "name lastname" },
      });
    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ message: error })
  }
});

const getPostsBySlot = asyncHandler(async (req, res, next) => {
  try {
    const { classroomID, slotID } = req.params
    const classroom = await Classroom.findById(classroomID).select("slots");
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    if (!classroom.slots.includes(slotID)) {
      return res.status(400).json({ message: "Slot does not belong to this classroom" });
    }
    const posts = await Slot.findById(slotID)
      .select("posts")
      .populate({
        path: "posts",
        select: "-__v",
        populate: { path: "author", select: "name lastname role" },
      });
    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(500).json({ message: error })
  }
});

const sendPostFile = async (req, res, next) => {
  try {
    const appPath = path.resolve();
    const { filename } = req.params;
    const [classroomID, slotID] = filename.split("-").slice(0, 2);
    const filePath = path.join(appPath, "../public/uploads", classroomID, slotID, filename);
    console.log(filePath)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    return res.status(200).sendFile(filePath);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error });
  }
};


module.exports = {
  createPost,
  deletePost,
  updatePost,
  getPostsByClassroom,
  sendPostFile,
  getPostsBySlot
};