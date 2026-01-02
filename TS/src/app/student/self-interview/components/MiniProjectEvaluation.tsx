import { useAuthContext } from '@/context/useAuthContext'
import React, { useState } from 'react'

const MiniProjectEvaluation = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthContext()
  const token = user?.token

  const handleSubmit = async () => {
    setFeedback('')
    setRating(null)

    if (!title || !description || !file) {
      alert('Please fill all fields and upload your project file.')
      return
    }

    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    const allowedExtensions = ['.zip', '.pdf', '.doc', '.docx']
    const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(`.${fileExtension}`)) {
      alert('Invalid file type. Please upload a .zip, .pdf, .doc, or .docx file.')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('projectFile', file)

    const res = await fetch(`${baseURL}/evaluate-project-with-file`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await res.json()
    if (res.ok) {
      setFeedback(data.result.aiFeedback)
      setRating(data.result.aiRating)
    } else {
      setFeedback('Evaluation failed.')
    }

    setLoading(false)
  }

  return (
    <div className="container my-4">
      <h3 className="mb-4 text-center">🎓 Mini Project AI Evaluation</h3>

      <div className="mb-3">
        <label>Project Title</label>
        <input
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Online Food Ordering App"
        />
        <small className="form-text text-secondary">
          A short and descriptive name for your project.
        </small>
      </div>

      <div className="mb-3">
        <label>Description</label>
        <textarea
          className="form-control"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project, purpose, and tech stack..."
        />
        <small className="form-text text-secondary">
          Include purpose, technologies used, and what your project aims to solve.
        </small>
      </div>

      <div className="mb-3">
        <label>Upload Project File (.zip, .pdf, .docx)</label>
        <input
          type="file"
          className="form-control"
          accept=".zip,.pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <small className="form-text text-secondary">
          Upload a .zip containing your code or a report file (.pdf/.docx). Include README and relevant files.
        </small>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Evaluating...' : 'Submit for Evaluation'}
      </button>

      {feedback && (
        <div className="alert alert-info mt-4">
          <h5>🧠 AI Feedback:</h5>
          <p>{feedback}</p>
          <h6>⭐ Rating: {rating}/10</h6>
        </div>
      )}
    </div>
  )
}

export default MiniProjectEvaluation
