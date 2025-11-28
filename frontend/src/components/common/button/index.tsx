import React from 'react';
import { ButtonProps } from './type';
import ThreeDots from '../three-dots';

const Button = ({
  className,
  color = 'primary',
  children,
  disabled = false,
  onClick,
  loading = false,
  type = 'submit',
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${
        !disabled &&
        !loading &&
        (color === 'primary'
          ? 'bg-primary-400 text-white hover:bg-primary-300'
          : color === 'secondary'
          ? 'bg-white border border-primary-400 text-primary-500 hover:bg-primary-50'
          : 'text-info-500 hover:underline')
      } ${
        (disabled || loading) && 'bg-primary-50 text-primary-100'
      } rounded-2xl ${className}`}
    >
      {loading ? <ThreeDots /> : children}
    </button>
  );
};

export default Button;
