import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import FormInput from '../../components/FormInput.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotMsg, setForgotMsg] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['customer', 'wholesaler', 'admin'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and Password are required");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const user = await loginUser({ email, password, role });
      
      // If wholesaler is pending/rejected/inactive, show note, but we redirect first if login is successful.
      // We will redirect and handle unauthorized logic inside ProtectedRoutes.
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setForgotMsg("Password reset is not connected yet.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-[var(--brand-red)]">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--brand-text)]">Login to your account</h2>
        
        <ErrorBox message={error} />
        {forgotMsg && <div className="bg-yellow-50 text-yellow-700 p-3 mb-4 rounded text-sm">{forgotMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[var(--brand-text)]">Select Role</label>
            <select 
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] border-gray-300 bg-white"
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <FormInput 
            label="Email Address" 
            type="email" 
            placeholder="Enter your email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          
          <FormInput 
            label="Password" 
            type="password" 
            placeholder="Enter your password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center text-sm cursor-pointer">
              <input 
                type="checkbox" 
                className="mr-2 accent-[var(--brand-red)]" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span className="text-gray-600">Remember Me</span>
            </label>
            <a href="#" onClick={handleForgot} className="text-sm text-[var(--brand-red)] hover:underline">
              Forgot Password?
            </a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-[var(--brand-red)] text-white font-bold py-3 px-4 rounded transition ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--brand-dark-red)]'}`}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New here?{' '}
            <Link to={role === 'wholesaler' ? "/register/wholesaler" : "/register/customer"} className="text-[var(--brand-red)] hover:underline font-semibold">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
