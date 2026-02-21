import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  // Fix: Remove /api prefix if present, since static files are served from root
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

const Admin = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [phonePePayments, setPhonePePayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Pagination & Filters
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '', type: '', role: '' });
  const [period, setPeriod] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, filters]);

  const fetchDashboardStats = async () => {
    try {
      const response = await axiosInstance.get(`/admin/dashboard/stats?period=${period}`);
      setStats(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = () => {
    const offset = (pagination.page - 1) * pagination.limit;
    switch(activeTab) {
      case 'users': fetchUsers(offset); break;
      case 'admissions': fetchAdmissions(offset); break;
      case 'payments': fetchPayments(offset); break;
      case 'phonepe': fetchPhonePePayments(offset); break;
      case 'contacts': fetchContacts(offset); break;
      case 'notices': fetchNotices(offset); break;
      case 'fees': fetchFeeStructures(); break;
      case 'gallery': fetchGallery(); break;
      case 'students': fetchStudents(offset); break;
      default: break;
    }
  };

  const fetchUsers = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users?limit=${pagination.limit}&offset=${offset}&status=${filters.status}&role=${filters.role}&search=${filters.search}`);
      setUsers(res.data.users || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchAdmissions = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/admissions?limit=${pagination.limit}&offset=${offset}&status=${filters.status}`);
      setAdmissions(res.data.admissions || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPayments = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/payments?limit=${pagination.limit}&offset=${offset}&status=${filters.status}`);
      setPayments(res.data.payments || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPhonePePayments = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/payments/phonepe?limit=${pagination.limit}&offset=${offset}&status=${filters.status}`);
      setPhonePePayments(res.data.payments || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchContacts = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/contacts?limit=${pagination.limit}&offset=${offset}&status=${filters.status}`);
      setContacts(res.data.contacts || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchNotices = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/notices?limit=${pagination.limit}&offset=${offset}`);
      setNotices(res.data.notices || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/fee-structures');
      setFeeStructures(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/gallery');
      setGallery(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchStudents = async (offset) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/students?limit=${pagination.limit}&offset=${offset}&search=${filters.search}`);
      setStudents(res.data.students || []);
      setPagination(p => ({ ...p, total: res.data.total || 0 }));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Actions
  const updateStatus = async (endpoint, id, status) => {
    setActionLoading(true);
    try {
      await axiosInstance.put(`/admin/${endpoint}/${id}/status`, { status });
      loadTabData();
      setShowModal(false);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async (endpoint, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/admin/${endpoint}/${id}`);
      loadTabData();
      setShowModal(false);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD Operations
  const openCreateForm = (type) => {
    setModalMode('create');
    setSelectedItem(null);
    setFormData(getInitialFormData(type));
    setShowModal(true);
  };

  const openEditForm = (item, type) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const getInitialFormData = (type) => {
    switch(type) {
      case 'notice':
        return { title: '', content: '', priority: 'normal', target_audience: 'all', status: 'active' };
      case 'fee':
        return { class_name: '', academic_year: '2026-2027', tuition_fee: 0, transport_fee: 0, uniform_fee: 0, exam_fee: 0, activity_fee: 0, total_fee: 0 };
      case 'student':
        return { name: '', admission_number: '', class_name: '', father_name: '', mother_name: '', phone: '', email: '', address: '', dob: '', gender: '' };
      case 'gallery':
        return { title: '', category: 'general' };
      case 'user':
        return { firstName: '', lastName: '', email: '', phone: '', role: 'parent', status: 'active' };
      default:
        return {};
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      let endpoint = '';
      
      switch(activeTab) {
        case 'users':
          endpoint = 'users';
          if (modalMode === 'edit') {
            await axiosInstance.put(`/admin/users/${selectedItem.id}`, formData);
          } else {
            await axiosInstance.post(`/admin/${endpoint}`, formData);
          }
          break;
        case 'notices':
          endpoint = 'notices';
          if (modalMode === 'edit') {
            await axiosInstance.put(`/admin/notices/${selectedItem.id}`, formData);
          } else {
            await axiosInstance.post(`/admin/${endpoint}`, formData);
          }
          break;
        case 'fees':
          endpoint = 'fee-structures';
          if (modalMode === 'edit') {
            await axiosInstance.put(`/admin/fee-structures/${selectedItem.id}`, formData);
          } else {
            await axiosInstance.post(`/admin/${endpoint}`, formData);
          }
          break;
        case 'students':
          endpoint = 'students';
          if (modalMode === 'edit') {
            await axiosInstance.put(`/admin/students/${selectedItem.id}`, formData);
          } else {
            await axiosInstance.post(`/admin/${endpoint}`, formData);
          }
          break;
        case 'gallery':
          if (!formData.title) {
            alert('Please enter a title');
            return;
          }
          if (modalMode === 'edit') {
            await axiosInstance.put(`/admin/gallery/${selectedItem.id}`, formData);
          } else {
            const formDataObj = new FormData();
            formDataObj.append('title', formData.title);
            formDataObj.append('category', formData.category || 'general');
            if (formData.image) {
              formDataObj.append('image', formData.image);
            }
            await axiosInstance.post(`/admin/gallery`, formDataObj, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
          break;
        default:
          break;
      }
      
      setShowModal(false);
      loadTabData();
    } catch (err) {
      console.error('Form submit failed:', err);
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const downloadReceipt = (paymentId) => {
    window.open(`${API_URL}/payments/receipt/${paymentId}`, '_blank');
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setShowModal(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have admin access.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <h1>Top View Public School - Admin Panel</h1>
          <p>Manage all school operations</p>
        </div>
        <div className="admin-user-info">
          <span>Welcome, {user?.firstName}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-layout">
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              📊 Dashboard
            </button>
            <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              👥 Users
            </button>
            <button className={activeTab === 'admissions' ? 'active' : ''} onClick={() => setActiveTab('admissions')}>
              📝 Admissions
            </button>
            <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
              💳 All Payments
            </button>
            <button className={activeTab === 'phonepe' ? 'active' : ''} onClick={() => setActiveTab('phonepe')}>
              📱 PhonePe Payments
            </button>
            <button className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>
              📧 Contacts
            </button>
            <button className={activeTab === 'notices' ? 'active' : ''} onClick={() => setActiveTab('notices')}>
              📢 Notices
            </button>
            <button className={activeTab === 'fees' ? 'active' : ''} onClick={() => setActiveTab('fees')}>
              💰 Fee Structures
            </button>
            <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
              🎓 Students
            </button>
            <button className={activeTab === 'gallery' ? 'active' : ''} onClick={() => setActiveTab('gallery')}>
              🖼️ Gallery
            </button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
              ⚙️ Settings
            </button>
          </nav>
        </div>

        <div className="admin-content">
          {activeTab === 'dashboard' && <DashboardTab stats={stats} loading={loading} setActiveTab={setActiveTab} period={period} setPeriod={setPeriod} />}
          
          {activeTab === 'users' && (
            <div className="section-header">
              <h2>Users Management</h2>
              <button className="add-btn" onClick={() => openCreateForm('user')}>+ Add User</button>
            </div>
          )}
          {activeTab === 'users' && (
            <DataTable
              data={users}
              columns={['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions']}
              renderRow={(u) => (
                <>
                  <td>{u.id}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td><span className={`status-badge ${u.status}`}>{u.status}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditForm(u, 'user')}>Edit</button>
                    <button className="action-btn reject" onClick={() => deleteItem('users', u.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{ status: ['active', 'inactive'], role: ['admin', 'parent', 'student', 'teacher'] }} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'admissions' && (
            <DataTable
              title="Admissions Management"
              data={admissions}
              columns={['ID', 'Student', 'Class', 'Father', 'Phone', 'Form No', 'Status', 'Actions']}
              renderRow={(a) => (
                <>
                  <td>{a.id}</td>
                  <td>{a.student_name}</td>
                  <td>{a.admission_class}</td>
                  <td>{a.father_name || '-'}</td>
                  <td>{a.father_contact || '-'}</td>
                  <td>{a.form_number || '-'}</td>
                  <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                  <td>
                    <button className="action-btn view" onClick={() => viewDetails(a)}>View</button>
                    {a.status === 'pending' && (
                      <>
                        <button className="action-btn approve" onClick={() => updateStatus('admissions', a.id, 'approved')} disabled={actionLoading}>Approve</button>
                        <button className="action-btn reject" onClick={() => updateStatus('admissions', a.id, 'rejected')} disabled={actionLoading}>Reject</button>
                      </>
                    )}
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{ status: ['pending', 'approved', 'rejected'] }} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'payments' && (
            <DataTable
              title="All Payments"
              data={payments}
              columns={['ID', 'Receipt No', 'Student', 'Class', 'Fee Type', 'Amount', 'Status', 'Date', 'Actions']}
              renderRow={(p) => (
                <>
                  <td>{p.id}</td>
                  <td>TVPS/P/{String(p.id).padStart(6, '0')}</td>
                  <td>{p.student_name}</td>
                  <td>{p.class || '-'}</td>
                  <td>{(p.fee_type || '').charAt(0).toUpperCase() + (p.fee_type || '').slice(1)}</td>
                  <td>₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                  <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view" onClick={() => downloadReceipt(p.id)}>Receipt</button>
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{ status: ['pending', 'completed', 'failed'] }} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'phonepe' && (
            <DataTable
              title="PhonePe Payments"
              data={phonePePayments}
              columns={['ID', 'Receipt No', 'Student', 'Class', 'Amount', 'Transaction ID', 'Status', 'Date', 'Actions']}
              renderRow={(p) => (
                <>
                  <td>{p.id}</td>
                  <td>TVPS/P/{String(p.id).padStart(6, '0')}</td>
                  <td>{p.student_name}</td>
                  <td>{p.class || '-'}</td>
                  <td>₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                  <td className="transaction-id">{p.phonepe_order_id?.substring(0, 20)}...</td>
                  <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view" onClick={() => downloadReceipt(p.id)}>Receipt</button>
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{ status: ['pending', 'completed', 'failed'] }} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'contacts' && (
            <DataTable
              title="Contact Messages"
              data={contacts}
              columns={['ID', 'Name', 'Email', 'Phone', 'Subject', 'Status', 'Date', 'Actions']}
              renderRow={(c) => (
                <>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.subject}</td>
                  <td><span className={`status-badge ${c.status || 'unread'}`}>{c.status || 'unread'}</span></td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view" onClick={() => viewDetails(c)}>View</button>
                    <button className="action-btn reply" onClick={() => {
                      setSelectedItem(c);
                      setModalMode('reply');
                      setFormData({ replyMessage: '', subject: c.subject });
                      setShowModal(true);
                    }}>Reply</button>
                    <button className="action-btn reject" onClick={() => deleteItem('contacts', c.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{ status: ['unread', 'read', 'replied'] }} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'notices' && (
            <div className="section-header">
              <h2>Notices</h2>
              <button className="add-btn" onClick={() => openCreateForm('notice')}>+ Add Notice</button>
            </div>
          )}
          {activeTab === 'notices' && (
            <DataTable
              data={notices}
              columns={['ID', 'Title', 'Priority', 'Audience', 'Date', 'Actions']}
              renderRow={(n) => (
                <>
                  <td>{n.id}</td>
                  <td>{n.title}</td>
                  <td><span className={`priority-badge ${n.priority}`}>{n.priority}</span></td>
                  <td>{n.target_audience || 'All'}</td>
                  <td>{new Date(n.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view" onClick={() => viewDetails(n)}>View</button>
                    <button className="action-btn edit" onClick={() => openEditForm(n, 'notice')}>Edit</button>
                    <button className="action-btn reject" onClick={() => deleteItem('notices', n.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'fees' && (
            <div className="section-header">
              <h2>Fee Structures</h2>
              <button className="add-btn" onClick={() => openCreateForm('fee')}>+ Add Fee Structure</button>
            </div>
          )}
          {activeTab === 'fees' && (
            <DataTable
              data={feeStructures}
              columns={['ID', 'Class', 'Academic Year', 'Tuition', 'Transport', 'Uniform', 'Total', 'Actions']}
              renderRow={(f) => (
                <>
                  <td>{f.id}</td>
                  <td>Class {f.class_name}</td>
                  <td>{f.academic_year}</td>
                  <td>₹{parseFloat(f.tuition_fee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{parseFloat(f.transport_fee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{parseFloat(f.uniform_fee || 0).toLocaleString('en-IN')}</td>
                  <td className="amount">₹{parseFloat(f.total_fee || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <button className="action-btn view" onClick={() => openEditForm(f, 'fee')}>Edit</button>
                    <button className="action-btn reject" onClick={() => deleteItem('fee-structures', f.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              loading={loading}
              onView={viewDetails}
            />
          )}

          {activeTab === 'students' && (
            <div className="section-header">
              <h2>Students</h2>
              <button className="add-btn" onClick={() => openCreateForm('student')}>+ Add Student</button>
            </div>
          )}
          {activeTab === 'students' && (
            <DataTable
              data={students}
              columns={['ID', 'Name', 'Admission No', 'Class', 'Father', 'Phone', 'Actions']}
              renderRow={(s) => (
                <>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.admission_number || '-'}</td>
                  <td>{s.class_name}</td>
                  <td>{s.father_name || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>
                    <button className="action-btn view" onClick={() => viewDetails(s)}>View</button>
                    <button className="action-btn edit" onClick={() => openEditForm(s, 'student')}>Edit</button>
                    <button className="action-btn reject" onClick={() => deleteItem('students', s.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              filters={<FilterBar filters={filters} setFilters={setFilters} options={{}} />}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onView={viewDetails}
            />
          )}

          {activeTab === 'gallery' && (
            <div className="section-header">
              <h2>Gallery</h2>
              <button className="add-btn" onClick={() => openCreateForm('gallery')}>+ Add Gallery Item</button>
            </div>
          )}
          {activeTab === 'gallery' && (
            <DataTable
              data={gallery}
              columns={['ID', 'Preview', 'Title', 'Category', 'Date', 'Actions']}
              renderRow={(g) => (
                <>
                  <td>{g.id}</td>
                  <td>
                    {g.image_url ? (
                      <img 
                        src={getImageUrl(g.image_url)} 
                        alt={g.title}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : '❌'}
                  </td>
                  <td>{g.title}</td>
                  <td>{g.category || '-'}</td>
                  <td>{new Date(g.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn view" onClick={() => viewDetails(g)}>View</button>
                    <button className="action-btn reject" onClick={() => deleteItem('gallery', g.id)} disabled={actionLoading}>Delete</button>
                  </td>
                </>
              )}
              loading={loading}
              onView={viewDetails}
            />
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h2>Admin Settings</h2>
              <div className="settings-grid">
                <div className="settings-card">
                  <h3>School Information</h3>
                  <p><strong>School Name:</strong> Top View Public School</p>
                  <p><strong>Address:</strong> Manju Sadan Basdiha, Panki, Palamu, Jharkhand 822122</p>
                  <p><strong>Email:</strong> topviewpublicschool@gmail.com</p>
                  <p><strong>Phone:</strong> 9470525155</p>
                </div>
                <div className="settings-card">
                  <h3>System Statistics</h3>
                  <p><strong>Total Users:</strong> {stats?.totalUsers || 0}</p>
                  <p><strong>Total Admissions:</strong> {stats?.totalAdmissions || 0}</p>
                  <p><strong>Total Revenue:</strong> ₹{parseFloat(stats?.totalRevenue || 0).toLocaleString('en-IN')}</p>
                  <p><strong>Pending Payments:</strong> {stats?.pendingPayments || 0}</p>
                </div>
                <div className="settings-card">
                  <h3>Account</h3>
                  <p><strong>Admin Name:</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Admin Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> Administrator</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content admin-modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'reply' ? 'Reply to ' : modalMode === 'create' ? 'Create New ' : modalMode === 'edit' ? 'Edit ' : ''}
                {activeTab === 'contacts' ? selectedItem?.name : 
                 activeTab === 'notices' ? 'Notice' : 
                 activeTab === 'fees' ? 'Fee Structure' : 
                 activeTab === 'students' ? 'Student' : 
                 activeTab === 'gallery' ? 'Gallery Item' : 
                 activeTab === 'users' ? 'User' : 'Details'}
              </h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {modalMode === 'reply' && activeTab === 'contacts' ? (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setActionLoading(true);
                  try {
                    await axiosInstance.post(`/admin/contacts/${selectedItem.id}/reply`, {
                      replyMessage: formData.replyMessage,
                      subject: formData.subject
                    });
                    alert('Reply sent successfully!');
                    setShowModal(false);
                    loadTabData();
                  } catch (err) {
                    alert('Failed to send reply: ' + (err.message || 'Unknown error'));
                  } finally {
                    setActionLoading(false);
                  }
                }} className="admin-form">
                  <div className="reply-info">
                    <p><strong>To:</strong> {selectedItem?.name} ({selectedItem?.email})</p>
                    <p><strong>Subject:</strong> {selectedItem?.subject}</p>
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <input 
                      type="text" 
                      value={formData.subject || ''} 
                      onChange={e => setFormData({...formData, subject: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Reply Message *</label>
                    <textarea 
                      value={formData.replyMessage || ''} 
                      onChange={e => setFormData({...formData, replyMessage: e.target.value})} 
                      rows="8" 
                      placeholder="Write your reply here..."
                      required 
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={actionLoading}>
                      {actionLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)} disabled={actionLoading}>Cancel</button>
                  </div>
                </form>
              ) : (modalMode === 'create' || modalMode === 'edit') ? (
                <form onSubmit={handleFormSubmit} className="admin-form">
                  {/* User Form */}
                  {activeTab === 'users' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>First Name *</label>
                          <input type="text" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label>Last Name *</label>
                          <input type="text" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={modalMode === 'edit'} />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} maxLength="10" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Role</label>
                          <select value={formData.role || 'parent'} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="parent">Parent</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select value={formData.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                      {modalMode === 'create' && (
                        <p className="form-info">A temporary password will be generated and sent to the user's email.</p>
                      )}
                    </>
                  )}

                  {/* Notice Form */}
                  {activeTab === 'notices' && (
                    <>
                      <div className="form-group">
                        <label>Title *</label>
                        <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label>Content *</label>
                        <textarea value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} rows="5" required />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Priority</label>
                          <select value={formData.priority || 'normal'} onChange={e => setFormData({...formData, priority: e.target.value})}>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Target Audience</label>
                          <select value={formData.target_audience || 'all'} onChange={e => setFormData({...formData, target_audience: e.target.value})}>
                            <option value="all">All</option>
                            <option value="students">Students</option>
                            <option value="parents">Parents</option>
                            <option value="staff">Staff</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select value={formData.status || 'active'} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Fee Structure Form */}
                  {activeTab === 'fees' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Class *</label>
                          <select value={formData.class_name || ''} onChange={e => setFormData({...formData, class_name: e.target.value})} required>
                            <option value="">Select Class</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i+1} value={i+1}>Class {i+1}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Academic Year *</label>
                          <input type="text" value={formData.academic_year || ''} onChange={e => setFormData({...formData, academic_year: e.target.value})} required />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Tuition Fee</label>
                          <input type="number" value={formData.tuition_fee || 0} onChange={e => {
                            const tf = parseFloat(e.target.value) || 0;
                            setFormData({...formData, tuition_fee: tf, total_fee: tf + (formData.transport_fee || 0) + (formData.uniform_fee || 0) + (formData.exam_fee || 0) + (formData.activity_fee || 0)});
                          }} />
                        </div>
                        <div className="form-group">
                          <label>Transport Fee</label>
                          <input type="number" value={formData.transport_fee || 0} onChange={e => {
                            const trf = parseFloat(e.target.value) || 0;
                            setFormData({...formData, transport_fee: trf, total_fee: (formData.tuition_fee || 0) + trf + (formData.uniform_fee || 0) + (formData.exam_fee || 0) + (formData.activity_fee || 0)});
                          }} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Uniform Fee</label>
                          <input type="number" value={formData.uniform_fee || 0} onChange={e => {
                            const uf = parseFloat(e.target.value) || 0;
                            setFormData({...formData, uniform_fee: uf, total_fee: (formData.tuition_fee || 0) + (formData.transport_fee || 0) + uf + (formData.exam_fee || 0) + (formData.activity_fee || 0)});
                          }} />
                        </div>
                        <div className="form-group">
                          <label>Exam Fee</label>
                          <input type="number" value={formData.exam_fee || 0} onChange={e => {
                            const ef = parseFloat(e.target.value) || 0;
                            setFormData({...formData, exam_fee: ef, total_fee: (formData.tuition_fee || 0) + (formData.transport_fee || 0) + (formData.uniform_fee || 0) + ef + (formData.activity_fee || 0)});
                          }} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Activity Fee</label>
                          <input type="number" value={formData.activity_fee || 0} onChange={e => {
                            const af = parseFloat(e.target.value) || 0;
                            setFormData({...formData, activity_fee: af, total_fee: (formData.tuition_fee || 0) + (formData.transport_fee || 0) + (formData.uniform_fee || 0) + (formData.exam_fee || 0) + af});
                          }} />
                        </div>
                        <div className="form-group">
                          <label>Total Fee (Auto-calculated)</label>
                          <input type="number" value={formData.total_fee || 0} disabled />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Student Form */}
                  {activeTab === 'students' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Student Name *</label>
                          <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label>Admission Number</label>
                          <input type="text" value={formData.admission_number || ''} onChange={e => setFormData({...formData, admission_number: e.target.value})} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Class *</label>
                          <select value={formData.class_name || ''} onChange={e => setFormData({...formData, class_name: e.target.value})} required>
                            <option value="">Select Class</option>
                            {[...Array(12)].map((_, i) => (
                              <option key={i+1} value={i+1}>Class {i+1}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Date of Birth</label>
                          <input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Gender</label>
                          <select value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} maxLength="10" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Father's Name</label>
                          <input type="text" value={formData.father_name || ''} onChange={e => setFormData({...formData, father_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Mother's Name</label>
                          <input type="text" value={formData.mother_name || ''} onChange={e => setFormData({...formData, mother_name: e.target.value})} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} rows="2" />
                      </div>
                    </>
                  )}

                  {/* Gallery Form */}
                  {activeTab === 'gallery' && (
                    <>
                      <div className="form-group">
                        <label>Title *</label>
                        <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select value={formData.category || 'general'} onChange={e => setFormData({...formData, category: e.target.value})}>
                          <option value="general">General</option>
                          <option value="events">Events</option>
                          <option value="sports">Sports</option>
                          <option value="cultural">Cultural</option>
                          <option value="academic">Academic</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Image {modalMode === 'create' ? '*' : ''}</label>
                        <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} />
                        {formData.image_url && <img src={formData.image_url} alt="Current" style={{maxWidth: '100px', marginTop: '10px'}} />}
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : (modalMode === 'create' ? 'Create' : 'Update')}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)} disabled={actionLoading}>Cancel</button>
                  </div>
                </form>
              ) : (
                <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ stats, loading, setActiveTab, period, setPeriod }) => (
  <div className="dashboard-section">
    <div className="dashboard-header-row">
      <h2>Dashboard Overview</h2>
      <div className="period-filter">
        <label>Time Period:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
    
    {loading ? <p>Loading...</p> : (
      <>
        {/* Revenue KPI Cards */}
        <div className="kpi-section">
          <h3>💰 Revenue KPIs</h3>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <h3>₹{parseFloat(stats?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>₹{parseFloat(stats?.todayRevenue || 0).toLocaleString('en-IN')}</h3>
                <p>Today's Revenue</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📆</div>
              <div className="stat-info">
                <h3>₹{parseFloat(stats?.weekRevenue || 0).toLocaleString('en-IN')}</h3>
                <p>This Week</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🗓️</div>
              <div className="stat-info">
                <h3>₹{parseFloat(stats?.monthRevenue || 0).toLocaleString('en-IN')}</h3>
                <p>This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admissions KPI */}
        <div className="kpi-section">
          <h3>📝 Admission KPIs</h3>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('admissions')}>
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>{stats?.totalAdmissions || 0}</h3>
                <p>Total Applications</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('admissions')}>
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats?.pendingAdmissions || 0}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('admissions')}>
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats?.approvedAdmissions || 0}</h3>
                <p>Approved</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('admissions')}>
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats?.rejectedAdmissions || 0}</h3>
                <p>Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment KPI */}
        <div className="kpi-section">
          <h3>💳 Payment KPIs</h3>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('payments')}>
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats?.totalPayments || 0}</h3>
                <p>Total Transactions</p>
              </div>
            </div>
            <div className="stat-card success" onClick={() => setActiveTab('payments')}>
              <div className="stat-icon">✓</div>
              <div className="stat-info">
                <h3>{stats?.completedPayments || 0}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card warning" onClick={() => setActiveTab('payments')}>
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats?.pendingPayments || 0}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card danger" onClick={() => setActiveTab('payments')}>
              <div className="stat-icon">✕</div>
              <div className="stat-info">
                <h3>{stats?.failedPayments || 0}</h3>
                <p>Failed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other KPIs */}
        <div className="kpi-section">
          <h3>📊 Other KPIs</h3>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('users')}>
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats?.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('students')}>
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>{stats?.totalStudents || 0}</h3>
                <p>Total Students</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('contacts')}>
              <div className="stat-icon">📧</div>
              <div className="stat-info">
                <h3>{stats?.totalContacts || 0}</h3>
                <p>Contact Messages</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab('notices')}>
              <div className="stat-icon">📢</div>
              <div className="stat-info">
                <h3>{stats?.totalNotices || 0}</h3>
                <p>Notices Published</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Type Breakdown */}
        {stats?.paymentMethodStats && stats.paymentMethodStats.length > 0 && (
          <div className="kpi-section">
            <h3>💰 Revenue by Fee Type</h3>
            <div className="breakdown-grid">
              {stats.paymentMethodStats.map((item, idx) => (
                <div key={idx} className="breakdown-card">
                  <div className="breakdown-title">{item.fee_type || 'Other'}</div>
                  <div className="breakdown-value">₹{parseFloat(item.total || 0).toLocaleString('en-IN')}</div>
                  <div className="breakdown-count">{item.count} transactions</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admissions by Class */}
        {stats?.admissionsByClass && stats.admissionsByClass.length > 0 && (
          <div className="kpi-section">
            <h3>📚 Admissions by Class</h3>
            <div className="class-grid">
              {stats.admissionsByClass.map((item, idx) => (
                <div key={idx} className="class-card">
                  <div className="class-name">Class {item.admission_class}</div>
                  <div className="class-count">{item.count} students</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Status */}
        {stats?.contactStats && stats.contactStats.length > 0 && (
          <div className="kpi-section">
            <h3>📬 Contact Message Status</h3>
            <div className="status-grid">
              {stats.contactStats.map((item, idx) => (
                <div key={idx} className={`status-card ${item.status}`}>
                  <div className="status-count">{item.count}</div>
                  <div className="status-label">{item.status || 'Unknown'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-buttons">
            <button onClick={() => setActiveTab('admissions')}>Manage Admissions</button>
            <button onClick={() => setActiveTab('payments')}>View Payments</button>
            <button onClick={() => setActiveTab('phonepe')}>PhonePe Status</button>
            <button onClick={() => setActiveTab('fees')}>Manage Fees</button>
            <button onClick={() => setActiveTab('contacts')}>View Contacts</button>
            <button onClick={() => setActiveTab('notices')}>Publish Notice</button>
          </div>
        </div>
      </>
    )}
  </div>
);

// Filter Bar Component
const FilterBar = ({ filters, setFilters, options }) => (
  <div className="filter-bar">
    {options.status && (
      <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
        <option value="">All Status</option>
        {options.status.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
    )}
    {options.role && (
      <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}>
        <option value="">All Roles</option>
        {options.role.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
      </select>
    )}
    <input 
      type="text" 
      placeholder="Search..." 
      value={filters.search} 
      onChange={e => setFilters({...filters, search: e.target.value})}
    />
  </div>
);

// Data Table Component
const DataTable = ({ title, data, columns, renderRow, filters, loading, pagination, setPagination, onView }) => (
  <div className="data-section">
    <h2>{title}</h2>
    {filters}
    <div className="data-table-container">
      {loading ? <p>Loading...</p> : data.length === 0 ? <p>No data found</p> : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item.id || i}>{renderRow(item)}</tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.total > 0 && (
            <div className="pagination">
              <button disabled={pagination.page === 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</button>
              <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
              <button disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

export default Admin;
