'use client';

import { useState } from 'react';
import { FiUser, FiMail, FiLock, FiCheck } from 'react-icons/fi';

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword: _, ...registerData } = formData;
      await onRegister(registerData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiUser className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            className="pl-12 input-field group-hover:border-blue-300"
            placeholder="Choose a username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiMail className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className="pl-12 input-field group-hover:border-blue-300"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiLock className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            className="pl-12 input-field group-hover:border-blue-300"
            placeholder="Create a password (min 6 characters)"
            minLength="6"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Password must be at least 6 characters long
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiCheck className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            className="pl-12 input-field group-hover:border-blue-300"
            placeholder="Confirm your password"
            minLength="6"
            required
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 flex items-center">
            <span className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center mr-2">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            </span>
            {error}
          </p>
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <FiUser className="w-5 h-5" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-gray-600 text-center">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-blue-600 hover:text-blue-700">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-blue-600 hover:text-blue-700">
          Privacy Policy
        </a>
      </p>
    </form>
  );
};

export default RegisterForm;