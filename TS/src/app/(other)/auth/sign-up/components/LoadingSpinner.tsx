import React from 'react'
import { Spinner } from 'react-bootstrap'

interface LoadingSpinnerProps {
  size?: 'sm' | undefined
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
  message?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  variant = 'primary',
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`d-flex flex-column align-items-center justify-content-center p-5 ${className}`}>
      <Spinner
        animation="border"
        role="status"
        size={size}
        variant={variant}
        className="mb-3"
      >
        <span className="visually-hidden">{message}</span>
      </Spinner>
      {message && (
        <p className="text-muted mt-2">{message}</p>
      )}
    </div>
  )
}

export default LoadingSpinner