import React from 'react'

const PrivacyPolicyPage = () => {
  return (
    <div style={{ background: '#05070d', color: '#f8fafc', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', color: '#ff6b35', marginBottom: '0.5rem' }}>Privacy Policy for Eklav</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Effective Date: May 2026</p>

        <p style={{ lineHeight: 1.75, marginBottom: '1.25rem' }}>
          Eklav (“we”, “our”, or “us”) values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Eklav mobile application and website.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Information We Collect</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1rem' }}>
          We may collect:
        </p>
        <ul style={{ marginLeft: '1.4rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Resume uploads</li>
          <li>Profile information</li>
          <li>Course activity</li>
          <li>Interview recordings</li>
          <li>Device information</li>
        </ul>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>How We Use Information</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1rem' }}>
          We use collected information to:
        </p>
        <ul style={{ marginLeft: '1.4rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          <li>Provide learning services</li>
          <li>Conduct AI interviews</li>
          <li>Improve user experience</li>
          <li>Send notifications about courses, jobs, and exams</li>
          <li>Track student progress</li>
        </ul>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Camera and Microphone</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          Eklav may request access to:
        </p>
        <ul style={{ marginLeft: '1.4rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          <li>Camera for interview recordings</li>
          <li>Microphone for communication and AI interview features</li>
        </ul>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Data Security</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          We take reasonable measures to protect your information and prevent unauthorized access.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Third-Party Services</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          We may use third-party services such as:
        </p>
        <ul style={{ marginLeft: '1.4rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          <li>Google Play Services</li>
          <li>Firebase</li>
          <li>Analytics tools</li>
        </ul>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Children&apos;s Privacy</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          Eklav is not intended for children under 13 years of age.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '0.5rem' }}>
          Website: <a href="https://eklav.in" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>https://eklav.in</a>
        </p>
        <p style={{ lineHeight: 1.75 }}>
          Email: <a href="mailto:admin@eklav.in" style={{ color: '#f97316' }}>admin@eklav.in</a>
        </p>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
