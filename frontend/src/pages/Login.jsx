import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP states
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [step, setStep] = useState(1); // 1: email, 2: OTP
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [verificationToken, setVerificationToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/otp/send', {
        email: formData.email,
        purpose: 'login'
      });
      
      setStep(2);
      setSuccess('OTP sent to your email!');
      setResendTimer(60);
      
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

  const verifyOTPAndLogin = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/otp/verify', {
        email: formData.email,
        otp,
        purpose: 'login'
      });

      if (response.success) {
        setVerificationToken(response.data.verificationToken);
        
        // Complete login with OTP
        await completeLoginWithOTP(response.data.verificationToken);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const completeLoginWithOTP = async (vToken) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: formData.email,
        useOTP: true,
        verificationToken: vToken
      });

      console.log('OTP Login response:', response);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Login successful, redirecting...');
        // Check if user must change password (but admins go to admin panel regardless)
        if (response.data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (response.data.user.mustChangePassword) {
          window.location.href = '/dashboard?tab=security';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('OTP Login error:', err);
      setError(err?.message || err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Password Login response:', response);

      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Login successful, redirecting...');
        
        // Check if user must change password (but admins go to admin panel regardless)
        if (response.data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (response.data.user.mustChangePassword) {
          window.location.href = '/dashboard?tab=security';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Password Login error:', err);
      setError(err?.message || err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loginMethod === 'otp') {
      if (step === 1) {
        await sendOTP();
      } else {
        await verifyOTPAndLogin();
      }
    } else {
      await handlePasswordLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to Your Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="login-method-toggle">
          <button 
            type="button"
            className={loginMethod === 'password' ? 'active' : ''}
            onClick={() => { setLoginMethod('password'); setStep(1); setError(''); }}
          >
            Password
          </button>
          <button 
            type="button"
            className={loginMethod === 'otp' ? 'active' : ''}
            onClick={() => { setLoginMethod('otp'); setStep(1); setError(''); }}
          >
            OTP
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={step === 2}
            />
          </div>

          {loginMethod === 'password' && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
          )}

          {loginMethod === 'otp' && step === 2 && (
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
          )}

          <button type="submit" className="login-btn" disabled={loading || otpLoading}>
            {loading || otpLoading 
              ? (step === 1 && loginMethod === 'otp' ? 'Sending OTP...' : 'Please wait...') 
              : (loginMethod === 'otp' && step === 1 ? 'Send OTP' : 'Login')}
          </button>

          {loginMethod === 'otp' && step === 2 && (
            <button 
              type="button" 
              className="resend-btn" 
              onClick={sendOTP}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          )}
        </form>

        <p className="register-link">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
