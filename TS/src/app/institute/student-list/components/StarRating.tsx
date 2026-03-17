import React from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating: React.FC<{
  rating: number;
  setRating: (rating: number) => void;
}> = ({ rating, setRating }) => {
  return (
    <div className="d-flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={24}
          style={{ marginRight: 5, cursor: 'pointer' }}
          color={star <= rating ? '#ffc107' : '#e4e5e9'}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
