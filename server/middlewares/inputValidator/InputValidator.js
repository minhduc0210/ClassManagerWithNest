const { body } = require("express-validator");

const newUser = () => {
  return [
    body("name", "Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be minumum of 2 characters")
      .exists()
      .trim(),
    body("lastname", "LastName is required")
      .isLength({ min: 2 })
      .withMessage("Lastname must be minumum of 2 characters")
      .exists()
      .trim(),
    body("role", "Role is required").exists(),
    body("email", "Email is required").isEmail().exists().trim(),
    body("password", "Password is require")
      .isLength({ min: 6 })
      .withMessage("Password must be 6 character")
      .exists(),
  ];
};

const newClassroom = () => {
  return [
    body("title", "Title is require").exists().isLength({ min: 3 }).trim(),
    body("subtitle").trim(),
  ];
};

module.exports = {
  newUser,
  newClassroom
};