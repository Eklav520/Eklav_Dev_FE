import Choices, { type Options as ChoiceOption } from 'choices.js'
import { type HTMLAttributes, type ReactElement, useEffect, useRef } from 'react'

export type ChoiceProps = {
  multiple?: boolean
  className?: string
  options?: Partial<ChoiceOption>
  allowInput?: boolean
  onChange?: (value: string) => void
  children?: ReactElement[]
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>

const ChoicesFormInput = ({ children, multiple, className, onChange, allowInput, options, ...props }: ChoiceProps) => {
  const choicesRef = useRef<HTMLInputElement & HTMLSelectElement>(null)

  useEffect(() => {
    if (choicesRef.current) {
      const choices = new Choices(choicesRef.current, {
        ...options,
        placeholder: true,
        allowHTML: true,
        shouldSort: false,
      })
      choices.passedElement.element.addEventListener('change', (e: Event) => {
        if (!(e.target instanceof HTMLSelectElement)) return
        if (onChange) {
          onChange(e.target.value)
        }
      })
    }
  }, [choicesRef])

  return allowInput ? (
    <input ref={choicesRef} multiple={multiple} className={className} {...props} />
  ) : (
    <select ref={choicesRef} multiple={multiple} className={className} {...props}>
      {children}
    </select>
  )
}

export default ChoicesFormInput
