import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [admissions, setAdmissions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    occupation: ''
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'admissions', 'payments', 'upload', 'documents', 'security'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load profile picture from localStorage with user-specific key
    if (user?.id) {
      const savedPic = localStorage.getItem(`profilePic_${user.id}`);
      if (savedPic) {
        setProfilePic(savedPic);
      }
    }
    
    // Initialize form data with user info
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        occupation: user.occupation || ''
      });
    }
  }, [user]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size should be less than 5MB');
        return;
      }
      setProfilePic(file);
      setUploadError('');
    }
  };

  const uploadProfilePic = async () => {
    if (!profilePic || !user?.id) return;
    
    setProfilePicLoading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('profilePic', profilePic);
      formData.append('userId', user.id);
      
      // Save to localStorage with user-specific key
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem(`profilePic_${user.id}`, reader.result);
        setUploadSuccess('Profile picture updated successfully!');
        setProfilePicLoading(false);
      };
      reader.readAsDataURL(profilePic);
    } catch (err) {
      setUploadError('Failed to upload profile picture');
      setProfilePicLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const response = await axiosInstance.put('/auth/profile', formData);
      
      if (response.success) {
        setUploadSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Update localStorage user data
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'admissions' || activeTab === 'payments') {
      fetchDataByEmailPhone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (user?.email || user?.phone) {
      fetchDataByEmailPhone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDataByEmailPhone = async () => {
    setLoading(true);
    try {
      const email = user?.email || '';
      const phone = user?.phone || '';
      
      const [admissionRes, paymentRes] = await Promise.all([
        axiosInstance.get(`/admission/lookup?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`),
        axiosInstance.get(`/payments/history/lookup?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`)
      ]);
      
      // Handle both response formats
      const admissionsData = Array.isArray(admissionRes) ? admissionRes : (admissionRes?.data || []);
      const paymentsData = Array.isArray(paymentRes) ? paymentRes : (paymentRes?.payments || paymentRes?.data?.payments || []);
      
      // For Admissions tab: show actual admissions OR completed admission-fee payments
      const completedAdmissions = paymentsData.filter(p => 
        p.fee_type === 'admission' && p.status === 'completed'
      );
      
      setAdmissions([...admissionsData, ...completedAdmissions]);
      setPayments(paymentsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axiosInstance.get('/payments/history');
      setPayments(response.data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size should be less than 5MB');
        return;
      }
      setScreenshot(file);
      setUploadError('');
    }
  };

  const submitScreenshotProof = async () => {
    if (!screenshot) {
      setUploadError('Please select a payment screenshot');
      return;
    }
    if (!selectedPayment) {
      setUploadError('Please select a payment from history');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('paymentId', selectedPayment.id);
      formData.append('studentName', selectedPayment.student_name);
      formData.append('email', user?.email);
      formData.append('phone', user?.phone);

      await axiosInstance.post('/payments/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess('Payment proof uploaded successfully!');
      setScreenshot(null);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUploadLoading(false);
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setPaymentDetails(payment);
  };

  const viewAdmissionDetails = (admission) => {
    setSelectedAdmission(admission);
    setShowAdmissionModal(true);
  };

  const proceedWithPayment = async (payment) => {
    setSelectedPayment(payment);
    setShowPaymentPreview(true);
    setPaymentSuccess('');
    setPaymentError('');
  };

  const initiatePayment = async () => {
    if (!selectedPayment) return;

    setProcessingPayment(true);
    setPaymentError('');
    setPaymentSuccess('Checking payment status...');

    // Check if there's an existing payment ID
    const existingPaymentId = selectedPayment.id;
    
    if (existingPaymentId) {
      try {
        const statusResponse = await axiosInstance.get(`/payments/status/${existingPaymentId}`);
        
        if (statusResponse.success && statusResponse.data.data) {
          const dbPayment = statusResponse.data.data;
          
          if (dbPayment.status === 'completed') {
            setPaymentSuccess('Payment already completed!');
            setProcessingPayment(false);
            return;
          } else if (dbPayment.status === 'pending') {
            const orderId = dbPayment.phonepe_order_id || dbPayment.razorpay_order_id || dbPayment.transaction_id;
            
            if (orderId) {
              setPaymentSuccess('Checking payment with provider...');
              
              try {
                const verifyResponse = await axiosInstance.post('/payments/verify', {
                  merchantOrderId: orderId
                }, { timeout: 15000 });

                if (verifyResponse.success && verifyResponse.data.paymentStatus === 'completed') {
                  setPaymentSuccess('Payment already completed!');
                  setProcessingPayment(false);
                  fetchDataByEmailPhone();
                  return;
                } else if (verifyResponse.success && verifyResponse.data.state === 'CREATED') {
                  setPaymentSuccess('Opening payment page...');
                  if (verifyResponse.data.redirectUrl) {
                    window.open(verifyResponse.data.redirectUrl, '_self');
                  } else if (verifyResponse.data.paymentUrl) {
                    window.open(verifyResponse.data.paymentUrl, '_self');
                  }
                  setProcessingPayment(false);
                  return;
                }
              } catch (verifyErr) {
                console.error('Error verifying payment:', verifyErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }

    // No existing payment or previous payment failed, create new order
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
        setProcessingPayment(false);
        setPaymentSuccess('Opening payment page...');
        window.open(response.data.redirectUrl, '_self');
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
                verifyPayment(response.data.orderId);
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

  const verifyPayment = async (merchantOrderId) => {
    try {
      const verifyResponse = await axiosInstance.post('/payments/verify', {
        merchantOrderId: merchantOrderId
      });

      if (verifyResponse.success && verifyResponse.data.paymentStatus === 'completed') {
        setPaymentSuccess('Payment successful! Receipt will be sent to your email.');
        setShowPaymentPreview(false);
        fetchDataByEmailPhone();
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p>Manage your school portal account</p>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="user-profile">
            <div className="avatar">
              {profilePic ? (
                <img 
                  src={typeof profilePic === 'string' ? profilePic : URL.createObjectURL(profilePic)} 
                  alt="Profile" 
                  className="sidebar-profile-pic"
                />
              ) : (
                <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
              )}
            </div>
            <h3>{user?.firstName} {user?.lastName}</h3>
            <p>{user?.email}</p>
            {user?.phone && <p className="sidebar-phone">{user?.phone}</p>}
          </div>

          <nav className="dashboard-nav">
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={activeTab === 'admissions' ? 'active' : ''}
              onClick={() => setActiveTab('admissions')}
            >
              Admissions
            </button>
            <button
              className={activeTab === 'payments' ? 'active' : ''}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </button>
            <button
              className={activeTab === 'upload' ? 'active' : ''}
              onClick={() => setActiveTab('upload')}
            >
              Upload Proof
            </button>
            <button
              className={activeTab === 'documents' ? 'active' : ''}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={activeTab === 'security' ? 'active' : ''}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </nav>
        </div>

        <div className="dashboard-content">
          {activeTab === 'profile' && (
            <div className="content-section">
              <h2>Profile Information</h2>
              
              <div className="profile-section">
                <div className="profile-pic-container profile-pic-large">
                  {profilePic ? (
                    <img 
                      src={typeof profilePic === 'string' ? profilePic : URL.createObjectURL(profilePic)} 
                      alt="Profile" 
                      className="profile-pic"
                    />
                  ) : (
                    <div className="profile-pic-placeholder">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  )}
                  <label htmlFor="profile-pic-input" className="profile-pic-edit">
                    📷
                  </label>
                  <input
                    type="file"
                    id="profile-pic-input"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    style={{ display: 'none' }}
                  />
                </div>
                
                {profilePic && typeof profilePic !== 'string' && (
                  <div className="profile-pic-actions">
                    <button 
                      className="upload-profile-btn"
                      onClick={uploadProfilePic}
                      disabled={profilePicLoading}
                    >
                      {profilePicLoading ? 'Saving...' : 'Save Photo'}
                    </button>
                    <button 
                      className="cancel-profile-btn"
                      onClick={() => setProfilePic(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {uploadError && <div className="error-message">{uploadError}</div>}
                {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
              </div>

              {isEditing ? (
                <form onSubmit={updateProfile} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="disabled-input"
                      />
                      <small>Email cannot be changed</small>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className="form-group">
                    <label>Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Enter your occupation"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={updateLoading}>
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-info-grid">
                    <div className="info-card">
                      <div className="info-icon">👤</div>
                      <div className="info-content">
                        <label>Full Name</label>
                        <p>{user?.firstName} {user?.lastName}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">📧</div>
                      <div className="info-content">
                        <label>Email Address</label>
                        <p>{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">📱</div>
                      <div className="info-content">
                        <label>Phone Number</label>
                        <p>{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">🏠</div>
                      <div className="info-content">
                        <label>Address</label>
                        <p>{user?.address || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">💼</div>
                      <div className="info-content">
                        <label>Occupation</label>
                        <p>{user?.occupation || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="info-card">
                      <div className="info-icon">🎭</div>
                      <div className="info-content">
                        <label>Role</label>
                        <p>{user?.role || 'Parent'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Profile
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'admissions' && (
            <div className="content-section">
              <h2>My Admissions</h2>
              
              <div className="user-info-banner">
                <p>Showing records for: <strong>{user?.email}</strong> {user?.phone && <span>| <strong>{user?.phone}</strong></span>}</p>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : admissions.length > 0 ? (
                <div className="admissions-list">
                  {admissions.map((item, index) => (
                    <div key={item.id || index} className="admission-card">
                      {item.form_number ? (
                        // It's an admission form
                        <>
                          <h3>{item.student_name}</h3>
                          <div className="admission-details">
                            <p><strong>Form No:</strong> {item.form_number}</p>
                            <p><strong>Admission No:</strong> {item.admission_number || 'N/A'}</p>
                            <p><strong>Class:</strong> {item.admission_class}</p>
                            <p><strong>Father Name:</strong> {item.father_name || 'N/A'}</p>
                            <p><strong>Mother Name:</strong> {item.mother_name || 'N/A'}</p>
                            <p><strong>Date of Birth:</strong> {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Gender:</strong> {item.gender || 'N/A'}</p>
                            <p><strong>Religion:</strong> {item.religion || 'N/A'}</p>
                            <p><strong>Caste:</strong> {item.caste || 'N/A'}</p>
                            <p><strong>Aadhaar:</strong> {item.aadhaar_number || 'N/A'}</p>
                            <p><strong>Blood Group:</strong> {item.blood_group || 'N/A'}</p>
                            <p><strong>Email:</strong> {item.email || 'N/A'}</p>
                            <p><strong>Father Phone:</strong> {item.father_contact || 'N/A'}</p>
                            <p><strong>Mother Phone:</strong> {item.mother_contact || 'N/A'}</p>
                            <p><strong>WhatsApp:</strong> {item.whatsapp_contact || 'N/A'}</p>
                            <p><strong>Address:</strong> {item.corresponding_address || 'N/A'}, {item.corresponding_district || ''} - {item.corresponding_pin || ''}</p>
                            <p><strong>Academic Year:</strong> {item.academic_year}</p>
                            <p><strong>Status:</strong> <span className={`status ${item.status}`}>{item.status}</span></p>
                            <p><strong>Applied:</strong> {new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <button 
                            className="view-details-btn"
                            onClick={() => viewAdmissionDetails(item)}
                          >
                            View Details
                          </button>
                        </>
                      ) : (
                        // It's a payment record (completed admission fee)
                        <>
                          <h3>{item.student_name}</h3>
                          <div className="admission-details">
                            <p><strong>Receipt No:</strong> TVPS/P/{String(item.id).padStart(6, '0')}</p>
                            <p><strong>Student Name:</strong> {item.student_name}</p>
                            <p><strong>Class:</strong> {item.class}</p>
                            <p><strong>Fee Type:</strong> {(item.fee_type || '').charAt(0).toUpperCase() + (item.fee_type || '').slice(1)} Fee</p>
                            <p><strong>Amount:</strong> ₹{parseFloat(item.amount).toLocaleString('en-IN')}</p>
                            <p><strong>Academic Year:</strong> {item.academic_year}</p>
                            <p><strong>Payment Date:</strong> {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                            <p><strong>Status:</strong> <span className="status completed">Completed</span></p>
                            {item.phonepe_order_id && (
                              <p><strong>Transaction ID:</strong> {item.phonepe_order_id}</p>
                            )}
                            {item.parent_email && (
                              <p><strong>Email:</strong> {item.parent_email}</p>
                            )}
                            {item.parent_phone && (
                              <p><strong>Phone:</strong> {item.parent_phone}</p>
                            )}
                          </div>
                          <button 
                            className="download-receipt-btn"
                            onClick={() => window.open(`${API_URL}/payments/receipt/${item.id}`, '_self')}
                          >
                            Download Receipt
                          </button>
                          <button 
                            className="view-details-btn"
                            onClick={() => viewAdmissionDetails(item)}
                            style={{ marginTop: '10px' }}
                          >
                            View Details
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-title">No Admission Record Found</p>
                  <p className="empty-note">You haven't submitted an admission form yet. Please submit an admission form to see your application status here.</p>
                  <a href="/admission" className="submit-admission-btn">Submit Admission Form</a>
                </div>
              )}

              {showAdmissionModal && selectedAdmission && (
                <div className="admission-modal-overlay" onClick={() => setShowAdmissionModal(false)}>
                  <div className="admission-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="admission-modal-header">
                      <h3>Admission Details</h3>
                      <button className="modal-close-btn" onClick={() => setShowAdmissionModal(false)}>×</button>
                    </div>
                    <div className="admission-modal-body">
                      {selectedAdmission.form_number ? (
                        <>
                          <div className="admission-section-title">Student Information</div>
                          <div className="admission-details-grid">
                            <div className="detail-item">
                              <label>Student Name</label>
                              <p>{selectedAdmission.student_name}</p>
                            </div>
                            <div className="detail-item">
                              <label>Form Number</label>
                              <p>{selectedAdmission.form_number}</p>
                            </div>
                            <div className="detail-item">
                              <label>Admission Number</label>
                              <p>{selectedAdmission.admission_number || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Class</label>
                              <p>{selectedAdmission.admission_class}</p>
                            </div>
                            <div className="detail-item">
                              <label>Date of Birth</label>
                              <p>{selectedAdmission.date_of_birth ? new Date(selectedAdmission.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Gender</label>
                              <p>{selectedAdmission.gender || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Blood Group</label>
                              <p>{selectedAdmission.blood_group || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Religion</label>
                              <p>{selectedAdmission.religion || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Caste</label>
                              <p>{selectedAdmission.caste || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Aadhaar Number</label>
                              <p>{selectedAdmission.aadhaar_number || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="admission-section-title">Parent Information</div>
                          <div className="admission-details-grid">
                            <div className="detail-item">
                              <label>Father's Name</label>
                              <p>{selectedAdmission.father_name || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Father's Phone</label>
                              <p>{selectedAdmission.father_contact || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Father's Occupation</label>
                              <p>{selectedAdmission.father_occupation || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Mother's Name</label>
                              <p>{selectedAdmission.mother_name || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Mother's Phone</label>
                              <p>{selectedAdmission.mother_contact || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Mother's Occupation</label>
                              <p>{selectedAdmission.mother_occupation || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>WhatsApp Number</label>
                              <p>{selectedAdmission.whatsapp_contact || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="admission-section-title">Contact & Address</div>
                          <div className="admission-details-grid">
                            <div className="detail-item full-width">
                              <label>Email</label>
                              <p>{selectedAdmission.email || 'N/A'}</p>
                            </div>
                            <div className="detail-item full-width">
                              <label>Corresponding Address</label>
                              <p>{selectedAdmission.corresponding_address || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>District</label>
                              <p>{selectedAdmission.corresponding_district || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>State</label>
                              <p>{selectedAdmission.corresponding_state || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>PIN Code</label>
                              <p>{selectedAdmission.corresponding_pin || 'N/A'}</p>
                            </div>
                            {selectedAdmission.permanent_address && (
                              <div className="detail-item full-width">
                                <label>Permanent Address</label>
                                <p>{selectedAdmission.permanent_address}</p>
                              </div>
                            )}
                            {selectedAdmission.permanent_district && (
                              <div className="detail-item">
                                <label>Permanent District</label>
                                <p>{selectedAdmission.permanent_district}</p>
                              </div>
                            )}
                            {selectedAdmission.permanent_state && (
                              <div className="detail-item">
                                <label>Permanent State</label>
                                <p>{selectedAdmission.permanent_state}</p>
                              </div>
                            )}
                            {selectedAdmission.permanent_pin && (
                              <div className="detail-item">
                                <label>Permanent PIN</label>
                                <p>{selectedAdmission.permanent_pin}</p>
                              </div>
                            )}
                          </div>

                          <div className="admission-section-title">Academic Information</div>
                          <div className="admission-details-grid">
                            <div className="detail-item">
                              <label>Academic Year</label>
                              <p>{selectedAdmission.academic_year}</p>
                            </div>
                            <div className="detail-item">
                              <label>Previous School</label>
                              <p>{selectedAdmission.previous_school || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>TC Number</label>
                              <p>{selectedAdmission.tc_number || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Status</label>
                              <p><span className={`status ${selectedAdmission.status}`}>{selectedAdmission.status}</span></p>
                            </div>
                            <div className="detail-item">
                              <label>Applied Date</label>
                              <p>{new Date(selectedAdmission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="admission-details-grid">
                            <div className="detail-item">
                              <label>Receipt Number</label>
                              <p>TVPS/P/{String(selectedAdmission.id).padStart(6, '0')}</p>
                            </div>
                            <div className="detail-item">
                              <label>Student Name</label>
                              <p>{selectedAdmission.student_name}</p>
                            </div>
                            <div className="detail-item">
                              <label>Class</label>
                              <p>{selectedAdmission.class}</p>
                            </div>
                            <div className="detail-item">
                              <label>Fee Type</label>
                              <p>{(selectedAdmission.fee_type || '').charAt(0).toUpperCase() + (selectedAdmission.fee_type || '').slice(1)} Fee</p>
                            </div>
                            <div className="detail-item">
                              <label>Amount</label>
                              <p>₹{parseFloat(selectedAdmission.amount).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="detail-item">
                              <label>Academic Year</label>
                              <p>{selectedAdmission.academic_year}</p>
                            </div>
                            <div className="detail-item">
                              <label>Payment Date</label>
                              <p>{new Date(selectedAdmission.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="detail-item">
                              <label>Status</label>
                              <p><span className="status completed">Completed</span></p>
                            </div>
                          </div>

                          <div className="admission-section-title">Parent/Guardian Information</div>
                          <div className="admission-details-grid">
                            <div className="detail-item">
                              <label>Parent Email</label>
                              <p>{selectedAdmission.parent_email || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                              <label>Parent Phone</label>
                              <p>{selectedAdmission.parent_phone || 'N/A'}</p>
                            </div>
                          </div>

                          {selectedAdmission.phonepe_order_id && (
                            <div className="admission-details-grid" style={{ marginTop: '15px' }}>
                              <div className="detail-item full-width">
                                <label>Transaction ID</label>
                                <p>{selectedAdmission.phonepe_order_id}</p>
                              </div>
                            </div>
                          )}

                          <div className="no-form-notice">
                            <p>📝 <strong>Note:</strong> No admission form submitted yet. To complete your admission process and add parent details, please fill the admission form.</p>
                            <a href="/admission" className="submit-admission-btn">Submit Admission Form</a>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="admission-modal-footer">
                      {selectedAdmission.form_number ? (
                        <button 
                          className="download-receipt-btn"
                          onClick={() => {
                            if (selectedAdmission.id) {
                              window.open(`${API_URL}/admission/form/${selectedAdmission.id}`, '_self');
                            }
                          }}
                        >
                          Download Form
                        </button>
                      ) : (
                        <button 
                          className="download-receipt-btn"
                          onClick={() => window.open(`${API_URL}/payments/receipt/${selectedAdmission.id}`, '_self')}
                        >
                          Download Receipt
                        </button>
                      )}
                      <button className="modal-cancel-btn" onClick={() => setShowAdmissionModal(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="content-section">
              <h2>Payment History</h2>
              
              <div className="payment-filter-bar">
                <button 
                  className={paymentFilter === 'all' ? 'active' : ''}
                  onClick={() => setPaymentFilter('all')}
                >
                  All
                </button>
                <button 
                  className={paymentFilter === 'completed' ? 'active' : ''}
                  onClick={() => setPaymentFilter('completed')}
                >
                  Completed
                </button>
                <button 
                  className={paymentFilter === 'pending' ? 'active' : ''}
                  onClick={() => setPaymentFilter('pending')}
                >
                  Pending
                </button>
              </div>

              <div className="user-info-banner">
                <p>Showing payments for: <strong>{user?.email}</strong> {user?.phone && <span>| <strong>{user?.phone}</strong></span>}</p>
              </div>

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

              <div className="payment-tabs">
                <button 
                  className={!paymentDetails ? 'active' : ''} 
                  onClick={() => { setPaymentDetails(null); setSelectedPayment(null); }}
                >
                  Payment List
                </button>
                <button 
                  className={paymentDetails ? 'active' : ''}
                  disabled={!selectedPayment}
                  onClick={() => paymentDetails && setPaymentDetails(selectedPayment)}
                >
                  Payment Details
                </button>
              </div>

              {!paymentDetails ? (
                <>
                  {loading ? (
                    <p>Loading...</p>
                  ) : (
                    <>
                      {(() => {
                        const filteredPayments = paymentFilter === 'all' 
                          ? payments 
                          : payments.filter(p => p.status === paymentFilter);
                        
                        return filteredPayments.length > 0 ? (
                          <div className="payments-list">
                            {filteredPayments.map((payment) => (
                              <div key={payment.id} className={`payment-card ${payment.status}`}>
                                <div className="payment-header">
                                  <div className="payment-id">
                                    <span className="receipt-no">TVPS/P/{String(payment.id).padStart(6, '0')}</span>
                                    <span className={`status-badge ${payment.status}`}>{payment.status}</span>
                                  </div>
                                  <div className="payment-amount">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</div>
                                </div>
                                <div className="payment-body">
                                  <div className="payment-info-row">
                                    <span className="label">Student Name</span>
                                    <span className="value">{payment.student_name}</span>
                                  </div>
                                  <div className="payment-info-row">
                                    <span className="label">Class</span>
                                    <span className="value">{payment.class || 'N/A'}</span>
                                  </div>
                                  <div className="payment-info-row">
                                    <span className="label">Fee Type</span>
                                    <span className="value">{(payment.fee_type || '').charAt(0).toUpperCase() + (payment.fee_type || '').slice(1)} Fee</span>
                                  </div>
                                  <div className="payment-info-row">
                                    <span className="label">Academic Year</span>
                                    <span className="value">{payment.academic_year || 'N/A'}</span>
                                  </div>
                                  <div className="payment-info-row">
                                    <span className="label">Payment Date</span>
                                    <span className="value">{new Date(payment.created_at).toLocaleDateString('en-IN')}</span>
                                  </div>
                                  {payment.payment_method && (
                                    <div className="payment-info-row">
                                      <span className="label">Payment Method</span>
                                      <span className="value">{payment.payment_method}</span>
                                    </div>
                                  )}
                                  {(payment.phonepe_order_id || payment.razorpay_order_id) && (
                                    <div className="payment-info-row">
                                      <span className="label">Transaction ID</span>
                                      <span className="value transaction-id">{payment.phonepe_order_id || payment.razorpay_order_id}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="payment-actions">
                                  <button 
                                    className="view-btn"
                                    onClick={() => viewPaymentDetails(payment)}
                                  >
                                    View Details
                                  </button>
                                  {(payment.status === 'pending' || payment.status === 'failed') && (
                                    <button 
                                      className="proceed-btn"
                                      onClick={() => proceedWithPayment(payment)}
                                    >
                                      Pay Now
                                    </button>
                                  )}
                                  {payment.status === 'completed' && (
                                    <button 
                                      className="receipt-btn"
                                      onClick={() => window.open(`${API_URL}/payments/receipt/${payment.id}`, '_self')}
                                    >
                                      Download Receipt
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <p>No {paymentFilter === 'all' ? '' : paymentFilter} payments found</p>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </>
              ) : (
                <div className="payment-details-card">
                  <div className="details-header">
                    <h3>Payment Details</h3>
                    <span className={`status ${paymentDetails.status}`}>{paymentDetails.status}</span>
                  </div>
                  
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Receipt Number</label>
                      <p>TVPS/P/{String(paymentDetails.id).padStart(6, '0')}</p>
                    </div>
                    <div className="detail-item">
                      <label>Transaction ID</label>
                      <p>{paymentDetails.phonepe_order_id || paymentDetails.razorpay_order_id || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Payment Date</label>
                      <p>{new Date(paymentDetails.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="detail-item">
                      <label>Amount</label>
                      <p className="amount">₹{parseFloat(paymentDetails.amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="detail-item">
                      <label>Student Name</label>
                      <p>{paymentDetails.student_name || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Class</label>
                      <p>{paymentDetails.class || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Fee Type</label>
                      <p>{(paymentDetails.fee_type || '').charAt(0).toUpperCase() + (paymentDetails.fee_type || '').slice(1)} Fee</p>
                    </div>
                    <div className="detail-item">
                      <label>Academic Year</label>
                      <p>{paymentDetails.academic_year || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Payment Type</label>
                      <p>{paymentDetails.payment_type === 'online' ? 'Online' : 'Manual'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Parent Email</label>
                      <p>{paymentDetails.parent_email || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Parent Phone</label>
                      <p>{paymentDetails.parent_phone || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Screenshot</label>
                      <p>{paymentDetails.screenshot_url ? 'Uploaded' : 'Not Uploaded'}</p>
                    </div>
                  </div>
                  
                  <div className="details-actions">
                    <button 
                      className="receipt-btn"
                      onClick={() => window.open(`${API_URL}/payments/receipt/${paymentDetails.id}`, '_self')}
                    >
                      📄 Download PDF
                    </button>
                    <button 
                      className="back-btn"
                      onClick={() => setPaymentDetails(null)}
                    >
                      ← Back to List
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="content-section">
              <h2>Upload Payment Proof</h2>
              <p className="section-desc">Upload payment screenshot as proof for manual verification</p>
              
              <div className="upload-proof-container">
                <div className="select-payment-section">
                  <h3>Select Payment</h3>
                  <p>Select a payment from your history to upload proof</p>
                  
                  {payments.length > 0 ? (
                    <div className="payment-select-list">
                      {payments.filter(p => p.status !== 'completed').map((payment) => (
                        <div 
                          key={payment.id} 
                          className={`payment-select-item ${selectedPayment?.id === payment.id ? 'selected' : ''} ${payment.screenshot_url ? 'has-proof' : ''}`}
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <div className="payment-select-info">
                            <span className="receipt-no">TVPS/P/{String(payment.id).padStart(6, '0')}</span>
                            <span className="amount">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</span>
                            <span className={`status ${payment.status}`}>{payment.status}</span>
                          </div>
                          <div className="payment-select-meta">
                            <span>{payment.fee_type} Fee</span>
                            <span>{payment.class}</span>
                          </div>
                          {payment.screenshot_url && <span className="proof-tag">Proof Uploaded</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-payments">No pending payments found</p>
                  )}
                </div>

                <div className="upload-section">
                  <h3>Upload Screenshot</h3>
                  <p>Take a screenshot of your payment transaction and upload it</p>
                  
                  <div className="upload-area">
                    <input 
                      type="file" 
                      id="screenshot-upload" 
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      disabled={!selectedPayment}
                    />
                    <label htmlFor="screenshot-upload" className={`upload-label ${!selectedPayment ? 'disabled' : ''}`}>
                      {screenshot ? (
                        <span className="file-selected">✓ {screenshot.name}</span>
                      ) : (
                        <span>📁 Click to upload screenshot</span>
                      )}
                    </label>
                  </div>

                  {uploadError && <div className="error-message">{uploadError}</div>}
                  {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}

                  <button 
                    className="submit-proof-btn"
                    onClick={submitScreenshotProof}
                    disabled={!screenshot || !selectedPayment || uploadLoading}
                  >
                    {uploadLoading ? 'Uploading...' : 'Submit Payment Proof'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="content-section">
              <h2>Important Documents</h2>
              <div className="documents-list">
                <span className="document-link">
                  <span>📄</span> School Prospectus
                </span>
                <span className="document-link">
                  <span>📄</span> Admission Guidelines
                </span>
                <span className="document-link">
                  <span>📄</span> Fee Payment Receipt
                </span>
                <span className="document-link">
                  <span>📄</span> Student ID Card
                </span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="content-section">
              <h2>Security Settings</h2>
              {user?.mustChangePassword && (
                <div className="alert alert-warning">
                  <strong>⚠️ Required:</strong> You must change your temporary password before continuing.
                </div>
              )}
              {user?.mustChangePassword && (
              <div className="security-section">
                <h3>Change Password</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const currentPassword = e.target.currentPassword.value;
                  const newPassword = e.target.newPassword.value;
                  const confirmPassword = e.target.confirmPassword.value;

                  if (newPassword !== confirmPassword) {
                    alert('New passwords do not match!');
                    return;
                  }

                  if (newPassword.length < 6) {
                    alert('Password must be at least 6 characters!');
                    return;
                  }

                  setPasswordLoading(true);
                  try {
                    const response = await axiosInstance.put('/auth/change-password', {
                      currentPassword,
                      newPassword
                    });
                    if (response.data.success) {
                      alert('Password changed successfully!');
                      e.target.reset();
                      
                      // Update user context to remove mustChangePassword flag
                      const updatedUser = { ...user, mustChangePassword: false };
                      updateUser(updatedUser);
                      
                      // Redirect to profile after successful password change
                      setActiveTab('profile');
                    } else {
                      alert(response.data.message || 'Failed to change password');
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to change password');
                  } finally {
                    setPasswordLoading(false);
                  }
                }} className="password-form">
                  <div className="form-group">
                    <label>Current Password *</label>
                    <input type="password" name="currentPassword" required disabled={passwordLoading} />
                  </div>
                  <div className="form-group">
                    <label>New Password *</label>
                    <input type="password" name="newPassword" required minLength="6" disabled={passwordLoading} />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password *</label>
                    <input type="password" name="confirmPassword" required minLength="6" disabled={passwordLoading} />
                  </div>
                  <button type="submit" className="submit-btn" disabled={passwordLoading}>
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
