import React, { useContext } from "react";
import { Navbar, Container } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import GuestButton from "./GuestButton";
import ProfileButton from "./ProfileButton";

const Header = () => {
    const { isLoggin } = useContext(AuthContext);
    return (
        <Navbar bg="light" variant="light" expand="lg" collapseOnSelect>
            <Container>
                <Navbar.Brand href="/" className="fw-bold d-flex align-items-center text-decoration-none">
                    <img
                        src="/images/logo_fpt.png"
                        alt="Logo"
                        style={{ height: "40px", marginRight: "10px" }}
                    />
                    <h3 className="brand mb-0" style={{ color: "#0569B1" }}>Classroom</h3>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {!isLoggin ? <GuestButton /> : <ProfileButton />}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;