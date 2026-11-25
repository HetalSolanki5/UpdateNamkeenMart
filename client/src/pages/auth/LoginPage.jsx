import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import FormInput from '../../components/FormInput.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';
import { forgotPassword, verifyResetOTP, resetPassword } from '../../api/authApi.js';

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

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter Email, 2: Enter OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotRole, setForgotRole] = useState('customer');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['customer', 'wholesaler', 'admin'].includes(roleParam)) {
      setRole(roleParam);
      setForgotRole(roleParam);
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
      
      // Navigate to the respective dashboard/portal based on role
      const targetRole = user?.role || role;
      if (targetRole === 'admin') {
        navigate('/admin');
      } else if (targetRole === 'wholesaler') {
        navigate('/wholesaler');
      } else {
        // Customer navigates directly to Catalogue & Shop page
        navigate('/customer/shop');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = (e) => {
    e.preventDefault();
    setForgotEmail(email || '');
    setForgotRole(role);
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccess(null);
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      await forgotPassword({ email: forgotEmail, role: forgotRole });
      setForgotSuccess('OTP sent successfully! Please check your terminal console.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP. User not found.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setForgotError('Please enter the 6-digit OTP');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      await verifyResetOTP({ email: forgotEmail, otp, role: forgotRole });
      setForgotSuccess('OTP verified! Now enter your new password.');
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      await resetPassword({
        email: forgotEmail,
        otp,
        newPassword,
        role: forgotRole
      });
      setForgotSuccess('Password reset successful! You can now login with your new password.');
      setPassword('');
      setTimeout(() => {
        setShowForgotModal(false);
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-t-4 border-[var(--brand-red)]">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--brand-text)]">Login to your account</h2>
        
        <ErrorBox message={error} />

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[var(--brand-text)]">Select Role</label>
            <select 
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)] border-gray-300 bg-white"
              value={role} 
              onChange={(e) => {
                setRole(e.target.value);
                setForgotRole(e.target.value);
              }}
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
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-sm text-[var(--brand-red)] hover:underline font-medium bg-transparent border-0 cursor-pointer p-0"
            >
              Forgot Password?
            </button>
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

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border-t-4 border-[var(--brand-red)] animate-fadeIn">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
            <p className="text-xs text-gray-500 mb-4">
              Step {forgotStep} of 3 &bull; {forgotStep === 1 ? 'Enter registered Email' : forgotStep === 2 ? 'Verify 6-digit OTP' : 'Create New Password'}
            </p>

            {forgotError && (
              <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3 rounded-lg mb-3">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-green-50 text-green-700 border border-green-200 text-xs p-3 rounded-lg mb-3">
                {forgotSuccess}
              </div>
            )}

            {/* STEP 1: Enter Email & Role */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Role</label>
                  <select
                    value={forgotRole}
                    onChange={(e) => setForgotRole(e.target.value)}
                    className="w-full border p-2 rounded text-sm bg-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-[var(--brand-red)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white text-sm font-bold py-2.5 rounded transition"
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter 6-digit OTP sent to <span className="font-bold text-gray-900">{forgotEmail}</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full border p-2.5 rounded text-center text-lg tracking-widest font-mono font-bold focus:ring-2 focus:ring-[var(--brand-red)] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    className="w-1/3 border border-gray-300 text-gray-700 text-xs font-semibold py-2.5 rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-2/3 bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white text-sm font-bold py-2.5 rounded transition"
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-[var(--brand-red)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-[var(--brand-red)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[var(--brand-red)] hover:bg-[var(--brand-dark-red)] text-white text-sm font-bold py-2.5 rounded transition"
                >
                  {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
