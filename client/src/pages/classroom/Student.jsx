import React, { useState } from "react";
import { Table, Button, OverlayTrigger, Popover } from "react-bootstrap";
import { fetchRemoveStudentFromClass } from "../../services/ClassroomService";
import { toast } from "react-toastify";

const StudentTab = ({ students, role, classroomID, setClassroom }) => {
    const [showPopover, setShowPopover] = useState(null);

    const handleRemoveStudent = async (studentID) => {
        try {
            const response = await fetchRemoveStudentFromClass(classroomID, studentID);
            if(response.status === 200){
                setClassroom((prevClassroom) => ({
                    ...prevClassroom,
                    students: prevClassroom.students.filter((s) => s._id !== studentID),
                }));
                toast.success("Student removed successfully!");
            }
        } catch (err) {
            console.error("Error removing student:", err);
            toast.error("Failed to remove student.");
        } finally {
            setShowPopover(null);
        }
    };

    return (
        <>
            {students.length === 0 ? (
                <p className="fw-bold mt-2 text-center">There are no students.</p>
            ) : (
                <>
                    <Table striped bordered hover size="sm" className="mt-3">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Name</th>
                                <th>Email</th>
                                {role === "teacher" && <th className="text-center">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => {
                                const popover = (
                                    <Popover id={`popover-${student._id}`}>
                                        <Popover.Body>
                                            <p className="mb-2">Are you sure you want to remove this student?</p>
                                            <div className="d-flex justify-content-end">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => setShowPopover(null)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveStudent(student._id)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </Popover.Body>
                                    </Popover>
                                );

                                return (
                                    <tr key={student._id}>
                                        <td>{index + 1}</td>
                                        <td>{`${student.name} ${student.lastname}`}</td>
                                        <td>{student.email}</td>
                                        {role === "teacher" && (
                                            <td className="text-center">
                                                <OverlayTrigger
                                                    trigger="click"
                                                    placement="left"
                                                    overlay={popover}
                                                    show={showPopover === student._id}
                                                    onToggle={() =>
                                                        setShowPopover(showPopover === student._id ? null : student._id)
                                                    }
                                                    rootClose
                                                >
                                                    <Button variant="danger" size="sm">
                                                        Remove
                                                    </Button>
                                                </OverlayTrigger>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <p className="fw-bold mt-2 text-center">
                        There are {students.length} student(s)
                    </p>
                </>
            )}
        </>
    );
};

export default StudentTab;
