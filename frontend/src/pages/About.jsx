import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <div className="about-hero">
        <div className="about-content">
          <h1>About Top View Public School</h1>
          <p>Empowering Minds, Building Futures</p>
        </div>
      </div>

      <section className="about-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p>To provide quality education that develops the intellectual, physical, emotional, and moral faculties of our students, preparing them to become responsible and productive members of society.</p>
        </div>
      </section>

      <section className="about-section alt">
        <div className="container">
          <h2>Our Vision</h2>
          <p>To be a leading educational institution that fosters excellence, creativity, and character development in all our students, creating informed, responsible, and compassionate global citizens.</p>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Integrity</h3>
              <p>We believe in honesty and strong moral principles</p>
            </div>
            <div className="value-card">
              <h3>Excellence</h3>
              <p>We strive for the highest standards in everything we do</p>
            </div>
            <div className="value-card">
              <h3>Respect</h3>
              <p>We value diversity and treat everyone with dignity</p>
            </div>
            <div className="value-card">
              <h3>Responsibility</h3>
              <p>We encourage students to be accountable and ethical</p>
            </div>
          </div>
        </div>
      </section>

      <section className="facilities-section">
        <div className="container">
          <h2>Our Facilities</h2>
          <div className="facilities-grid">
            <div className="facility">
              <h3>🏫 Modern Classrooms</h3>
              <p>Well-equipped classrooms with smart boards and learning resources</p>
            </div>
            <div className="facility">
              <h3>🔬 Science Labs</h3>
              <p>Fully equipped laboratories for practical learning</p>
            </div>
            <div className="facility">
              <h3>📚 Library</h3>
              <p>Comprehensive library with thousands of books and digital resources</p>
            </div>
            <div className="facility">
              <h3>🎮 Computer Lab</h3>
              <p>Advanced computing facilities for tech education</p>
            </div>
            <div className="facility">
              <h3>⚽ Sports Complex</h3>
              <p>Complete sports facilities for various games and physical education</p>
            </div>
            <div className="facility">
              <h3>🎨 Art & Music Room</h3>
              <p>Dedicated spaces for creative and artistic expression</p>
            </div>
          </div>
        </div>
      </section>

      <section className="achievements">
        <div className="container">
          <h2>Our Achievements</h2>
          <ul className="achievement-list">
            <li>CBSE Affiliation since 2000</li>
            <li>Consistent 95%+ pass rate in board exams</li>
            <li>Winner of National School Excellence Award 2022</li>
            <li>Top rank in state-level science competitions</li>
            <li>Active in sports, winning multiple state championships</li>
            <li>Strong focus on community service and social responsibility</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default About;
