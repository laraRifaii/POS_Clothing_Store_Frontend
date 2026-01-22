import React from 'react';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  label?: string;
  className?: string;
  fallbackRoute?: string; // used if history stack is empty
};

const BackButton: React.FC<BackButtonProps> = ({
  className = '',
  fallbackRoute = '/',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackRoute);
    }
  };

  return (
    <div>
      <button
        onClick={handleBack}
        className={`px-4 py-2  rounded-md bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition ${className}`}
      >
        ←
      </button>
    </div>
  );
};

export default BackButton;
