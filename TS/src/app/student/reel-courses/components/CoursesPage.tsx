import { useNavigate } from "react-router-dom";
import { coursesData } from "./coursesData";

const CoursesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-4">
      <h2>Available Courses</h2>
      {coursesData.map((course:any) => (
        <div
          key={course.id}
          className="card p-3 mb-3"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/course/${course.id}`)}
        >
          <h4>{course.title}</h4>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
};

export default CoursesPage;