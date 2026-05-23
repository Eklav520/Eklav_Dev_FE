import React from 'react'

const DeleteAccountPage = () => {
  return (
    <div style={{ background: '#05070d', color: '#f8fafc', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', color: '#ff6b35', marginBottom: '0.5rem' }}>Account Deletion Request</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Users can request account deletion by emailing <a href="mailto:admin@eklav.in" style={{ color: '#f97316' }}>admin@eklav.in</a> with their registered email ID.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>How to Request Account Deletion</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          To request deletion of your Eklav account, please send an email from your registered email address to <a href="mailto:admin@eklav.in" style={{ color: '#f97316' }}>admin@eklav.in</a>. Include the email ID associated with your account and a clear request to delete your account.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>What Happens Next</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          After verification, Eklav will delete the account and associated user data within 7 business days.
        </p>

        <h2 style={{ color: '#fbbf24', fontSize: '1.6rem', marginTop: '2rem', marginBottom: '1rem' }}>Need Help?</h2>
        <p style={{ lineHeight: 1.75, marginBottom: '1.5rem' }}>
          If you have any questions about the account deletion process, contact us at <a href="mailto:admin@eklav.in" style={{ color: '#f97316' }}>admin@eklav.in</a>.
        </p>
      </div>
    </div>
  )
}

export default DeleteAccountPage
