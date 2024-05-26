import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import emailjs from "@emailjs/browser";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { getAuth } from "firebase/auth";
import {
  ref,
  onValue,
  update,
  getDatabase,
  query,
  orderByChild,
  equalTo,
  get,
  set,
  push,
} from "firebase/database";
import app from "../../firebase";

const Main = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const db = getDatabase(app);
    const borrowsRef = ref(db, "borrows");

    const checkAndUpdateOverdue = (snapshot) => {
      const borrows = snapshot.val();

      if (!borrows) return;

      const books = Object.keys(borrows);

      books.forEach(async (key) => {
        const book = borrows[key];

        if (book.status === "borrowed") {
          //update the status to overdue if duedate is less than current date
          const borrowRef = ref(db, `borrows/${key}`);
          if (new Date(book.dueDate) < new Date()) {
            // update status

            await update(borrowRef, {
              status: "overdue",
            });

            const penaltyRef = ref(db, "penalties");

            const newPenalty = await push(penaltyRef);

            let dt = {};

            dt = { ...book };
            dt["date"] = new Date().toString();

            await set(newPenalty, dt);

            console.log("set");
          } else if (new Date(book.dueDate) >= new Date()) {
            //if a book has been borrowed and not yet on due, notify the user

            if (book?.notified) {
              //if the email was already been sent
              return;
            } else {
              const studentRef = ref(db, `users`);
              const bookRef = ref(db, `books/${book.bookUid}`);

              const bookData = (await get(bookRef)).val();

              const studentQuery = query(
                studentRef,
                orderByChild("studentNumber"),
                equalTo(book.studentNumber)
              );

              const snapshot = await get(studentQuery);
              let userData = snapshot.val();
              const userKey = Object.keys(userData);
              userData = userData[userKey[0]];

              const params = {
                username: userData.fullName,
                title: bookData.title,
                dueDate: book.dueDate,
                user_email: userData.email,
              };
              // if user is not yet notified
              emailjs
                .send(
                  "service_lsoyrun",
                  "template_b9o71d8",
                  params,
                  "CgAESiaUJmyydd236"
                )
                .then(async (response) => {
                  console.log("email sent: ", response);
                  await update(borrowRef, {
                    notified: true,
                  });
                })
                .catch(function (error) {
                  console.error("Error sending email:", error);
                });
            }
          }
        }
      });
    };

    const unsubscribeBorrows = onValue(borrowsRef, checkAndUpdateOverdue);

    return () => {
      unsubscribeBorrows();
    };
  }, []);

  return (
    <Container>
      <Header />
      <Wrapper>
        <Sidebar />
        <Outlet />
      </Wrapper>
    </Container>
  );
};

export default Main;

const Container = styled.div`
  height: 100vh;
  background: #f2f2f2;
`;

const Wrapper = styled.div`
  height: calc(100vh - 80px);
  display: flex;
`;
