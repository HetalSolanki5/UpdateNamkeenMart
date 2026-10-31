import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-[var(--brand-text)] mb-4">404</h1>
        <p className="mb-6 text-gray-700">Page not found.</p>
        <Link to="/" className="text-[var(--brand-red)] hover:underline font-medium">Back to Home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
