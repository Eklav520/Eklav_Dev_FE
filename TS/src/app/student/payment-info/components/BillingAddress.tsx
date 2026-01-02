import { Button, Card, CardBody, CardHeader } from 'react-bootstrap'

const BillingAddress = () => {
  return (
    <Card className="bg-transparent border rounded-3 mb-4">
      <CardHeader className="bg-transparent d-sm-flex justify-content-sm-between align-items-center border-bottom">
        <h3 className="mb-2 mb-sm-0">Billing address</h3>
        <Button variant="primary-soft" size="sm" className="mb-0">
          Add new address
        </Button>
      </CardHeader>
      <CardBody>
        <div className="bg-body border border-1 p-3 rounded-3 d-sm-flex justify-content-sm-between align-items-center mb-4">
          <div className="form-check">
            <input className="form-check-input mb-1" type="radio" name="address" id="address1" defaultChecked />
            <label className="form-check-label mb-0 h5" htmlFor="address1">
              Address-1
            </label>
            <p className="mb-0">2492 Centennial NW, Acworth, GA, 30102</p>
          </div>
          <div>
            <Button variant="success" size="sm" className="mb-0">
              Edit
            </Button>
            &nbsp;
            <button className="btn btn-sm btn-danger mb-0">Delete</button>
          </div>
        </div>
        <div className="bg-body border border-1 p-3 rounded-3 d-sm-flex justify-content-sm-between align-items-center mb-4">
          <div className="form-check">
            <input className="form-check-input mb-1" type="radio" name="address" id="address2" />
            <label className="form-check-label mb-0 h5" htmlFor="address2">
              Address-2
            </label>
            <p className="mb-0">2002 Horton Ford Rd, Eidson, TN, 37731</p>
          </div>
          <div>
            <Button variant="success" size="sm" className="mb-0">
              Edit
            </Button>
            &nbsp;
            <button className="btn btn-sm btn-danger mb-0">Delete</button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default BillingAddress
