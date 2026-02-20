import React, { useState, useEffect } from 'react';
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
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [receiptAccessToken, setReceiptAccessToken] = useState('');
  const [pendingReceiptId, setPendingReceiptId] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState('idle');

  // Check for pending payment on page load
  useEffect(() => {
    // First check localStorage
    const pendingOrderId = localStorage.getItem('pendingPaymentOrderId');
    
    // Also check URL for orderId (after redirect from PhonePe)
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrderId = urlParams.get('orderId');
    const orderIdToCheck = pendingOrderId || urlOrderId;
    
    if (orderIdToCheck) {
      console.log('Found pending payment order:', orderIdToCheck);
      // Clear URL params
      if (urlOrderId) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      // Start polling but don't auto-open modal
      setShowPaymentPreview(true);
      setProcessingPayment(true);
      setPaymentSuccess('Checking payment status...');
      setPollingStatus('checking');
      startPaymentPolling(orderIdToCheck, 15);
    }
  }, []);

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

  const classes = [
    { name: 'NUR', age: '2-3 years' },
    { name: 'LKG', age: '3-4 years' },
    { name: 'UKG', age: '4-5 years' },
    { name: 'I', age: '5-6 years' },
    { name: 'II', age: '6-7 years' },
    { name: 'III', age: '7-8 years' },
    { name: 'IV', age: '8-9 years' },
    { name: 'V', age: '9-10 years' },
    { name: 'VI', age: '10-11 years' },
    { name: 'VII', age: '11-12 years' },
    { name: 'VIII', age: '12-13 years' }
  ];

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

  const initiateReceiptDownload = (receipt) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      window.open(`${API_URL}/payments/receipt/${receipt.id}`, '_self');
    } else {
      setPendingReceiptId(receipt.id);
      setShowOTPModal(true);
      setOtpStep(1);
      setOtp('');
      setError('');
    }
  };

  const sendReceiptOTP = async () => {
    let email = '';
    if (searchType === 'email') {
      email = searchValue;
    } else if (searchType === 'phone' && receipts.length > 0) {
      email = receipts[0].parent_email;
    } else if (searchType === 'order' && selectedPayment) {
      email = selectedPayment.parent_email;
    }

    if (!email) {
      setError('Email is required for OTP verification. Please search by email first.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/otp/send', {
        email: email,
        purpose: 'receipt'
      });
      
      setOtpStep(2);
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
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyReceiptOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }

    let email = '';
    if (searchType === 'email') {
      email = searchValue;
    } else if (searchType === 'phone' && receipts.length > 0) {
      email = receipts[0].parent_email;
    } else if (searchType === 'order' && selectedPayment) {
      email = selectedPayment.parent_email;
    }

    setOtpLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/otp/verify', {
        email: email,
        otp,
        purpose: 'receipt'
      });

      if (response.success) {
        setReceiptAccessToken(response.data.verificationToken);
        setShowOTPModal(false);
        if (pendingReceiptId) {
          window.open(`${API_URL}/payments/receipt/${pendingReceiptId}`, '_self');
        }
        setPendingReceiptId(null);
        setOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const [success, setSuccess] = useState('');

  const proceedWithPayment = (payment) => {
    console.log('proceedWithPayment called with payment ID:', payment.id, 'status:', payment.status);
    
    // Always show modal first with loading state
    setSelectedPayment(payment);
    setShowPaymentPreview(true);
    setPaymentError('');
    setPaymentSuccess('Loading payment details...');
    setPollingStatus('checking');
    setProcessingPayment(true);
    
    // Then check the current status from database
    checkPaymentStatusFromDB(payment.id, payment);
  };

  // Check payment status from database
  const checkPaymentStatusFromDB = async (paymentId, originalPayment) => {
    try {
      const response = await axiosInstance.get(`/payments/status/${paymentId}`);
      console.log('Payment status from DB:', response.data);

      if (response.success && response.data.data) {
        const dbPayment = response.data.data;
        
        // Update selected payment with fresh data
        setSelectedPayment({ ...originalPayment, ...dbPayment });

        if (dbPayment.status === 'completed') {
          // Payment is completed, show success
          setPaymentSuccess('Payment completed successfully!');
          setPollingStatus('success');
          setProcessingPayment(false);
          
          // Refresh receipts
          handleReceiptSearch({ preventDefault: () => {} });
        } else if (dbPayment.status === 'pending') {
          // Payment still pending, check if there's an order ID
          const orderId = dbPayment.phonepe_order_id || dbPayment.razorpay_order_id || dbPayment.transaction_id;
          
          if (orderId) {
            // Has order ID, check with PhonePe
            setPaymentSuccess('Checking payment with provider...');
            startPaymentPolling(orderId, 15);
          } else {
            // No order ID yet, show the Pay Now button
            setPaymentSuccess('');
            setPollingStatus('idle');
            setProcessingPayment(false);
          }
        } else if (dbPayment.status === 'failed') {
          // Payment failed, allow retry
          setPaymentError('Previous payment failed. You can try again.');
          setPollingStatus('idle');
          setProcessingPayment(false);
        } else {
          setPaymentSuccess('');
          setPollingStatus('idle');
          setProcessingPayment(false);
        }
      } else {
        setPaymentError('Could not check payment status');
        setPollingStatus('idle');
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setPaymentError('Error checking payment status');
      setPollingStatus('idle');
      setProcessingPayment(false);
    }
  };

  const initiatePayment = async () => {
    if (!selectedPayment) return;

    // First, check if there's an existing order ID
    const existingOrderId = selectedPayment.phonepe_order_id || selectedPayment.order_id || selectedPayment.razorpay_order_id;
    
    if (existingOrderId) {
      // Check PhonePe status first
      setProcessingPayment(true);
      setPaymentError('');
      setPollingStatus('checking');
      setPaymentSuccess('Checking payment status with provider...');

      try {
        const verifyResponse = await axiosInstance.post('/payments/verify', {
          merchantOrderId: existingOrderId
        }, { timeout: 15000 });

        console.log('PhonePe status check:', verifyResponse);

        if (verifyResponse.success && verifyResponse.data.paymentStatus === 'completed') {
          // Payment already completed
          setPaymentSuccess('Payment already completed!');
          setPollingStatus('success');
          setProcessingPayment(false);
          handleReceiptSearch({ preventDefault: () => {} });
          return;
        } else if (verifyResponse.success && verifyResponse.data.paymentStatus === 'failed') {
          // Payment failed, create new order
          setPaymentSuccess('');
          setPollingStatus('idle');
          setProcessingPayment(false);
          // Continue to create new payment below
        } else {
          // Payment still pending/created - redirect to payment page
          setPaymentSuccess('Redirecting to payment page...');
          
          // Save order ID
          localStorage.setItem('pendingPaymentOrderId', existingOrderId);
          setCurrentOrderId(existingOrderId);
          
          // Redirect to PhonePe payment page
          const redirectUrl = `https://mercury-uat.phonepe.com/transact/uat_v3?token=${selectedPayment.phonepe_token || ''}`;
          window.open(redirectUrl, '_self');
          
          // Start polling
          startPaymentPolling(existingOrderId, 15);
          return;
        }
      } catch (err) {
        console.error('Error checking PhonePe status:', err);
        // Continue to create new payment
      }
    }

    // Create new payment order
    setProcessingPayment(true);
    setPaymentError('');
    setPollingStatus('checking');
    setPaymentSuccess('Creating payment...');

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
        // Save order ID and redirect
        const orderId = response.data.orderId;
        const phonepeOrderId = response.data.phonepeOrderId;
        setCurrentOrderId(phonepeOrderId || orderId);
        localStorage.setItem('pendingPaymentOrderId', phonepeOrderId || orderId);
        
        setPaymentSuccess('Redirecting to payment page...');
        
        // Redirect to PhonePe payment page
        window.open(response.data.redirectUrl, '_self');
        
        // Start polling for payment status
        startPaymentPolling(phonepeOrderId || orderId);
        
        setProcessingPayment(false);
      } else if (response.success && response.data.token) {
        // Save order ID
        const orderId = response.data.orderId;
        const phonepeOrderId = response.data.phonepeOrderId;
        setCurrentOrderId(phonepeOrderId || orderId);
        localStorage.setItem('pendingPaymentOrderId', phonepeOrderId || orderId);
        
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
                startPaymentPolling(response.data.phonepeOrderId);
              }).onError((error) => {
                setPaymentError('Payment failed. Please try again.');
                setProcessingPayment(false);
                setPollingStatus('failed');
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
      setPollingStatus('failed');
    }
  };

  // Polling function to check payment status
  const startPaymentPolling = async (orderId, maxAttempts = 15) => {
    let attempts = 0;
    setPaymentSuccess('Waiting for payment completion...');
    setPollingStatus('checking');
    
    const checkStatus = async () => {
      try {
        const verifyResponse = await axiosInstance.post('/payments/verify', {
          merchantOrderId: orderId
        }, { timeout: 10000 });

        console.log('Payment verify response:', verifyResponse);

        if (verifyResponse.success) {
          if (verifyResponse.data.paymentStatus === 'completed') {
            setPaymentSuccess('Payment successful!');
            setPollingStatus('success');
            localStorage.removeItem('pendingPaymentOrderId');
            
            // Refresh receipts and keep the modal open with success
            handleReceiptSearch({ preventDefault: () => {} });
            setProcessingPayment(false);
            return;
          } else if (verifyResponse.data.paymentStatus === 'failed') {
            setPaymentError('Payment failed. Please try again.');
            setPollingStatus('failed');
            setProcessingPayment(false);
            localStorage.removeItem('pendingPaymentOrderId');
            return;
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setPaymentError('Payment verification timed out. Please check your payment status manually.');
          setPollingStatus('failed');
          setProcessingPayment(false);
          localStorage.removeItem('pendingPaymentOrderId');
          return;
        }

        // Continue polling every 3 seconds
        setTimeout(checkStatus, 5000);
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          setPaymentError('Payment verification failed. Please check your payment status manually.');
          setPollingStatus('failed');
          setProcessingPayment(false);
          localStorage.removeItem('pendingPaymentOrderId');
          return;
        }
        setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
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
              <div key={cls.name} className="class-card">
                <div className="class-name">Class {cls.name}</div>
                <div className="class-info">{cls.age}</div>
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
                      {receipt.order_id && <p><strong>Order ID:</strong> {receipt.order_id}</p>}
                    </div>
                    <div className="receipt-actions">
                      {receipt.status === 'pending' && (
                        <button 
                          className="proceed-pay-btn"
                          onClick={() => proceedWithPayment(receipt)}
                        >
                          {(receipt.phonepe_order_id || receipt.order_id || receipt.razorpay_order_id || receipt.transactionId || receipt.transaction_id) ? 'Continue Payment' : 'Pay Now'}
                        </button>
                      )}
                      {receipt.status === 'failed' && (
                        <button 
                          className="proceed-pay-btn"
                          onClick={() => proceedWithPayment(receipt)}
                        >
                          Retry Payment
                        </button>
                      )}
                      {receipt.status === 'completed' && (
                        <button 
                          className="download-btn"
                          onClick={() => initiateReceiptDownload(receipt)}
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
                
                {/* Show complete loading state when checking payment status */}
                {pollingStatus === 'checking' && (
                  <div className="payment-loading-state">
                    <div className="loading-spinner-large"></div>
                    <p className="loading-text">{paymentSuccess || 'Checking payment status...'}</p>
                    <p className="loading-subtext">Please wait while we verify your payment</p>
                  </div>
                )}
                
                {paymentError && <div className="error-message">{paymentError}</div>}
                
                {pollingStatus === 'success' && (
                  <div className="success-message">{paymentSuccess}</div>
                )}
                
                {/* Show success receipt after payment completed */}
                {pollingStatus === 'success' && (
                  <div className="payment-success-receipt">
                    <div className="success-icon">✓</div>
                    <h4>Payment Successful!</h4>
                    <div className="success-details">
                      <p><strong>Student Name:</strong> {selectedPayment?.student_name}</p>
                      <p><strong>Class:</strong> {selectedPayment?.class}</p>
                      <p><strong>Amount Paid:</strong> ₹{parseFloat(selectedPayment?.amount || 0).toLocaleString('en-IN')}</p>
                      <p><strong>Fee Type:</strong> {selectedPayment?.fee_type}</p>
                    </div>
                    <div className="receipt-actions">
                      <a 
                        href={`${API_URL}/payments/receipt/${selectedPayment.id}`}
                        target="_self"
                        rel="noopener noreferrer"
                        className="btn-download-pdf"
                      >
                        📄 Download PDF Receipt
                      </a>
                      <button 
                        onClick={() => window.print()} 
                        className="btn-print"
                      >
                        🖨️ Print Receipt
                      </button>
                    </div>
                    <button 
                      className="close-success-btn"
                      onClick={() => { 
                        setShowPaymentPreview(false); 
                        setSelectedPayment(null); 
                        setPaymentSuccess('');
                        setPollingStatus('idle');
                        handleReceiptSearch({ preventDefault: () => {} });
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
                
                {/* Show payment buttons when not polling or success */}
                {pollingStatus !== 'checking' && pollingStatus !== 'success' && (
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
                )}
                
                {/* Show cancel button during polling */}
                {pollingStatus === 'checking' && (
                  <button 
                    className="cancel-btn"
                    onClick={() => { 
                      localStorage.removeItem('pendingPaymentOrderId'); 
                      setShowPaymentPreview(false); 
                      setSelectedPayment(null); 
                      setPaymentError(''); 
                      setPaymentSuccess('');
                      setPollingStatus('idle');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>{otpStep === 1 ? 'Verify Your Identity' : 'Enter OTP'}</h3>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {otpStep === 1 ? (
              <div className="otp-step-1">
                <p>To download the receipt, we need to verify your identity.</p>
                <p className="otp-info">We'll send an OTP to your email address.</p>
                <button 
                  className="send-otp-btn"
                  onClick={sendReceiptOTP}
                  disabled={otpLoading}
                >
                  {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="otp-step-2">
                <p>Enter the 6-digit OTP sent to your email</p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="otp-input"
                />
                <button 
                  className="verify-otp-btn"
                  onClick={verifyReceiptOTP}
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Download'}
                </button>
                <button 
                  className="resend-btn"
                  onClick={sendReceiptOTP}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            )}

            <button 
              className="close-otp-modal"
              onClick={() => { setShowOTPModal(false); setPendingReceiptId(null); setError(''); setSuccess(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
