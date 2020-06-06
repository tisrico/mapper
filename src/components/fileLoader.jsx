import React, { Component } from "react";
import { Modal, Form, FormFile, Button } from "react-bootstrap";

export class FileLoader extends Component {
    render() {
        const { fileLoaderRef, show, onClose, onSelect } = this.props;

        return (
            <Modal show={show} onHide={onClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Load OMCI MIB File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <FormFile.Input ref={fileLoaderRef} />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={onSelect}>
                        Load
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default FileLoader;
