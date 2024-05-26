import React from "react";
import styled from "styled-components";

import logo from "/logo.png";

const Header = () => {
  return (
    <Container>
      <img src={logo} alt="Logo" />
      <p>
        DIGITAL <span>LIBRARY</span>
      </p>
    </Container>
  );
};

export default Header;
const Container = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0.3em 1em;
  gap: 0.5em;
  background: white;

  & img {
    height: 100%;
  }

  & p {
    font-size: 1.5rem;
    font-weight: bold;

    & span {
      color: dodgerblue;
    }
  }
`;
