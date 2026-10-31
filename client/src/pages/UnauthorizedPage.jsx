import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-[var(--brand-red)] mb-4">Access Denied</h1>
        <p className="mb-6 text-gray-700">You are not allowed to open this page.</p>
        <Link to="/" className="text-[var(--brand-red)] hover:underline font-medium">Back to Home</Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
