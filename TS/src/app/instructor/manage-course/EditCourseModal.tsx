// components/course/EditCourseModal.tsx
import { Modal, Button, Form, Tab, Nav, Row, Col, Badge, Spinner, Alert, InputGroup, Card } from 'react-bootstrap'
import { 
  FaRegEdit, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaLink,
  FaImage,
  FaVideo,
  FaList,
  FaQuestionCircle,
  FaPlus,
  FaTimes,
  FaEye,
  FaHashtag,
  FaDollarSign,
  FaTag,
  FaBold,
  FaItalic,
  FaUnderline,
  FaHeading,
  FaParagraph,
  FaListUl,
  FaListOl,
  FaCode,
  FaUndo,
  FaRedo,
  FaEyeDropper,
  FaHighlighter,
  FaLink as FaLinkIcon,
  FaQuoteRight,
  FaTable,
  FaPlayCircle,
  FaTrash,
  FaEdit,
  FaDownload,
  FaExternalLinkAlt,
  FaUpload
} from 'react-icons/fa'
import { useState, useEffect, useRef } from 'react'

interface Video {
  _id: string
  video: string
  description: string
  caseStudy?: string | null
  progress?: number
}

interface FAQ {
  question: string
  answer: string
}

interface Quiz {
  question: string
  options: string[]
  answer: string
}

interface Course {
  _id: string
  title: string
  shortDescription?: string
  category: string[] | string
  level?: string[] | string
  language?: string[] | string
  isFeatured?: boolean
  features?: string[]
  previewVideo?: string
  duration?: string
  totalLectures?: string
  price?: string | number
  discountPrice?: string | number
  description?: string
  image?: string
  videoUrl?: string[]
  videos: Video[]
  addFAQ: FAQ[]
  quiz?: Quiz[]
  createdAt?: string
  updatedAt?: string
  enrolledStudents?: number
  rating?: number
  status?: 'Draft' | 'Published' | 'Archived'
}

interface EditCourseModalProps {
  show: boolean
  onHide: () => void
  selectedCourse: Course | null
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onFeaturesChange: (featuresText: string) => void
  onVideoUrlChange: (urlsText: string) => void
  onFAQChange: (index: number, field: keyof FAQ, value: string) => void
  onAddFAQ: () => void
  onRemoveFAQ: (index: number) => void
  onUpdate: () => void
  isUpdating: boolean
  // Add these new props for video management
  onVideoChange?: (index: number, field: keyof Video, value: string) => void
  onAddVideo?: () => void
  onRemoveVideo?: (index: number) => void
  onUploadVideo?: (file: File, description: string) => Promise<void>
}

