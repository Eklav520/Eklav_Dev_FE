import { useState } from "react";
import { Modal } from "react-bootstrap";
import BookLibrary from "./components/BookLibrary";
import BookReaderFlip from "./components/BookReaderFlip";
import { booksMap } from "./components/data/booksMap";
import "./components/Materials.css"

const Materials = () => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const selectedBook = selectedBookId
    ? booksMap[selectedBookId]
    : null;

  const handleClose = () => {
    setSelectedBookId(null);
  };

  return (
    <>
      {/* Always show library */}
      <BookLibrary onSelectBook={setSelectedBookId} />

      {/* Modal for Book Reader */}
      <Modal
        show={!!selectedBook}
        onHide={handleClose}
        fullscreen
        centered
        backdrop="static"
        keyboard={false}
        dialogClassName="book-modal"
      >
        <Modal.Header closeButton className="book-modal-header">
          <Modal.Title className="book-modal-title">
            {selectedBook?.title}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="book-modal-body p-0">
          {selectedBook && (
            <BookReaderFlip
              book={selectedBook}
              onBack={handleClose}
            />
          )}
        </Modal.Body>

        {/* REMOVED the Modal.Footer - BookReaderFlip has its own footer */}
      </Modal>
    </>
  );
};

export default Materials;