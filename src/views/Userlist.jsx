import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FaTrash,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortNumericDown,
  FaSortNumericUp,
} from "react-icons/fa";

// firebase
import {
  getDatabase,
  ref,
  orderByChild,
  equalTo,
  query,
  get,
  remove,
} from "firebase/database";
import { deleteUser as deleteFirebaseUser, getAuth } from "firebase/auth";
import app from "../../firebase";

const Users = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState(null);
  const [sortField, setSortField] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true); // Set loading state to true while fetching data

      const db = getDatabase(app);
      const usersRef = ref(db, "users");

      const roleQuery = query(
        usersRef,
        orderByChild("role"),
        equalTo("student")
      );

      get(roleQuery)
        .then((snapshot) => {
          setIsLoading(false); // Set loading state to false after fetching data
          if (snapshot.exists()) {
            const studentData = [];
            snapshot.forEach((childSnapshot) => {
              // Include UID in student object
              const student = {
                uid: childSnapshot.key, // Retrieve UID
                ...childSnapshot.val(), // Retrieve other student data
              };
              studentData.push(student);
            });
            setStudents(studentData);
            setFilteredStudents(studentData);
          } else {
            // No students found
            console.log("No students found.");
          }
        })
        .catch((error) => {
          setIsLoading(false); // Set loading state to false if there's an error
          console.error("Error fetching student data:", error);
        });
    };

    fetchStudents();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    filterAndSortStudents(event.target.value, sortField, sortOrder);
  };

  const handleSort = (field) => {
    const order = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(order);
    setSortField(field);
    filterAndSortStudents(searchTerm, field, order);
  };

  const filterAndSortStudents = (searchTerm, field, order) => {
    let filtered = students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentNumber.includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (field) {
      filtered = filtered.sort((a, b) => {
        if (order === "asc") {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      });
    }

    setFilteredStudents(filtered);
  };

  const handleDeleteUser = (uid) => {
    const confirmation = window.confirm("Do you want to delete this student?");

    if (!confirmation) {
      return;
    }

    const auth = getAuth();
    const db = getDatabase(app);
    const userRef = ref(db, `users/${uid}`);

    deleteFirebaseUser(auth.currentUser)
      .then(() => {
        console.log("User deleted from Firebase Authentication.");
        return remove(userRef);
      })
      .then(() => {
        console.log("Student data deleted from the Realtime Database.");
        setStudents((prevStudents) =>
          prevStudents.filter((student) => student.uid !== uid)
        );
        setFilteredStudents((prevFilteredStudents) =>
          prevFilteredStudents.filter((student) => student.uid !== uid)
        );
      })
      .catch((error) => {
        console.error("Error deleting student:", error);
      });
  };

  return (
    <Container>
      <FilterContainer>
        <SearchInput
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <SortButton onClick={() => handleSort("fullName")}>
          Sort by Name{" "}
          {sortField === "fullName" &&
            (sortOrder === "asc" ? <FaSortAlphaUp /> : <FaSortAlphaDown />)}
        </SortButton>
        <SortButton onClick={() => handleSort("studentNumber")}>
          Sort by Number{" "}
          {sortField === "studentNumber" &&
            (sortOrder === "asc" ? <FaSortNumericUp /> : <FaSortNumericDown />)}
        </SortButton>
      </FilterContainer>
      {isLoading ? (
        <LoadingMessage>Loading...</LoadingMessage>
      ) : filteredStudents.length > 0 ? (
        <Table>
          <thead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Student Number</TableHeader>
              <TableHeader>Email</TableHeader>
              {/* <TableHeader>Action</TableHeader> */}
            </TableRow>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <TableRow key={index}>
                <TableCell>{student?.fullName.toUpperCase()}</TableCell>
                <TableCell>{student?.studentNumber.toUpperCase()}</TableCell>
                <TableCell>{student.email}</TableCell>
                {/* <TableCell>
                  <ActionIcon>
                    <FaTrash onClick={() => handleDeleteUser(student.uid)} />
                  </ActionIcon>
                </TableCell> */}
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <NoStudentsMessage>No students found.</NoStudentsMessage>
      )}
    </Container>
  );
};

export default Users;

const Container = styled.div`
  flex: 1;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const FilterContainer = styled.div`
  height: 70px;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  padding: 10px;
  font-size: 1rem;
  width: 60%;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.2);
  }
`;

const SortButton = styled.button`
  padding: 10px;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s ease;
  margin: 0;

  &:hover {
    background-color: #0056b3;
  }

  svg {
    font-size: 1rem;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  font-size: 1rem;
`;

const TableCell = styled.td`
  padding: 15px;
  font-size: 1rem;
  border-bottom: 1px solid #ccc;
`;

const ActionIcon = styled.span`
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
`;

const LoadingMessage = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  padding: 20px;
`;

const NoStudentsMessage = styled.div`
  font-size: 1.5rem;
  color: #dc3545;
  font-weight: bold;
  text-align: center;
  padding: 20px;
`;
