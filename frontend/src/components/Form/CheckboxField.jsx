import React from 'react';

const CheckboxField = ({ label, checked, onChange }) => (
    <div className="flex items-center mb-3 cursor-pointer select-none">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="form-checkbox h-6 w-6 text-blue-600 rounded-md focus:ring-blue-500 transition-all duration-200 cursor-pointer border-gray-300"
        />
        <label className="ml-3 text-gray-800 text-lg cursor-pointer">
            {label}
        </label>
    </div>
);

export default CheckboxField;
