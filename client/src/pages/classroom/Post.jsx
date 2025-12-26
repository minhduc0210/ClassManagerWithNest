import { useFormik } from "formik";
import { useEffect, useContext, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Modal,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Row,
  Popover,
  OverlayTrigger,
  Badge,
} from "react-bootstrap";
import {
  fetchCreatePost,
  fetchDeletePost,
  downloadCloudinaryFile,
  fetchPostsBySlot,
  fetchUpdatePost,
} from "../../services/PostService.js";
import { AuthContext } from "../../context/AuthContext.js";
import { GrDocumentDownload } from "react-icons/gr";
import moment from "moment";
import { saveAs } from "file-saver";
import { AiFillDelete, AiFillEdit } from "react-icons/ai";
import { postValidation } from "../../validations";
import { useLocation, useParams } from "react-router-dom";
import { fetchClassroomDetail } from "../../services/ClassroomService.js";
import { toast } from "react-toastify";

const Post = () => {
  const location = useLocation();
  const { classroomID, slotID } = useParams();
  const { slotIndex, title, content, startTime, endTime } =
    location.state || {};
  const { posts, setPosts, user, classroom, setClassroom } =
    useContext(AuthContext);
  const [showPopover, setShowPopover] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState({});

  useEffect(() => {
    const getPostsBySlot = async () => {
      let { data } = await fetchPostsBySlot(classroomID, slotID);
      console.log(data);

      setPosts([...data.posts.posts]);
    };
    getPostsBySlot();

    const getClassroomDetail = async (id) => {
      try {
        const { data } = await fetchClassroomDetail(id);
        setClassroom(data.data);
      } catch (err) {
        console.log(err);
      }
    };
    getClassroomDetail(classroomID);
  }, [setPosts]);

  const downloadFile = async (fileUrl) => {
    if (!fileUrl) return;
    const downloadToast = toast.loading("Preparing your download...");
    try {
      const blob = await downloadCloudinaryFile(fileUrl);
      const fileName = fileUrl.split('/').pop().split('?')[0];

      saveAs(blob, fileName);

      toast.update(downloadToast, {
        render: "Download started!",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Không thể tải tập tin.");
    }
  };

  const deletePost = async (slotID, postID) => {
    const response = await fetchDeletePost(slotID, postID);
    if (response.data.success) {
      toast.success("Delete post successfully!");
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postID));
      setShowPopover(false);
    }
  };

  const handleShowModal = (post = null) => {
    setEditingPost(post);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingPost(null);
    setShowModal(false);
  };

  const popover = (
    <Popover id="delete-popover">
      <Popover.Body>
        <p className="mb-2">Are you sure you want to delete this post?</p>
        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            size="sm"
            className="me-2"
            onClick={() => setShowPopover(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deletePost(slotID, selectedPost._id)}
          >
            Delete
          </Button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <Container>
      <Card className="shadow-sm p-3" style={{ backgroundColor: "#F7F7F7" }}>
        <Card.Body>
          <Card.Title className="fs-3 fw-bold">Slot {slotIndex}</Card.Title>
          <Card.Subtitle className="mb-3 text-muted">{title}</Card.Subtitle>
          <hr />
          <Card.Text>{content}</Card.Text>
        </Card.Body>
      </Card>

      <Button
        variant="primary"
        className="mt-3"
        onClick={() => handleShowModal()}
      >
        Create Post
      </Button>

      {posts.length === 0 && (
        <Container
          fluid
          className="d-flex justify-content-center align-items-center mt-3"
        >
          <Image src="/images/no_post.jpg" />
        </Container>
      )}

      {(() => {
        const teacherPosts = posts.filter(
          (post) => post.author.role === "teacher"
        );
        const studentPosts = posts
          .filter((post) => post.author.role === "student")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const sortedPosts = [...teacherPosts, ...studentPosts];

        return sortedPosts.map((post) => (
          <Card
            className="mt-2"
            key={post._id}
            style={
              post.author.role === "teacher"
                ? { backgroundColor: "#FFF3CD" }
                : {}
            }
          >
            <Card.Body>
              <Card.Title>
                <Row>
                  <Col>
                    <h5 className="d-inline me-3">{post.title}</h5>
                  </Col>
                  {user._id === post.author._id && (
                    <Col className="text-end">
                      <Button
                        size="sm"
                        variant="info"
                        className="me-2"
                        onClick={() => handleShowModal(post)}
                      >
                        <AiFillEdit />
                      </Button>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        show={showPopover && selectedPost?._id === post._id}
                        onToggle={() => {
                          if (showPopover && selectedPost?._id === post._id) {
                            setShowPopover(false);
                          } else {
                            setSelectedPost(post);
                            setShowPopover(true);
                          }
                        }}
                        overlay={popover}
                        rootClose
                      >
                        <Button size="sm" variant="warning">
                          <AiFillDelete />
                        </Button>
                      </OverlayTrigger>
                    </Col>
                  )}
                </Row>
              </Card.Title>
              <Card.Text>
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </Card.Text>
            </Card.Body>
            <Card.Footer className="text-muted">
              <Row>
                <Col>
                  {post.file && (
                    <Button
                      size="sm"
                      onClick={() => downloadFile(post.file)}
                      variant="outline-success"
                    >
                      <GrDocumentDownload className="me-2" />
                      Click to download document
                    </Button>
                  )}
                </Col>
                <Col className="text-end">
                  {post.author.name} {post.author.lastname} |{" "}
                  {moment(post.createdAt).format("DD.MM.YYYY HH:mm")}
                </Col>
              </Row>
            </Card.Footer>
          </Card>
        ));
      })()}

      <PostModal
        show={showModal}
        handleClose={handleCloseModal}
        classroomID={classroomID}
        slotID={slotID}
        post={editingPost}
        setPosts={setPosts}
      />
    </Container>
  );
};

export default Post;

const PostModal = ({
  show,
  handleClose,
  classroomID,
  slotID,
  post,
  setPosts,
}) => {
  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: post?.title || "",
      content: post?.content || "",
      post_file: post?.file || null,
    },
    validationSchema: postValidation,
    onSubmit: async (values) => {
      setIsSubmitting(true); // 🟢 Start Loading
      try {
        let response;
        const isFileUpload = values.post_file instanceof File;

        if (isFileUpload) {
          const submitData = new FormData();
          submitData.append("title", values.title);
          submitData.append("content", values.content);
          submitData.append("file", values.post_file);

          if (post) {
            response = await fetchUpdatePost(
              classroomID,
              slotID,
              post._id,
              submitData
            );
          } else {
            response = await fetchCreatePost(classroomID, slotID, submitData);
          }
        } else {
          const jsonData = {
            title: values.title,
            content: values.content,
          };

          if (post) {
            response = await fetchUpdatePost(
              classroomID,
              slotID,
              post._id,
              jsonData
            );
          } else {
            response = await fetchCreatePost(classroomID, slotID, jsonData);
          }
        }

        if (
          response.status === 200 ||
          response.status === 201 ||
          response.data?.success
        ) {
          toast.success(
            post ? "Post updated successfully!" : "Post created successfully!"
          );
        }

        const { data } = await fetchPostsBySlot(classroomID, slotID);
        if (data?.posts?.posts) {
          setPosts([...data.posts.posts]);
        }

        handleClose();
      } catch (error) {
        console.error("Submit error:", error);
        const errorMsg =
          error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          error.message;
        toast.error("Error: " + errorMsg);
      } finally {
        setIsSubmitting(false); // 🔴 Stop Loading regardless of success/fail
      }
    },
  });

  const handleChangeFile = (e) => {
    formik.setFieldValue("post_file", e.target.files[0]);
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop={isSubmitting ? "static" : true}
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>{post ? "Edit Post" : "Create Post"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={formik.handleSubmit}
          className="px-5"
          encType="multipart/form-data"
        >
          <Form.Group className="mt-2">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              onChange={formik.handleChange}
              value={formik.values.title}
              disabled={isSubmitting}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="content"
              onChange={formik.handleChange}
              value={formik.values.content}
              disabled={isSubmitting}
            />
          </Form.Group>
          <Form.Group controlId="post_file" className="mb-3 mt-2">
            <Form.Label>File Upload</Form.Label>
            <Form.Control
              onChange={handleChangeFile}
              type="file"
              name="post_file"
              aria-label="Upload"
              disabled={isSubmitting}
            />
          </Form.Group>

          <div className="d-flex justify-content-end mt-3">
            <Button
              variant="secondary"
              className="me-2"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {post ? "Updating..." : "Creating..."}
                </>
              ) : post ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
