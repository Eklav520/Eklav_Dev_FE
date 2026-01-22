import React, { useState, useEffect, useRef } from 'react'
import { Form } from 'react-bootstrap'
import { FaSearch, FaTimes, FaCheck } from 'react-icons/fa'

interface College {
    _id: string
    name: string
    address: string
    pincode: string
    logo?: string
}

interface CollegeSearchProps {
    onSelect: (college: College | null) => void
    error?: any
    value?: string
}


const CollegeSearch: React.FC<CollegeSearchProps> = ({ onSelect, error, value = '' }) => {
    const [query, setQuery] = useState(value)
    const [results, setResults] = useState<College[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const baseURL = import.meta.env.VITE_API_BASE_URL

    useEffect(() => {
        const fetchColleges = async () => {
            if (query.trim().length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const response = await fetch(`${baseURL}/api/colleges/search?q=${encodeURIComponent(query)}`)
                if (response.ok) {
                    const data = await response.json()
                    setResults(data)
                    setShowDropdown(true)
                }
            } catch (error) {
                console.error('Error fetching colleges:', error)
            } finally {
                setLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchColleges, 300)
        return () => clearTimeout(timeoutId)
    }, [query, baseURL])

    useEffect(() => {
        setQuery(value || '')
        if (!value) {
            setSelectedCollege(null)
        }
    }, [value])


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setTimeout(() => setShowDropdown(false), 0)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

const handleSelect = (college: College) => {
  const fullValue = `${college.name}, ${college.address}, ${college.pincode}`

  setQuery(fullValue)
  setSelectedCollege(college)

  onSelect(college) // ✅ send ONLY college

  setShowDropdown(false)
}



  const handleClear = () => {
  setQuery('')
  setSelectedCollege(null)
  setResults([])
  setShowDropdown(false)
  onSelect(null)
}


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)

        // 🔥 User edited input → clear selected college
        if (selectedCollege) {
            setSelectedCollege(null)
            onSelect(null)
        }
    }


    return (
        <div ref={wrapperRef} className="position-relative">
            <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                    {loading ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <FaSearch className="text-muted" />
                    )}
                </span>
                <Form.Control
                    type="text"
                    placeholder="Search for your college..."
                    value={query}
                    onChange={handleChange}
                    onFocus={() => query.length >= 2 && setShowDropdown(true)}
                    className={`border-start-0 ${error ? 'is-invalid' : ''}`}
                    style={{ paddingLeft: '0' }}
                />
                {query && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary border-start-0"
                        onClick={handleClear}
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            {query.length === 1 && (
                <small className="text-muted mt-1 d-block">
                    Type at least 2 characters to search
                </small>
            )}

            {selectedCollege && (
                <div className="d-flex align-items-center gap-2 mt-2">
                    <FaCheck className="text-success" />
                    <small className="text-success">College selected</small>
                </div>
            )}

            {error && !selectedCollege && (
                <small className="text-danger mt-1 d-block">
                    {error.message}
                </small>
            )}

            {showDropdown && results.length > 0 && (
                <div className="dropdown-menu show w-100 mt-1 shadow" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {results.map((college) => (
                        <button
                            type="button"
                            className="dropdown-item text-start py-2"
                            onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelect(college)
                            }}
                        >
                            <div className="fw-semibold">{college.name}</div>
                            <small className="text-muted">
                                {college.address}, {college.pincode}
                            </small>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && query.length >= 2 && results.length === 0 && !loading && (
                <div className="dropdown-menu show w-100 mt-1">
                    <div className="dropdown-item text-muted py-2">
                        No colleges found. Try a different search term.
                    </div>
                </div>
            )}
        </div>
    )
}

export default CollegeSearch