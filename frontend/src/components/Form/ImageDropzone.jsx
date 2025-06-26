import React, { useState } from 'react';
import { Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { customUploadRequest } from '@utils/s3Upload';

const ImageDropzone = ({ value, onChange, maxCount = 10 }) => {
  const [fileList, setFileList] = useState([]);

  // Initialize file list from value prop
  React.useEffect(() => {
    if (value && Array.isArray(value)) {
      const initialFiles = value.map((url, index) => ({
        uid: `existing-${index}`,
        name: `image-${index}`,
        status: 'done',
        url: url,
      }));
      setFileList(initialFiles);
    }
  }, [value]);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      await customUploadRequest({ file, onSuccess, onError }, (url) => {
        // Update the file list with the new URL
        setFileList(prev => {
          const newList = prev.map(item => 
            item.uid === file.uid ? { ...item, url, status: 'done' } : item
          );
          
          // Extract URLs and notify parent component
          const urls = newList.filter(item => item.url).map(item => item.url);
          if (onChange) {
            onChange(urls);
          }
          
          return newList;
        });
      });
    } catch (error) {
      setFileList(prev => 
        prev.map(item => 
          item.uid === file.uid ? { ...item, status: 'error' } : item
        )
      );
    }
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // If a file was removed, update the parent
    const urls = newFileList.filter(item => item.url && item.status === 'done').map(item => item.url);
    if (onChange) {
      onChange(urls);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <Upload
      listType="picture-card"
      fileList={fileList}
      customRequest={handleUpload}
      onChange={handleChange}
      accept="image/*"
      multiple={maxCount > 1}
      maxCount={maxCount}
    >
      {fileList.length >= maxCount ? null : uploadButton}
    </Upload>
  );
};

export default ImageDropzone;
