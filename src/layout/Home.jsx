import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  FaBars,
  FaBook,
  FaBookOpen,
  FaUndo,
  FaMoneyBillWave,
  FaUserCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaFolder } from "react-icons/fa6";

import { Outlet, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import app from "../../firebase";
import { get, getDatabase, ref } from "firebase/database";

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const db = getDatabase(app);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);

        const user = await get(userRef);

        if (user.exists()) {
          const userCredential = user.val();

          if (userCredential?.role && userCredential.role == "student") {
            setUser(currentUser);
          } else if (userCredential?.role && userCredential.role == "admin") {
            navigate("/library");
          } else {
            await signOut(auth);
          }
        } else {
          navigate("/");
        }
      } else {
        navigate("/"); // Redirect to home page if no user is logged in
      }
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (!user || !user?.email) {
      return;
    }

    await signOut(auth);
    navigate("/");
  };

  return (
    <Container>
      <Header>
        <Logo>MyLibrary</Logo>
        <Nav $menuOpen={menuOpen}>
          <NavItem onClick={() => navigate("")}>
            <FaBook />
            <span>Library</span>
          </NavItem>
          <NavItem onClick={() => navigate("borrowed")}>
            <FaBookOpen />
            <span>Borrowed</span>
          </NavItem>
          <NavItem onClick={() => navigate("returned")}>
            <FaUndo />
            <span>Returned</span>
          </NavItem>
          <NavItem onClick={() => navigate("penalties")}>
            <FaMoneyBillWave />
            <span>Penalties</span>
          </NavItem>
          <NavItem onClick={() => navigate("setting")}>
            <FaUserCog />
            <span>Settings</span>
          </NavItem>
          <NavItem onClick={() => navigate("files")}>
            <FaFolder />
            <span>Files</span>
          </NavItem>
          <NavItem onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </NavItem>
        </Nav>
        <Hamburger onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars />
        </Hamburger>
      </Header>
      <Overlay $menuOpen={menuOpen} onClick={() => setMenuOpen(false)} />
      <Wrapper>
        <Outlet />
      </Wrapper>
    </Container>
  );
};

export default Home;

const Container = styled.div`
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #f4f4f9;
  display: flex;
  flex-direction: column;

  & * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`;

const Header = styled.header`
  height: 80px;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    position: fixed;
    top: 0;
    left: ${(props) => (props.$menuOpen ? "0" : "-100%")};
    width: 250px;
    height: 100%;
    background-color: #fff;
    border-right: 1px solid #ddd;
    transition: left 0.3s ease-in-out;
    z-index: 1001;
    padding-top: 80px; /* To push the menu items below the header */
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  }
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 20px;
  font-size: 18px;
  cursor: pointer;
  color: #333;
  padding: 10px 15px;
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
  cursor: pointer;

  svg {
    margin-right: 8px;
  }

  &:hover {
    background-color: #f4f4f9;
    color: #007bff;
  }

  @media (max-width: 768px) {
    margin: 10px 0;
    width: 100%;
    justify-content: start;
    padding: 10px 20px;
    flex-direction: row;
  }

  span {
    display: inline;
  }
`;

const Hamburger = styled.div`
  display: none;
  cursor: pointer;
  font-size: 24px;
  color: #333;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Overlay = styled.div`
  display: ${(props) => (props.$menuOpen ? "block" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: opacity 0.3s ease-in-out;
`;

const Wrapper = styled.div`
  flex: 1;
  margin-top: 80px;
`;
