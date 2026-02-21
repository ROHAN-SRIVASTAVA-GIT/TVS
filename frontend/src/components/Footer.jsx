import React from 'react';
import './Footer.css';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>About School</h3>
          <p>Top View Public School is committed to providing quality education with modern facilities and experienced faculty.</p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/admission">Admission</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Info</h3>
          <div className="contact-info">
            <p><FiPhone /> 9470525155 / 9199204566</p>
            <p><FiMail /> topviewpublicschool@gmail.com</p>
            <p><FiMapPin /> Manju Sadan Basdiha, Panki, Palamu, Jharkhand 822122</p>
          </div>
        </div>

        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-links">
            <span className="social-link">Facebook</span>
            <span className="social-link">Instagram</span>
            <span className="social-link">Twitter</span>
            <span className="social-link">YouTube</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Top View Public School. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
