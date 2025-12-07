import React, { useState, useEffect, useContext } from "react";
import { Form, Button, Container, Row, Col, Card, Spinner, Modal } from "react-bootstrap";
import { fetchUser, fetchUpdateUser, fetchChangePassword } from "../../services/AuthService";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const UserProfile = () => {
    const { setUser } = useContext(AuthContext);
    const [user, setLocalUser] = useState(null);
    const [formData, setFormData] = useState({ name: "", lastname: "" });
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordError, setPasswordError] = useState("");
    const [apiError, setApiError] = useState("");

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await fetchUser();
                setLocalUser(response.data.user);
                setFormData({
                    name: response.data.user.name || "",
                    lastname: response.data.user.lastname || ""
                });
            } catch (error) {
                toast.error("Error fetching user data!");
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user._id) {
            toast.error("User data is not available!");
            return;
        }

        try {
            const updatedUser = await fetchUpdateUser(user._id, formData);
            if (updatedUser) {
                setLocalUser(updatedUser.data);
                setUser(updatedUser.data);
                toast.success("Update information successfully!");
            } else {
                toast.error("Error updating information!");
            }
        } catch (error) {
            toast.error("Error updating information!");
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });

        // Kiểm tra confirmPassword có khớp không
        if (name === "confirmPassword") {
            if (value !== passwordData.newPassword) {
                setPasswordError("Passwords do not match!");
            } else {
                setPasswordError("");
            }
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordError) {
            toast.error("You must enter the password correctly!");
            return;
        }
        try {
            const response = await fetchChangePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            console.log(response)
            if (response?.status === 200) {
                toast.success("Password updated successfully!");
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                setApiError("");
                setShowPasswordModal(false);
            }else{
                toast.error("Error updating password!");
            }

        } catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Error updating password!";
            setApiError(errorMessage);
            toast.error(errorMessage);
        }
    };


    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title style={{ textAlign: "center" }}>User Profile</Card.Title>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={user.email} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <div className="d-flex justify-content-between">
                                    <Button variant="primary" type="submit">
                                        Update Profile
                                    </Button>
                                    <Button variant="danger" onClick={() => setShowPasswordModal(true)}>
                                        Change Password
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal đổi mật khẩu */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleChangePassword}>
                        <Form.Group className="mb-3">
                            <Form.Label>Old Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="oldPassword"
                                value={passwordData.oldPassword}
                                onChange={handlePasswordChange}
                                required
                                isInvalid={!!apiError}
                            />
                            <Form.Control.Feedback type="invalid">{apiError}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                isInvalid={!!passwordError}
                            />
                            <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button variant="danger" type="submit">
                                Change Password
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default UserProfile;
