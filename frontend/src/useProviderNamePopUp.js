// hooks/useInput.js
import { useState } from 'react';

export const useInput = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);

  const handleInputChange = (event) => {
    setValue(event.target.value);
  };

  return [value, handleInputChange, setValue];
};
