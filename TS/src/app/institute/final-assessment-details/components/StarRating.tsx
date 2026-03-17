interface StarRatingProps {
  rating: number
  setRating?: (rating: number) => void
  readOnly?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, readOnly = false }) => {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? '#ffc107' : '#e4e5e9',
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: 18,
            marginRight: 4,
          }}
          onClick={() => {
            if (!readOnly && setRating) setRating(star)
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRating
