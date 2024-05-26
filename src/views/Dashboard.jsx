import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Chart from "chart.js/auto";

import {
  getMonthNameFromDate,
  getCurrentMonthName,
  getPreviousMonthName,
} from "../utilities/date.js";

// firebase
import {
  getDatabase,
  ref,
  orderByChild,
  equalTo,
  query,
  get,
  onValue,
} from "firebase/database";
import app from "../../firebase";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState({
    booksInLibrary: 0,
    registeredStudents: 0,
    borrowedBooks: 0,
    unreturnedBooks: 0,
    recentlyReturnedBooks: 0,
    booksBorrowedThisMonth: 0,
    booksBorrowedLastMonth: 0,
    booksReturnedThisMonth: 0,
    booksReturnedLastMonth: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const usersRef = ref(db, "users");
      const currentMonth = getCurrentMonthName();
      const lastMonth = getPreviousMonthName();

      let dt = {
        booksInLibrary: 0,
        registeredStudents: 0,
        borrowedBooks: 0,
        overDue: 0,
        recentlyReturnedBooks: 0,
        booksBorrowedThisMonth: 0,
        booksBorrowedLastMonth: 0,
        booksReturnedThisMonth: 0,
        booksReturnedLastMonth: 0,
      };

      const roleQuery = query(
        usersRef,
        orderByChild("role"),
        equalTo("student")
      );

      get(roleQuery)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const studentData = [];
            snapshot.forEach((childSnapshot) => {
              studentData.push(childSnapshot.key);
            });
            // data setter
            dt.registeredStudents = studentData.length || 0;
          } else {
            // No students found
            dt.registeredStudents = 0;
          }
        })
        .catch((error) => {
          console.error("Error fetching student data:", error);
        });

      const bookRef = ref(db, "books");
      onValue(bookRef, (snapshot) => {
        const books = snapshot.val();
        if (books) {
          const bookArray = Object.keys(books).map((key) => books[key]);
          dt.booksInLibrary = bookArray.length;
        } else {
          dt.booksInLibrary = 0;
        }
      });

      const bookStatusQuery = query(
        bookRef,
        orderByChild("status"),
        equalTo("borrowed")
      );

      get(bookStatusQuery).then((snapshot) => {
        if (snapshot.exists()) {
          const bookData = [];
          snapshot.forEach((childSnapshot) => {
            bookData.push(childSnapshot.key);
          });

          dt.borrowedBooks = bookData.length || 0;
        } else {
          // No students found
          dt.borrowedBooks = 0;
        }
      });

      const borrowsRef = ref(db, "borrows");

      const overDueQuery = query(
        borrowsRef,
        orderByChild("status"),
        equalTo("overdue")
      );

      get(overDueQuery).then((snapshot) => {
        if (snapshot.exists()) {
          const borrowData = [];

          snapshot.forEach((childSnapshot) => {
            borrowData.push(childSnapshot.key);
          });
          dt.overDue = borrowData.length || 0;
        } else {
          dt.overDue = 0;
        }
      });

      const returnQuery = query(
        borrowsRef,
        orderByChild("status"),
        equalTo("returned")
      );

      get(returnQuery).then((snapshot) => {
        if (snapshot.exists()) {
          const arr = [];
          const returnData = snapshot.val();
          const keys = Object.keys(returnData);

          const current = [];
          const last = [];

          keys.forEach((key) => {
            const obj = returnData[key];

            const currentMonth = getCurrentMonthName();
            const returnMonth = getMonthNameFromDate(obj.returnedDate);

            if (
              currentMonth.trim().toLowerCase() ==
              returnMonth.trim().toLowerCase()
            ) {
              arr.push(obj);
            }

            const dateReturned = getMonthNameFromDate(obj.returnedDate);

            if (dateReturned == currentMonth) {
              current.push(obj);
            } else if (dateReturned == lastMonth) {
              last.push(obj);
            }

            dt.booksReturnedThisMonth = current.length || 0;
            dt.booksReturnedLastMonth = last.length || 0;

            dt.recentlyReturnedBooks = arr.length || 0;
          });
        }
      });

      get(borrowsRef).then((snapshot) => {
        if (snapshot.exists()) {
          const allBorrows = snapshot.val();
          const keys = Object.keys(allBorrows);

          const current = [];
          const last = [];
          keys.forEach((key) => {
            const borrow = allBorrows[key];

            const dateBorrowed = getMonthNameFromDate(borrow.dateBorrowed);

            if (dateBorrowed == currentMonth) {
              current.push(borrow);
            } else if (dateBorrowed == lastMonth) {
              last.push(borrow);
            }
          });

          dt.booksBorrowedThisMonth = current.length || 0;
          dt.booksBorrowedLastMonth = last.length || 0;
        }
      });

      // set all the data at once
      setData(dt);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Chart for books borrowed this month compared to last month
    const borrowedChart = new Chart(document.getElementById("borrowedChart"), {
      type: "bar",
      data: {
        labels: ["This Month", "Last Month"],
        datasets: [
          {
            label: "Books Borrowed",
            data: [data.booksBorrowedThisMonth, data.booksBorrowedLastMonth],
            backgroundColor: ["#007bff", "#555"],
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    // Chart for books returned this month compared to last month
    const returnedChart = new Chart(document.getElementById("returnedChart"), {
      type: "bar",
      data: {
        labels: ["This Month", "Last Month"],
        datasets: [
          {
            label: "Books Returned",
            data: [data.booksReturnedThisMonth, data.booksReturnedLastMonth],
            backgroundColor: ["#007bff", "#555"],
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    return () => {
      borrowedChart.destroy();
      returnedChart.destroy();
    };
  }, [data.booksInLibrary]);

  return (
    <Container>
      <Header>Dashboard</Header>
      <StatsGrid>
        <StatCard>
          <StatNumber>{data.booksInLibrary}</StatNumber>
          <StatLabel>Books in Library</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data.registeredStudents}</StatNumber>
          <StatLabel>Registered Students</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data.borrowedBooks}</StatNumber>
          <StatLabel>Borrowed Books</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data.overDue}</StatNumber>
          <StatLabel>Overdues</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{data.recentlyReturnedBooks}</StatNumber>
          <StatLabel>Recently Returned Books</StatLabel>
        </StatCard>
      </StatsGrid>

      <AdditionalStats>
        <ChartCard>
          <canvas id="borrowedChart"></canvas>
        </ChartCard>
        <ChartCard>
          <canvas id="returnedChart"></canvas>
        </ChartCard>
      </AdditionalStats>
      <Footer>
        <DateTime>{currentTime.toLocaleDateString()}</DateTime>
        <DateTime>{currentTime.toLocaleTimeString()}</DateTime>
      </Footer>
    </Container>
  );
};

export default Dashboard;

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f4f4f9;
  color: #333;
  font-family: "Arial", sans-serif;
`;

const Header = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  color: #007bff;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;
const AdditionalStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const StatCard = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ChartCard = styled(StatCard)`
  /* Your existing styles */
`;
const StatNumber = styled.div`
  font-size: 42px;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #555;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: auto;
  color: #555;
`;

const DateTime = styled.div`
  font-size: 18px;
  margin: 5px 0;
`;
