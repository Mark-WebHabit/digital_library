import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { BsBook } from "react-icons/bs"; // Example icon
import { FaHandHolding, FaTrash } from "react-icons/fa";
import { MdAddCircleOutline, MdScanner, MdNfc } from "react-icons/md";
import { transformDateFormat } from "../utilities/date";

// firebase
import {
  ref,
  onValue,
  getDatabase,
  get,
  push,
  remove,
  update,
  off,
} from "firebase/database";
import app from "../../firebase";

const Shelf = () => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addBook, setAddBook] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [studentNumber, setStudentNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [books, setBooks] = useState([]);

  // new book state
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    numberOfPages: 0,
    description: "",
    publicationDate: "", // Add publicationDate field
    status: "available",
  });
  const [enableFindSimilar, setEnableFIndSimilar] = useState(false);

  useEffect(() => {
    const db = getDatabase(app);
    const booksRef = ref(db, "books");

    onValue(booksRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return; // If data is null or undefined, return early

      // Convert the data object to an array if it's not already an array
      const dataArray = Array.isArray(data) ? data : Object.entries(data);

      // Convert the array of books to include UID
      const booksWithUid = dataArray.map(([uid, book]) => ({ ...book, uid }));

      // Filter books based on search query
      const filteredBooks = booksWithUid.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Update the state with the filtered array of books
      setBooks(filteredBooks);
    });

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      off(booksRef); // Remove the listener when component unmounts
    };
  }, [searchQuery]);

  // Open modal function
  const openModal = (bookId) => {
    if (books && books.length > 0) {
      const book = books.find((book) => book.uid === bookId);
      setSelectedBook(book);
    }
  };

  const closeModal = () => {
    setSelectedBook(null);
    setIsEditing(false);
    setIsBorrowing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
  const handleSave = async () => {
    if (!selectedBook || !selectedBook.uid) {
      return;
    }

    const { uid, title, author, description, numberOfPages } = selectedBook;

    try {
      const db = getDatabase(app);
      const bookRef = ref(db, `books/${uid}`);

      // Update the book with new data
      const updates = {
        title,
        author,
        description,
        numberOfPages,
      };

      await update(bookRef, updates);

      console.log("Book updated successfully.");
    } catch (error) {
      console.error("Error updating book:", error);
    }

    // Reset the state
    setIsEditing(false);
    setSelectedBook(null);
  };

  const handleBorrow = () => {
    setIsBorrowing(true);
  };

  const handleBorrowCancel = () => {
    setIsBorrowing(false);
  };

  const handleBorrowDone = () => {
    // Handle borrowing the book for the entered student number
    // Reset state after borrowing
    setStudentNumber("");
    setIsBorrowing(false);
  };

  const handleSort = (criteria) => {
    setSortOrder(criteria);
  };

  const handleNfcOptionChange = (option) => {
    setNfcOption(option);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook({
      ...newBook,
      [name]: value,
    });
  };

  const handleDeleteBook = async (uid) => {
    try {
      const db = getDatabase(app);
      const bookRef = ref(db, `books/${uid}`);

      const book = (await get(bookRef)).val();

      if (book && book.status !== "available") {
        alert(
          "This book is currently borrowed by a student therefore it cannot be deleted."
        );
        return;
      }

      // Remove the book entry from the database
      await remove(bookRef);

      // Update the state to remove the deleted book
      setBooks(books.filter((book) => book.uid !== uid));

      console.log("Book deleted successfully.");
    } catch (error) {
      console.error("Error deleting book:", error);
      // Handle error deleting book
    }
  };

  const handleBookInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedBook({
      ...selectedBook,
      [name]: value,
    });
  };

  const handleAddBook = () => {
    // Open the modal for adding a new book
    setAddBook(true);
  };

  const handleCancelAddBook = () => {
    // Close the modal for adding a new book and reset form inputs
    setAddBook(false);
    setNewBook({
      title: "",
      author: "",
      numberOfPages: 0,
      description: "",
    });
    setEnableFIndSimilar(false);
  };

  const handleDoneAddBook = async () => {
    // Get a reference to the 'books' node in the database
    const db = getDatabase(app);
    const booksRef = ref(db, "books");

    // Push the new book object to the 'books' node
    await push(booksRef, { ...newBook, status: "available" })
      .then(() => {
        // Reset form inputs and close the modal
        setAddBook(false);
        setNewBook({
          title: "",
          author: "",
          numberOfPages: 0,
          description: "",
        });
        setEnableFIndSimilar(false);
      })
      .catch((error) => {
        console.error("Error adding new book:", error);
        // Handle error adding new book
      });
  };

  const handleFillSimilar = async () => {
    if (newBook.title) {
      try {
        const db = getDatabase(app);
        const booksRef = ref(db, "books");

        const snapshot = await get(booksRef);

        if (snapshot.exists()) {
          const similarBooks = Object.values(snapshot.val()).filter(
            (book) =>
              book.title.toLowerCase() === newBook.title.toLowerCase() &&
              book.author !== newBook.author
          );

          if (similarBooks.length > 0) {
            const similarBook = similarBooks[0];
            setNewBook({
              title: similarBook.title || "",
              author: similarBook.author || "",
              numberOfPages: similarBook.numberOfPages || 0,
              description: similarBook.description || "",
              publicationDate: transformDateFormat(similarBook.publicationDate),
            });
          } else {
            alert("No similar book found.");
          }
        } else {
          alert("No books found in the database.");
        }
      } catch (error) {
        console.error("Error fetching similar books:", error);
        // Handle error fetching similar books
      }
    } else {
      alert("Please enter a title first.");
    }
  };

  return (
    <Container>
      <FilterSection>
        <SearchInput
          type="text"
          placeholder="Search Book Title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </FilterSection>
      <ButtonGroup>
        <Button onClick={handleAddBook}>
          <ButtonIcon>
            <MdAddCircleOutline />
          </ButtonIcon>
          Add Book
        </Button>
        <Button onClick={() => handleNfcOptionChange("scan")}>
          <ButtonIcon>
            <MdScanner />
          </ButtonIcon>
          Scan
        </Button>
        <SelectInput onChange={(e) => handleNfcOptionChange(e.target.value)}>
          <Option value="nfc">NFC</Option>
          <Option value="read">Read</Option>
          <Option value="write">Write</Option>
          <Option value="reset">Reset</Option>
        </SelectInput>
      </ButtonGroup>
      <Table>
        <thead>
          <TableRow>
            <TableHeader onClick={() => handleSort("title")}>Title</TableHeader>
            <TableHeader onClick={() => handleSort("author")}>
              Author
            </TableHeader>
            <TableHeader>Pages</TableHeader>
            <TableHeader>Staus</TableHeader>
            <TableHeader>Description</TableHeader>
            <TableHeader>Action</TableHeader>
          </TableRow>
        </thead>
        <tbody>
          {books &&
            books?.length > 0 &&
            books.map((book, index) => (
              <TableRow key={index}>
                <TableCell>{book.title.toUpperCase()}</TableCell>
                <TableCell>{book.author.toUpperCase()}</TableCell>
                <TableCell>{book.numberOfPages}</TableCell>
                <TableCell>{book.status.toUpperCase()}</TableCell>
                <TableCell>
                  {book.description?.length > 20
                    ? book.description.slice(0, 20) + "..."
                    : book.description}
                </TableCell>
                <TableCell>
                  <ActionIcon onClick={() => openModal(book.uid)}>
                    <BsBook />
                  </ActionIcon>
                  {/* <ActionIcon onClick={handleBorrow}>
                    <FaHandHolding />
                  </ActionIcon> */}
                  <ActionIcon onClick={() => handleDeleteBook(book.uid)}>
                    <FaTrash />
                  </ActionIcon>
                </TableCell>
              </TableRow>
            ))}
        </tbody>
      </Table>
      {selectedBook && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={closeModal}>X</CloseButton>
            <h2>Book Details</h2>
            <InputRow>
              <InputLabel>Title:</InputLabel>
              <InputField
                name="title"
                type="text"
                value={selectedBook.title}
                disabled={!isEditing}
                onChange={handleBookInputChange}
              />
            </InputRow>
            <InputRow>
              <InputLabel>Author:</InputLabel>
              <InputField
                name="author"
                type="text"
                value={selectedBook.author}
                disabled={!isEditing}
                onChange={handleBookInputChange}
              />
            </InputRow>
            <InputRow>
              <InputLabel>Pages:</InputLabel>
              <InputField
                name="numberOfPages"
                type="number"
                value={selectedBook.numberOfPages}
                disabled={!isEditing}
                onChange={handleBookInputChange}
              />
            </InputRow>

            <InputRow></InputRow>
            <InputRow>
              <InputLabel>Description:</InputLabel>
              <InputField
                name="description"
                as="textarea"
                rows="3"
                value={selectedBook.description}
                disabled={!isEditing}
                onChange={handleBookInputChange}
              />
            </InputRow>
            <ButtonRow>
              {!isEditing ? (
                <EditButton onClick={handleEdit}>Edit</EditButton>
              ) : (
                <>
                  <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                </>
              )}
            </ButtonRow>
          </ModalContent>
        </Modal>
      )}
      {addBook && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={handleCancelAddBook}>X</CloseButton>
            <h2>Add New Book</h2>
            <InputRow>
              <InputLabel>Title:</InputLabel>
              <InputField
                type="text"
                name="title"
                value={newBook.title}
                onChange={(e) => {
                  handleInputChange(e);
                  setEnableFIndSimilar(true);
                }}
              />
              {enableFindSimilar && (
                <input
                  type="button"
                  value={"Fill similar"}
                  className="findSimilar"
                  onClick={handleFillSimilar}
                />
              )}
            </InputRow>
            <InputRow>
              <InputLabel>Author:</InputLabel>
              <InputField
                type="text"
                name="author"
                value={newBook.author}
                onChange={handleInputChange}
              />
            </InputRow>
            <InputRow>
              <InputLabel>Pages:</InputLabel>
              <InputField
                type="number"
                name="numberOfPages"
                value={newBook.numberOfPages}
                onChange={handleInputChange}
              />
            </InputRow>
            <InputRow>
              <InputLabel>Publication Date:</InputLabel>
              <InputField
                type="date"
                name="publicationDate"
                value={newBook.publicationDate}
                onChange={handleInputChange}
                placeholder="Mm dd, yyyy"
              />
            </InputRow>
            <InputRow>
              <InputLabel>Description:</InputLabel>
              <InputField
                as="textarea"
                rows="3"
                name="description"
                value={newBook.description}
                onChange={handleInputChange}
              />
            </InputRow>
            <ButtonRow>
              <CancelButton onClick={handleCancelAddBook}>Cancel</CancelButton>
              <DoneButton onClick={handleDoneAddBook}>Done</DoneButton>
            </ButtonRow>
          </ModalContent>
        </Modal>
      )}
      {isBorrowing && (
        <Modal>
          <ModalContent>
            <CloseButton onClick={handleBorrowCancel}>X</CloseButton>
            <h2>Borrow Book</h2>
            <InputRow>
              <InputLabel>Enter Student Number:</InputLabel>
              <InputField
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
              />
            </InputRow>
            <ButtonRow>
              <CancelButton onClick={handleBorrowCancel}>Cancel</CancelButton>
              <DoneButton onClick={handleBorrowDone}>Done</DoneButton>
            </ButtonRow>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Shelf;

const Container = styled.div`
  flex: 1;
  padding: 20px;
`;

const SearchInput = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  width: 100%;

  &:focus {
    outline-color: #007bff;
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
  }
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #555;
  transition: color 0.3s;

  &:hover {
    color: #000;
  }
`;

const Table = styled.table`
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
  transition: background-color 0.3s;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const ActionIcon = styled.span`
  color: #007bff;
  cursor: pointer;
  font-size: 25px;

  &:first-child,
  &:nth-child(2) {
    margin-right: 30px;
  }
`;

const Modal = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
`;
const ModalContent = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  text-align: left;
  position: relative;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;

  & .findSimilar {
    background: dodgerblue;
    border: none;
    outline: none;
    font-size: 1rem;
    color: white;
    font-weight: bold;
    padding: 0.5em;
    cursor: pointer;
  }
`;

const InputLabel = styled.label`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const InputField = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const EditButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const CancelButton = styled.button`
  background-color: #dc3545;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  margin-right: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #b02a37;
  }
`;

const SaveButton = styled.button`
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #218838;
  }
`;

const DoneButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const ButtonGroup = styled.div`
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
  align-items: center;
`;

const Button = styled.button`
  margin: 0;
  padding: 0;
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-right: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const SelectInput = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  appearance: none; /* Remove default arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23007bff' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px top 50%;
  background-size: 20px auto;
  padding-right: 30px;
`;

const Option = styled.option`
  color: black;
`;

const ButtonIcon = styled.span`
  margin-right: 5px;
`;
