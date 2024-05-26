// BorrowModal.js
import React, { useEffect, useState } from "react";
import styled from "styled-components";

const BorrowModal = ({ uid, books, onCancel, onConfirm }) => {
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    if (uid) {
      const book = books.find((bk) => bk.uid == uid);
      setSelectedBook(book);
    }
  }, [uid]);

  return (
    <ModalOverlay $selectedBook={selectedBook}>
      {selectedBook && (
        <ModalContent>
          <h2>Confirm Borrow</h2>
          <p>
            Are you sure you want to borrow the book "{selectedBook.title}"?
          </p>
          <ModalActions>
            <ModalButton onClick={onCancel}>Cancel</ModalButton>
            <ModalButton onClick={() => onConfirm(selectedBook)}>
              Confirm
            </ModalButton>
          </ModalActions>
        </ModalContent>
      )}
    </ModalOverlay>
  );
};

export default BorrowModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$selectedBook ? "flex" : "none")};
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2em;
  border-radius: 5px;
  text-align: center;
`;

const ModalActions = styled.div`
  margin-top: 1em;
  display: flex;
  justify-content: space-around;
`;

const ModalButton = styled.button`
  padding: 0.5em 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;
