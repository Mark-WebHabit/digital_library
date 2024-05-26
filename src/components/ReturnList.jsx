import React, { useState, useEffect } from "react";
import styled from "styled-components";
import app, { db } from "../../firebase.js";
import { getAuth } from "firebase/auth";
import { equalTo, get, orderByChild, query, ref } from "firebase/database";

const ReturnList = () => {
  const [returnedBooks, setReturnedBooks] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const borrowsRef = ref(db, "borrows");
    const borrowQuery = query(
      borrowsRef,
      orderByChild("status"),
      equalTo("returned")
    );

    get(borrowQuery).then(async (snapshot) => {
      const books = snapshot.val();
      const keys = Object.keys(books);

      const onlyReturnedBooks = await Promise.all(
        keys.map(async (key) => {
          const book = books[key];

          if (book.status === "returned") {
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

      setReturnedBooks(onlyReturnedBooks.filter((book) => book !== null));
    });
  }, []);

  const filteredBorrowers = returnedBooks.filter((borrower) => {
    const matchesFilterText = Object.values(borrower).some((value) =>
      value.toString().toLowerCase().includes(filterText.toLowerCase())
    );
    const matchesFilterStatus = filterStatus
      ? borrower.status.toLowerCase() === filterStatus.toLowerCase()
      : true;
    return matchesFilterText && matchesFilterStatus;
  });

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
      </FilterContainer>
      <StyledTable>
        <thead>
          <TableRow>
            <TableHeader>Student Number</TableHeader>
            <TableHeader>Book Title</TableHeader>
            <TableHeader>Due Date</TableHeader>
            <TableHeader>Borrowed Date</TableHeader>
            <TableHeader>Return Date</TableHeader>
            <TableHeader>Status</TableHeader>
            {/* <TableHeader>Action</TableHeader> */}
          </TableRow>
        </thead>
        {returnedBooks.length > 0 ? (
          <tbody>
            {filteredBorrowers.map((borrower, index) => (
              <TableRow key={index}>
                <TableCell>{borrower.studentNumber.toUpperCase()}</TableCell>
                <TableCell>{borrower.title.toUpperCase()}</TableCell>
                <TableCell>{borrower.dueDate}</TableCell>
                <TableCell>{borrower.dateBorrowed}</TableCell>
                <TableCell>{borrower.returnedDate}</TableCell>
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

export default ReturnList;

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
