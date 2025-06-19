import React from 'react';

const InputField = ({ label, type = 'text', value, onChange, className = '', placeholder = '', warning = '' }) => (
    <div className={`mb-5 ${className}`}>
        <label className="block text-gray-700 text-base font-semibold mb-2">
            {label}:
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 transition-all duration-200 text-lg
                ${warning ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400 focus:border-blue-400'}`}
            required={!!warning}
        />
        {warning && <p className="text-red-500 text-xs italic mt-2">{warning}</p>}
    </div>
);

export default InputField;
