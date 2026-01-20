import React, { useState } from 'react'
import { Form, InputGroup, FormControlProps } from 'react-bootstrap'
import { Control, Controller, FieldError } from 'react-hook-form'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface FormInputProps extends Omit<FormControlProps, 'isInvalid'> {
  name: string
  control: Control<any>
  label?: string
  icon?: React.ReactNode
  error?: FieldError
  hint?: string
  required?: boolean
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  control,
  label,
  icon,
  error,
  hint,
  required = false,
  leftAddon,
  rightAddon,
  type = 'text',
  placeholder,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const getInputType = () => {
    if (type === 'password' && showPassword) {
      return 'text'
    }
    return type
  }

  const renderIcon = () => {
    if (type === 'password') {
      return (
        <button
          type="button"
          className="btn btn-link p-0 border-0 bg-transparent text-muted"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
        </button>
      )
    }
    return icon
  }

  return (
    <div className={`form-group ${className || ''}`}>
      {label && (
        <Form.Label className="fw-semibold mb-2">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputGroup className={error ? 'has-error' : ''}>
            {leftAddon && (
              <InputGroup.Text className="bg-light border-end-0">
                {leftAddon}
              </InputGroup.Text>
            )}

            {icon && type !== 'password' && (
              <InputGroup.Text className="bg-light border-end-0">
                {icon}
              </InputGroup.Text>
            )}

            <Form.Control
              {...field}
              {...props}
              type={getInputType()}
              placeholder={placeholder}
              isInvalid={!!error}
              className={`${icon || leftAddon ? 'border-start-0' : ''} ${type === 'password' ? 'pe-5' : ''}`}
              value={field.value || ''}
              onChange={(e) => {
                if (props.maxLength && e.target.value.length > props.maxLength) {
                  return
                }
                field.onChange(e)
              }}
            />

            {type === 'password' && (
              <InputGroup.Text className="bg-transparent border-start-0 position-absolute end-0 h-100">
                {renderIcon()}
              </InputGroup.Text>
            )}

            {rightAddon && (
              <InputGroup.Text className="bg-light border-start-0">
                {rightAddon}
              </InputGroup.Text>
            )}

            {error && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {error.message}
              </Form.Control.Feedback>
            )}
          </InputGroup>
        )}
      />

      {hint && !error && (
        <Form.Text className="text-muted mt-1">
          {hint}
        </Form.Text>
      )}

      {props.maxLength && control._formValues?.[name] && (
        <div className="d-flex justify-content-end mt-1">
          <small className={`text-${control._formValues[name]?.length > props.maxLength * 0.9 ? 'danger' : 'muted'}`}>
            {control._formValues[name]?.length || 0}/{props.maxLength}
          </small>
        </div>
      )}
    </div>
  )
}

export default FormInput