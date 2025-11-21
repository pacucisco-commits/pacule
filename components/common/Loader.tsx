
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-brand-secondary">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-solid border-brand-primary border-t-transparent`}
      ></div>
      {text && <p className="text-sm tracking-wider animate-pulse">{text}</p>}
    </div>
  );
};

export default Loader;
