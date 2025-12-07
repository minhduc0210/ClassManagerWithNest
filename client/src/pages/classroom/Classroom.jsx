import React, { useContext, useEffect, useState } from "react";
import { Badge, Button, Col, Container, Form, Modal, Row, Spinner, Tab, Tabs } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { fetchClassroomDetail, fetchDeleteClassroom, fetchUpdateClassroom } from "../../services/ClassroomService";
import { AuthContext } from "../../context/AuthContext";
import NotFoundClassroom from "../home/NotFoundClassroom";
import Post from "./Post";
import SlotList from "./SlotList";
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai"
import { fetchCreateSlot } from "../../services/SlotService";
import { toast } from "react-toastify"
import StudentTab from "./Student";

const Classroom = () => {
    const navigate = useNavigate()
    const { classroomID } = useParams();
    const { classroom, setClassroom, user } = useContext(AuthContext);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [updatedClassroom, setUpdatedClassroom] = useState({ title: "", subtitle: "" })
    const [newSlot, setNewSlot] = useState({
        title: "",
        content: "",
        startTime: "",
        endTime: "",
    });


    useEffect(() => {
        const getClassroomDetail = async (id) => {
            try {
                const { data } = await fetchClassroomDetail(id);
                setClassroom(data.data);
            } catch (err) {
                console.log(err)
            }
        };
        getClassroomDetail(classroomID);
    }, [classroomID, setClassroom]);

    if (!user) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        )
    }

    if (!classroom) {
        return (
            <NotFoundClassroom />
        );
    }

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        try {
            const { data } = await fetchCreateSlot(classroomID, newSlot);
            console.log(data)
            if (data.status === 201) {
                setClassroom((prev) => ({
                    ...prev,
                    slots: [...prev.slots, data.slot],
                }));
                setShowModal(false);
                setNewSlot({ title: "", content: "", startTime: "", endTime: "" });
                toast.success(`Create slot successfully!`);
            }
            else {
                toast.error("Errror creating slot!")
            }
        } catch (err) {
            console.log(err);
            toast.error(err.response?.data?.message || "Error creating slot!");
        }
    };

    const handleEditClassroom = async (e) => {
        e.preventDefault();
        try {
            const { data } = await fetchUpdateClassroom(classroomID, updatedClassroom);
            console.log(data)
            setClassroom((prev) => ({
                ...prev,
                ...data.classroom,
                slots: prev.slots,
            }));
            setShowEditModal(false);
            toast.success("Classroom updated successfully!");
        } catch (err) {
            console.log(err);
            toast.error("Error updating classroom!");
        }
    };

    const handleDeleteClassroom = async () => {
        try {
            const response = await fetchDeleteClassroom(classroomID);
            if (response.status === 200) {
                toast.success("Classroom deleted successfully!");
                window.location.href = "/";
            }
        } catch (err) {
            console.error("Error deleting classroom:", err);
            toast.error("Error deleting classroom!");
        }
    };

    return (
        <Container>
            <Row className="mt-4 mb-4">
                <Col>
                    <h1 style={{ color: "#333978" }}>
                        {classroom.title}
                    </h1>
                    {user.role === "teacher" && (
                        <>
                            <Button size="sm" variant="primary" onClick={() => setShowModal(true)} className="me-2">
                                <AiOutlinePlus className="me-1" /> Add Slot
                            </Button>
                            <Button
                                size="sm"
                                variant="success"
                                className="me-2"
                                onClick={() => {
                                    setShowEditModal(true);
                                    setUpdatedClassroom({ title: classroom.title, subtitle: classroom.subtitle })
                                }}>
                                <AiOutlineEdit className="me-1" /> Edit Classroom
                            </Button>
                            <Button size="sm" variant="danger" className="me-2" onClick={() => setShowDeleteModal(true)}>
                                <AiOutlineDelete className="me-1" /> Delete Classroom
                            </Button>
                        </>
                    )}
                </Col>
                <Col className="text-end">
                    <span className="d-block">
                        Teacher: {classroom?.teacher.name} {classroom?.teacher.lastname}
                    </span>
                    <span className="d-block">
                        Access Code: <Badge bg="info">{classroom.accessCode}</Badge>
                    </span>
                </Col>
            </Row>
            <Tabs defaultActiveKey={"slots"}>
                <Tab eventKey={"slots"} title="Slots">
                    <SlotList slots={classroom.slots} classroom={classroom} setClassroom={setClassroom} />
                </Tab>
                <Tab eventKey={"students"} title="Students">
                    <StudentTab students={classroom.students} role={user.role} classroomID={classroom._id} setClassroom={setClassroom}/>
                </Tab>
            </Tabs>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Slot</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateSlot}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newSlot.title}
                                onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={newSlot.content}
                                onChange={(e) => setNewSlot({ ...newSlot, content: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Start Time</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={newSlot.startTime}
                                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>End Time</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={newSlot.endTime}
                                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <div className="text-end">
                            <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button type="submit" variant="success">
                                <AiOutlinePlus className="me-1" /> Create Slot
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal Edit Classroom */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Classroom</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditClassroom}>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={updatedClassroom.title}
                                onChange={(e) => setUpdatedClassroom({ ...updatedClassroom, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Subtitle</Form.Label>
                            <Form.Control
                                type="text"
                                value={updatedClassroom.subtitle}
                                onChange={(e) => setUpdatedClassroom({ ...updatedClassroom, subtitle: e.target.value })}
                            />
                        </Form.Group>
                        <div className="text-end">
                            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2">
                                Cancel
                            </Button>
                            <Button type="submit" variant="success">
                                <AiOutlineEdit className="me-1" /> Save Changes
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal Edit Classroom */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this classroom? This action cannot be undone.</p>
                    <div className="text-end">
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="me-2">
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteClassroom}>
                            <AiOutlineDelete className="me-1" /> Delete Classroom
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Classroom;