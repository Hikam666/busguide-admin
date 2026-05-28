import React from 'react'
import styles from './Button.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  disabled,
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <button 
      className={classNames} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? <span className={styles.loader}></span> : children}
    </button>
  )
}
