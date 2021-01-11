import React from "react";
import Spinner from "react-bootstrap/Spinner";
import "./LoadingSpinner.css";

export default function LoadingSpinner() {
  return (
    <div className='LoadingSpinner'>
        <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
        </Spinner>
    </div>
  );
}
