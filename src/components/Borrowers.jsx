import React, { useState, useEffect } from "react";
import styled from "styled-components";
import app, { db } from "../../firebase.js";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";

const Borrowers = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const auth = getAuth(app);

  useEffect(() => {
    const borrowsRef = ref(db, "borrows");

    get(borrowsRef).then(async (snapshot) => {
      const books = snapshot.val();
      const keys = Object.keys(books);

      const notReturnedBooks = await Promise.all(
        keys.map(async (key) => {
          const book = books[key];

          if (book.status !== "returned") {
            const bookRef = ref(db, `books/${book.bookUid}`);
            const bookData = (await get(bookRef)).val();
            return {
              ...book,
              title: bookData.title,
            };
          }
          return null;
        })
      );

      setBorrowedBooks(notReturnedBooks.filter((book) => book !== null));
    });
  }, []);

  const filteredBorrowers = borrowedBooks.filter((borrower) => {
    const matchesFilterText = Object.values(borrower).some((value) =>
      value.toString().toLowerCase().includes(filterText.toLowerCase())
    );
    const matchesFilterStatus = filterStatus
      ? borrower.status.toLowerCase() === filterStatus.toLowerCase()
      : true;
    return matchesFilterText && matchesFilterStatus;
  });

  const handleStatusUpdate = (id, newStatus) => {
    // Update the status of the book with the given ID
    const updatedBooks = borrowedBooks.map((book) =>
      book.id === id ? { ...book, status: newStatus } : book
    );
    setBorrowedBooks(updatedBooks);
  };

  return (
    <Container>
      <h2>Borrowed Books</h2>
      <FilterContainer>
        <FilterInput
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <FilterSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="borrowed">Borrowed</option>
          <option value="overdue">Overdue</option>
        </FilterSelect>
      </FilterContainer>
      <StyledTable>
        <thead>
          <TableRow>
            <TableHeader>Student Number</TableHeader>
            <TableHeader>Book Title</TableHeader>
            <TableHeader>Due Date</TableHeader>
            <TableHeader>Borrowed Date</TableHeader>
            <TableHeader>Status</TableHeader>
            {/* <TableHeader>Action</TableHeader> */}
          </TableRow>
        </thead>
        {borrowedBooks.length > 0 ? (
          <tbody>
            {filteredBorrowers.map((borrower, index) => (
              <TableRow key={index}>
                <TableCell>{borrower.studentNumber.toUpperCase()}</TableCell>
                <TableCell>{borrower.title.toUpperCase()}</TableCell>
                <TableCell>{borrower.dueDate}</TableCell>
                <TableCell>{borrower.dateBorrowed}</TableCell>
                <TableCell>{borrower.status.toUpperCase()}</TableCell>
                {/* <TableCell>
                {borrower.status === "Borrowed" && (
                  <ActionButtons>
                    <ActionButton
                      onClick={() =>
                        handleStatusUpdate(borrower.id, "Returned")
                      }
                    >
                      Return
                    </ActionButton>
                  </ActionButtons>
                )}
              </TableCell> */}
              </TableRow>
            ))}
          </tbody>
        ) : (
          <h1
            style={{
              marginTop: "1em",
            }}
          >
            No Books Found
          </h1>
        )}
      </StyledTable>
    </Container>
  );
};

export default Borrowers;

const Container = styled.div`
  flex: 1;
  padding: 20px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 1.5em;
`;

const FilterInput = styled.input`
  padding: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  flex: 1;

  &:focus {
    outline: 2px solid dodgerblue;
  }
`;

const FilterSelect = styled.select`
  padding: 1em;
  border-radius: 5px;
  border: none;
  font-size: 1em;
  background: dodgerblue;
  color: white;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
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
