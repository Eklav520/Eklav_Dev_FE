import { useState, useEffect } from 'react';
import IconTextFormInput from '@/components/form/IconTextFormInput';
import { BsEnvelopeFill } from 'react-icons/bs';
import { FaLock } from 'react-icons/fa';
import useSignUp from '../useSignUp';
import CaptchaBox from '@/common/CaptchaBox';
import { Col } from 'react-bootstrap';
import { BsPlus, BsX, BsSearch } from 'react-icons/bs';

const SignUpForm = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { signUp, control, register, watch, errors, setValue } = useSignUp() // ✅ Get setValue from hook
  const [showTerms, setShowTerms] = useState(false)
  const [captchaValid, setCaptchaValid] = useState(false);
  const termsAccepted = watch('terms', false);
  const yearOptions = Array.from({ length: 5 }, (_, i) => 2021 + i);
  const branchOptions = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Information Technology', 'AI ML', 'Data Science', 'IoT', 'Biomedical', 'Chemical','MCA','Btech'].sort();
  const [selectedCollege, setSelectedCollege] = useState<{
    _id: string
    name: string
    address: string
    pincode: string
  } | null>(null);
  const [collegeQuery, setCollegeQuery] = useState('');
  const [collegeResults, setCollegeResults] = useState<{ _id: string; name: string; address: string; pincode: string; logo?: string }[]>([]);
  const [showCollegeList, setShowCollegeList] = useState(false);

  useEffect(() => 
  {
    const fetchColleges = async () => {
      if (collegeQuery.trim().length < 2) {
        setCollegeResults([])
        return
      }
      try {
        const res = await fetch(`${baseURL}/api/colleges/search?q=${collegeQuery}`)
        if (res.ok) {
          const data = await res.json()
          setCollegeResults(data)
        }
      } catch (err) {
        console.error('Error fetching college list:', err)
      }
    }

    const delayDebounce = setTimeout(fetchColleges, 400)
    return () => clearTimeout(delayDebounce)
  }, [collegeQuery]);

  return (
    <form onSubmit={signUp} noValidate>
      {/* Full Name */}
      <div className="mt-3">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          maxLength={30}
          minLength={4}
          placeholder="Full Name"
          label="Full Name *"
          name="fullname"
        />
        {errors?.fullname && (
          <small className="text-danger">{errors.fullname.message}</small>
        )}
      </div>

      {/* Email */}
      <div className="mt-3">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          placeholder="E-mail"
          label="Email Address *"
          name="email"
        />
        {errors?.email && (
          <small className="text-danger">{errors.email.message}</small>
        )}
      </div>

      {/* Password */}
      <div className="mt-3">
        <IconTextFormInput
          control={control}
          icon={FaLock}
          placeholder="*********"
          label="Password *"
          name="password"
        />
        {errors?.password && (
          <small className="text-danger">{errors.password.message}</small>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mt-3">
        <IconTextFormInput
          control={control}
          icon={FaLock}
          placeholder="*********"
          label="Confirm Password *"
          name="confirmPassword"
        />
        {errors?.confirmPassword && (
          <small className="text-danger">{errors.confirmPassword.message}</small>
        )}
      </div>

      {/* Phone Number */}
      <div className="mt-3">
        <IconTextFormInput
          control={control}
          icon={BsEnvelopeFill}
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone Number"
          label="Phone Number *"
          name="phoneNo"
        />
        {errors?.phoneNo && (
          <small className="text-danger">{errors.phoneNo.message}</small>
        )}
      </div>

       {/* Joining Year */}
      <Col md={12} className="mt-3">
        <label className="form-label fw-semibold">Joining Year *</label>
        <select 
          className={`form-select ${errors?.joiningYear ? 'is-invalid' : ''}`}
          {...register('joiningYear')}
        >
          <option value="">Select Year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {errors?.joiningYear && (
          <small className="text-danger d-block mt-1">{`Joining Year is Required`}</small>
        )}
      </Col>

      {/* Batch (Department) */}
      <Col md={12} className="mt-3">
        <label className="form-label fw-semibold">Batch *</label>
        <select 
          className={`form-select ${errors?.batch ? 'is-invalid' : ''}`}
          {...register('batch')}
        >
          <option value="">Select Department</option>
          {branchOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {errors?.batch && (
          <small className="text-danger d-block mt-1">{errors.batch.message}</small>
        )}
      </Col>

      {/* College - FIXED */}
      <Col md={12} className="mt-3">
        <label className="form-label fw-semibold">College *</label>
        <div className="position-relative">

        {/* Search icon */}
        {collegeQuery.length >= 1 && (
          <span
            className="position-absolute top-50 translate-middle-y text-muted"
            style={{ left: '12px', zIndex: 2 }}
          >
            <BsSearch />
          </span>
        )}

        <input
          type="text"
          className={`form-control ps-5 ${errors?.college && !selectedCollege ? 'is-invalid' : ''}`}
          placeholder="Search your college"
          autoComplete="off"
          value={collegeQuery}
          onChange={(e) => {
            const val = e.target.value
            setCollegeQuery(val)
            setValue('college', val, { shouldValidate: true }) // ✅ Trigger validation
            setSelectedCollege(null)
            setShowCollegeList(true)
          }}
          onFocus={() => {
            if (collegeQuery.length >= 2) {
              setShowCollegeList(true)
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowCollegeList(false), 200)
          }}
        />

        {/* Helper text */}
        {collegeQuery.length === 1 && (
          <small className="text-muted mt-1 d-block">
            Start typing to search and select your college
          </small>
        )}

        {/* Error message - only show if no college selected */}
        {errors?.college && !selectedCollege && (
          <small className="text-danger d-block mt-1">{errors.college.message}</small>
        )}

        {/* Success indicator */}
        {selectedCollege && (
          <small className="text-success d-block mt-1">
            ✓ College selected
          </small>
        )}

        {/* Dropdown */}
        {showCollegeList && collegeResults.length > 0 && (
          <ul
            className="list-group position-absolute w-100 shadow-sm mt-1"
            style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
          >
            {collegeResults.map((college) => (
              <li
                key={college._id}
                className="list-group-item list-group-item-action"
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => {
                  e.preventDefault() // ✅ Prevent input blur
                  const display = `${college.name}, ${college.address}, ${college.pincode}`
                  setCollegeQuery(display)
                  setValue('college', display, { shouldValidate: true }) // ✅ Clear validation error
                  setSelectedCollege(college)
                  setShowCollegeList(false)
                }}
              >
                <strong>{college.name}</strong>
                <br />
                <small className="text-muted">
                  {college.address}, {college.pincode}
                </small>
              </li>
            ))}
          </ul>
        )}
        </div>
      </Col>

      <div className="mt-3">
        <CaptchaBox onValidate={setCaptchaValid} />
      </div>

      {/* Terms of Service */}
      <div className="mt-3">
        <div className="form-check">
          <input
            type="checkbox"
            className={`form-check-input ${errors?.terms ? 'is-invalid' : ''}`}
            id="checkbox-1"
            {...register('terms')}
          />
          <label className="form-check-label" htmlFor="checkbox-1">
            By signing up, you agree to the{' '}
            <span
              role="button"
              className="text-primary text-decoration-underline"
              onClick={() => setShowTerms(!showTerms)}
            >
              Terms of Service
            </span>
          </label>
        </div>
        {errors?.terms && (
          <small className="text-danger">{errors.terms.message}</small>
        )}

        {showTerms && (
          <div
            className="mt-3 p-3 border rounded bg-light"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            <h6>Terms of Service</h6>
            <p>
              Welcome to our platform. By creating an account, you agree not to
              misuse the service.
            </p>
            <p>
              <strong>1. Usage:</strong> You must not engage in prohibited
              activities...
            </p>
            <p>
              <strong>2. Privacy:</strong> Your data will be protected according
              to our privacy policy...
            </p>
            <p>
              <strong>3. Termination:</strong> We may suspend accounts that
              violate these rules...
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="align-items-center mt-0">
        <div className="d-grid">
          <button
            className="btn btn-primary mb-0"
            type="submit"
            disabled={!termsAccepted || !captchaValid}
          >
            Sign Up
          </button>
        </div>
      </div>
    </form>
  )
}

export default SignUpForm