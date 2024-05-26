import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Form from "../components/Form";
import "../styles/Register.css";
import logo from "/logo.png";
import FormField from "../components/FormField";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components"; // Import styled-components

// firebase
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { getDatabase, ref, set, get } from "firebase/database";
import app from "../../firebase";

Modal.setAppElement("#root");

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    studentNumber: "",
    agreed: false,
    grade: "",
  });

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // user listener
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log(user);
        // User is signed in, check user role
        const db = getDatabase(app);
        const userRef = ref(db, "users/" + user.uid);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          const { role } = userData;

          if (role === "admin") {
            navigate("/library");
          } else if (role === "student") {
            navigate("/home");
          } else {
            // Handle other roles or scenarios
            setModalMessage("Invalid user role.");
            setModalIsOpen(true);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const openModal = (message, success = false) => {
    setModalMessage(message);
    setIsSuccess(success);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, fullName, grade, studentNumber, agreed } =
      formData;

    // Input validation
    if (!fullName || !email || !password || !studentNumber || !grade) {
      openModal("All fields are required. Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      openModal("Password must be at least 6 characters long.");
      return;
    }

    // Simple email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      openModal("Please enter a valid email address.");
      return;
    }

    if (!agreed) {
      openModal("Please agree to the terms and conditions.");
      return;
    }

    const auth = getAuth(app);
    const db = getDatabase(app);

    try {
      setIsLoading(true);

      // Check if the email is already registered
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        openModal(
          "This email is already registered. Please use a different email or log in."
        );
        setIsLoading(false);
        return;
      }

      // Check if the student number already exists
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        const existingStudentNumber = Object.values(users).find(
          (user) => user.studentNumber === studentNumber && user.email !== email
        );

        if (existingStudentNumber) {
          openModal(
            "This student number is already registered. Please use your own student number."
          );
          setIsLoading(false);
          return;
        }
      }

      // Register the user
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;

      // Save user data in the database
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, {
        email,
        studentNumber,
        fullName,
        role: "student",
        grade,
      });

      // Send email verification
      openModal(
        "Registration successful! Please check your email for verification.",
        true
      );
      await signOut(auth);
      await sendEmailVerification(user);
      navigate("/");
    } catch (error) {
      console.error("Error registering user", error);

      let errorMessage;
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage =
            "This email is already registered. Please use a different email or log in.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/operation-not-allowed":
          errorMessage =
            "Registration is currently disabled. Please try again later.";
          break;
        case "auth/weak-password":
          errorMessage =
            "Password is too weak. Please choose a stronger password.";
          break;
        default:
          errorMessage =
            "There was an error registering the user. Please try again.";
      }

      openModal(errorMessage);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="register-container">
      <div className="form-wrapper">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h2>Create an Account</h2>

        <Form
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isRegister={true}
          isLoading={isLoading}
          additionalFields={
            <>
              <FormField
                label="Grade"
                type="number"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
              />
              <FormField
                label="Student Number"
                type="text"
                name="studentNumber"
                value={formData.studentNumber}
                onChange={handleChange}
              />
            </>
          }
        />
        <Link
          to={"/"}
          style={{
            textDecoration: "none",
            display: "block",
            marginTop: "0.5em",
          }}
        >
          Already have an account
        </Link>
        <Link
          to={"/register-admin"}
          style={{
            textDecoration: "none",
            display: "block",
            marginTop: "0.5em",
          }}
        >
          I'm an Admin
        </Link>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Message"
        className="Modal"
        overlayClassName="Overlay"
      >
        <h2>{isSuccess ? "Success" : "Error"}</h2>
        <div>{modalMessage}</div>
        <button onClick={closeModal}>Close</button>
      </Modal>
    </div>
  );
};

export default Register;
