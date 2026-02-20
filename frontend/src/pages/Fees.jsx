import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import './Fees.css';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axiosInstance.get('/fees/structures');
      setFees(response.data || []);
    } catch (err) {
      setError('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const demoFees = [
    {
      id: 1,
      class: 'NUR',
      tuition_fee: 2000,
      transport_fee: 500,
      uniform_fee: 1000,
      exam_fee: 300,
      activity_fee: 200,
      total_fee: 4000
    },
    {
      id: 2,
      class: 'LKG',
      tuition_fee: 2000,
      transport_fee: 500,
      uniform_fee: 1000,
      exam_fee: 300,
      activity_fee: 200,
      total_fee: 4000
    },
    {
      id: 3,
      class: 'UKG',
      tuition_fee: 2500,
      transport_fee: 500,
      uniform_fee: 1200,
      exam_fee: 300,
      activity_fee: 200,
      total_fee: 4700
    },
    {
      id: 4,
      class: 'I',
      tuition_fee: 3000,
      transport_fee: 600,
      uniform_fee: 1200,
      exam_fee: 400,
      activity_fee: 300,
      total_fee: 5500
    },
    {
      id: 5,
      class: 'II',
      tuition_fee: 3000,
      transport_fee: 600,
      uniform_fee: 1200,
      exam_fee: 400,
      activity_fee: 300,
      total_fee: 5500
    },
    {
      id: 6,
      class: 'III',
      tuition_fee: 3500,
      transport_fee: 600,
      uniform_fee: 1500,
      exam_fee: 500,
      activity_fee: 300,
      total_fee: 6400
    },
    {
      id: 7,
      class: 'IV',
      tuition_fee: 4000,
      transport_fee: 700,
      uniform_fee: 1500,
      exam_fee: 500,
      activity_fee: 400,
      total_fee: 7100
    },
    {
      id: 8,
      class: 'V',
      tuition_fee: 4000,
      transport_fee: 700,
      uniform_fee: 1500,
      exam_fee: 500,
      activity_fee: 400,
      total_fee: 7100
    },
    {
      id: 9,
      class: 'VI',
      tuition_fee: 5000,
      transport_fee: 800,
      uniform_fee: 2000,
      exam_fee: 600,
      activity_fee: 500,
      total_fee: 8900
    },
    {
      id: 10,
      class: 'VII',
      tuition_fee: 5500,
      transport_fee: 800,
      uniform_fee: 2000,
      exam_fee: 600,
      activity_fee: 500,
      total_fee: 9400
    },
    {
      id: 11,
      class: 'VIII',
      tuition_fee: 6000,
      transport_fee: 800,
      uniform_fee: 2200,
      exam_fee: 700,
      activity_fee: 600,
      total_fee: 10300
    }
  ];

  const displayFees = fees.length > 0 ? fees : demoFees;

  return (
    <div className="fees-container">
      <div className="fees-header">
        <h1>Fee Structure</h1>
        <p>Transparent and Affordable Fees for All Classes</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading fee structures...</div>
      ) : (
        <div className="fees-content">
          <div className="table-responsive">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Tuition Fee</th>
                  <th>Transport Fee</th>
                  <th>Uniform Fee</th>
                  <th>Exam Fee</th>
                  <th>Activity Fee</th>
                  <th>Total Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayFees.map((fee) => (
                  <tr key={fee.id || fee.class}>
                    <td className="class-name">Class {fee.class}</td>
                    <td>₹{fee.tuition_fee}</td>
                    <td>₹{fee.transport_fee}</td>
                    <td>₹{fee.uniform_fee}</td>
                    <td>₹{fee.exam_fee}</td>
                    <td>₹{fee.activity_fee}</td>
                    <td className="total-fee">₹{fee.total_fee}</td>
                    <td>
                      <a href="/register" className="pay-btn">Apply</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fee-info">
            <h3>Fee Payment Information</h3>
            <ul>
              <li>Fees are payable annually in advance</li>
              <li>Payment can be made online or in cash at the school office</li>
              <li>Concessions are available for deserving students</li>
              <li>Late fees will be charged for delayed payments</li>
              <li>Refund policy as per school rules</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
