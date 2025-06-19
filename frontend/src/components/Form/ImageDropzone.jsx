import React, { useRef, useCallback } from 'react';

const ImageDropzone = ({ index, onImageUpload, onRemove, imageUrl, totalImages }) => {
    const fileInputRef = useRef(null);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(index, file);
        } else {
            console.warn("Dropped file is not an image.");
        }
    }, [index, onImageUpload]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(index, file);
        } else {
            console.warn("Selected file is not an image.");
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div
            className="relative mb-6 p-8 border-2 border-dashed border-blue-300 rounded-xl text-center bg-blue-50 hover:bg-blue-100 transition-all duration-300 cursor-pointer group shadow-inner"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleBrowseClick}
        >
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
            {imageUrl ? (
                <div className="flex flex-col items-center">
                    <img src={imageUrl} alt={`Uploaded ${index}`} className="max-w-full h-auto rounded-lg mb-4 shadow-lg border border-gray-200 transition-transform duration-300 group-hover:scale-102" style={{ maxHeight: '250px', objectFit: 'contain' }} />
                    <p className="text-base text-gray-700 font-medium">Click to change or drag and drop a new image.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
                    <svg className="mx-auto h-16 w-16 text-blue-400 group-hover:text-blue-600 transition-colors duration-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a2 2 0 00-2 2v20m32-12v8m0 0v8a2 2 0 01-2 2H12a2 2 0 01-2-2v-8m0 0l2.939-2.939A2 2 0 0115.414 16H32v2m-7 2H12m5-5h.01M32 28a6 6 0 100-12 6 6 0 000 12z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-3 text-lg text-gray-700 font-semibold">Drag 'n' drop an image here, or <span className="font-bold text-blue-600 group-hover:text-blue-800">click to select one</span></p>
                    <p className="text-sm text-gray-500 mt-1">(PNG, JPG, GIF up to 10MB)</p>
                </div>
            )}
            {totalImages > 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                    className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center justify-center transform hover:scale-110"
                    title="Remove image"
                >
                    <i className="fas fa-times text-lg"></i>
                </button>
            )}
        </div>
    );
};

export default ImageDropzone;
