import {
    Container,
    Form,
    FloatingLabel,
    Button,
    Row,
    Col,
    Modal,
} from "react-bootstrap"
import { loginValidation } from "../../validations"
import { useFormik } from "formik"
import { useNavigate } from "react-router-dom"
import { fetchLogin, fetchResetPassword, fetchVerifyPassword } from "../../services/AuthService"
import { toast } from "react-toastify"
import { AuthContext } from "../../context/AuthContext";
import { useContext, useEffect, useState } from "react"

const Login = () => {
    const { login, user } = useContext(AuthContext)
    const navigate = useNavigate();
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [step, setStep] = useState(1);
    const [tempPassword, setTempPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const formik = useFormik({
        initialValues: {
            email: "",
            password: "",
        },
        validationSchema: loginValidation,
        onSubmit: async (values, bag) => {
            try {
                const response = await fetchLogin(values);
                if (response.status === 200) {
                    login(response);
                    toast.success(`Welcome ${response.data.name}!`);
                    navigate("/");
                }
            } catch (err) {
                toast.error("Incorrect email or password. Please try again.");
            }
        }
    });

    const handleResetPassword = async () => {
        try {
            const response = await fetchResetPassword({ email: resetEmail });
            if (response?.status === 200) {
                toast.success("A temporary password has been sent to your email");
                setStep(2);
            } else {
                toast.error("Error sending reset password email");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error sending reset password email");
        }
    };

    const handleVerifyPassword = async () => {
        try {
            const response = await fetchVerifyPassword({ email: resetEmail, tempPassword, newPassword });
            if (response?.status === 200) {
                toast.success("Password updated successfully! You can now log in.");
                setShowResetModal(false);
                setResetEmail("");
                setStep(1);
            } else {
                toast.error("Verification failed. Please try again.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error verifying password");
        }
    };

    return (
        <Container>
            <div>
                <img
                    src="/images/logo_fpt.png"
                    style={{ width: '20%', display: 'block', margin: '0 auto' }}
                    alt="Logo"
                    className="mt-4"
                />
                <h3 className="text-center mt-2 mb-4">Login Page</h3>
            </div>

            <Row>
                <Form onSubmit={formik.handleSubmit}>
                    <Col md={{ span: 6, offset: 3 }}>
                        <FloatingLabel label="Email" className="mb-3" controlId="floatingInput">
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
                        <FloatingLabel label="Password" className="mb-3" controlId="floatingPassword">
                            <Form.Control
                                onChange={formik.handleChange}
                                onBlur={formik.onBlur}
                                value={formik.values.password}
                                name="password"
                                type="password"
                                placeholder="Password"
                                isInvalid={formik.touched.password && formik.errors.password}
                            />
                            <Form.Control.Feedback type="invalid">
                                {formik.errors.password}
                            </Form.Control.Feedback>
                        </FloatingLabel>
                        <div className="d-grid gap-2">
                            <Button size="lg" className="mt-3" type="submit" style={{ backgroundColor: "#1565C0", color: "white" }}>
                                Login
                            </Button>
                            <div className="text-end mt-2">
                                <Button variant="link" className="p-0" onClick={() => setShowResetModal(true)}>
                                    Forgot Password?
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Form>
            </Row>

            <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {step === 1 ? (
                        <>
                            <FloatingLabel label="Enter your email" className="mb-3" controlId="floatingResetEmail">
                                <Form.Control
                                    type="email"
                                    placeholder="name@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </FloatingLabel>
                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" onClick={() => setShowResetModal(false)} className="me-2">
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleResetPassword}>
                                    Send Temporary Password
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <FloatingLabel label="Temporary Password" className="mb-3" controlId="floatingTempPassword">
                                <Form.Control
                                    type="text"
                                    placeholder="Temporary Password"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                />
                            </FloatingLabel>
                            <FloatingLabel label="New Password" className="mb-3" controlId="floatingNewPassword">
                                <Form.Control
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </FloatingLabel>
                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" onClick={() => setShowResetModal(false)} className="me-2">
                                    Cancel
                                </Button>
                                <Button variant="success" onClick={handleVerifyPassword}>
                                    Set New Password
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Login;
