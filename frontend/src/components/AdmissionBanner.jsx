import React from 'react';
import { Link } from 'react-router-dom';
import './AdmissionBanner.css';

const AdmissionBanner = () => {
  return (
    <div className="admission-banner">
      <div className="admission-banner-content">
        <span className="admission-icon">🎓</span>
        <span className="admission-text">
          Admissions are now open for the Academic Session 2026-2027! 
          Limited seats available. 
          <Link to="/admission" className="admission-link">
            Apply Now →
          </Link>
        </span>
      </div>
    </div>
  );
};

export default AdmissionBanner;
