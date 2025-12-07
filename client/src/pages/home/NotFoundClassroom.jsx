import React from "react";
import { Image } from "react-bootstrap";

const NotFoundClassroom = () => {
  return (
    <div className="text-center">
      <Image
        className="mx-auto d-block"
        fluid
        src={"/images/not_found_classroom.webp"}
        alt="There are no classroom you entered"
        width={500}
        height="auto"
      />
      <h3 className="mt-2">There are no classroom matched!</h3>
    </div>
  );
};

export default NotFoundClassroom;