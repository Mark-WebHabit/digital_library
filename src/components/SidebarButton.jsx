import React from "react";
import styled from "styled-components";

const SidebarButton = ({ text, icon, onClick }) => {
  return (
    <Container onClick={onClick}>
      <img src={icon} alt="Dashboard" />
      <p>{text}</p>
    </Container>
  );
};

export default SidebarButton;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  cursor: pointer;
  border: 2px solid transparent;
  padding: 1em;
  border-radius: 1.5em;
  margin: 1em 0;
  & img {
    width: 13%;
  }

  & p {
    font-size: 1.3rem;
    font-weight: bold;
    text-transform: uppercase;
  }

  &:hover {
    border-color: #bfbfbf;

    & p {
      color: green;
    }
  }
`;
