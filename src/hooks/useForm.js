import { useState, useCallback, useRef } from 'react';

/**
 * useForm — generic controlled form hook
 * @param {object} initialValues
 * @param {function} validate  — (values) => { fieldName: 'error message' }
 */
export function useForm(initialValues = {}, validate = () => ({})) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errs = validate(values);
    setErrors(errs);
  }, [values, validate]);

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched(Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }, [values, validate]);

  const isValid = Object.keys(validate(values)).length === 0;

  return {
    values,
    errors,
    touched,
    submitting,
    isValid,
    handleChange,
    handleBlur,
    setField,
    reset,
    handleSubmit,
  };
}
