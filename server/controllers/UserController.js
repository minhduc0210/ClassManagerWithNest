const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const CustomError = require("../helpers/errors/CustomError");
const { validationResult } = require("express-validator");
const { hash, compare } = require("bcrypt");
const { verify } = require("jsonwebtoken");
const {
  createAccessToken,
  createRefreshToken,
  saveRefreshToken,
  deleteRefreshToken,
} = require("../helpers/tokens/tokenHelper");
const RefreshToken = require("../models/RefreshToken");
const crypto = require("crypto");
const nodemailer = require("nodemailer")

const register = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        errors: [{ path: "email", msg: "Email already in use" }]
      });
    }
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        errors: validationErrors.array(),
      });
    }

    const hashedPassword = await hash(password, 10);
    const newUser = await User.create({ ...req.body, password: hashedPassword });

    return res.status(201).json({
      message: "User Created",
      user: newUser,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        path: key,
        msg: error.errors[key].message,
      }));
      return res.status(400).json({ errors });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(401).json({ errors: [{ msg: "Incorrect email or password" }] });
    const valid = await compare(password, user.password);
    if (!valid) return res.status(401).json({ errors: [{ msg: "Incorrect email or password" }] });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.save();
    await saveRefreshToken(user._id, refreshToken);
    return res.status(200).json({
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" })
  }

});

const logout = asyncHandler(async (req, res, next) => {
  try {
    const { userID } = req.params;
    await deleteRefreshToken(userID);
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" })
  }

});

const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.refreshtoken;
  if (!token) return res.json({ accessToken: "" });
  let payload = verify(token, process.env.SECRET_REFRESH_TOKEN);
  if (!payload) return res.json({ accessToken: "" });
  let user = await User.findById(payload._id);
  if (!user) return res.json({ accessToken: "user not found" });
  const existingRefreshtoken = await RefreshToken.findOne({ user: user._id });
  if (existingRefreshtoken.refreshToken !== token) {
    return res.json({ accessToken: "token is not correct" });
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  await user.save();
  await saveRefreshToken(user._id, refreshToken);
  return res.status(200).json({ accessToken, refreshToken });
});

const changeInformation = asyncHandler(async (req, res) => {
  try {
    const { userID } = req.params;
    const { name, lastname } = req.body;
    const user = await User.findByIdAndUpdate(
      userID,
      { name, lastname },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Not found user!" })
    return res.status(200).json(user);
  } catch (error) {
    console.log(error)
    return res.status(500).json(error)
  }
});

const getUserInformation = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return next(new CustomError("User not found", 400));
  const attended = await Classroom.find({
    students: user.id,
  })
    .select("title subtitle teacher")
    .populate({
      path: "teacher",
      select: "name lastname ",
    });

  const createdBy = await Classroom.find({
    teacher: user.id,
  })
    .select("title subtitle teacher")
    .populate({
      path: "teacher",
      select: "name lastname ",
    });
  const classrooms = [...createdBy, ...attended];
  return res.status(200).json({ user, classrooms });
});

const changePassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        errors: [{ path: "oldPassword", msg: "Old password is incorrect" }],
      });
    }
    const hashedPassword = await hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-6);
};

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Tạo mật khẩu tạm thời
    const tempPassword = generateRandomPassword();
    user.tempPassword = tempPassword
    await user.save()

    // Gửi email chứa mật khẩu tạm thời
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Your Temporary Password",
      text: `Hello,\n\nYour temporary password is: ${tempPassword}\n\n`
        + `Please use this password to verify and set a new password.\n\n`
        + `If you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    // Gửi về client để frontend có thể kiểm tra mật khẩu này (không lưu vào DB)
    return res.status(200).json({ tempPassword, message: "A temporary password has been sent to your email." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const verifyPassword = async(req, res)=>{
  try {
    const { email, tempPassword, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Kiểm tra nếu người dùng không nhập đúng mật khẩu tạm thời (so sánh phía frontend)
    if (!tempPassword) {
      return res.status(400).json({ message: "Temporary password is required!" });
    }

    if (tempPassword !== user.tempPassword) {
      return res.status(400).json({ message: "Wrong temp password!" });
    }

    // Cập nhật mật khẩu mới nếu mật khẩu tạm thời đúng
    user.password = await hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  changeInformation,
  getUserInformation,
  changePassword,
  resetPassword,
  verifyPassword
};