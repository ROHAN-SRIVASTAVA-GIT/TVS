import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      // Store the orderId for Admission page to pick up
      localStorage.setItem('pendingPaymentOrderId', orderId);
    }
    // Redirect to admission page
    navigate('/admission', { replace: true });
  }, [navigate, searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting...</p>
    </div>
  );
};

export default PaymentCallback;