const EditCourseModal = ({
  show,
  onHide,
  selectedCourse,
  onFormChange,
  onFeaturesChange,
  onVideoUrlChange,
  onFAQChange,
  onAddFAQ,
  onRemoveFAQ,
  onUpdate,
  isUpdating,
  onVideoChange,
  onAddVideo,
  onRemoveVideo,
  onUploadVideo
}: EditCourseModalProps) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [undoHistory, setUndoHistory] = useState<string[]>([])
  const [redoHistory, setRedoHistory] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 })
  const [isHtmlValid, setIsHtmlValid] = useState(true)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoDescription, setVideoDescription] = useState('')
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const getCategoryText = (category: string[] | string) => {
    return Array.isArray(category) ? category.join(', ') : category
  }

  // Handle textarea changes with undo/redo support
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedCourse) return
    
    const value = e.target.value
    
    // Save to undo history
    setUndoHistory(prev => [...prev, selectedCourse.description || ''])
    setRedoHistory([])
    
    // Validate HTML
    validateHtml(value)
    
    // Update form
    onFormChange({
      target: {
        name: 'description',
        value: value,
        type: 'text'
      }
    } as any)
  }

  // Validate HTML
  const validateHtml = (html: string) => {
    try {
      // Simple HTML validation
      const div = document.createElement('div')
      div.innerHTML = html
      setIsHtmlValid(true)
    } catch (e) {
      setIsHtmlValid(false)
    }
  }

  // Undo functionality
  const handleUndo = () => {
    if (!selectedCourse || undoHistory.length === 0) return
    
    const lastValue = undoHistory[undoHistory.length - 1]
    const newUndoHistory = undoHistory.slice(0, -1)
    
    setRedoHistory(prev => [selectedCourse.description || '', ...prev])
    setUndoHistory(newUndoHistory)
    
    onFormChange({
      target: {
        name: 'description',
        value: lastValue,
        type: 'text'
      }
    } as any)
    
    if (textareaRef.current) {
      textareaRef.current.value = lastValue
    }
  }

  // Redo functionality
  const handleRedo = () => {
    if (!selectedCourse || redoHistory.length === 0) return
    
    const nextValue = redoHistory[0]
    const newRedoHistory = redoHistory.slice(1)
    
    setUndoHistory(prev => [...prev, selectedCourse.description || ''])
    setRedoHistory(newRedoHistory)
    
    onFormChange({
      target: {
        name: 'description',
        value: nextValue,
        type: 'text'
      }
    } as any)
    
    if (textareaRef.current) {
      textareaRef.current.value = nextValue
    }
  }

  // Formatting functions
  const wrapSelectionWithTag = (tag: string, isSelfClosing = false, attributes = '') => {
    if (!selectedCourse || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)
    
    let formattedText = ''
    if (isSelfClosing) {
      formattedText = `<${tag} ${attributes}/>`
    } else if (selectedText) {
      formattedText = `<${tag} ${attributes}>${selectedText}</${tag}>`
    } else {
      formattedText = `<${tag} ${attributes}></${tag}>`
    }
    
    const newValue = text.substring(0, start) + formattedText + text.substring(end)
    
    // Save to undo history
    setUndoHistory(prev => [...prev, text])
    setRedoHistory([])
    
    onFormChange({
      target: {
        name: 'description',
        value: newValue,
        type: 'text'
      }
    } as any)
    
    // Update textarea value and cursor position
    textarea.value = newValue
    const newCursorPos = start + formattedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
    
    validateHtml(newValue)
  }

  const insertText = (text: string) => {
    if (!selectedCourse || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = textarea.value
    
    const newValue = currentText.substring(0, start) + text + currentText.substring(end)
    
    // Save to undo history
    setUndoHistory(prev => [...prev, currentText])
    setRedoHistory([])
    
    onFormChange({
      target: {
        name: 'description',
        value: newValue,
        type: 'text'
      }
    } as any)
    
    textarea.value = newValue
    const newCursorPos = start + text.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
    
    validateHtml(newValue)
  }

  const insertList = (type: 'ul' | 'ol', items = 3) => {
    const itemsArray = Array.from({ length: items }, (_, i) => `  <li>Item ${i + 1}</li>`)
    const list = `<${type}>\n${itemsArray.join('\n')}\n</${type}>\n`
    insertText(list)
  }

  const insertTable = (rows = 3, cols = 3) => {
    let table = '<table class="table table-bordered">\n'
    
    // Header row
    table += '  <thead>\n    <tr>\n'
    for (let c = 1; c <= cols; c++) {
      table += `      <th>Header ${c}</th>\n`
    }
    table += '    </tr\n  </thead>\n'
    
    // Body rows
    table += '  <tbody>\n'
    for (let r = 1; r <= rows; r++) {
      table += '    <tr>\n'
      for (let c = 1; c <= cols; c++) {
        table += `      <td>Cell ${r}-${c}</td>\n`
      }
      table += '    </tr>\n'
    }
    table += '  </tbody>\n</table>\n'
    
    insertText(table)
  }

  // Clear formatting
  const clearFormatting = () => {
    if (!selectedCourse || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)
    
    // Remove HTML tags from selected text
    const cleanedText = selectedText.replace(/<[^>]*>/g, '')
    
    const newValue = text.substring(0, start) + cleanedText + text.substring(end)
    
    setUndoHistory(prev => [...prev, text])
    setRedoHistory([])
    
    onFormChange({
      target: {
        name: 'description',
        value: newValue,
        type: 'text'
      }
    } as any)
    
    textarea.value = newValue
    const newCursorPos = start + cleanedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
    
    validateHtml(newValue)
  }

  // Auto format (indent, clean up)
  const autoFormat = () => {
    if (!selectedCourse || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const text = textarea.value
    
    // Basic auto-formatting
    let formattedText = text
      .replace(/<(\w+)([^>]*)>/g, '\n<$1$2>') // Add newline before opening tags
      .replace(/<\/(\w+)>/g, '</$1>\n') // Add newline after closing tags
      .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
      .trim()
    
    // Indent nested elements
    let indentLevel = 0
    const lines = formattedText.split('\n')
    formattedText = lines.map(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1)
      }
      
      const indent = '  '.repeat(indentLevel)
      const result = indent + trimmed
      
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indentLevel++
      }
      
      return result
    }).join('\n')
    
    setUndoHistory(prev => [...prev, text])
    setRedoHistory([])
    
    onFormChange({
      target: {
        name: 'description',
        value: formattedText,
        type: 'text'
      }
    } as any)
    
    textarea.value = formattedText
    textarea.focus()
    
    validateHtml(formattedText)
  }

  // Save cursor position
  const handleTextareaSelect = () => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    setCursorPosition({
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    })
  }

  // Preview scroll synchronization
  useEffect(() => {
    if (selectedCourse && previewRef.current && textareaRef.current) {
      const scrollRatio = textareaRef.current.scrollTop / (textareaRef.current.scrollHeight - textareaRef.current.clientHeight)
      const previewScrollTop = scrollRatio * (previewRef.current.scrollHeight - previewRef.current.clientHeight)
      previewRef.current.scrollTop = previewScrollTop
    }
  }, [selectedCourse?.description])

  // Initialize undo history
  useEffect(() => {
    if (selectedCourse?.description) {
      setUndoHistory([selectedCourse.description])
      setRedoHistory([])
      validateHtml(selectedCourse.description)
    }
  }, [selectedCourse?.description])

  // Handle video file selection
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (mp4, mov, avi, etc.)')
        return
      }
      
      // Check file size (limit to 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File size too large. Please select a video under 500MB')
        return
      }
      
      setSelectedVideoFile(file)
      // Set default description from filename
      setVideoDescription(file.name.replace(/\.[^/.]+$/, "")) // Remove extension
    }
  }

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !onUploadVideo) {
      alert('Please select a video file first')
      return
    }
    
    if (!videoDescription.trim()) {
      alert('Please enter a description for the video')
      return
    }
    
    try {
      setUploadingVideo(true)
      setUploadProgress(0)
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      await onUploadVideo(selectedVideoFile, videoDescription)
      
      setUploadProgress(100)
      setTimeout(() => {
        setUploadingVideo(false)
        setUploadProgress(0)
        setSelectedVideoFile(null)
        setVideoDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 500)
      
      clearInterval(interval)
    } catch (error) {
      setUploadingVideo(false)
      alert('Failed to upload video: ' + (error as Error).message)
    }
  }

  // Handle video description change
  const handleVideoDescriptionChange = (index: number, value: string) => {
    if (onVideoChange) {
      onVideoChange(index, 'description', value)
    }
  }

  // Handle video URL change
  const handleVideoUrlChange = (index: number, value: string) => {
    if (onVideoChange) {
      onVideoChange(index, 'video', value)
    }
  }

  // Handle removing a video
  const handleRemoveVideo = (index: number) => {
    if (onRemoveVideo && window.confirm('Are you sure you want to remove this video?')) {
      onRemoveVideo(index)
    }
  }

  // Get filename from URL
  const getFilenameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      return pathname.substring(pathname.lastIndexOf('/') + 1)
    } catch {
      return url.substring(url.lastIndexOf('/') + 1)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      fullscreen={true}
      centered
      scrollable={true}
    >
      <Modal.Header closeButton className="bg-dark">
        <Modal.Title className="text-white">
          <FaRegEdit className="me-2" />
          Edit Course: {selectedCourse?.title || 'Loading...'}
        </Modal.Title>
        {selectedCourse && (
          <Badge bg="info" className="ms-2">
            ID: {selectedCourse._id.substring(0, 8)}...
          </Badge>
        )}
      </Modal.Header>
      <Modal.Body style={{ overflowY: 'auto' }}>
        {!selectedCourse ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading course data...</p>
          </div>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="basic"><FaHashtag className="me-2" />Basic Info</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="content"><FaList className="me-2" />Content</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="media"><FaImage className="me-2" />Media</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pricing"><FaDollarSign className="me-2" />Pricing</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="faq"><FaQuestionCircle className="me-2" />FAQs</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settings"><FaTag className="me-2" />Settings</Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content>
              {/* Basic Info Tab - Same as before */}
              <Tab.Pane eventKey="basic">
                <Form>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Title <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="title" 
                          value={selectedCourse.title} 
                          onChange={onFormChange}
                          required
                          placeholder="Enter course title"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="category" 
                          value={getCategoryText(selectedCourse.category)} 
                          onChange={onFormChange}
                          required
                          placeholder="e.g., Information Technology"
                        />
                        <Form.Text className="text-muted">
                          Separate multiple categories with commas
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Short Description</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={3} 
                          name="shortDescription" 
                          value={selectedCourse.shortDescription || ''} 
                          onChange={onFormChange}
                          placeholder="Brief overview of the course (appears in listings)"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Level</Form.Label>
                        <Form.Select 
                          name="level" 
                          value={Array.isArray(selectedCourse.level) ? selectedCourse.level[0] : selectedCourse.level || ''} 
                          onChange={onFormChange}
                        >
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="All level">All Levels</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Enhanced Full Description Section */}
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">
                        <strong>Full Description</strong>
                        {!isHtmlValid && (
                          <Badge bg="danger" className="ms-2">
                            Invalid HTML
                          </Badge>
                        )}
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={handleUndo}
                          disabled={undoHistory.length <= 1}
                          title="Undo (Ctrl+Z)"
                        >
                          <FaUndo />
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={handleRedo}
                          disabled={redoHistory.length === 0}
                          title="Redo (Ctrl+Y)"
                        >
                          <FaRedo />
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={autoFormat}
                          title="Auto Format"
                        >
                          <FaCode /> Format
                        </Button>
                      </div>
                    </div>
                    
                    {/* Enhanced Formatting Toolbar */}
                    <div className="border rounded-top p-2 bg-light d-flex flex-wrap gap-1 align-items-center mb-0">
                      {/* Text Actions */}
                      <div className="d-flex gap-1 border-end pe-2 me-2">
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('strong')}
                          title="Bold (Ctrl+B)"
                        >
                          <FaBold />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('em')}
                          title="Italic (Ctrl+I)"
                        >
                          <FaItalic />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('u')}
                          title="Underline (Ctrl+U)"
                        >
                          <FaUnderline />
                        </Button>
                      </div>
                      
                      {/* Headings */}
                      <div className="d-flex gap-1 border-end pe-2 me-2">
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('h1')}
                          title="Heading 1"
                        >
                          H1
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('h2')}
                          title="Heading 2"
                        >
                          H2
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('h3')}
                          title="Heading 3"
                        >
                          H3
                        </Button>
                      </div>
                      
                      {/* Lists */}
                      <div className="d-flex gap-1 border-end pe-2 me-2">
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => insertList('ul')}
                          title="Bullet List"
                        >
                          <FaListUl />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => insertList('ol')}
                          title="Numbered List"
                        >
                          <FaListOl />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('li')}
                          title="List Item"
                        >
                          <FaList />
                        </Button>
                      </div>
                      
                      {/* Structural Elements */}
                      <div className="d-flex gap-1 border-end pe-2 me-2">
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('p')}
                          title="Paragraph"
                        >
                          <FaParagraph />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => insertText('<br/>')}
                          title="Line Break"
                        >
                          ↵
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('hr', true)}
                          title="Horizontal Rule"
                        >
                          —
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('blockquote')}
                          title="Blockquote"
                        >
                          <FaQuoteRight />
                        </Button>
                      </div>
                      
                      {/* Links & More */}
                      <div className="d-flex gap-1">
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('a', false, 'href="https://example.com"')}
                          title="Link"
                        >
                          <FaLinkIcon />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('span', false, 'style="color: red;"')}
                          title="Colored Text"
                        >
                          <FaEyeDropper />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => wrapSelectionWithTag('mark')}
                          title="Highlight"
                        >
                          <FaHighlighter />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => insertTable()}
                          title="Insert Table"
                        >
                          <FaTable />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={clearFormatting}
                          title="Clear Formatting"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    {/* Split View: Editor (left) and Preview (right) */}
                    <Row>
                      <Col md={6}>
                        <div className="border-start border-end border-bottom rounded-bottom position-relative">
                          <Form.Control 
                            ref={textareaRef}
                            as="textarea" 
                            rows={15}
                            name="description" 
                            value={selectedCourse.description || ''} 
                            onChange={handleDescriptionChange}
                            onSelect={handleTextareaSelect}
                            placeholder="Enter HTML content here or use toolbar above..."
                            className="border-0 rounded-0 font-monospace"
                            style={{ 
                              resize: 'none',
                              fontSize: '14px',
                              lineHeight: '1.4'
                            }}
                          />
                          <div className="position-absolute bottom-0 end-0 p-2 bg-white border-start border-top rounded-top-left">
                            <small className="text-muted">
                              Lines: {selectedCourse.description?.split('\n').length || 0} | 
                              Chars: {selectedCourse.description?.length || 0}
                            </small>
                          </div>
                        </div>
                        <small className="text-muted mt-1 d-block">
                          <strong>HTML Editor</strong> - Edit HTML with toolbar assistance
                        </small>
                      </Col>
                      
                      <Col md={6}>
                        <div 
                          ref={previewRef}
                          className="border rounded-bottom p-3 bg-white html-preview"
                          style={{ 
                            minHeight: '360px',
                            maxHeight: '360px',
                            overflowY: 'auto',
                            lineHeight: '1.6'
                          }}
                        >
                          {/* Live Preview with enhanced styling */}
                          <div 
                            dangerouslySetInnerHTML={{ __html: selectedCourse.description || '' }}
                            className="html-content"
                          />
                          
                          {/* If no content, show placeholder */}
                          {!selectedCourse.description && (
                            <div className="text-muted text-center py-5">
                              <FaQuestionCircle className="display-6 mb-3 opacity-50" />
                              <p className="mb-0">Preview will appear here</p>
                              <small>HTML tags will be rendered as formatted content</small>
                            </div>
                          )}
                          
                          {/* Validation errors */}
                          {!isHtmlValid && (
                            <Alert variant="warning" className="mt-3">
                              <FaExclamationTriangle className="me-2" />
                              HTML validation issues detected. Some tags may not render correctly.
                            </Alert>
                          )}
                        </div>
                        <small className="text-muted mt-1 d-block">
                          <strong>Live Preview</strong> - See how content will appear to students
                        </small>
                      </Col>
                    </Row>
                    
                    <div className="mt-3">
                      <div className="alert alert-info p-2">
                        <small className="d-flex align-items-center">
                          <FaCode className="me-2 flex-shrink-0" />
                          <div>
                            <strong>HTML Tips:</strong> Select text and click toolbar buttons to wrap with HTML tags. 
                            Common tags: &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, 
                            &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;br&gt;, &lt;hr&gt;, &lt;a href="#"&gt;, &lt;table&gt;, &lt;blockquote&gt;
                          </div>
                        </small>
                      </div>
                    </div>
                  </Form.Group>

                  {/* Enhanced CSS for preview styling */}
                  <style>{`
                    .html-preview .html-content {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }
                    .html-preview .html-content h1 {
                      font-size: 2em;
                      font-weight: bold;
                      margin: 1em 0 0.5em 0;
                      color: #333;
                      border-bottom: 2px solid #eee;
                      padding-bottom: 0.3em;
                    }
                    .html-preview .html-content h2 {
                      font-size: 1.5em;
                      font-weight: bold;
                      margin: 1em 0 0.5em 0;
                      color: #444;
                      border-left: 4px solid #0d6efd;
                      padding-left: 10px;
                    }
                    .html-preview .html-content h3 {
                      font-size: 1.3em;
                      font-weight: bold;
                      margin: 1em 0 0.5em 0;
                      color: #555;
                    }
                    .html-preview .html-content p {
                      margin: 0 0 1em 0;
                      line-height: 1.6;
                      color: #333;
                    }
                    .html-preview .html-content strong {
                      font-weight: bold;
                      color: #000;
                    }
                    .html-preview .html-content em {
                      font-style: italic;
                    }
                    .html-preview .html-content u {
                      text-decoration: underline;
                    }
                    .html-preview .html-content ul,
                    .html-preview .html-content ol {
                      margin: 0 0 1em 1.5em;
                      padding: 0;
                    }
                    .html-preview .html-content li {
                      margin: 0.5em 0;
                      line-height: 1.6;
                    }
                    .html-preview .html-content ul li {
                      list-style-type: disc;
                    }
                    .html-preview .html-content ol li {
                      list-style-type: decimal;
                    }
                    .html-preview .html-content hr {
                      border: none;
                      border-top: 1px solid #ddd;
                      margin: 1.5em 0;
                    }
                    .html-preview .html-content blockquote {
                      border-left: 4px solid #0d6efd;
                      margin: 1em 0;
                      padding: 0.5em 1em;
                      background-color: #f8f9fa;
                      font-style: italic;
                    }
                    .html-preview .html-content a {
                      color: #0d6efd;
                      text-decoration: none;
                    }
                    .html-preview .html-content a:hover {
                      text-decoration: underline;
                    }
                    .html-preview .html-content mark {
                      background-color: #ffec99;
                      padding: 0.1em 0.3em;
                      border-radius: 3px;
                    }
                    .html-preview .html-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1em 0;
                    }
                    .html-preview .html-content table th {
                      background-color: #f8f9fa;
                      font-weight: bold;
                      text-align: left;
                    }
                    .html-preview .html-content table th,
                    .html-preview .html-content table td {
                      border: 1px solid #dee2e6;
                      padding: 0.5em;
                    }
                    .html-preview .html-content code {
                      font-family: 'Courier New', monospace;
                      background-color: #f8f9fa;
                      padding: 0.2em 0.4em;
                      border-radius: 3px;
                      font-size: 0.9em;
                    }
                    .html-preview .html-content pre {
                      background-color: #f8f9fa;
                      padding: 1em;
                      border-radius: 5px;
                      overflow-x: auto;
                      font-family: 'Courier New', monospace;
                    }
                  `}</style>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Duration</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="duration" 
                          value={selectedCourse.duration || ''} 
                          onChange={onFormChange}
                          placeholder="e.g., 65 Hr"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Lectures</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="totalLectures" 
                          value={selectedCourse.totalLectures || ''} 
                          onChange={onFormChange}
                          placeholder="e.g., 70"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Enrolled Students</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="enrolledStudents" 
                          value={selectedCourse.enrolledStudents || 0} 
                          onChange={onFormChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab.Pane>

              {/* Content Tab */}
              <Tab.Pane eventKey="content">
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label>
                      <strong>Course Features</strong>
                      <Badge bg="info" className="ms-2">
                        {selectedCourse.features?.length || 0} features
                      </Badge>
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={10} 
                      value={selectedCourse.features?.join('\n') || ''}
                      onChange={(e) => onFeaturesChange(e.target.value)}
                      placeholder="Enter each feature on a new line:
Beginner to Intermediate Python Course
No Prior Programming Experience Required
Structured, Module-Wise Video Lessons
Hands-on Coding & Practice Sessions
..."
                    />
                    <Form.Text className="text-muted">
                      One feature per line. These will appear as bullet points on the course page.
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Tab.Pane>

              {/* Media Tab - UPDATED with proper video management */}
              <Tab.Pane eventKey="media">
                <Form>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <FaImage className="me-2" />
                          Course Image URL
                        </Form.Label>
                        <Form.Control 
                          type="text" 
                          name="image" 
                          value={selectedCourse.image || ''} 
                          onChange={onFormChange}
                          placeholder="https://example.com/image.jpg"
                        />
                        {selectedCourse.image && (
                          <div className="mt-2">
                            <div className="border rounded p-2 bg-light">
                              <small className="text-muted">Preview:</small>
                              <img 
                                src={selectedCourse.image} 
                                alt="Course preview" 
                                className="img-fluid rounded mt-1"
                                style={{ maxHeight: '150px' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = '<small class="text-danger">Image failed to load. Check URL.</small>'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <FaVideo className="me-2" />
                          Preview Video URL
                        </Form.Label>
                        <Form.Control 
                          type="text" 
                          name="previewVideo" 
                          value={selectedCourse.previewVideo || ''} 
                          onChange={onFormChange}
                          placeholder="https://example.com/video.mp4"
                        />
                        {selectedCourse.previewVideo && (
                          <div className="mt-2">
                            <div className="border rounded p-2 bg-light">
                              <small className="text-muted">Video URL:</small>
                              <div className="mt-1">
                                <a href={selectedCourse.previewVideo} target="_blank" rel="noopener noreferrer" className="text-truncate d-block">
                                  <FaLink className="me-1" />
                                  {selectedCourse.previewVideo.substring(0, 50)}...
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Uploaded Videos Section */}
                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Form.Label className="mb-0">
                        <FaVideo className="me-2" />
                        <strong>Uploaded Course Videos</strong>
                        <Badge bg="info" className="ms-2">
                          {selectedCourse.videos.length} videos
                        </Badge>
                      </Form.Label>
                      {onAddVideo && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={onAddVideo}
                          disabled={uploadingVideo}
                        >
                          <FaPlus className="me-1" /> Add Video URL
                        </Button>
                      )}
                    </div>
                    
                    {selectedCourse.videos.length === 0 ? (
                      <Alert variant="info">
                        <FaVideo className="me-2" />
                        No videos uploaded yet. Upload videos below or add video URLs.
                      </Alert>
                    ) : (
                      <div className="row g-3">
                        {selectedCourse.videos.map((video, index) => (
                          <Col md={6} lg={4} key={video._id || index}>
                            <Card className="h-100">
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <FaPlayCircle className="text-primary me-2" />
                                    <strong className="text-truncate">
                                      Video #{index + 1}
                                    </strong>
                                  </div>
                                  {onRemoveVideo && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleRemoveVideo(index)}
                                      className="p-0"
                                      style={{ width: '24px', height: '24px' }}
                                    >
                                      <FaTimes size={12} />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <small className="text-muted d-block">Description:</small>
                                  {onVideoChange ? (
                                    <Form.Control 
                                      type="text"
                                      value={video.description}
                                      onChange={(e) => handleVideoDescriptionChange(index, e.target.value)}
                                      placeholder="Enter video description"
                                      size="sm"
                                    />
                                  ) : (
                                    <div className="text-truncate">{video.description}</div>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <small className="text-muted d-block">Video URL:</small>
                                  {onVideoChange ? (
                                    <>
                                      <Form.Control 
                                        type="text"
                                        value={video.video}
                                        onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                                        placeholder="Enter video URL"
                                        size="sm"
                                        className="mt-1"
                                      />
                                      {video.video && (
                                        <a 
                                          href={video.video} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-truncate d-block small mt-1"
                                          title={video.video}
                                        >
                                          <FaLink className="me-1" />
                                          {getFilenameFromUrl(video.video)}
                                        </a>
                                      )}
                                    </>
                                  ) : (
                                    <a 
                                      href={video.video} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-truncate d-block small"
                                      title={video.video}
                                    >
                                      <FaLink className="me-1" />
                                      {getFilenameFromUrl(video.video)}
                                    </a>
                                  )}
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <div className="d-flex gap-1">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => window.open(video.video, '_blank')}
                                      title="View Video"
                                      disabled={!video.video}
                                    >
                                      <FaExternalLinkAlt />
                                    </Button>
                                    <Button 
                                      variant="outline-secondary" 
                                      size="sm"
                                      onClick={() => {
                                        if (video.video) {
                                          const link = document.createElement('a')
                                          link.href = video.video
                                          link.download = getFilenameFromUrl(video.video)
                                          document.body.appendChild(link)
                                          link.click()
                                          document.body.removeChild(link)
                                        }
                                      }}
                                      title="Download Video"
                                      disabled={!video.video}
                                    >
                                      <FaDownload />
                                    </Button>
                                  </div>
                                  {video.progress !== undefined && (
                                    <div className="text-end">
                                      <small className="text-success">
                                        <FaCheckCircle className="me-1" />
                                        {video.progress}% Complete
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  {/* Video Upload Section */}
                  {onUploadVideo && (
                    <Card className="mb-4 border-primary">
                      <Card.Header className="bg-primary text-white">
                        <FaUpload className="me-2" />
                        Upload New Video
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Select Video File</Form.Label>
                              <Form.Control 
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileSelect}
                                disabled={uploadingVideo}
                              />
                              <Form.Text className="text-muted">
                                Supported formats: MP4, MOV, AVI, WMV, etc. (Max 500MB)
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Video Description</Form.Label>
                              <Form.Control 
                                type="text"
                                value={videoDescription}
                                onChange={(e) => setVideoDescription(e.target.value)}
                                placeholder="Enter video description"
                                disabled={uploadingVideo}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {selectedVideoFile && (
                          <Alert variant="info" className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>Selected File:</strong> {selectedVideoFile.name}
                                <br />
                                <small>Size: {formatFileSize(selectedVideoFile.size)}</small>
                              </div>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => {
                                  setSelectedVideoFile(null)
                                  setVideoDescription('')
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ''
                                  }
                                }}
                                disabled={uploadingVideo}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </Alert>
                        )}
                        
                        {uploadingVideo && (
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small>Uploading...</small>
                              <small>{uploadProgress}%</small>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                role="progressbar" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="primary"
                          onClick={handleVideoUpload}
                          disabled={!selectedVideoFile || uploadingVideo || !videoDescription.trim()}
                          className="w-100"
                        >
                          {uploadingVideo ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FaUpload className="me-2" />
                              Upload Video
                            </>
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Additional Video URLs Section */}
                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaLink className="me-2" />
                      Additional Video URLs
                      <Badge bg="info" className="ms-2">
                        {selectedCourse.videoUrl?.length || 0} URLs
                      </Badge>
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={6} 
                      value={selectedCourse.videoUrl?.join('\n') || ''}
                      onChange={(e) => onVideoUrlChange(e.target.value)}
                      placeholder="Enter one video URL per line:
https://example.com/video1.mp4
https://example.com/video2.mp4
https://example.com/video3.mp4
..."
                    />
                    <Form.Text className="text-muted">
                      One URL per line. These are additional video URLs (not uploaded files).
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Tab.Pane>

              {/* Pricing Tab */}
              <Tab.Pane eventKey="pricing">
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Original Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="text" 
                            name="price" 
                            value={selectedCourse.price || ''} 
                            onChange={onFormChange}
                            placeholder="0.00"
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Leave empty for free course
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discounted Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="text" 
                            name="discountPrice" 
                            value={selectedCourse.discountPrice || ''} 
                            onChange={onFormChange}
                            placeholder="0.00"
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Special offer price (optional)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {selectedCourse.price && selectedCourse.discountPrice && (
                    <Alert variant="info" className="mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Discount Applied:</strong> 
                          {(() => {
                            const price = parseFloat(selectedCourse.price as string) || 0
                            const discount = parseFloat(selectedCourse.discountPrice as string) || 0
                            if (price > 0 && discount > 0) {
                              const savings = price - discount
                              const percentage = (savings / price * 100).toFixed(0)
                              return (
                                <span className="ms-2">
                                  Save ${savings.toFixed(2)} ({percentage}%)
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                        <Badge bg="success">On Sale</Badge>
                      </div>
                    </Alert>
                  )}

                  {(!selectedCourse.price || selectedCourse.price === '') && (
                    <Alert variant="success" className="mt-3">
                      <FaCheckCircle className="me-2" />
                      This course is marked as FREE
                    </Alert>
                  )}
                </Form>
              </Tab.Pane>

              {/* FAQs Tab */}
              <Tab.Pane eventKey="faq">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Course FAQs</h6>
                  <Button variant="outline-primary" size="sm" onClick={onAddFAQ}>
                    <FaPlus className="me-1" /> Add FAQ
                  </Button>
                </div>
                
                {selectedCourse.addFAQ.length === 0 ? (
                  <Alert variant="info">
                    <FaQuestionCircle className="me-2" />
                    No FAQs added yet. Click "Add FAQ" to create one.
                  </Alert>
                ) : (
                  selectedCourse.addFAQ.map((faq, index) => (
                    <div key={index} className="border rounded p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">FAQ #{index + 1}</h6>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => onRemoveFAQ(index)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Question</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={faq.question}
                              onChange={(e) => onFAQChange(index, 'question', e.target.value)}
                              placeholder="Enter question"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Answer</Form.Label>
                            <Form.Control 
                              as="textarea" 
                              rows={3}
                              value={faq.answer}
                              onChange={(e) => onFAQChange(index, 'answer', e.target.value)}
                              placeholder="Enter answer"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  ))
                )}
              </Tab.Pane>

              {/* Settings Tab */}
              <Tab.Pane eventKey="settings">
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Language</Form.Label>
                        <Form.Select 
                          name="language" 
                          value={Array.isArray(selectedCourse.language) ? selectedCourse.language[0] : selectedCourse.language || ''} 
                          onChange={onFormChange}
                        >
                          <option value="">Select Language</option>
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Status</Form.Label>
                        <Form.Select 
                          name="status" 
                          value={selectedCourse.status || 'Draft'} 
                          onChange={onFormChange}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Archived">Archived</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="checkbox"
                          label={
                            <>
                              <strong>Featured Course</strong>
                              <span className="text-muted ms-2">Show in featured section</span>
                            </>
                          }
                          name="isFeatured"
                          checked={selectedCourse.isFeatured || false}
                          onChange={(e) => {
                            onFormChange({
                              target: { 
                                name: 'isFeatured', 
                                value: e.target.checked,
                                type: 'checkbox'
                              }
                            } as any)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rating (0-5)</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="rating" 
                          value={selectedCourse.rating || 0} 
                          onChange={onFormChange}
                          min="0"
                          max="5"
                          step="0.1"
                        />
                        <Form.Text className="text-muted">
                          Average course rating
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />
                  
                  <div className="bg-light p-3 rounded">
                    <h6 className="text-muted mb-3">Course Metadata</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Course ID</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={selectedCourse._id} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Created At</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={new Date(selectedCourse.createdAt || '').toLocaleString()} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Last Updated</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={new Date(selectedCourse.updatedAt || '').toLocaleString()} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Total Videos</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={selectedCourse.videos.length} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light border-top">
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button variant="outline-secondary" onClick={onHide}>
              Cancel
            </Button>
          </div>
          <div>
            {selectedCourse && (
              <>
                <Button 
                  variant="outline-primary" 
                  className="me-2" 
                  onClick={() => window.open(`/course/${selectedCourse._id}`, '_blank')}
                >
                  <FaEye className="me-2" />
                  Preview
                </Button>
                <Button variant="primary" onClick={onUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default EditCourseModal