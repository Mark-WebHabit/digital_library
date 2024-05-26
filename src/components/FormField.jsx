// src/components/FormField.js
import React from "react";
import "../styles/FormField.css";

const FormField = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder = "",
}) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder=""
      />
    </div>
  );
};

export default FormField;
