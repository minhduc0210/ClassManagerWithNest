import * as yup from "yup";

let schema = yup.object().shape({
    email: yup
        .string()
        .email("Please provide a correct email")
        .required("Email is required"),
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters")
});

export default schema;