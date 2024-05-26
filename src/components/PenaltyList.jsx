import React, { useState, useEffect } from "react";
import styled from "styled-components";
import app, { db } from "../../firebase.js";
import { getAuth } from "firebase/auth";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
  update,
} from "firebase/database";
import { FaInfoCircle } from "react-icons/fa";
import { currentDateFormatted } from "../utilities/date.js";

const PenaltyList = () => {
  const [penaltyBooks, setPenaltyBooks] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  const auth = getAuth(app);

  useEffect(() => {
    const borrowsRef = ref(db, "borrows");
    const borrowsQuery = query(
      borrowsRef,
      orderByChild("status"),
      equalTo("overdue")
    );

    get(borrowsQuery).then(async (snapshot) => {
      const books = snapshot.val();
      if (books) {
        const keys = Object.keys(books);

        const overdueBooks = await Promise.all(
          keys.map(async (key) => {
            const book = books[key];

            if (book.status === "overdue") {
              const bookRef = ref(db, `books/${book.bookUid}`);
              const bookData = (await get(bookRef)).val();
              return {
                ...book,
                title: bookData.title,
                author: bookData.author,
                borrowKey: key,
              };
            }
            return null;
          })
        );

        setPenaltyBooks(overdueBooks.filter((book) => book !== null));
      }
    });
  }, []);

  const filteredBooks = penaltyBooks.filter((book) =>
    Object.values(book).some((value) =>
      value.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const handleReturn = (id) => {
    setSelectedBookId(id);
    setIsConfirmModalOpen(true);
  };

  const confirmReturn = async () => {
    if (!selectedBookId) return;

    const bookRef = ref(db, `borrows/${selectedBookId}`);
    const snapshot = (await get(bookRef)).val();

    const bkRef = ref(db, `books/${snapshot.bookUid}`);

    await update(bkRef, {
      status: "available",
    });

    await update(bookRef, {
      status: "returned",
      returnedDate: currentDateFormatted(),
    });

    const updatedBooks = penaltyBooks.map((book) =>
      book.id === selectedBookId ? { ...book, status: "returned" } : book
    );
    setPenaltyBooks(updatedBooks.filter((book) => book.status === "overdue"));

    setSelectedBookId(null);
    setIsConfirmModalOpen(false);
  };

  const handleInfoClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedBookId(null);
  };

  return (
    <Container>
      <Header>
        <h2>Penalty List</h2>
        <InfoButton onClick={handleInfoClick}>
          <FaInfoCircle size={24} />
        </InfoButton>
      </Header>
      <FilterInput
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />
      {penaltyBooks.length > 0 ? (
        <StyledTable>
          <thead>
            <TableRow>
              <TableHeader>Student Number</TableHeader>
              <TableHeader>Book Title</TableHeader>
              <TableHeader>Author</TableHeader>
              <TableHeader>Due Date</TableHeader>
              <TableHeader>Borrowed Date</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {filteredBooks.map((book, index) => (
              <TableRow key={index}>
                <TableCell>{book.studentNumber.toUpperCase()}</TableCell>
                <TableCell>{book.title.toUpperCase()}</TableCell>
                <TableCell>{book.author.toUpperCase()}</TableCell>
                <TableCell>{book.dueDate}</TableCell>
                <TableCell>{book.dateBorrowed}</TableCell>
                <TableCell>{book.status.toUpperCase()}</TableCell>
                <TableCell>
                  {book.status === "overdue" && (
                    <ActionButtons>
                      <ActionButton
                        onClick={() => handleReturn(book.borrowKey)}
                      >
                        Return
                      </ActionButton>
                    </ActionButtons>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </StyledTable>
      ) : (
        <NoBooksMessage>No Books Found</NoBooksMessage>
      )}
      {isModalOpen && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            <p>
              The student who has been disciplined ought to communicate with the
              librarian.
              <br />
              The librarian will then determine the suitable consequence for the
              student.
              <br />
              And only after the student complies will the librarian mark the
              student's return.
            </p>{" "}
          </ModalContent>
        </Modal>
      )}
      {isConfirmModalOpen && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={closeConfirmModal}>&times;</CloseButton>
            <p>
              I certify that the pupil is eligible to return the book and has
              complied with the consequences.
            </p>
            <ModalActions>
              <ModalButton onClick={confirmReturn}>Yes</ModalButton>
              <ModalButton onClick={closeConfirmModal}>No</ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default PenaltyList;
const Container = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FilterInput = styled.input`
  margin-bottom: 1.5em;
  padding: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  width: 100%;

  &:focus {
    outline: 2px solid dodgerblue;
  }
`;

const InfoButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

const TableHeader = styled.th`
  padding: 15px;
  text-align: left;
  background-color: #007bff;
  color: white;
  font-weight: bold;
  text-transform: uppercase;
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #ddd;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #218838;
  }
`;

const NoBooksMessage = styled.h1`
  margin-top: 1em;
  text-align: center;
  color: #777;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  position: relative;
`;

const CloseButton = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;
