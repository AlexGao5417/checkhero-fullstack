import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ImageDropzone = ({ initialImages = [], onImagesChange }) => {
  const [files, setFiles] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to initialize state from props, runs only once
  useEffect(() => {
    if (!isInitialized && initialImages.length > 0) {
      setFiles(initialImages.map(url => ({
        file: null,
        preview: url,
        status: 'success',
        s3Url: url,
        error: null,
      })));
      setIsInitialized(true);
    }
  }, [initialImages, isInitialized]);
  
  // Effect to notify parent of changes
  useEffect(() => {
    // Only notify if the component has been initialized to avoid wiping state on mount
    if (isInitialized) {
      const successfulUploads = files
        .filter(f => f.status === 'success' && f.s3Url)
        .map(f => f.s3Url);
      onImagesChange(successfulUploads);
    }
  }, [files, onImagesChange, isInitialized]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      s3Url: null,
      error: null,
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    for (const newFile of newFiles) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${apiUrl}/reports/presigned-url`);
        const { upload_url, public_url } = response.data;

        await axios.put(upload_url, newFile.file, {
          headers: { 'Content-Type': '*' },
        });

        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.preview === newFile.preview
              ? { ...f, status: 'success', s3Url: public_url }
              : f
          )
        );
      } catch (err) {
        console.error('Upload failed:', err);
        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.preview === newFile.preview
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  });
  
  const handleRemove = (fileToRemove) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(fileToRemove.preview);
    
    setFiles(prevFiles => prevFiles.filter(file => file.preview !== fileToRemove.preview));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <p>Drag 'n' drop some images here, or click to select images</p>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((fileWrapper) => (
          <div key={fileWrapper.preview} className="relative">
            <img
              src={fileWrapper.preview}
              alt="Preview"
              className="w-full h-auto object-cover rounded-md"
              onLoad={() => {
                // Revoke data uri after image is loaded to free up memory
                if (fileWrapper.s3Url) {
                  URL.revokeObjectURL(fileWrapper.preview);
                }
              }}
            />
            {fileWrapper.status === 'uploading' && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">Uploading...</div>}
            {fileWrapper.status === 'error' && <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center text-white">{fileWrapper.error}</div>}
            <button
              onClick={() => handleRemove(fileWrapper)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageDropzone;
