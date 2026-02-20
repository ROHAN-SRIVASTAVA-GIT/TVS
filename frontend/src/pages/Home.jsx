import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import axiosInstance from '../api/axios';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const features = [
    {
      title: 'Expert Faculty',
      description: 'Experienced and qualified teachers dedicated to student success',
      icon: '👨‍🏫'
    },
    {
      title: 'Modern Facilities',
      description: 'State-of-the-art classrooms, labs, and sports facilities',
      icon: '🏫'
    },
    {
      title: 'Holistic Development',
      description: 'Focus on academics, sports, arts, and personality development',
      icon: '🌟'
    },
    {
      title: 'Safe Environment',
      description: 'Safe, secure, and nurturing environment for all students',
      icon: '🔒'
    }
  ];

  const classes = ['NUR', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const handleReceiptSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError('Please enter a value to search');
      return;
    }

    setLoading(true);
    setError('');
    setReceipts([]);
    setSelectedPayment(null);
    setShowPaymentPreview(false);

    try {
      let queryParams = '';
      if (searchType === 'phone') {
        queryParams = `?phone=${encodeURIComponent(searchValue)}`;
      } else if (searchType === 'email') {
        queryParams = `?email=${encodeURIComponent(searchValue)}`;
      } else if (searchType === 'order') {
        const response = await axiosInstance.get(`/payments/receipt/${searchValue}`);
        if (response.success) {
          setReceipts([response.data]);
          setShowReceipts(true);
        } else {
          setError('No receipt found');
        }
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get(`/payments/history/lookup${queryParams}`);
      
      if (response.success && response.data.payments && response.data.payments.length > 0) {
        setReceipts(response.data.payments);
        setShowReceipts(true);
      } else {
        setError('No receipts found for the given details');
      }
    } catch (err) {
      setError('Failed to search receipts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedWithPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentPreview(true);
    setPaymentSuccess('');
    setPaymentError('');
  };

  const initiatePayment = async () => {
    if (!selectedPayment) return;

    setProcessingPayment(true);
    setPaymentError('');

    try {
      const paymentData = {
        studentId: selectedPayment.student_id,
        studentName: selectedPayment.student_name,
        email: selectedPayment.parent_email,
        phone: selectedPayment.parent_phone,
        amount: selectedPayment.amount,
        feeType: selectedPayment.fee_type,
        className: selectedPayment.class,
        academicYear: selectedPayment.academic_year,
        notes: `${selectedPayment.fee_type} fee payment`
      };

      const response = await axiosInstance.post('/payments/create-order', paymentData);

      if (response.success && response.data.redirectUrl) {
        setProcessingPayment(false);
        setPaymentSuccess('Opening payment page...');
        window.open(response.data.redirectUrl, '_blank');
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
                setPaymentError('Payment failed. Please try again.');
                setProcessingPayment(false);
              }).redirect();
            });
          }
        };
        document.body.appendChild(script);
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (err) {
      setPaymentError(err.message || 'Failed to create payment order');
      setProcessingPayment(false);
    }
  };

  const verifyPayment = async (phonepeOrderId) => {
    try {
      const verifyResponse = await axiosInstance.post('/payments/verify', {
        phonepeOrderId: phonepeOrderId
      });

      if (verifyResponse.success && verifyResponse.data.paymentStatus === 'completed') {
        setPaymentSuccess('Payment successful! Receipt will be sent to your email.');
        setShowPaymentPreview(false);
        handleReceiptSearch({ preventDefault: () => {} });
      } else {
        setPaymentError('Payment verification failed');
      }
      setProcessingPayment(false);
    } catch (err) {
      setPaymentError('Failed to verify payment');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="home">
      <HeroSection />

      <section className="features">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="classes-offered">
        <div className="container">
          <h2>Classes Offered</h2>
          <div className="classes-grid">
            {classes.map((cls) => (
              <div key={cls} className="class-card">
                <div className="class-name">Class {cls}</div>
                <div className="class-info">Age Group</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="statistics">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>500+</h3>
              <p>Students</p>
            </div>
            <div className="stat-card">
              <h3>50+</h3>
              <p>Faculty Members</p>
            </div>
            <div className="stat-card">
              <h3>25+</h3>
              <p>Years of Excellence</p>
            </div>
            <div className="stat-card">
              <h3>95%</h3>
              <p>Pass Rate</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Join Our School?</h2>
          <p>Start your journey to success with Top View Public School</p>
          <a href="/admission" className="cta-button">Apply Now</a>
        </div>
      </section>

      <section className="receipt-download-section">
        <div className="container">
          <h2>Download Receipt</h2>
          <p>Enter your details to search and download payment receipts</p>
          
          <form onSubmit={handleReceiptSearch} className="receipt-search-form">
            <div className="search-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${searchType === 'phone' ? 'active' : ''}`}
                onClick={() => { setSearchType('phone'); setSearchValue(''); setShowReceipts(false); }}
              >
                By Phone
              </button>
              <button
                type="button"
                className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                onClick={() => { setSearchType('email'); setSearchValue(''); setShowReceipts(false); }}
              >
                By Email
              </button>
              <button
                type="button"
                className={`toggle-btn ${searchType === 'order' ? 'active' : ''}`}
                onClick={() => { setSearchType('order'); setSearchValue(''); setShowReceipts(false); }}
              >
                By Order ID
              </button>
            </div>

            <div className="search-input-group">
              <input
                type={searchType === 'email' ? 'email' : 'text'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === 'phone' ? 'Enter phone number' :
                  searchType === 'email' ? 'Enter email address' :
                  'Enter order/transaction ID'
                }
                maxLength={searchType === 'phone' ? 10 : undefined}
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && <div className="error-message">{error}</div>}

          {showReceipts && receipts.length > 0 && (
            <div className="receipts-results">
              <h3>Found {receipts.length} Payment(s)</h3>
              <div className="receipts-list">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="receipt-card">
                    <div className="receipt-info">
                      <p><strong>Receipt No:</strong> TVPS/P/{String(receipt.id).padStart(6, '0')}</p>
                      <p><strong>Student Name:</strong> {receipt.student_name}</p>
                      <p><strong>Class:</strong> {receipt.class || 'N/A'}</p>
                      <p><strong>Amount:</strong> ₹{parseFloat(receipt.amount).toLocaleString('en-IN')}</p>
                      <p><strong>Fee Type:</strong> {(receipt.fee_type || '').charAt(0).toUpperCase() + (receipt.fee_type || '').slice(1)} Fee</p>
                      <p><strong>Date:</strong> {new Date(receipt.created_at).toLocaleDateString('en-IN')}</p>
                      <p><strong>Status:</strong> <span className={`status ${receipt.status}`}>{receipt.status}</span></p>
                    </div>
                    <div className="receipt-actions">
                      {(receipt.status === 'pending' || receipt.status === 'failed') && (
                        <button 
                          className="proceed-pay-btn"
                          onClick={() => proceedWithPayment(receipt)}
                        >
                          Pay Now
                        </button>
                      )}
                      {receipt.status === 'completed' && (
                        <button 
                          className="download-btn"
                          onClick={() => window.open(`${API_URL}/payments/receipt/${receipt.id}`, '_blank')}
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showPaymentPreview && selectedPayment && (
            <div className="payment-preview-modal">
              <div className="payment-preview-content">
                <h3>Payment Preview</h3>
                <div className="preview-details">
                  <div className="preview-row">
                    <span>Receipt Number</span>
                    <span>TVPS/P/{String(selectedPayment.id).padStart(6, '0')}</span>
                  </div>
                  <div className="preview-row">
                    <span>Student Name</span>
                    <span>{selectedPayment.student_name}</span>
                  </div>
                  <div className="preview-row">
                    <span>Class</span>
                    <span>{selectedPayment.class || 'N/A'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Fee Type</span>
                    <span>{(selectedPayment.fee_type || '').charAt(0).toUpperCase() + (selectedPayment.fee_type || '').slice(1)} Fee</span>
                  </div>
                  <div className="preview-row">
                    <span>Academic Year</span>
                    <span>{selectedPayment.academic_year || 'N/A'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Email</span>
                    <span>{selectedPayment.parent_email || 'N/A'}</span>
                  </div>
                  <div className="preview-row">
                    <span>Phone</span>
                    <span>{selectedPayment.parent_phone || 'N/A'}</span>
                  </div>
                  <div className="preview-row total">
                    <span>Total Amount</span>
                    <span>₹{parseFloat(selectedPayment.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                {paymentError && <div className="error-message">{paymentError}</div>}
                {paymentSuccess && <div className="success-message">{paymentSuccess}</div>}
                
                <div className="preview-actions">
                  <button 
                    className="proceed-pay-btn"
                    onClick={initiatePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? 'Processing...' : `Pay ₹${parseFloat(selectedPayment.amount).toLocaleString('en-IN')} via PhonePe`}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => { setShowPaymentPreview(false); setSelectedPayment(null); setPaymentError(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
