import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import './NoticeBoard.css';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await axiosInstance.get('/notices');
      setNotices(response.data.notices || demoNotices);
    } catch (err) {
      setNotices(demoNotices);
    } finally {
      setLoading(false);
    }
  };

  const demoNotices = [
    {
      id: 1,
      title: 'Annual Examination Schedule',
      content: 'Annual examinations will be held from March 15 to April 10, 2026. Time table has been displayed on the notice board.',
      category: 'Examination',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'School Holiday Announcement',
      content: 'The school will remain closed on February 26 for Maha Shivaratri. Regular classes will resume on February 27.',
      category: 'Holiday',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Sports Day Event',
      content: 'Annual Sports Day will be held on March 5, 2026. All students are requested to participate.',
      category: 'Event',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Parent-Teacher Meeting',
      content: 'PTM will be conducted on February 22, 2026. All parents are requested to participate.',
      category: 'Meeting',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Science Exhibition',
      content: 'Inter-class Science Exhibition on March 20, 2026. All classes to participate.',
      category: 'Event',
      created_at: new Date().toISOString()
    }
  ];

  return (
    <div className="notice-container">
      <div className="notice-header">
        <h1>Notice Board</h1>
        <p>Latest announcements and updates</p>
      </div>

      {loading ? (
        <div className="loading">Loading notices...</div>
      ) : (
        <div className="notices-grid">
          {notices.map((notice) => (
            <div key={notice.id} className="notice-card">
              <div className="notice-category">{notice.category || 'General'}</div>
              <h3>{notice.title}</h3>
              <p>{notice.content}</p>
              <div className="notice-date">
                {new Date(notice.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
