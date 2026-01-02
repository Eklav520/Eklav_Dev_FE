import { InputHTMLAttributes, useState } from 'react';
import {
  FormControl,
  FormLabel,
  InputGroup,
  type FormControlProps,
} from 'react-bootstrap';
import Feedback from 'react-bootstrap/esm/Feedback';
import {
  Controller,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form';

import type { FormInputProps } from '@/types/component-props';
import { IconType } from 'react-icons';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

type IconFormInputProps = { icon: IconType };

const IconTextFormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  containerClassName,
  control,
  id,
  label,
  icon,
  noValidate,
  type,
  ...other
}: FormInputProps<TFieldValues> &
  FormControlProps &
  InputHTMLAttributes<HTMLInputElement> &
  IconFormInputProps) => {
  const Icon = icon;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = name.toLowerCase().includes('password');

  return (
    <Controller<TFieldValues, TName>
      name={name as TName}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      control={control}
      render={({ field, fieldState }) => (
        <div className={containerClassName ?? ''}>
          {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
          <InputGroup size="lg">
            <span className="input-group-text bg-light border-0 text-secondary px-3">
              <Icon />
            </span>
            <FormControl
              className="border-0 bg-light ps-1"
              type={
                isPassword
                  ? showPassword
                    ? 'text'
                    : 'password'
                  : type || 'text'
              }
              id={id}
              {...other}
              {...field}
              isInvalid={Boolean(fieldState.error?.message)}
            />
            {isPassword && (
              <span
                className="input-group-text bg-light border-0 text-secondary px-3"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            )}
            {!noValidate && fieldState.error?.message && (
              <Feedback type="invalid">{fieldState.error?.message}</Feedback>
            )}
          </InputGroup>
        </div>
      )}
    />
  );
};

export default IconTextFormInput;
