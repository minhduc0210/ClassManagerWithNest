import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaFacebookF, FaFacebookMessenger } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-light py-4 mt-5 border-top">
            <Container>
                <Row className="justify-content-between">
                    <Col md={5} className="text-start">
                        <img
                            src="/images/logo_fpt.png"
                            alt="SHub Logo"
                            style={{ height: "50px" }}
                        />
                        <h6 className="fw-bold mt-2">ONLINE CLASSROOM</h6>
                        <p className="text-muted mb-0">
                            ©Copyright 2025 Online Classroom. All Rights Reserved
                        </p>
                    </Col>

                    <Col md={4} className="text-start">
                        <h6 className="fw-bold">Phone number</h6>
                        <p className="mb-1">(024) 7300 5588</p>

                        <h6 className="fw-bold">Email</h6>
                        <p className="mb-1">tuyensinh.hanoi@fpt.edu.vn</p>

                        <h6 className="fw-bold">Address</h6>
                        <p className="mb-0">
                            Thach Hoa, Thach That, Ha Noi
                        </p>
                    </Col>

                    <Col md={3} className="text-start">
                        <h6 className="fw-bold">Information</h6>
                        <p className="mb-1"><a href="https://daihoc.fpt.edu.vn/" className="text-dark text-decoration-none">FPT University</a></p>
                        <p className="mb-1"><a href="https://fap.fpt.edu.vn/" className="text-dark text-decoration-none">FPT University Academic Portal</a></p>
                        <p className="mb-3"><a href="https://fu-edunext.fpt.edu.vn/home" className="text-dark text-decoration-none">EduNext</a></p>
                        <h6 className="fw-bold">Connect with us</h6>
                        <FaFacebookF size={22} className="me-3" />
                        <FaFacebookMessenger size={22} />
                    </Col>
                </Row>
            </Container>
        </footer>

    );
};

export default Footer;
