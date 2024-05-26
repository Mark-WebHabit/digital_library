import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  BsSearch,
  BsArrowsVertical,
  BsEye,
  BsBoxArrowInRight,
} from "react-icons/bs";
import ViewModal from "./ViewModal";
import BorrowModal from "./BorrowModal";
import Modal from "./Modal";

// utilities
import {
  currentDateFormatted,
  getDate3DaysFromNow,
} from "../utilities/date.js";

// firebase
import app from "../../firebase";
import {
  getDatabase,
  onValue,
  ref,
  off,
  get,
  update,
  set,
  push,
} from "firebase/database";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const HomeLibrary = () => {
  const [books, setBooks] = useState([]); // State to hold books data
  const [originalBooks, setOriginalBooks] = useState([]); // State to hold original books data
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [filterStatus, setFilterStatus] = useState("all"); // State for filtering status
  const [sortOrder, setSortOrder] = useState(null); // State for sorting order
  const [selectedBook, setSelectedBook] = useState(null); // State to hold selected book for view modal
  const [user, setUser] = useState(null);
  const [borrowBook, setBorrowBook] = useState(null); // State for borrow book modal
  const [scannedUID, setScannedUID] = useState(null);
  const [nfc, setNfc] = useState(null); // Add state for the nfc variable
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const auth = getAuth(app);
  const db = getDatabase(app);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const data = {
          uid: currentUser.uid,
          email: currentUser.email,
        };

        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const { studentNumber } = snapshot.val();

          data["studentNumber"] = studentNumber;

          setUser(data);
        } else {
          alert("Unauthenticated User");
          await signOut(auth);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const db = getDatabase(app);
      const booksRef = ref(db, "books");

      const unsubscribeBooks = onValue(booksRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return; // If data is null or undefined, return early

        // Convert the data object to an array if it's not already an array
        const dataArray = Array.isArray(data) ? data : Object.entries(data);

        // Convert the array of books to include UID
        const booksWithUid = dataArray.map(([uid, book]) => ({ ...book, uid }));

        // Update the state with the filtered array of books
        setBooks(booksWithUid);
        setOriginalBooks(booksWithUid);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
          off(booksRef); // Remove the listener when component unmounts
        };
      });

      return () => unsubscribeBooks();
    }
  }, [user]);

  useEffect(() => {
    let nfcReader;

    const handleNfcScan = async () => {
      try {
        nfcReader = new NDEFReader();
        await nfcReader.scan();
        nfcReader.addEventListener("reading", handleNfcReading);
        setNfc(nfcReader); // Set the nfcReader to state
      } catch (error) {
        console.error("Error scanning NFC:", error);
      }
    };

    const handleNfcReading = async ({ message }) => {
      // Extracting the ArrayBuffer from DataView
      const dataBuffer = message.records[0].data.buffer;
      // Converting ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(dataBuffer);
      // Assuming the data is a string
      const uid = new TextDecoder().decode(uint8Array);
      if (uid && books?.length) {
        // Check if the UID exists in the books state
        const uidExists = books.find((book) => book.uid === uid.toString());

        if (!uidExists) {
          // If UID is not found, display modal with a message
          setShowModal(true);
          setModalMessage("Book not found for scanned UID!");
          return;
        } else {
          setShowModal(false);
          handleBorrowClick(uid);
          setScannedUID(uid);
        }
      }
    };

    if ("NDEFReader" in window) {
      handleNfcScan();
    }
    // } else {
    //   alert("Web NFC API is not supported in this browser.");
    // }

    // Cleanup function
    return () => {
      if (nfcReader) {
        nfcReader.removeEventListener("reading", handleNfcReading);
        if (typeof nfcReader.stop === "function") {
          nfcReader.stop();
        }
      }
    };
  }, [books]); // Add books as a dependency

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

  // Function to handle filtering
  const handleFilter = () => {
    const filteredBooks = originalBooks.filter((book) => {
      if (filterStatus === "all") return true;
      return book.status === filterStatus;
    });

    setBooks(filteredBooks);
  };

  // Function to handle searching
  const handleSearch = (query) => {
    const searchedBooks = originalBooks.filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );

    setBooks(searchedBooks);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Handle click on View button to open modal
  const handleViewClick = (uid) => {
    setSelectedBook(uid);
  };

  // Close view modal
  const handleCloseModal = () => {
    setSelectedBook(null);
  };

  // Handle click on Borrow button to open confirmation modal
  const handleBorrowClick = (uid) => {
    setBorrowBook(uid);
  };

  // Handle borrow confirmation
  const handleConfirmBorrow = async (book) => {
    if (!borrowBook) {
      return;
    }

    if (!user) {
      return;
    }

    const db = getDatabase(app); // Ensure you have this line to get the database instance
    const bookRef = ref(db, `books/${book.uid}`);

    const snapshot = await get(bookRef);

    if (snapshot.exists()) {
      const bookData = snapshot.val();
      const bookUid = snapshot.key;

      if (bookData.status !== "available") {
        alert("Book is already borrowed, select another book");
        return;
      }

      await update(bookRef, {
        status: "borrowed",
      });

      // Use push to generate a unique key for the new borrow entry
      const newBorrowRef = push(ref(db, "borrows"));

      await set(newBorrowRef, {
        bookUid,
        studentNumber: user.studentNumber,
        dateBorrowed: currentDateFormatted(),
        dueDate: getDate3DaysFromNow(),
        status: "borrowed",
        dateReturned: null,
      });

      alert("Book Borrowed Successfully");
      setBorrowBook(null);
      return;
    } else {
      alert("Book not found, please try again.");
      setBorrowBook(null);
      return;
    }
  };

  const handleCancelBorrow = () => {
    setBorrowBook(null);
  };

  const handleCloseModalBorrow = () => {
    // Function to handle closing the modal
    setShowModal(false);
  };

  return (
    <Container>
      <Modal isOpen={showModal} onClose={handleCloseModalBorrow}>
        <p>{modalMessage}</p>
      </Modal>
      <FilterSortContainer>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
          <SearchButton>
            <BsSearch />
          </SearchButton>
        </SearchContainer>
        <FilterContainer>
          <FilterSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </FilterSelect>
          <FilterButton onClick={handleFilter}>Filter</FilterButton>
          <SortButton onClick={handleSort}>
            Sort <BsArrowsVertical />
          </SortButton>
        </FilterContainer>
      </FilterSortContainer>
      {books && books.length > 0 ? (
        <TableContainer>
          <Table>
            <thead>
              <TableRow>
                <TableHeader>Action</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Author</TableHeader>
                <TableHeader>Pages</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Description</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <TableRow key={index}>
                  <ActionTableCell>
                    <ActionButton>
                      <Action onClick={() => handleViewClick(book.uid)}>
                        <BsEye />
                        <ActionText>View</ActionText>
                      </Action>
                      <Action onClick={() => handleBorrowClick(book.uid)}>
                        <BsBoxArrowInRight />
                        <ActionText>Borrow</ActionText>
                      </Action>
                    </ActionButton>
                  </ActionTableCell>
                  <TableCell>{book.title.toUpperCase()}</TableCell>
                  <TableCell>{book.author.toUpperCase()}</TableCell>
                  <TableCell>{book.numberOfPages}</TableCell>
                  <TableCell>{book.status.toUpperCase()}</TableCell>
                  <TableCell>{truncateText(book.description, 50)}</TableCell>
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

      {/* View Modal */}
      {selectedBook && (
        <ViewModal
          uid={selectedBook}
          books={books}
          onClose={handleCloseModal}
        />
      )}

      {/* Borrow Modal */}
      {borrowBook && (
        <BorrowModal
          uid={borrowBook}
          books={books}
          onConfirm={handleConfirmBorrow}
          onCancel={handleCancelBorrow}
        />
      )}
    </Container>
  );
};

export default HomeLibrary;

// Styles
const Container = styled.div`
  padding: 20px;
`;

const FilterSortContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SearchContainer = styled.div`
  display: flex;
  flex: 1;
  margin-bottom: 1em;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
  font-size: 1.2rem;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const SearchButton = styled.button`
  padding: 8px 0.5em;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
`;

const FilterSelect = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
  min-width: 100px;
  font-size: 1.2rem;

  &:focus {
    outline: 1px solid dodgerblue;
  }
`;

const FilterButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 2em;
  font-size: 1.2rem;
`;

const SortButton = styled.button`
  padding: 8px 12px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
`;

const ActionButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0;
`;

const Action = styled.button`
  background-color: #007bff;
  padding: 0.5em 0.5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
  font-size: 0.9rem;
`;

const ActionText = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
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
