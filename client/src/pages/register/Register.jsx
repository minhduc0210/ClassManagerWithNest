import {
    Container,
    Form,
    FloatingLabel,
    Button,
    Row,
    Col,
    ToggleButton,
    Alert,
    ToggleButtonGroup,
} from "react-bootstrap"
import { registerValidation } from "../../validations"
import { useFormik } from "formik"
import { useNavigate } from "react-router-dom"
import { fetchRegister } from "../../services/AuthService"
import { toast } from "react-toastify"

const Register = () => {
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            name: "",
            lastname: "",
            password: "",
            role: "student",
            email: "",
        },
        validationSchema: registerValidation,
        onSubmit: async (values, bag) => {
            try {
                const response = await fetchRegister(values);
                if (response.status === 201) {
                    toast.success("Register successfully!");
                    navigate("/login")
                  }
            } catch (err) {
                console.log(err)
                if (err.response && err.response.data.errors) {
                    const errorsArray = err.response.data.errors;
                    const errors = {}
        
                    errorsArray.forEach(error => {
                        errors[error.path] = error.msg;
                    });
        
                    bag.setErrors(errors)
                }
            }
        },
    });

    return (
        <Container>
            <div>
                <img
                    src="/images/logo_fpt.png"
                    style={{ width: '20%', display: 'block', margin: '0 auto' }}
                    alt="Logo"
                    className="mt-4"
                />
                <h3 className="text-center mt-2 mb-4">Register Your Account</h3>
            </div>

            {/* forms */}
            <Row>
                {formik.errors.general && (
                    <Col md={{ span: 6, offset: 3 }}>
                        <Alert variant="danger">{formik.errors.general}</Alert>
                    </Col>
                )}

                <Form onSubmit={formik.handleSubmit}>
                    <Col md={{ span: 6, offset: 3 }}>
                        <FloatingLabel label="First Name" className="mb-3">
                            <Form.Control
                                onChange={formik.handleChange}
                                onBlur={formik.onBlur}
                                value={formik.values.name}
                                name="name"
                                type="text"
                                isInvalid={formik.touched.name && formik.errors.name}
                            />
                            <Form.Control.Feedback type="invalid">
                                {formik.errors.name}
                            </Form.Control.Feedback>
                        </FloatingLabel>
                        <FloatingLabel label="Lastname" className="mb-3">
                            <Form.Control
                                onChange={formik.handleChange}
                                onBlur={formik.onBlur}
                                value={formik.values.lastname}
                                name="lastname"
                                type="text"
                                isInvalid={formik.touched.lastname && formik.errors.lastname}
                            />
                            <Form.Control.Feedback type="invalid">
                                {formik.errors.lastname}
                            </Form.Control.Feedback>
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="floatingInput"
                            label="Email address"
                            className="mb-3"
                        >
                            <Form.Control
                                onChange={formik.handleChange}
                                onBlur={formik.onBlur}
                                value={formik.values.email}
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                isInvalid={formik.touched.email && formik.errors.email}
                            />
                            <Form.Control.Feedback type="invalid">
                                {formik.errors.email}
                            </Form.Control.Feedback>
                        </FloatingLabel>

                        <FloatingLabel controlId="floatingPassword" label="Password">
                            <Form.Control
                                name="password"
                                onChange={formik.handleChange}
                                onBlur={formik.onBlur}
                                value={formik.values.password}
                                type="password"
                                placeholder="Password"
                                isInvalid={formik.touched.password && formik.errors.password}
                            />
                            <Form.Control.Feedback type="invalid">
                                {formik.errors.password}
                            </Form.Control.Feedback>
                        </FloatingLabel>
                        <div className="d-flex justify-content-between mt-3">
                            <ToggleButtonGroup
                                type="radio"
                                name="role"
                                defaultValue="student"
                                className="w-100"
                            >
                                <ToggleButton
                                    id="studentRadio"
                                    value={"student"}
                                    onChange={formik.handleChange}
                                    style={{
                                        backgroundColor: formik.values.role === "student" ? "#1565C0" : "#FFFFFF",
                                        color: formik.values.role === "student" ? "white" : "#1565C0"
                                    }}
                                    className="btn-sm flex-grow-1"
                                >
                                    Student
                                </ToggleButton>
                                <ToggleButton
                                    id="teacherRadio"
                                    value="teacher"
                                    onChange={formik.handleChange}
                                    style={{
                                        backgroundColor: formik.values.role === "teacher" ? "#1565C0" : "#FFFFFF",
                                        color: formik.values.role === "teacher" ? "white" : "#1565C0"
                                    }}
                                    className="btn-sm flex-grow-1"
                                >
                                    Teacher
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </div>
                        <div className="d-grid gap-2">
                            <Button size="lg" className="mt-3" type="submit" style={{ backgroundColor: "#1565C0", color: "white" }}>
                                Register
                            </Button>
                        </div>
                    </Col>
                </Form>
            </Row>
        </Container>
    );
};

export default Register