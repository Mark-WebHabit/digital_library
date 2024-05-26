import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import app, { db } from "../../firebase";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { formatDateTime } from "../utilities/date.js";

const Penalties = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);

        get(userRef).then((snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUser(userData);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!user?.email) {
      return;
    }

    const penaltyRef = ref(db, "penalties");
    const penaltyQuery = query(
      penaltyRef,
      orderByChild("studentNumber"),
      equalTo(user.studentNumber)
    );

    get(penaltyQuery)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dateKey = Object.keys(data);

          let arr = [];

          dateKey.forEach((key) => {
            const dt = data[key];
            const obj = {
              date: new Date(dt.date), // Convert to Date object
              body: "You have an overdue, Therefore you are penalized, please refer to the Library Admin regarding the penalty, remember to return the book!",
            };
            arr.push(obj);
          });

          // Sort notifications by date in descending order
          arr.sort((a, b) => b.date - a.date);

          // Format dates after sorting
          const formattedNotifications = arr.map((notification) => ({
            date: formatDateTime(notification.date),
            body: notification.body,
          }));

          setNotifications(formattedNotifications);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [user]);

  return (
    <Container>
      <Title>Notifications</Title>
      {notifications.length > 0 && user ? (
        notifications.reverse().map((notification, index) => (
          <Notification key={index}>
            <NotificationDate>{notification.date}</NotificationDate>
            <NotificationBody>{notification.body}</NotificationBody>
          </Notification>
        ))
      ) : (
        <p>No new notification</p>
      )}
    </Container>
  );
};

export default Penalties;

const Container = styled.div`
  padding: 20px;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
`;

const Notification = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 90%;
    padding: 15px;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 10px;
  }
`;

const NotificationDate = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
`;

const NotificationBody = styled.p`
  font-size: 16px;
  color: #333;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;
