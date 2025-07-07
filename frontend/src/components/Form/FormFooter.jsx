import React, { useState } from 'react';
import { Modal, Input } from 'antd';

const FormFooter = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onClear,
  onSubmit,
  isSubmitting,
  isLastStep,
  isAdmin,
  reportId,
  onApprove,
  onDecline,
  user,
  submitText,
  updateText,
  disabled
}) => {
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineComment, setDeclineComment] = useState('');

  const handleDeclineClick = () => {
    setDeclineModalVisible(true);
  };

  const handleDeclineConfirm = () => {
    if (onDecline) onDecline(declineComment);
    setDeclineModalVisible(false);
    setDeclineComment('');
  };

  const handleDeclineCancel = () => {
    setDeclineModalVisible(false);
    setDeclineComment('');
  };

  return (
    <>
      <div className="flex justify-between mt-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            disabled={currentStep === 1 || disabled}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onClear}
            className="ml-4 px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Clear All
          </button>
        </div>
        <div>
          {isLastStep ? (
            isAdmin && reportId ? (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleDeclineClick}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || disabled}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (reportId ? (updateText || 'Updating...') : (submitText || 'Submitting...')) : (reportId ? (updateText || 'Update') : (submitText || 'Submit'))}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
      <Modal
        title="Decline Report"
        open={declineModalVisible}
        onOk={handleDeclineConfirm}
        onCancel={handleDeclineCancel}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Please provide a comment for declining this report:</p>
        <Input.TextArea
          rows={4}
          value={declineComment}
          onChange={e => setDeclineComment(e.target.value)}
          placeholder="Enter comment (optional)"
        />
      </Modal>
    </>
  );
};

export default FormFooter; 