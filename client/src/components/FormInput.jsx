import React from 'react';

const FormInput = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1 text-[var(--brand-text)]">{label}</label>}
      <input
        className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] ${error ? 'border-[var(--brand-red)]' : 'border-gray-300'}`}
        {...props}
      />
      {error && <p className="text-[var(--brand-red)] text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
