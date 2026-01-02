import { Card, Col, Row } from 'react-bootstrap'

const CourseFilter = () => {
  const languages = ['English', 'Francas', 'Hindi', 'Russian', 'Spanish', 'Bengali', 'Portuguese']

  return (
    <form>
      <Card className="card-body shadow p-4 mb-4">
        <h4 className="mb-4">Category</h4>
        <Row>
          <Col xxl={6}>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault9" />
              <label className="form-check-label" htmlFor="flexCheckDefault9">
                All
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault10" />
              <label className="form-check-label" htmlFor="flexCheckDefault10">
                Development
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault11" />
              <label className="form-check-label" htmlFor="flexCheckDefault11">
                Design
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault12" />
              <label className="form-check-label" htmlFor="flexCheckDefault12">
                Accounting
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault17" />
              <label className="form-check-label" htmlFor="flexCheckDefault17">
                Translation
              </label>
            </div>
          </Col>
          <Col xxl={6}>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault13" />
              <label className="form-check-label" htmlFor="flexCheckDefault13">
                Finance
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault14" />
              <label className="form-check-label" htmlFor="flexCheckDefault14">
                Legal
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault15" />
              <label className="form-check-label" htmlFor="flexCheckDefault15">
                Photography
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault16" />
              <label className="form-check-label" htmlFor="flexCheckDefault16">
                Writing
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="flexCheckDefault18" />
              <label className="form-check-label" htmlFor="flexCheckDefault18">
                Marketing
              </label>
            </div>
          </Col>
        </Row>
      </Card>
      <Card className="card-body shadow p-4 mb-4">
        <h4 className="mb-3">Price Level</h4>
        <ul className="list-inline mb-0">
          <li className="list-inline-item">
            <input type="radio" className="btn-check" name="options" id="option1" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="option1">
              All
            </label>
          </li>
          <li className="list-inline-item">
            <input type="radio" className="btn-check" name="options" id="option2" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="option2">
              Free
            </label>
          </li>
          <li className="list-inline-item">
            <input type="radio" className="btn-check" name="options" id="option3" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="option3">
              Paid
            </label>
          </li>
        </ul>
      </Card>
      <Card className="card-body shadow p-4 mb-4">
        <h4 className="mb-3">Skill level</h4>
        <ul className="list-inline mb-0">
          <li className="list-inline-item mb-2">
            <input type="checkbox" className="btn-check" id="btn-check-12" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="btn-check-12">
              All levels
            </label>
          </li>
          <li className="list-inline-item mb-2">
            <input type="checkbox" className="btn-check" id="btn-check-9" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="btn-check-9">
              Beginner
            </label>
          </li>
          <li className="list-inline-item mb-2">
            <input type="checkbox" className="btn-check" id="btn-check-10" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="btn-check-10">
              Intermediate
            </label>
          </li>
          <li className="list-inline-item mb-2">
            <input type="checkbox" className="btn-check" id="btn-check-11" />
            <label className="btn btn-light btn-primary-soft-check" htmlFor="btn-check-11">
              Advanced
            </label>
          </li>
        </ul>
      </Card>
      <Card className="card-body shadow p-4 mb-4">
        <h4 className="mb-3">Language</h4>
        <ul className="list-inline mb-0 g-3">
          {languages.map((language, idx) => (
            <li className="list-inline-item mb-2" key={idx}>
              <input type="checkbox" className="btn-check" id={`btn-check-lan-${idx}`} />
              <label className="btn btn-light btn-primary-soft-check" htmlFor={`btn-check-lan-${idx}`}>
                {language}
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </form>
  )
}

export default CourseFilter
