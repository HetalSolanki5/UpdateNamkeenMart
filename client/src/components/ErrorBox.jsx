import React from 'react';

const ErrorBox = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-[var(--brand-light-red)] border-l-4 border-[var(--brand-red)] text-[var(--brand-dark-red)] p-4 mb-4 rounded shadow-sm">
      <p>{message}</p>
    </div>
  );
};

export default ErrorBox;
