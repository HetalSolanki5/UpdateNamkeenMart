import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-4 border-[#FDECEC] border-t-[#C62828] rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};

export default Loader;
