import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-body';
    
    const variants = {
      primary: 'bg-[#512DDB] text-white hover:bg-[#4E30B2] focus:ring-[#512DDB]',
      secondary: 'bg-gray-light text-gray-700 hover:bg-gray-border focus:ring-gray-400',
      danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
      success: 'bg-success text-white hover:bg-green-700 focus:ring-success',
      outline: 'border border-gray-border bg-white text-gray-700 hover:bg-gray-light'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'h-10 w-10 p-0 text-lg'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';