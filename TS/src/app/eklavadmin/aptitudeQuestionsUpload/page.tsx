import { useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import CsvUploadForm from './components/BulkUpload'
import PuzzleUploadForm from './components/PuzzleUpload'
import { BsFiletypeCsv, BsPuzzle } from 'react-icons/bs'

const AptitudeQuestionsUpload = () => {
  const [activeTab, setActiveTab] = useState<'csv' | 'puzzle'>('csv')

  return (
    <>
      <PageMetaData title="Quiz Upload" />

      {/* Tab switcher */}
      <div style={{ maxWidth: 620, margin: '1.5rem auto 0', padding: '0 1rem' }}>
        <div
          style={{
            display: 'flex',
            background: '#f1f3f5',
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {([
            { key: 'csv',    label: 'Text Questions',   icon: BsFiletypeCsv, desc: 'CSV upload' },
            { key: 'puzzle', label: 'Puzzle Questions',  icon: BsPuzzle,      desc: 'ZIP + images' },
          ] as const).map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s',
                background: activeTab === key ? '#fff' : 'transparent',
                color: activeTab === key ? (key === 'puzzle' ? '#d97706' : '#0d6efd') : '#6b7280',
                boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 400,
                  color: activeTab === key ? '#9ca3af' : '#9ca3af',
                }}
              >
                ({desc})
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'csv'    && <CsvUploadForm />}
      {activeTab === 'puzzle' && <PuzzleUploadForm />}
    </>
  )
}

export default AptitudeQuestionsUpload
