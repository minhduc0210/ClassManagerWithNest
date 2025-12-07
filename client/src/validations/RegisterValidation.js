import * as yup from "yup";

let schema = yup.object().shape({
  email: yup
    .string()
    .email("Please provide correct a email")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must at least 6 characters"),
  name: yup.string().required("Name is required"),
  lastname: yup.string().required("Lastname is required"),
  role: yup
    .mixed(["student", "teacher"])
    .required("You must choose student or teacher?"),
});

export default schema;