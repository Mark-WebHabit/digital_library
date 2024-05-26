import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { BsArrowUp, BsArrowDown } from "react-icons/bs";
import { currentDateFormatted } from "../utilities/date.js";

import app, { db } from "../../firebase";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
  update,
} from "firebase/database";
import { getAuth } from "firebase/auth";

const Returned = () => {
  const [books, setBooks] = useState([]); // State for borrowed books
  const [orginalBookCopy, setOriginalBookCopy] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [sortOrder, setSortOrder] = useState(null); // State for sorting order
  const [selectedBorrowed, setSelectedBorrowed] = useState(null);
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const userData = {
      email: auth?.currentUser?.email,
      id: auth?.currentUser?.uid,
    };

    const userRef = ref(db, `users/${userData.id}`);

    get(userRef).then((snapshot) => {
      const data = snapshot.val();
      userData["fullName"] = data?.fullName;
      userData["studentNumber"] = data?.studentNumber;

      setUser(userData);
    });
  }, [auth.currentUser]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const borrowsRef = ref(db, "borrows");
    const borrowsQuery = query(
      borrowsRef,
      orderByChild("studentNumber"),
      equalTo(user?.studentNumber)
    );

    get(borrowsQuery)
      .then(async (snapshot) => {
        const borrowsData = snapshot.val();
        if (!borrowsData) {
          return;
        }

        const keys = Object.keys(borrowsData);
        const arr = await Promise.all(
          keys.map(async (key) => {
            const bk = borrowsData[key];

            if (bk?.status === "returned") {
              let dt = { ...bk, uid: key };

              const bookRef = ref(db, `books/${bk.bookUid}`);
              const bookData = (await get(bookRef)).val();

              dt["title"] = bookData.title;
              dt["author"] = bookData.author;
              return dt;
            }
          })
        );

        const filteredArr = arr.filter(Boolean);
        setBooks(filteredArr);
        setOriginalBookCopy(filteredArr);
      })
      .catch((error) => {
        console.log("Couldn't fetch borrows: ", error);
      });
  }, [user]);

  // Function to handle sorting
  const handleSort = () => {
    const sortedBooks = [...books];

    if (sortOrder === "asc") {
      sortedBooks.sort((a, b) => (a.title > b.title ? 1 : -1));
      setSortOrder("desc");
    } else {
      sortedBooks.sort((a, b) => (a.title < b.title ? 1 : -1));
      setSortOrder("asc");
    }

    setBooks(sortedBooks);
  };

  // Function to handle searching
  const handleSearch = (query) => {
    if (query === "" || !query) {
      setBooks(orginalBookCopy);
    } else {
      const searchedBooks = books.filter((book) =>
        book.title.toLowerCase().includes(query.toLowerCase())
      );

      setBooks(searchedBooks);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  return (
    <Container>
      {user ? (
        <>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          </SearchContainer>
          {books && books.length > 0 && (
            <SortButton onClick={handleSort}>
              Sort {sortOrder === "asc" ? <BsArrowUp /> : <BsArrowDown />}
            </SortButton>
          )}

          {books && books.length > 0 ? (
            <TableContainer>
              <Table>
                <thead>
                  <TableRow>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Author</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Date Borrowed</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Return Date</TableHeader>
                  </TableRow>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <TableRow key={index}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.status}</TableCell>
                      <TableCell>{book.dateBorrowed}</TableCell>
                      <TableCell>{book.dueDate}</TableCell>
                      <TableCell>{book.returnedDate}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          ) : (
            <p
              style={{
                fontSize: "2rem",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              No Books found
            </p>
          )}
        </>
      ) : (
        <p
          style={{
            fontSize: "2rem",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Loading...
        </p>
      )}
    </Container>
  );
};

export default Returned;

// Styles
const Container = styled.div`
  padding: 20px;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  font-size: 1.2rem;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const SortButton = styled.button`
  margin-bottom: 20px;
  padding: 8px 12px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

const TableHeader = styled.th`
  padding: 12px 10px;
  text-align: left;
  background-color: #007bff;
  color: white;
`;

const TableCell = styled.td`
  padding: 12px 10px;
  border-bottom: 1px solid #ddd;
`;

const ActionTableCell = styled(TableCell)`
  width: 150px; /* Fixed width for action cell */
  padding: 12px 5px; /* Adjusted padding */
`;

const ReturnButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.2rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  font-size: 1.8rem;
`;

const ModalText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 20px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
  flex: 1;
  margin: 0 10px;

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }
`;
