import React from 'react'
import { Badge, Button, Col, Container, Image, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

function WelcomePage() {
    return (
        <Container fluid>
            <Container>
                <Row className="justify-content-center align-items-center">
                    <Col>
                        <div className="mt-5">
                            <h6 className="text-primary fw-bold">Online Classroom</h6>
                            <h1 className="fw-bold">Join Our Class with Ease!</h1>

                            <Button
                                variant="primary"
                                size="lg"
                                className="mt-3"
                                style={{ paddingRight: 50, paddingLeft: 50, paddingTop: 20, paddingBottom: 20, borderRadius: 20 }}
                                as={Link}
                                to={"/register"}
                            >
                                Register now
                            </Button>
                            <Row className="mt-4">
                                <Col xs={"auto"} className="mt-2">
                                    <Badge bg="light" text="dark" className="p-3 fs-6">
                                        🏫 Join a Class
                                    </Badge>
                                </Col>
                                <Col xs={"auto"} className="mt-2">
                                    <Badge bg="light" text="dark" className="p-3 fs-6">
                                        ✏️ Complete Assignments
                                    </Badge>
                                </Col>
                                <Col xs={"auto"} className="mt-2">
                                    <Badge bg="light" text="dark" className="p-3 fs-6">
                                        📰 View News & Announcements
                                    </Badge>
                                </Col>
                                <Col xs={"auto"} className="mt-2">
                                    <Badge bg="light" text="dark" className="p-3 fs-6">
                                        📖 View Course Materials
                                    </Badge>
                                </Col>
                                <Col xs={"auto"} className="mt-2">
                                    <Badge bg="light" text="dark" className="p-3 fs-6">
                                        📥 Download Course Materials
                                    </Badge>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                    <Col>
                        <div className="mt-5">
                            <Image fluid src={"/images/fpt_main.jpg"} alt="Online Education | Classroom App" />
                        </div>
                    </Col>
                </Row>
            </Container>
        </Container>
    )
}

export default WelcomePage
