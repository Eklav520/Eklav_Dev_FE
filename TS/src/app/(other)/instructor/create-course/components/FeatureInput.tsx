import { useState, useEffect } from 'react';
import { Col, Form } from 'react-bootstrap';

interface FeatureInputProps {
  onFeaturesChange: (features: string[]) => void;
}

const FeatureInput: React.FC<FeatureInputProps> = ({ onFeaturesChange }) => {
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState('');

  useEffect(() => {
    onFeaturesChange(features);
  }, [features]);

  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = currentFeature.trim();
      if (trimmed && features.length < 14 && !features.includes(trimmed)) {
        setFeatures([...features, trimmed]);
        setCurrentFeature('');
      }
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <Col xs={12}>
      <div className="bg-light border rounded p-4">
        <h5 className="mb-0">Features</h5>
        <Form.Group className="mt-3">
          <Form.Control
            type="text"
            placeholder="Enter a feature and press Enter"
            value={currentFeature}
            onChange={(e) => setCurrentFeature(e.target.value)}
            onKeyDown={handleAddFeature}
          />
          <Form.Text className="text-muted">
            Max 14 features. Press Enter to add. Click (×) to remove.
          </Form.Text>

          <div className="mt-3 d-flex flex-wrap gap-2">
            {features.map((feat, index) => (
              <span key={index} className="badge bg-primary px-3 py-2 d-flex align-items-center">
                {feat}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-2"
                  onClick={() => removeFeature(index)}
                  style={{ fontSize: '0.6rem' }}
                />
              </span>
            ))}
          </div>
        </Form.Group>
      </div>
    </Col>
  );
};

export default FeatureInput;
