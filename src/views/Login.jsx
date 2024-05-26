// src/components/Login.js
import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Form from "../components/Form";
import "../styles/Login.css";
import logo from "/logo.png";
import FormField from "../components/FormField";
import { Link, useNavigate } from "react-router-dom";

// firebase
import {
  fetchSignInMethodsForEmail,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import app from "../../firebase";
Modal.setAppElement("#root");

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (!user?.emailVerified) {
          return;
        }
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

  const openModal = (message) => {
    setModalMessage(message);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    // Input validation
    if (!email || !password) {
      openModal("All fields are required. Please fill in all fields.");
      return;
    }

    setIsLoading(true); // Show loading indicator

    const auth = getAuth(app);
    const db = getDatabase(app);

    try {
      // const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      // if (signInMethods.length <= 0) {
      //   openModal("Invalid Account or Account not registered");
      //   setIsLoading(false);
      //   return;
      // }

      // Sign in the user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      if (user.emailVerified) {
        // Fetch user data from Realtime Database
        const userRef = ref(db, "users/" + user.uid);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          const { role } = userData;

          if (role === "student") {
            navigate("/home");
          } else if (role === "admin") {
            navigate("/library");
          } else {
            openModal("Invalid user role.");
          }
        } else {
          openModal(
            "No user found with this email. Please check your details."
          );
          await signOut(auth);
        }
      } else {
        openModal("Account not registered");
        await signOut(auth);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error signing in", error);

      let errorMessage;
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No user found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Wrong Email or Password";
          break;
        default:
          errorMessage = "There was an error signing in. Please try again.";
      }

      openModal(errorMessage);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  return (
    <div className="login-container">
      <div className="form-wrapper">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h2>Login</h2>

        <Form
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isRegister={false}
          isLoading={isLoading}
        />

        <Link
          to={"/register"}
          style={{
            textDecoration: "none",
            display: "block",
            marginTop: "0.5em",
          }}
        >
          Create an account
        </Link>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Error Message"
        className="Modal"
        overlayClassName="Overlay"
      >
        <h2>Error</h2>
        <div>{modalMessage}</div>
        <button onClick={closeModal}>Close</button>
      </Modal>
    </div>
  );
};

export default Login;
