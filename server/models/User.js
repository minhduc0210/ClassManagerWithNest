const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
  },
  lastname: {
    type: String,
    required: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    default: "student",
  },
  tempPassword: {
    type: String,
    default: null,
  },
});

const User = mongoose.model("User", UserSchema, "users");

module.exports = User;