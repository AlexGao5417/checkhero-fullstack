import React from 'react';
import { Upload, Input, Button, message } from 'antd';
import { DeleteFilled, PlusCircleOutlined, PictureFilled } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

const ImageAppendixList = ({ value = [], onChange }) => {
  // value: [{ imageUrl, description }]
  const handleAdd = () => {
    onChange([...(value || []), { imageUrl: '', description: '' }]);
  };

  const handleRemove = (index) => {
    const newList = value.filter((_, i) => i !== index);
    onChange(newList);
  };

  const handleImageChange = (url, index) => {
    // Use a deep copy to avoid mutation issues
    const newList = value.map(item => ({ ...item }));
    newList[index].imageUrl = url;
    onChange(newList);
  };

  const handleDescChange = (e, index) => {
    // Use a deep copy to avoid mutation issues
    const newList = value.map(item => ({ ...item }));
    newList[index].description = e.target.value;
    onChange(newList);
  };

  // S3 upload logic using presigned URL
  const customRequest = async ({ file, onSuccess, onError }, idx) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // Get presigned URL from backend
      const presignRes = await axios.get(
        `${apiUrl}/reports/presigned-url/?content_type=${encodeURIComponent(file.type)}`
      );
      const { upload_url, public_url } = presignRes.data;
      
      // Upload to S3 using fetch for cleaner headers
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 upload failed.');
      }

      handleImageChange(public_url, idx);
      onSuccess({ url: public_url });
      message.success('Image uploaded');
    } catch (err) {
      message.error('Upload failed');
      onError(err);
    }
  };

  return (
    <div>
      {(value || []).map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            marginBottom: 20,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {/* Upload Area */}
          <div style={{ width: 320, height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={false}
              customRequest={(options) => customRequest(options, idx)}
              accept="image/*"
              onRemove={() => handleImageChange('', idx)}
              style={{ width: 320, height: 220 }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt="Uploaded"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '2px solid #e6e6e6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    display: 'block',
                    margin: '0 auto',
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(item.imageUrl, '_blank')}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 180,
                    width: 280,
                    border: '2px dashed #bfbfbf',
                    borderRadius: 10,
                    background: '#fafbfc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <PictureFilled style={{ fontSize: 48, color: '#bfbfbf' }} />
                  <div style={{ marginTop: 12, color: '#888', fontWeight: 500, fontSize: 18 }}>
                    Click or drag image to upload
                  </div>
                  <div style={{ color: '#aaa', fontSize: 15, marginTop: 4 }}>
                    Support for single image upload. Max size: 5MB
                  </div>
                </div>
              )}
            </Upload>
          </div>

          {/* Textarea */}
          <TextArea
            placeholder="Enter description for the image..."
            value={item.description}
            onChange={(e) => handleDescChange(e, idx)}
            rows={8}
            style={{
              width: 420,
              minWidth: 320,
              maxWidth: 520,
              minHeight: 180,
              fontSize: 16,
              padding: 12,
              borderRadius: 12,
              border: '2px solid #e6e6e6',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              margin: '0',
              resize: 'vertical',
            }}
          />

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginLeft: 12 }}>
            <Button
              icon={<DeleteFilled style={{ fontSize: 18 }} />}
              onClick={() => handleRemove(idx)}
              danger
              type="default"
              size="large"
              style={{
                width: 120,
                height: 48,
                fontSize: 18,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: '1.5px solid #ff4d4f',
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {/* Add Button (outside the map) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button
          type="primary"
          onClick={handleAdd}
          icon={<PlusCircleOutlined style={{ fontSize: 18 }} />}
          style={{
            width: 120,
            height: 48,
            fontSize: 18,
            borderRadius: 8,
            background: '#1890ff',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(24,144,255,0.08)',
          }}
          size="large"
        >
          + Add
        </Button>
      </div>
    </div>
  );
};

export default ImageAppendixList; 