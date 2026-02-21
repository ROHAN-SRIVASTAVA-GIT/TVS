import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLoader from './components/GlobalLoader';
import AdmissionBanner from './components/AdmissionBanner';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Admission from './pages/Admission';
import Fees from './pages/Fees';
import Payment from './pages/Payment';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import NoticeBoard from './pages/NoticeBoard';
import Faculty from './pages/Faculty';
import NotFound from './pages/NotFound';
import PaymentCallback from './pages/PaymentCallback';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LoadingProvider>
          <GlobalLoader />
          <ScrollToTop />
          <Navbar />
          <AdmissionBanner />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/admission" element={<Admission />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/notices" element={<NoticeBoard />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/payment-callback" element={<PaymentCallback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </LoadingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
