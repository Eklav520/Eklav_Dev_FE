import { Tabs, Tab, Form } from 'react-bootstrap'
import './eklav-tabs.css'

export type TestCase = {
  id: number
  input: string
  expectedOutput: string
}

type Props = {
  testCases: TestCase[]
}

const TestCasesPanel = ({ testCases }: Props) => {
  return (
    <Tabs
      defaultActiveKey={testCases[0]?.id}
      className="eklav-tabs"   // 👈 THIS enables orange theme
    >
      {testCases.map((tc) => (
        <Tab key={tc.id} eventKey={tc.id} title={`Case ${tc.id}`}>
          <div className="p-3">
            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Input</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={tc.input}
                readOnly
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="text-muted">Expected Output</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={tc.expectedOutput}
                readOnly
              />
            </Form.Group>
          </div>
        </Tab>
      ))}
    </Tabs>
  )
}

export default TestCasesPanel
