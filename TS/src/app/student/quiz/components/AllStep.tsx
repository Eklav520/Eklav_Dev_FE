import useBSStepper from '@/hooks/useBSStepper'
import { useEffect, useRef, useState } from 'react'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { BsClockHistory } from 'react-icons/bs'
import Inner from './Inner'

const Countdown = () => {
  const [timer, setTimer] = useState(90)
  const timerToString = () => {
    let hours = ('0' + Math.floor(timer / 3600)).slice(-2)
    let minutes = ('0' + Math.floor(timer / 60)).slice(-2)
    let seconds = ('0' + (timer % 60)).slice(-2)
    return hours + ':' + minutes + ':' + seconds
  }

  useEffect(() => {
    if (timer > 0) {
      setTimeout(() => {
        setTimer(timer - 1)
      }, 1000)
    }
  }, [timer])

  return (
    <h6 className="text-danger text-end mb-0">
      <BsClockHistory className="bi bi-clock-history me-1" />
      Time Left: {timerToString()}
    </h6>
  )
}

const AllStep = () => {
  return (
    <CardBody>
      <Card className="bg-transparent border rounded-3 mb-1">
        <div id="stepper" className="bs-stepper stepper-outline">
        
          <CardBody>
            <Countdown />
            <div className="bs-stepper-content">
             
            </div>
          </CardBody>
        </div>
      </Card>
    </CardBody>
  )
}

export default AllStep
