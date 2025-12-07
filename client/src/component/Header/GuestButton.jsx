import React from "react";
import { Stack, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const GuestButton = () => {
  return (
    <Stack className="ms-auto" direction="horizontal" gap={2}>
      <Link to="/login">
        <Button variant="secondary">Login</Button>
      </Link>
      <Link to="/register">
        <Button variant="outline-secondary">Register</Button>
      </Link>
    </Stack>
  );
};

export default GuestButton;