// src/components/Form.js
import React from "react";
import FormField from "./FormField";
import CheckboxField from "./CheckboxField";
import "../styles/Form.css";

const Form = ({
  formData,
  handleChange,
  handleSubmit,
  isRegister,
  additionalFields,
  isLoading,
}) => {
  return (
    <form className="form" onSubmit={handleSubmit}>
      {isRegister && (
        <>
          <FormField
            label="Full Name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
          />
        </>
      )}
      <FormField
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {additionalFields}
      <FormField
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
      />

      {isRegister && (
        <CheckboxField
          label="I agree to the terms and conditions"
          name="agreed"
          checked={formData.agreed}
          onChange={handleChange}
        />
      )}
      <button type="submit" className="submit-button">
        {isLoading ? "Loading..." : isRegister ? "Register" : "Login"}
      </button>
    </form>
  );
};
export default Form;
