// src/components/CheckboxField.js
import React from "react";
import "../styles/CheckboxField.css";

const CheckboxField = ({ label, name, checked, onChange }) => {
  return (
    <div className="form-group terms">
      <label>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          required
        />
        {label}
      </label>
    </div>
  );
};

export default CheckboxField;
