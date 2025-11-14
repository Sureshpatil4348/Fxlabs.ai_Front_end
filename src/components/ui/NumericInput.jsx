import React, { useEffect, useMemo, useState } from 'react';

/**
 * NumericInput
 * - Allows clearing the entire value while editing
 * - If left empty on blur, commits 0
 * - Emits numeric values via onChange for parent state
 */
const NumericInput = ({
  value,
  onChange,
  min,
  max,
  step,
  className,
  id,
  placeholder,
  disabled,
  name,
  inputMode = 'decimal',
  ...rest
}) => {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  // Normalize numeric value to string when not focused
  useEffect(() => {
    if (!focused) {
      if (value === null || value === undefined || Number.isNaN(value)) {
        setText('');
      } else {
        setText(String(value));
      }
    }
  }, [value, focused]);

  const clamp = useMemo(() => {
    return (num) => {
      if (typeof min === 'number' && num < min) return min;
      if (typeof max === 'number' && num > max) return max;
      return num;
    };
  }, [min, max]);

  const commit = (raw) => {
    // If empty or not a valid number, treat as 0
    const num = raw === '' ? 0 : Number(raw);
    const safe = Number.isFinite(num) ? clamp(num) : 0;
    if (typeof onChange === 'function') onChange(safe);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    // Emit only when it parses as a number
    if (v !== '' && v !== '-' && v !== '.' && v !== '-.' && Number.isFinite(Number(v))) {
      const num = clamp(Number(v));
      if (typeof onChange === 'function') onChange(num);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    commit(text.trim());
  };

  const handleFocus = () => setFocused(true);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commit(text.trim());
      e.currentTarget.blur();
    }
  };

  return (
    <input
      id={id}
      name={name}
      type="number"
      inputMode={inputMode}
      className={className}
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      {...rest}
    />
  );
};

export default NumericInput;
