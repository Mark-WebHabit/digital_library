import React from "react";
import styled from "styled-components";

import dashboard from "/dashboard.png";
import users from "/users.png";
import books from "/books.png";
import borrow from "/borrow.png";
import returned from "/back.png";
import logout from "/log-out.png";
import penalty from "/penalty.png";
import folder from "/folder.png";

import SidebarButton from "./SidebarButton";
import { useNavigate } from "react-router-dom";

// firebase
import { signOut, getAuth } from "firebase/auth";
import app from "../../firebase";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const auth = getAuth(app);

    await signOut(auth);
  };

  const handleClick = (txt) => {
    navigate(`/library/${txt}`);
  };

  return (
    <Container>
      <SidebarButton
        text="Dashboard"
        icon={dashboard}
        onClick={() => handleClick("")}
      />
      <SidebarButton
        text="library"
        icon={books}
        onClick={() => handleClick("shelf")}
      />
      <SidebarButton
        text="users"
        icon={users}
        onClick={() => handleClick("users")}
      />
      <SidebarButton
        text="Borrowed"
        icon={borrow}
        onClick={() => handleClick("borrowers")}
      />
      <SidebarButton
        text="returned"
        icon={returned}
        onClick={() => handleClick("returned")}
      />
      <SidebarButton
        text="Penalties"
        icon={penalty}
        onClick={() => handleClick("penalties")}
      />
      <SidebarButton
        text="Files"
        icon={folder}
        onClick={() => handleClick("files")}
      />
      <SidebarButton text="logout" icon={logout} onClick={handleLogout} />
    </Container>
  );
};

export default Sidebar;
const Container = styled.div`
  flex-basis: 14%;
  background: white;
  padding: 5% 0;
`;
