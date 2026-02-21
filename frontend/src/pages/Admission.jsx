import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import './Admission.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Admission = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    fatherOccupation: '',
    fatherContact: '',
    motherName: '',
    motherOccupation: '',
    motherContact: '',
    whatsappContact: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    religion: '',
    caste: '',
    aadhaarNumber: '',
    bloodGroup: '',
    correspondingAddress: '',
    correspondingDistrict: '',
    correspondingPin: '',
    correspondingState: '',
    permanentAddress: '',
    permanentDistrict: '',
    permanentPin: '',
    permanentState: '',
    admissionClass: '',
    academicYear: new Date().getFullYear().toString()
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [feeStructure, setFeeStructure] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sameAsCorrespondence, setSameAsCorrespondence] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [pollingStatus, setPollingStatus] = useState('idle'); // idle, checking, success, failed

  // Payment polling function
  const startPaymentPolling = async (orderId, maxAttempts = 15) => {
    let attempts = 0;
    setPollingStatus('checking');
    
    const checkStatus = async () => {
      try {
        const verifyResponse = await axiosInstance.post('/payments/verify', {
          merchantOrderId: orderId
        }, { timeout: 10000 });

        console.log('Payment verify response:', verifyResponse);

        if (verifyResponse.success) {
          if (verifyResponse.data.paymentStatus === 'completed') {
            // Submit admission form with payment ID after successful payment
            try {
              await submitAdmissionForm(orderId);
            } catch (err) {
              console.error('Error submitting admission after payment:', err);
            }
            
            // Fetch admission data and THEN show success
            await fetchAdmissionData(orderId);
            
            setPollingStatus('success');
            setPaymentSuccess(true);
            setSuccess('Payment successful! Your admission form has been submitted.');
            setLoading(false);
            localStorage.removeItem('pendingPaymentOrderId');
            return;
          } else if (verifyResponse.data.paymentStatus === 'failed') {
            setError('Payment failed. Please try again.');
            setPollingStatus('failed');
            setLoading(false);
            localStorage.removeItem('pendingPaymentOrderId');
            return;
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setError('Payment verification timed out. Please check your payment status manually.');
          setPollingStatus('failed');
          setLoading(false);
          localStorage.removeItem('pendingPaymentOrderId');
          return;
        }

        // Poll every 5 seconds
        setTimeout(checkStatus, 5000);
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError('Payment verification failed. Please check your payment status manually.');
          setPollingStatus('failed');
          setLoading(false);
          localStorage.removeItem('pendingPaymentOrderId');
          return;
        }
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  };

  // Fetch admission data from backend
  const fetchAdmissionData = async (orderIdFromParam = null) => {
    try {
      // Use orderId from parameter first, then fall back to localStorage
      const pendingOrderId = orderIdFromParam || localStorage.getItem('pendingPaymentOrderId');
      
      console.log('=== fetchAdmissionData called ===');
      console.log('orderIdFromParam:', orderIdFromParam);
      console.log('pendingOrderId from localStorage:', pendingOrderId);
      console.log('URL params orderId:', new URLSearchParams(window.location.search).get('orderId'));
      
      // First: try to get from Payments table by phonepe_order_id (most reliable)
      if (pendingOrderId) {
        try {
          console.log('Fetching from payments table with orderId:', pendingOrderId);
          const payResponse = await axiosInstance.get(`/payments/check-phonepe?phonepeOrderId=${pendingOrderId}`);
          console.log('Payments table response:', payResponse.data);
          if (payResponse.success && payResponse.data) {
            const payData = payResponse.data;
            const updatedFormData = {
              ...formData,
              studentName: payData.student_name || formData.studentName,
              email: payData.parent_email || formData.email,
              admissionClass: payData.class || formData.admissionClass,
              academicYear: payData.academic_year || formData.academicYear
            };
            setFormData(updatedFormData);
            localStorage.setItem('admissionFormData', JSON.stringify(updatedFormData));
            setOrderId(pendingOrderId);
            console.log('Form data updated from payments table - SUCCESS', updatedFormData);
            return;
          }
        } catch (err) {
          console.error('Error fetching from payments table:', err.response?.data || err.message);
        }
      }
      
      console.log('No pendingOrderId found, skipping all fetches');
    } catch (err) {
      console.error('Error fetching admission data:', err);
    }
  };

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('admissionFormData');
    const savedOrderId = localStorage.getItem('admissionOrderId');
    const pendingOrderId = localStorage.getItem('pendingPaymentOrderId');
    
    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    if (savedOrderId) {
      setOrderId(savedOrderId);
    }
    
    // Check URL for orderId (after redirect from PhonePe)
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrderId = urlParams.get('orderId');
    const orderIdToCheck = pendingOrderId || urlOrderId;
    
    if (orderIdToCheck) {
      console.log('Found orderId to check:', orderIdToCheck);
      localStorage.setItem('pendingPaymentOrderId', orderIdToCheck);
      setLoading(true);
      setSuccess('Checking payment status...');
      setPaymentStep(true);
      setOrderId(orderIdToCheck);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      startPaymentPolling(orderIdToCheck, 15);
    } else {
      // Try to fetch admission data from backend if no localStorage data
      fetchAdmissionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear localStorage on component unmount only (not on state change)
  useEffect(() => {
    return () => {
      localStorage.removeItem('admissionFormData');
      localStorage.removeItem('admissionOrderId');
      localStorage.removeItem('pendingPaymentOrderId');
    };
  }, []);

  const classes = ['NUR', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Other'];
  const castes = ['General', 'OBC', 'SC', 'ST', 'Other'];

  useEffect(() => {
    if (formData.admissionClass) {
      fetchFeeStructure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.admissionClass]);

  const fetchFeeStructure = async () => {
    try {
      const response = await axiosInstance.get(`/fees/class/${formData.admissionClass}`);
      if (response.success) {
        setFeeStructure(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch fee structure:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSameAddressChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsCorrespondence(isChecked);
    
    if (isChecked) {
      setFormData({
        ...formData,
        permanentAddress: formData.correspondingAddress,
        permanentDistrict: formData.correspondingDistrict,
        permanentPin: formData.correspondingPin,
        permanentState: formData.correspondingState
      });
    } else {
      setFormData({
        ...formData,
        permanentAddress: '',
        permanentDistrict: '',
        permanentPin: '',
        permanentState: ''
      });
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.studentName || !formData.dateOfBirth || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
    }
    if (step === 2) {
      if (!formData.correspondingAddress || !formData.correspondingDistrict) {
        setError('Please fill in address details');
        return;
      }
    }
    setError('');
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  // eslint-disable-next-line no-unused-vars
  const handleProceedToPayment = () => {
    console.log('Proceed to Payment clicked', formData.admissionClass);
    if (!formData.admissionClass) {
      setError('Please select admission class');
      return;
    }
    setError('');
    setPaymentStep(true);
  };

  const handlePayment = async () => {
    if (!feeStructure) return;

    setLoading(true);
    setError('');

    try {
      const paymentData = {
        studentName: formData.studentName,
        email: formData.email,
        phone: formData.fatherContact || formData.motherContact,
        amount: parseFloat(feeStructure.total_fee),
        feeType: 'admission',
        className: formData.admissionClass,
        academicYear: formData.academicYear,
        notes: 'Admission Fee'
      };

      console.log('Creating PhonePe payment order...');
      const response = await axiosInstance.post('/payments/create-order', paymentData);
      console.log('PhonePe response:', response);
      console.log('Redirect URL:', response.data?.redirectUrl);

      const paymentOrderId = response.data.phonepeOrderId || response.data.orderId;
      
      // Save form data and order ID to localStorage FIRST
      localStorage.setItem('admissionFormData', JSON.stringify(formData));
      if (paymentOrderId) {
        localStorage.setItem('admissionOrderId', paymentOrderId);
        localStorage.setItem('pendingPaymentOrderId', paymentOrderId);
        setOrderId(paymentOrderId);
      }

      if (response.success && response.data.redirectUrl) {
        console.log('Redirecting to PhonePe payment page:', response.data.redirectUrl);
        // Save state to localStorage BEFORE navigating away
        localStorage.setItem('admissionFormData', JSON.stringify(formData));
        localStorage.setItem('pendingPaymentOrderId', paymentOrderId);
        // Redirect to payment page - PhonePe will return to callback URL
        window.location.href = response.data.redirectUrl;
      } else if (response.success && response.data.token) {
        console.log('Opening PhonePe checkout with token...');
        
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
                console.log('Payment success:', data);
                startPaymentPolling(response.data.phonepeOrderId);
              }).onError((error) => {
                console.error('Payment error:', error);
                setError('Payment failed. Please try again.');
                setLoading(false);
                setPollingStatus('failed');
              }).redirect();
            });
          } else {
            throw new Error('PhonePe SDK not loaded');
          }
        };
        document.body.appendChild(script);
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const submitAdmissionForm = async (paymentId = null) => {
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });
      if (photo) {
        form.append('photo', photo);
      }
      if (paymentId) {
        form.append('paymentId', paymentId);
      }

      const response = await axiosInstance.post('/admission/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPaymentSuccess(true);
      setSuccess(`Admission form submitted successfully! Form Number: ${response.data.data?.form_number || 'Generated'}`);
    } catch (err) {
      setError(err.message || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await submitAdmissionForm();
    } catch (err) {
      setError(err.message || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="admission-container">
        <div className="success-page">
          <div className="success-icon">✓</div>
          <h1>Admission Submitted Successfully!</h1>
          <p>{success}</p>
          <p className="success-note">A confirmation email has been sent to {formData.email}</p>
          
          <div className="payment-receipt-preview">
            <h3>Admission Details</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Student Name:</span>
                <span>{formData.studentName}</span>
              </div>
              {formData.dateOfBirth && (
                <div className="receipt-row">
                  <span>Date of Birth:</span>
                  <span>{formData.dateOfBirth}</span>
                </div>
              )}
              {formData.gender && (
                <div className="receipt-row">
                  <span>Gender:</span>
                  <span>{formData.gender}</span>
                </div>
              )}
              {formData.bloodGroup && (
                <div className="receipt-row">
                  <span>Blood Group:</span>
                  <span>{formData.bloodGroup}</span>
                </div>
              )}
              {formData.email && (
                <div className="receipt-row">
                  <span>Email:</span>
                  <span>{formData.email}</span>
                </div>
              )}
              {formData.correspondingAddress && (
                <div className="receipt-row">
                  <span>Address:</span>
                  <span>{formData.correspondingAddress}, {formData.correspondingDistrict || ''} - {formData.correspondingPin || ''}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>Class:</span>
                <span>{formData.admissionClass}</span>
              </div>
              <div className="receipt-row">
                <span>Academic Year:</span>
                <span>{formData.academicYear || 'N/A'}</span>
              </div>
            </div>

            <h3 style={{marginTop: '30px'}}>Payment Details</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Fee Type:</span>
                <span>Admission Fee</span>
              </div>
              <div className="receipt-row">
                <span>Amount Paid:</span>
                <span>₹{feeStructure?.total_fee || '30,000'}</span>
              </div>
            </div>
             
            <div className="receipt-actions">
              <a 
                href={`${API_URL}/payments/receipt/new?studentName=${encodeURIComponent(formData.studentName)}&class=${formData.admissionClass}&amount=${feeStructure?.total_fee || 30000}&feeType=admission&transactionId=${orderId}`}
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
          </div>
          
          <a href="/dashboard" className="btn-home">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  if (paymentStep && feeStructure) {
    return (
      <div className="admission-container">
        <div className="admission-header">
          <h1>Complete Payment</h1>
          <p>Pay admission fee to complete your application</p>
        </div>

        <div className="payment-summary-card">
          <h2>Admission Fee Details</h2>
          
          <div className="fee-breakdown">
            <div className="fee-row">
              <span>Class Applied</span>
              <span>Class {formData.admissionClass}</span>
            </div>
            <div className="fee-row">
              <span>Academic Year</span>
              <span>{formData.academicYear}-{parseInt(formData.academicYear) + 1}</span>
            </div>
            <div className="fee-row">
              <span>Student Name</span>
              <span>{formData.studentName}</span>
            </div>
          </div>

          <div className="fee-total">
            <span>Total Admission Fee</span>
            <span className="amount">₹{parseFloat(feeStructure.total_fee).toLocaleString('en-IN')}</span>
          </div>

          {pollingStatus === 'checking' && (
            <div className="polling-indicator">
              <div className="spinner"></div>
              <p>Waiting for payment confirmation...</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && !paymentSuccess && <div className="success-message">{success}</div>}

          {/* Show success receipt after payment completed */}
          {pollingStatus === 'success' && paymentSuccess && (
            <div className="payment-success-receipt">
              <div className="success-icon">✓</div>
              <h4>Payment Successful!</h4>
              <div className="success-details">
                <p><strong>Student Name:</strong> {formData.studentName}</p>
                <p><strong>Class:</strong> {formData.admissionClass}</p>
                <p><strong>Amount Paid:</strong> ₹{parseFloat(feeStructure?.total_fee || 0).toLocaleString('en-IN')}</p>
                <p><strong>Order ID:</strong> {orderId}</p>
              </div>
              <div className="receipt-actions">
                <a 
                  href={`${API_URL}/payments/receipt/new?studentName=${encodeURIComponent(formData.studentName)}&class=${formData.admissionClass}&amount=${feeStructure?.total_fee || 30000}&feeType=admission&transactionId=${orderId}`}
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
                className="go-dashboard-btn"
                onClick={() => {
                  localStorage.removeItem('pendingPaymentOrderId');
                  localStorage.removeItem('admissionFormData');
                  localStorage.removeItem('admissionOrderId');
                  window.location.href = '/dashboard';
                }}
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Show manual check button if polling timed out */}
          {pollingStatus === 'failed' && (
            <div className="payment-check-manual">
              <p>Having trouble? Click below to check payment status manually.</p>
              <button 
                className="check-status-btn"
                onClick={() => {
                  setPollingStatus('idle');
                  setError('');
                  setPaymentStep(false);
                }}
              >
                🔄 Check Status & Try Again
              </button>
            </div>
          )}

          {pollingStatus !== 'checking' && pollingStatus !== 'success' && (
            <button 
              className="pay-button" 
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${parseFloat(feeStructure.total_fee).toLocaleString('en-IN')}`}
            </button>
          )}

          {(pollingStatus === 'checking' || loading) && (
            <button 
              className="back-button"
              onClick={() => {
                localStorage.removeItem('pendingPaymentOrderId');
                setPaymentStep(false);
                setPollingStatus('idle');
              }}
            >
              Cancel & Go Back
            </button>
          )}

          {pollingStatus !== 'checking' && !loading && !paymentSuccess && (
            <button 
              className="back-button"
              onClick={() => setPaymentStep(false)}
            >
              Back to Form
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admission-container">
      <div className="admission-header">
        <h1>Admission Form</h1>
        <p>Fill out the form to apply for admission</p>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admission-form">
        <div className="steps">
          <div className={`step ${step === 1 ? 'active' : ''}`}>
            <span>1</span> Student Info
          </div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <span>2</span> Address Info
          </div>
          <div className={`step ${step === 3 ? 'active' : ''}`}>
            <span>3</span> Class & Pay
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-step">
              <h3>Student & Parent Information</h3>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Student Name *</label>
                  <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Religion</label>
                  <select name="religion" value={formData.religion} onChange={handleChange}>
                    <option value="">Select Religion</option>
                    {religions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Caste</label>
                  <select name="caste" value={formData.caste} onChange={handleChange}>
                    <option value="">Select Caste</option>
                    {castes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Aadhaar Number</label>
                  <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} maxLength="12" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <h3 style={{ marginTop: '30px' }}>Father's Information</h3>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Father Name</label>
                  <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Father Occupation</label>
                  <input type="text" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Father Contact</label>
                  <input type="tel" name="fatherContact" value={formData.fatherContact} onChange={handleChange} maxLength="10" />
                </div>
              </div>

              <h3 style={{ marginTop: '30px' }}>Mother's Information</h3>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Mother Name</label>
                  <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Mother Occupation</label>
                  <input type="text" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Mother Contact</label>
                  <input type="tel" name="motherContact" value={formData.motherContact} onChange={handleChange} maxLength="10" />
                </div>
                <div className="form-group">
                  <label>WhatsApp Contact</label>
                  <input type="tel" name="whatsappContact" value={formData.whatsappContact} onChange={handleChange} maxLength="10" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h3>Corresponding Address</h3>
              <div className="form-group">
                <label>Address</label>
                <textarea name="correspondingAddress" value={formData.correspondingAddress} onChange={handleChange} rows="3"></textarea>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>District</label>
                  <input type="text" name="correspondingDistrict" value={formData.correspondingDistrict} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>PIN Code</label>
                  <input type="text" name="correspondingPin" value={formData.correspondingPin} onChange={handleChange} maxLength="6" />
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>State</label>
                  <input type="text" name="correspondingState" value={formData.correspondingState} onChange={handleChange} />
                </div>
              </div>

              <h3 style={{ marginTop: '30px' }}>Permanent Address</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={sameAsCorrespondence}
                    onChange={handleSameAddressChange}
                  />
                  Same as Correspondence Address
                </label>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea 
                  name="permanentAddress" 
                  value={formData.permanentAddress} 
                  onChange={handleChange} 
                  rows="3"
                  disabled={sameAsCorrespondence}
                ></textarea>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>District</label>
                  <input 
                    type="text" 
                    name="permanentDistrict" 
                    value={formData.permanentDistrict} 
                    onChange={handleChange}
                    disabled={sameAsCorrespondence}
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code</label>
                  <input 
                    type="text" 
                    name="permanentPin" 
                    value={formData.permanentPin} 
                    onChange={handleChange} 
                    maxLength="6"
                    disabled={sameAsCorrespondence}
                  />
                </div>
              </div>

              <div className="form-group-half">
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    name="permanentState" 
                    value={formData.permanentState} 
                    onChange={handleChange}
                    disabled={sameAsCorrespondence}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h3>Admission Details</h3>

              <div className="form-group-half">
                <div className="form-group">
                  <label>Admission for Class *</label>
                  <select name="admissionClass" value={formData.admissionClass} onChange={handleChange} required>
                    <option value="">Select Class</option>
                    {classes.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Academic Year</label>
                  <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} />
                </div>
              </div>

              {feeStructure && (
                <div className="fee-preview">
                  <h4>Fee Structure for Class {formData.admissionClass}</h4>
                  <div className="fee-items">
                    <div className="fee-item"><span>Tuition Fee</span><span>₹{parseFloat(feeStructure.tuition_fee).toLocaleString('en-IN')}</span></div>
                    {feeStructure.transport_fee > 0 && <div className="fee-item"><span>Transport Fee</span><span>₹{parseFloat(feeStructure.transport_fee).toLocaleString('en-IN')}</span></div>}
                    {feeStructure.uniform_fee > 0 && <div className="fee-item"><span>Uniform Fee</span><span>₹{parseFloat(feeStructure.uniform_fee).toLocaleString('en-IN')}</span></div>}
                    {feeStructure.exam_fee > 0 && <div className="fee-item"><span>Exam Fee</span><span>₹{parseFloat(feeStructure.exam_fee).toLocaleString('en-IN')}</span></div>}
                    {feeStructure.activity_fee > 0 && <div className="fee-item"><span>Activity Fee</span><span>₹{parseFloat(feeStructure.activity_fee).toLocaleString('en-IN')}</span></div>}
                    <div className="fee-item total"><span>Total</span><span>₹{parseFloat(feeStructure.total_fee).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Upload Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  I hereby declare that all the information provided is true and correct
                </label>
              </div>
            </div>
          )}

          <div className="form-buttons">
            {step > 1 && <button type="button" onClick={handlePrev} className="btn-secondary">Previous</button>}
            {step < 3 && <button type="button" onClick={handleNext} className="btn-primary">Next</button>}
            {step === 3 && (
              <button 
                type="button" 
                onClick={() => {
                  console.log('Button clicked, admissionClass:', formData.admissionClass);
                  if (!formData.admissionClass) {
                    setError('Please select admission class');
                    return;
                  }
                  if (!formData.studentName || !formData.email) {
                    setError('Please fill in student name and email');
                    return;
                  }
                  setError('');
                  setPaymentStep(true);
                }} 
                className="btn-primary btn-pay"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Admission;
