import React, { useEffect, useState } from "react";
import styled from "styled-components";

const ViewModal = ({ books, uid, onClose }) => {
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    const filtered = books.find((bk) => bk.uid == uid);

    setSelectedBook(filtered);
  }, [uid]);

  return (
    <ModalBackground>
      {selectedBook && (
        <ModalContainer>
          <ModalContent>
            <h2>Book Details</h2>
            <Form>
              <FormGroup>
                <Label>Title:</Label>
                <Input type="text" value={selectedBook.title} readOnly />
              </FormGroup>
              <FormGroup>
                <Label>Author:</Label>
                <Input type="text" value={selectedBook.author} readOnly />
              </FormGroup>
              <FormGroup>
                <Label>Pages:</Label>
                <Input
                  type="number"
                  value={selectedBook.numberOfPages}
                  readOnly
                />
              </FormGroup>
              <FormGroup>
                <Label>Status:</Label>
                <Input type="text" value={selectedBook.status} readOnly />
              </FormGroup>
              <FormGroup>
                <Label>Description:</Label>
                <TextArea value={selectedBook.description} readOnly />
              </FormGroup>
              <CloseButton onClick={onClose}>Close</CloseButton>
            </Form>
          </ModalContent>
        </ModalContainer>
      )}
    </ModalBackground>
  );
};

export default ViewModal;

// Styled Components
const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: scroll;
`;

const ModalContainer = styled.div`
  background-color: #fff;
  padding: 2em;
  border-radius: 20px;
  width: 100%;
  max-width: 1000px;
  width: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
`;

const ModalContent = styled.div`
  h2 {
    margin-bottom: 20px;
    font-size: 2rem;
    color: #333;
    text-align: center;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1em;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #333;
`;

const Input = styled.input`
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1.2rem;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  min-height: 100px;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const CloseButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
  align-self: flex-end;

  &:hover {
    background-color: #0056b3;
  }
`;
