import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo16k.png';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero">
      <div className="hero-content">
        <img src={logo} alt="Top View Public School" className="hero-logo" />
        <h1 className="hero-title">Welcome to Top View Public School</h1>
        <p className="hero-subtitle">Quality Education for a Bright Future</p>
        <div className="hero-buttons">
          <Link to="/admission" className="btn btn-primary">Apply Now</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
          <Link to="/about" className="btn btn-outline">Learn More</Link>
        </div>
      </div>
      <div className="hero-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>
    </div>
  );
};

export default HeroSection;
