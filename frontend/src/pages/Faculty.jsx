import React from 'react';
import './Faculty.css';

const Faculty = () => {
  const faculty = [
    {
      id: 1,
      name: 'Dr. Raj Kumar',
      position: 'Principal',
      qualification: 'M.A, B.Ed, Ph.D',
      experience: '25+ years',
      subject: 'Administration'
    },
    {
      id: 2,
      name: 'Ms. Priya Singh',
      position: 'Vice Principal',
      qualification: 'M.Sc, B.Ed',
      experience: '18+ years',
      subject: 'Science'
    },
    {
      id: 3,
      name: 'Mr. Amit Kumar',
      position: 'Senior Teacher',
      qualification: 'M.A, B.Ed',
      experience: '15+ years',
      subject: 'English'
    },
    {
      id: 4,
      name: 'Mrs. Neha Sharma',
      position: 'Teacher',
      qualification: 'B.Sc, B.Ed',
      experience: '10+ years',
      subject: 'Mathematics'
    },
    {
      id: 5,
      name: 'Mr. Vikram Patel',
      position: 'Teacher',
      qualification: 'B.A, B.Ed',
      experience: '8+ years',
      subject: 'Social Studies'
    },
    {
      id: 6,
      name: 'Ms. Ananya Verma',
      position: 'Teacher',
      qualification: 'B.Sc, B.Ed',
      experience: '7+ years',
      subject: 'Science'
    }
  ];

  return (
    <div className="faculty-container">
      <div className="faculty-header">
        <h1>Our Faculty</h1>
        <p>Dedicated and Experienced Teachers</p>
      </div>

      <div className="faculty-grid">
        {faculty.map((member) => (
          <div key={member.id} className="faculty-card">
            <div className="avatar">
              <span>{member.name.charAt(0)}</span>
            </div>
            <h3>{member.name}</h3>
            <p className="position">{member.position}</p>
            <div className="details">
              <p><strong>Subject:</strong> {member.subject}</p>
              <p><strong>Qualification:</strong> {member.qualification}</p>
              <p><strong>Experience:</strong> {member.experience}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="faculty-info">
        <h2>Why Choose Our Faculty?</h2>
        <div className="info-grid">
          <div className="info-item">
            <h4>👨‍🎓 Highly Qualified</h4>
            <p>All teachers have relevant degrees and certifications</p>
          </div>
          <div className="info-item">
            <h4>💼 Experienced</h4>
            <p>Average 15+ years of teaching experience</p>
          </div>
          <div className="info-item">
            <h4>🎯 Student-Focused</h4>
            <p>Dedicated to individual student development</p>
          </div>
          <div className="info-item">
            <h4>📚 Continuous Learning</h4>
            <p>Regular training and professional development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faculty;
