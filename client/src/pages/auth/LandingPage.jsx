import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-[var(--brand-red)] mb-2">RAMESHWAR NAMKEEN</h1>
          <p className="text-gray-600 mb-8 italic">Authentic Taste of Gujarat</p>
          <p className="mb-6">Welcome back, {user.name}!</p>
          <button 
            onClick={() => navigate(`/${user.role}`)}
            className="w-full bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white font-bold py-3 px-4 rounded mb-4"
          >
            Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center border-t-8 border-[var(--brand-red)]">
        <h1 className="text-3xl font-bold text-[var(--brand-red)] mb-2">RAMESHWAR NAMKEEN</h1>
        <p className="text-gray-600 mb-8 italic font-serif">Authentic Taste of Gujarat</p>
        
        <div className="space-y-3 mb-8">
          <Link to="/login?role=customer" className="block w-full bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white font-bold py-3 px-4 rounded transition">
            CUSTOMER LOGIN
          </Link>
          <Link to="/login?role=wholesaler" className="block w-full bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white font-bold py-3 px-4 rounded transition">
            WHOLESALER LOGIN
          </Link>
          <Link to="/login?role=admin" className="block w-full border-2 border-[var(--brand-red)] text-[var(--brand-red)] hover:bg-[var(--brand-light-red)] font-bold py-2.5 px-4 rounded transition">
            ADMIN LOGIN
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-3">New to Rameshwar Namkeen?</p>
          <div className="flex gap-2">
            <Link to="/register/customer" className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-2 rounded">
              CUSTOMER REGISTER
            </Link>
            <Link to="/register/wholesaler" className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-2 rounded">
              WHOLESALER REGISTER
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
