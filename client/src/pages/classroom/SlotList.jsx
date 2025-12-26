import React, { useContext, useState } from "react";
import { Badge, Button, Card, Modal, Form, Spinner } from "react-bootstrap";
import moment from "moment";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { fetchDeleteSlot, fetchUpdateSlot } from "../../services/SlotService";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-toastify";

const SlotList = ({ slots, classroom, setClassroom }) => {
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  if (!slots || slots.length === 0) {
    return <p>No slots available.</p>;
  }

  const handleEditClick = (slot) => {
    setEditingSlot(slot);
    setShowModal(true);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      const { data } = await fetchUpdateSlot(editingSlot._id, editingSlot);
      console.log(data);

      if (data.status === 200) {
        setClassroom((prev) => ({
          ...prev,
          slots: prev.slots
            .map((slot) => (slot._id === data.slot._id ? data.slot : slot))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
        }));
        setShowModal(false);
        toast.success(`Update slot successfully!`);
      } else {
        toast.error("Error updating slot!");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Error updating slot!");
    }
  };

  const handleDeleteSlot = async (id) => {
    if (
      !window.confirm(
        "Are you sure? This will delete all posts and files in this slot!"
      )
    ) {
      return;
    }

    setIsDeleting(id);
    try {
      const { data } = await fetchDeleteSlot(id);
      if (data.success) {
        setClassroom((prev) => ({
          ...prev,
          slots: prev.slots.filter((slot) => slot._id !== id),
        }));
        toast.success("Slot deleted successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error deleting slot!");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      {slots
        .slice()
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .map((slot, index) => (
          <Card key={slot._id} className="mb-3 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <h5>
                <Badge bg="secondary" className="me-2">
                  Slot {index + 1}
                </Badge>
                {user.role === "teacher" && (
                  <div className="d-inline-flex gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleEditClick(slot)}
                    >
                      <AiOutlineEdit className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSlot(slot._id)}
                      disabled={isDeleting === slot._id}
                    >
                      {isDeleting === slot._id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          <AiOutlineDelete className="me-1" /> Delete
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </h5>
              <Link
                to={`/classroom/${classroom._id}/${slot._id}`}
                state={{
                  slotIndex: index + 1,
                  title: slot.title,
                  content: slot.content,
                }}
                className="text-primary fw-bold"
              >
                View slot
              </Link>
            </div>

            <p className="text-muted">
              📅 {moment(slot.startTime).format("HH:mm DD/MM/YYYY")} -{" "}
              {moment(slot.endTime).format("HH:mm DD/MM/YYYY")}
            </p>

            <div>
              <strong>{slot.title}</strong>
              <p>{slot.content}</p>
            </div>
          </Card>
        ))}

      {/* Modal Edit Slot */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Slot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateSlot}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editingSlot?.title || ""}
                onChange={(e) =>
                  setEditingSlot({ ...editingSlot, title: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editingSlot?.content || ""}
                onChange={(e) =>
                  setEditingSlot({ ...editingSlot, content: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={
                  moment(editingSlot?.startTime).format("YYYY-MM-DDTHH:mm") ||
                  ""
                }
                onChange={(e) =>
                  setEditingSlot({ ...editingSlot, startTime: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={
                  moment(editingSlot?.endTime).format("YYYY-MM-DDTHH:mm") || ""
                }
                onChange={(e) =>
                  setEditingSlot({ ...editingSlot, endTime: e.target.value })
                }
                required
              />
            </Form.Group>
            <div className="text-end">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button type="submit" variant="success">
                <AiOutlineEdit className="me-1" /> Update Slot
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SlotList;
