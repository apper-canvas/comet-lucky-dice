import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'font-heading font-semibold rounded-xl transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary border-primary text-white hover:shadow-lg focus:ring-primary neon-glow',
    secondary: 'bg-secondary border-secondary text-white hover:shadow-lg focus:ring-secondary',
    accent: 'bg-accent border-accent text-background hover:shadow-lg focus:ring-accent',
    outline: 'bg-transparent border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
    danger: 'bg-error border-error text-white hover:shadow-lg focus:ring-error'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-6 text-xl'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;