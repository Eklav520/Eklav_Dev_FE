// CertificateGenerator.tsx
import React, { useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { Button } from 'react-bootstrap'

interface CertificateProps {
  username: string
  courseName: string
  averageRating: number
}

const CertificateGenerator: React.FC<CertificateProps> = ({ username, courseName, averageRating }) => {
  const certRef = useRef<HTMLDivElement>(null)

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    for (let i = 0; i < fullStars; i++) stars.push(<FaStar key={`f-${i}`} color="gold" />)
    if (hasHalfStar) stars.push(<FaStarHalfAlt key="half" color="gold" />)
    for (let i = 0; i < emptyStars; i++) stars.push(<FaRegStar key={`e-${i}`} color="gold" />)

    return <span className="fs-5">{stars}</span>
  }

  const exportPDF = async () => {
    if (!certRef.current) return

    const canvas = await html2canvas(certRef.current)
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('landscape', 'pt', 'a4')
    pdf.addImage(imgData, 'PNG', 20, 20, 800, 560)
    pdf.save(`${username}-certificate.pdf`)
  }

  return (
    <div className="text-center mt-5">
      <div
        ref={certRef}
        style={{
          width: '800px',
          margin: 'auto',
          padding: '40px',
          border: '6px double #0d6efd',
          borderRadius: '15px',
          backgroundColor: '#fff',
        }}
      >
        <h1 style={{ color: '#0d6efd' }}>🎓 Certificate of Achievement</h1>
        <p className="mt-4 fs-4">
          This is to certify that <strong>{username}</strong>
        </p>
        <p className="fs-5">
          has successfully completed the <strong>{courseName}</strong> interview
        </p>
        <p className="fs-5">
          with an average rating of <strong>{averageRating}/10</strong>
        </p>
        <div className="mt-2">{renderStars(averageRating)}</div>
        <p className="mt-4">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <Button className="mt-4" variant="success" onClick={exportPDF}>
        📄 Download Certificate as PDF
      </Button>
    </div>
  )
}

export default CertificateGenerator
