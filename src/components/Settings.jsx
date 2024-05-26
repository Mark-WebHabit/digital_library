import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FaUser, FaEnvelope, FaGraduationCap } from "react-icons/fa";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import app, { db } from "../../firebase";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
  update,
} from "firebase/database";

const Settings = () => {
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    studentNumber: "",
    grade: "",
  });
  const [userCopy, setUserCopy] = useState({
    fullName: "",
    email: "",
    studentNumber: "",
    grade: "",
  });
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);

        get(userRef).then((snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUser(userData);
            setUserCopy(userData);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSave = async () => {
    if (!user || !user.email) {
      return;
    }

    if (!auth.currentUser) {
      return;
    }

    const userRef = ref(db, `users/${auth.currentUser.uid}`);
    const usersRef = ref(db, "users");
    const userQuery = query(
      usersRef,
      orderByChild("studentNumber"),
      equalTo(user.studentNumber)
    );

    const snapshot = await get(userQuery);

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const conflictingUser = Object.keys(usersData).find(
        (key) => key !== auth.currentUser.uid
      );

      if (conflictingUser) {
        setErrorMessage("Student number already in use by another user.");
        return;
      }
    }

    const penaltyRef = ref(db, "penalties");
    const penaltyQuery = query(
      penaltyRef,
      orderByChild("studentNumber"),
      equalTo(userCopy.studentNumber)
    );

    const penaltySnapshot = await get(penaltyQuery);

    if (penaltySnapshot.exists()) {
      const dt = penaltySnapshot.val();
      const keys = Object.keys(dt);

      keys.forEach(async (key) => {
        const penaltyRef = ref(db, `penalties/${key}`);

        await update(penaltyRef, {
          studentNumber: user.studentNumber,
        });
      });
    }

    const borrowsRef = ref(db, "borrows");
    const borrowsQuery = query(
      borrowsRef,
      orderByChild("studentNumber"),
      equalTo(userCopy.studentNumber)
    );

    const borrowSnapshot = await get(borrowsQuery);

    if (borrowSnapshot.exists()) {
      const dt = borrowSnapshot.val();
      const keys = Object.keys(dt);

      keys.forEach(async (key) => {
        const borrowRef = ref(db, `borrows/${key}`);

        await update(borrowRef, {
          studentNumber: user.studentNumber,
        });
      });
    }

    await update(userRef, user);
    setShowSuccessModal(true);
    setUserCopy(user);
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePasswordReset = () => {
    if (!user.email) {
      setResetMessage("No email found for password reset.");
      return;
    }

    sendPasswordResetEmail(auth, user.email)
      .then(() => {
        setResetMessage("Password reset email sent successfully.");
      })
      .catch((error) => {
        setResetMessage(`Error: ${error.message}`);
      });
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setErrorMessage("");
    setResetMessage("");
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container>
      {auth?.currentUser && (
        <Form>
          <Title>Settings</Title>
          <InputWrapper>
            <FaUser />
            <Input
              type="text"
              placeholder="Full Name"
              name="fullName"
              value={user.fullName}
              onChange={handleChange}
            />
          </InputWrapper>
          <InputWrapper>
            <FaEnvelope />
            <Input
              type="email"
              placeholder="Email"
              name="email"
              value={user.email}
              onChange={handleChange}
              readOnly
            />
          </InputWrapper>
          <InputWrapper>
            <FaGraduationCap />
            <Input
              type="text"
              placeholder="Student Number"
              name="studentNumber"
              value={user.studentNumber}
              onChange={handleChange}
            />
          </InputWrapper>
          <InputWrapper>
            <FaGraduationCap />
            <Input
              type="text"
              placeholder="Grade"
              name="grade"
              value={user.grade}
              onChange={handleChange}
            />
          </InputWrapper>
          <Button onClick={handleSave}>Save</Button>
          <ForgotPasswordButton onClick={handlePasswordReset}>
            Forgot Password?
          </ForgotPasswordButton>
        </Form>
      )}
      {showSuccessModal && (
        <Modal>
          <ModalContent>
            <p>Profile updated successfully!</p>
            <ModalButton onClick={closeModal}>Close</ModalButton>
          </ModalContent>
        </Modal>
      )}
      {errorMessage && (
        <Modal>
          <ModalContent>
            <p>{errorMessage}</p>
            <ModalButton onClick={closeModal}>Close</ModalButton>
          </ModalContent>
        </Modal>
      )}
      {resetMessage && (
        <Modal>
          <ModalContent>
            <p>{resetMessage}</p>
            <ModalButton onClick={closeModal}>Close</ModalButton>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Settings;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 80px);
  background: #f0f2f5;
  padding: 20px;
`;

const Form = styled.div`
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
  text-align: center;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background: #f9f9f9;
  border-radius: 5px;
  padding: 10px;
`;

const Input = styled.input`
  border: none;
  background: transparent;
  outline: none;
  padding: 10px;
  flex: 1;
  font-size: 16px;
  margin-left: 10px;
  color: #333;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 15px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background 0.3s;

  &:hover {
    background: #0056b3;
  }
`;

const ForgotPasswordButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  transition: color 0.3s;

  &:hover {
    color: #0056b3;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
`;

const ModalButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background 0.3s;

  &:hover {
    background: #0056b3;
  }
`;
