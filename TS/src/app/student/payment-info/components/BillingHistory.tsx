import { billingHistoryData } from '@/assets/data/products'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { currency } from '@/context/constants'
import { BillingHistoryType } from '@/types/other'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { BsDownload } from 'react-icons/bs'
import { FaAngleLeft, FaAngleRight, FaSearch } from 'react-icons/fa'

const BillingHistoryData = ({ date, name, paymentMethod, price, status }: BillingHistoryType) => {
  return (
    <tr>
      <td>{date.toLocaleDateString()}</td>
      <td>
        <h6 className="mt-2 mt-lg-0 mb-0">
          <a href="#">{name}</a>
        </h6>
      </td>
      <td>
        {paymentMethod.number ? (
          <img src={paymentMethod.image} height={40} width={40} className="h-40px" alt="image" />
        ) : (
          <img src={paymentMethod.image} height={21} width={80} className="w-80px" alt="image" />
        )}
        <span className="ms-2">{paymentMethod.number}</span>
      </td>
      <td>
        <span
          className={`badge ${status === 'paid' ? 'bg-success text-success' : status === 'pending' ? 'bg-orange text-orange' : 'bg-danger text-danger'}  bg-opacity-10 `}>
          {status}
        </span>
      </td>
      <td>
        {currency}
        {price}
      </td>
      <td>
        <Button variant="primary-soft" className="btn-round me-1 mb-1 mb-md-0" data-bs-toggle="tooltip" data-bs-placement="top" title="Download">
          <BsDownload />
        </Button>
      </td>
    </tr>
  )
}

const BillingHistory = () => {
  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <h3 className="mb-0">Billing history</h3>
      </CardHeader>
      <CardBody>
        <Row className="g-3 align-items-center justify-content-between mb-4">
          <Col md={8}>
            <form className="rounded position-relative">
              <input className="form-control pe-5 bg-transparent" type="search" placeholder="Search" aria-label="Search" />
              <button
                className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                type="submit">
                <FaSearch />
              </button>
            </form>
          </Col>
          <Col md={3}>
            <form>
              <ChoicesFormInput className="form-select js-choice border-0 z-index-9 bg-transparent" aria-label=".form-select-sm">
                <option>Sort by</option>
                <option>Newest</option>
                <option>Oldest</option>
              </ChoicesFormInput>
            </form>
          </Col>
        </Row>
        <div className="table-responsive border-0">
          <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
            <thead>
              <tr>
                <th scope="col" className="border-0 rounded-start">
                  Date
                </th>
                <th scope="col" className="border-0">
                  Course name
                </th>
                <th scope="col" className="border-0">
                  Payment method
                </th>
                <th scope="col" className="border-0">
                  Status
                </th>
                <th scope="col" className="border-0">
                  Total
                </th>
                <th scope="col" className="border-0 rounded-end">
                  Action
                </th>
              </tr>
            </thead>

            {billingHistoryData.slice(0, 4).map((item, idx) => {
              return (
                <tbody key={idx}>
                  <BillingHistoryData {...item} />
                </tbody>
              )
            })}
          </table>
        </div>
        <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-4 mt-sm-3">
          <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
          <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
            <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
              <li className="page-item mb-0">
                <a className="page-link" href="#" tabIndex={-1}>
                  <FaAngleLeft />
                </a>
              </li>
              <li className="page-item mb-0">
                <a className="page-link" href="#">
                  1
                </a>
              </li>
              <li className="page-item mb-0 active">
                <a className="page-link" href="#">
                  2
                </a>
              </li>
              <li className="page-item mb-0">
                <a className="page-link" href="#">
                  3
                </a>
              </li>
              <li className="page-item mb-0">
                <a className="page-link" href="#">
                  <FaAngleRight />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </CardBody>
    </Card>
  )
}

export default BillingHistory
