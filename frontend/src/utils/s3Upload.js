import axios from 'axios';
import { message } from 'antd';

/**
 * Uploads a file to S3 using presigned URL
 * @param {File} file - The file to upload
 * @param {Function} onSuccess - Success callback function
 * @param {Function} onError - Error callback function
 * @returns {Promise<string>} - Returns the public URL of the uploaded file
 */
export const uploadToS3 = async (file, onSuccess, onError) => {
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
      throw new Error(`S3 upload failed with status: ${uploadResponse.status}`);
    }

    // Call success callback if provided
    if (onSuccess) {
      onSuccess({ url: public_url });
    }
    
    message.success('Image uploaded successfully');
    return public_url;
  } catch (err) {
    console.error('Upload error:', err);
    message.error('Upload failed: ' + (err.message || 'Unknown error'));
    
    // Call error callback if provided
    if (onError) {
      onError(err);
    }
    
    throw err;
  }
};

/**
 * Custom request function for Antd Upload component
 * @param {Object} options - Upload options from Antd
 * @param {Function} onUrlChange - Callback to handle URL change
 * @returns {Promise<void>}
 */
export const customUploadRequest = async ({ file, onSuccess, onError }, onUrlChange) => {
  try {
    const publicUrl = await uploadToS3(file, onSuccess, onError);
    
    // Call URL change callback if provided
    if (onUrlChange) {
      onUrlChange(publicUrl);
    }
  } catch (err) {
    // Error is already handled in uploadToS3
  }
};