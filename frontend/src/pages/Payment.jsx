import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import './Payment.css';

const Payment = () => {
  const [searchType, setSearchType] = useState('email');
  const [searchValue, setSearchValue] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [feeStructure, setFeeStructure] = useState(null);
  const [selectedFeeType, setSelectedFeeType] = useState('tuition');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [academicYear] = useState(new Date().getFullYear().toString());
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  const feeTypes = [
    { value: 'tuition', label: 'Tuition Fee', key: 'tuition_fee' },
    { value: 'transport', label: 'Transport Fee', key: 'transport_fee' },
    { value: 'uniform', label: 'Uniform Fee', key: 'uniform_fee' },
    { value: 'exam', label: 'Exam Fee', key: 'exam_fee' },
    { value: 'activity', label: 'Activity Fee', key: 'activity_fee' }
  ];

  const paymentSteps = [
    { number: 1, title: 'Search Student', description: 'Enter email or phone number to find the student' },
    { number: 2, title: 'Select Fee Type', description: 'Choose the type of fee you want to pay' },
    { number: 3, title: 'Make Payment', description: 'Pay securely via PhonePe/UPI/Cards' },
    { number: 4, title: 'Upload Receipt', description: 'Upload payment screenshot as proof' },
    { number: 5, title: 'Get Confirmation', description: 'Receive confirmation via email' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError('Please enter email or phone number');
      return;
    }

    setLoading(true);
    setError('');
    setStudentData(null);
    setFeeStructure(null);

    try {
      const payload = searchType === 'email' 
        ? { email: searchValue } 
        : { phone: searchValue };

      const response = await axiosInstance.post('/auth/lookup-student', payload);

      if (response.success) {
        setStudentData(response.data);
        if (response.data.student?.class) {
          await fetchFeeStructure(response.data.student.class);
        }
      } else {
        setError(response.message || 'Student not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to find student');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructure = async (className) => {
    try {
      const response = await axiosInstance.get(`/fees/class/${className}`);
      if (response.success) {
        setFeeStructure(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch fee structure:', err);
    }
  };

  const getSelectedFeeAmount = () => {
    if (!feeStructure) return 0;
    const feeType = feeTypes.find(f => f.value === selectedFeeType);
    return feeStructure[feeType?.key] || 0;
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
    }
  };

  const handleManualPayment = async () => {
    if (!paymentScreenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('screenshot', paymentScreenshot);
      formData.append('studentId', studentData.student?.id);
      formData.append('studentName', `${studentData.user?.first_name} ${studentData.user?.last_name}`);
      formData.append('email', studentData.user?.email);
      formData.append('phone', studentData.user?.phone);
      formData.append('amount', getSelectedFeeAmount());
      formData.append('feeType', selectedFeeType);
      formData.append('className', studentData.student?.class || studentData.user?.firstName);
      formData.append('academicYear', academicYear);
      formData.append('notes', `${selectedFeeType} fee payment - Manual verification`);

      const response = await axiosInstance.post('/payments/manual-submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.success) {
        setSuccess('Payment screenshot uploaded successfully! We will verify and confirm shortly.');
        setPaymentScreenshot(null);
        setUploadProgress(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload payment screenshot');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!studentData || !getSelectedFeeAmount()) {
      setError('Please select student and fee type');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const paymentData = {
        studentId: studentData.student?.id,
        studentName: `${studentData.user?.first_name} ${studentData.user?.last_name}`,
        email: studentData.user?.email,
        phone: studentData.user?.phone,
        amount: getSelectedFeeAmount(),
        feeType: selectedFeeType,
        className: studentData.student?.class || studentData.user?.firstName,
        academicYear: academicYear,
        notes: `${selectedFeeType} fee payment`
      };

      const response = await axiosInstance.post('/payments/create-order', paymentData);

      if (response.success && response.data.redirectUrl) {
        setLoading(false);
        window.open(response.data.redirectUrl, '_self');
        setSuccess('Payment page opened in new tab. Please complete your payment there.');
      } else if (response.success && response.data.token) {
        const script = document.createElement('script');
        script.src = 'https://cdn.phonepe.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          if (window.PhonePe) {
            window.PhonePe.Checkout.init({
              token: response.data.token,
              merchantId: 'M23Y40Q4NT1KS_2602191640',
              amount: response.data.amount * 100,
              currency: 'INR',
              merchantOrderId: response.data.orderId,
              callbackUrl: `${window.location.origin}/payment-callback?orderId=${response.data.phonepeOrderId}`,
              publicKey: 'M23Y40Q4NT1KS_2602191640',
            }).then((checkout) => {
              checkout.onSuccess((data) => {
                verifyPayment(response.data.phonepeOrderId);
              }).onError((error) => {
                setError('Payment failed. Please try again.');
                setLoading(false);
              }).redirect();
            });
          }
        };
        document.body.appendChild(script);
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (err) {
      setError(err.message || 'Failed to create payment order');
      setLoading(false);
    }
  };

  const verifyPayment = async (phonepeOrderId) => {
    try {
      const verifyResponse = await axiosInstance.post('/payments/verify', {
        phonepeOrderId: phonepeOrderId
      });

      if (verifyResponse.success && verifyResponse.data.paymentStatus === 'completed') {
        setSuccess('Payment successful! Receipt will be sent to your email.');
      } else {
        setError('Payment verification failed');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to verify payment');
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-header">
        <h1>Fee Payment Portal</h1>
        <p>Secure online fee payment for Top View Public School</p>
      </div>

      <div className="payment-container">
        {showSteps && (
          <div className="payment-steps-section">
            <div className="steps-header">
              <h2>How to Pay</h2>
              <button className="toggle-steps" onClick={() => setShowSteps(false)}>Hide Steps</button>
            </div>
            <div className="payment-steps">
              {paymentSteps.map((step) => (
                <div key={step.number} className="payment-step">
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="search-section">
          <div className="search-header">
            <h2>Find Student</h2>
            {!showSteps && <button className="show-steps" onClick={() => setShowSteps(true)}>Show Steps</button>}
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                onClick={() => { setSearchType('email'); setSearchValue(''); }}
              >
                By Email
              </button>
              <button
                type="button"
                className={`toggle-btn ${searchType === 'phone' ? 'active' : ''}`}
                onClick={() => { setSearchType('phone'); setSearchValue(''); }}
              >
                By Phone
              </button>
            </div>

            <div className="search-input-group">
              <input
                type={searchType === 'email' ? 'email' : 'tel'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'email' ? 'Enter email address' : 'Enter phone number'}
                maxLength={searchType === 'phone' ? 10 : undefined}
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>

        {studentData && (
          <div className="student-info-section">
            <h2>Student Details</h2>
            <div className="student-card">
              <div className="student-avatar">
                {studentData.user?.first_name?.[0]}{studentData.user?.last_name?.[0]}
              </div>
              <div className="student-details">
                <h3>{studentData.user?.first_name} {studentData.user?.last_name}</h3>
                <p><strong>Email:</strong> {studentData.user?.email}</p>
                <p><strong>Phone:</strong> {studentData.user?.phone}</p>
                {studentData.student && (
                  <>
                    <p><strong>Class:</strong> {studentData.student.class}</p>
                    <p><strong>Roll No:</strong> {studentData.student.roll_number || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {studentData && feeStructure && (
          <div className="fee-section">
            <h2>Select Fee Type</h2>
            <div className="fee-types-grid">
              {feeTypes.map((fee) => (
                <div
                  key={fee.value}
                  className={`fee-type-card ${selectedFeeType === fee.value ? 'selected' : ''}`}
                  onClick={() => setSelectedFeeType(fee.value)}
                >
                  <div className="fee-type-name">{fee.label}</div>
                  <div className="fee-type-amount">
                    ₹{parseFloat(feeStructure[fee.key] || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="summary-row">
                <span>Student Name</span>
                <span>{studentData.user?.first_name} {studentData.user?.last_name}</span>
              </div>
              <div className="summary-row">
                <span>Class</span>
                <span>{studentData.student?.class}</span>
              </div>
              <div className="summary-row">
                <span>Fee Type</span>
                <span>{feeTypes.find(f => f.value === selectedFeeType)?.label}</span>
              </div>
              <div className="summary-row">
                <span>Academic Year</span>
                <span>{academicYear}-{parseInt(academicYear) + 1}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{getSelectedFeeAmount().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="payment-modes">
              <h3>Payment Options</h3>
              <div className="mode-toggle">
                <button 
                  className={`mode-btn ${!manualMode ? 'active' : ''}`}
                  onClick={() => setManualMode(false)}
                >
                  Online Payment
                </button>
                <button 
                  className={`mode-btn ${manualMode ? 'active' : ''}`}
                  onClick={() => setManualMode(true)}
                >
                  Manual Upload
                </button>
              </div>

              {!manualMode ? (
                <button 
                  className="pay-button" 
                  onClick={handlePayment}
                  disabled={loading || !getSelectedFeeAmount()}
                >
                  {loading ? 'Processing...' : `Pay ₹${getSelectedFeeAmount().toLocaleString('en-IN')} via PhonePe`}
                </button>
              ) : (
                <div className="manual-payment-section">
                  <div className="upload-section">
                    <h4>Upload Payment Screenshot</h4>
                    <p className="upload-hint">Take a screenshot of your payment transaction and upload it</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="file-input"
                    />
                    {paymentScreenshot && (
                      <div className="file-preview">
                        <span>Selected: {paymentScreenshot.name}</span>
                      </div>
                    )}
                    {uploadProgress > 0 && (
                      <div className="upload-progress">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="pay-button manual" 
                    onClick={handleManualPayment}
                    disabled={loading || !paymentScreenshot}
                  >
                    {loading ? 'Uploading...' : 'Submit Payment Proof'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!studentData && !error && (
          <div className="payment-info">
            <div className="info-card">
              <div className="info-icon">📱</div>
              <h3>Online Payment</h3>
              <p>Pay instantly using PhonePe, UPI, Cards, or Net Banking</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📧</div>
              <h3>Instant Confirmation</h3>
              <p>Get payment confirmation via email immediately</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3>Secure Payment</h3>
              <p>100% secure payment with PhonePe</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
