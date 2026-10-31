import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import FormInput from '../../components/FormInput.jsx';
import ErrorBox from '../../components/ErrorBox.jsx';

const RegisterCustomerPage = () => {
  const navigate = useNavigate();
  const { registerCustomerUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    houseBuilding: '',
    subAddressArea: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.phone) newErrors.phone = "Phone is required";
    else if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(formData.phone.trim())) newErrors.phone = "Invalid Indian phone number";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = "Password needs uppercase, lowercase, number, and special character";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setGlobalError(null);
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      if (formData.houseBuilding || formData.city || formData.state || formData.pincode) {
        payload.address = {
          receiverName: formData.name,
          phoneNumber: formData.phone,
          houseBuilding: formData.houseBuilding || 'N/A',
          subAddressArea: formData.subAddressArea || 'N/A',
          city: formData.city || 'N/A',
          state: formData.state || 'N/A',
          pincode: formData.pincode || '380001'
        };
      }

      await registerCustomerUser(payload);
      navigate('/login?role=customer');
    } catch (err) {
      const serverMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Registration failed';
      setGlobalError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--brand-light-bg)]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full border-t-4 border-[var(--brand-red)] my-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--brand-text)]">Create Customer Account</h2>
        
        <ErrorBox message={globalError} />

        <form onSubmit={handleSubmit}>
          <div className="mb-6 border-b pb-4 border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-[var(--brand-red)]">Basic Info</h3>
            <FormInput label="Full Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
            <FormInput label="Email Address *" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <FormInput label="Phone Number *" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
            <FormInput label="Password *" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} />
            <p className="text-[11px] text-gray-500 -mt-2 mb-3">
              Must be 8+ characters, with uppercase, lowercase, number, and special character (e.g. <span className="font-semibold text-gray-700">Hetal@1234</span>).
            </p>
            <FormInput label="Confirm Password *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--brand-red)]">Address (Optional)</h3>
            <FormInput label="House/Building" name="houseBuilding" value={formData.houseBuilding} onChange={handleChange} />
            <FormInput label="Sub-address/Area" name="subAddressArea" value={formData.subAddressArea} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="City" name="city" value={formData.city} onChange={handleChange} />
              <FormInput label="State" name="state" value={formData.state} onChange={handleChange} />
            </div>
            <FormInput label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-[var(--brand-red)] text-white font-bold py-3 px-4 rounded transition ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--brand-dark-red)]'}`}
          >
            {loading ? 'Registering...' : 'REGISTER'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login?role=customer" className="text-[var(--brand-red)] hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomerPage;
