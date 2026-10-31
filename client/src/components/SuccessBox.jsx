import React from 'react';

const SuccessBox = ({ message }) => {
  if (!message) return null;
  return (
    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-sm">
      <p>{message}</p>
    </div>
  );
};

export default SuccessBox;
