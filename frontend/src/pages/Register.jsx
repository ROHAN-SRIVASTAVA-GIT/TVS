import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'parent'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP states
  const [step, setStep] = useState(1); // 1: details, 2: OTP
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/otp/send', {
        email: formData.email,
        phone: formData.phone || undefined,
        purpose: 'registration'
      });
      
      setStep(2);
      setSuccess('OTP sent to your email!');
      setResendTimer(60);
      
      // Countdown for resend
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/otp/verify', {
        email: formData.email,
        phone: formData.phone || undefined,
        otp,
        purpose: 'registration'
      });

      if (response.success) {
        setVerificationToken(response.data.verificationToken);
        setSuccess('Email verified! Completing registration...');
        
        // Now complete registration
        await completeRegistration(response.data.verificationToken);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const completeRegistration = async (vToken) => {
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/auth/register', {
        ...formData,
        verificationToken: vToken
      });

      if (response.success) {
        // Save token and user
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Redirect based on role
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Send OTP first
    await sendOTP();
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>{step === 1 ? 'Create Your Account' : 'Verify Your Email'}</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Phone Number (Optional for OTP)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
              />
            </div>

            <button type="submit" className="register-btn" disabled={loading || otpLoading}>
              {loading || otpLoading ? 'Sending OTP...' : 'Send OTP & Register'}
            </button>
          </form>
        ) : (
          <div className="otp-section">
            <div className="otp-info">
              <p>We've sent a 6-digit OTP to</p>
              <p className="otp-email">{formData.email}</p>
            </div>

            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="otp-input"
              />
            </div>

            <button 
              type="button" 
              className="verify-btn" 
              onClick={verifyOTP}
              disabled={otpLoading || otp.length !== 6}
            >
              {otpLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button 
              type="button" 
              className="resend-btn" 
              onClick={sendOTP}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>

            <button 
              type="button" 
              className="back-btn" 
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
            >
              Change Email
            </button>
          </div>
        )}

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
