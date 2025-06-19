import React from 'react';

const StepWrapper = ({ title, children }) => (
    <div className="mb-10 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 pb-4 border-blue-200 text-center">{title}</h2>
        {children}
    </div>
);

export default StepWrapper;
