const { verify } = require("jsonwebtoken");
const CustomError = require("../../helpers/errors/CustomError");

const isAuth = (req, res, next) => {
  try {
    const authorization = req.headers["authorization"];
    if (!authorization) {
      return res.status(401).json({
        message: "You are not authorized!",
      });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Invalid token!",
      });
    }

    const { _id, email, role } = verify(token, process.env.SECRET_ACCESS_TOKEN);
    req.user = {
      id: _id,
      email,
      role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token!",
    });
  }
};

const isTeacher = (req, res, next) => {
  if (req.user.role === "teacher") return next();
  return res.status(401).json({
      message: "You're not authorized!",
    });
};

const isStudent = (req, res, next) => {
  if (req.user.role === "student") return next();
  return res.status(401).json({
      message: "You're not authorized!",
    });
};

module.exports = {
  isAuth,
  isStudent,
  isTeacher
};