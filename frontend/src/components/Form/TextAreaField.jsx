import React from 'react';

const TextAreaField = ({ label, value, onChange }) => (
    <div className="mb-5">
        <label className="block text-gray-700 text-base font-semibold mb-2">
            {label}:
        </label>
        <textarea
            value={value}
            onChange={onChange}
            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 h-32 resize-y text-lg"
            required
        />
    </div>
);

export default TextAreaField;
