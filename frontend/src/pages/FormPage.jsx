import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StepWrapper from '../components/Form/StepWrapper';
import ImageDropzone from '../components/Form/ImageDropzone';
import CheckboxField from '../components/Form/CheckboxField';
import TextAreaField from '../components/Form/TextAreaField';
import InputField from '../components/Form/InputField';
import { downloadPdf } from '../utils/downloadPdf';
import {
  setStep,
  updateField,
  updateNestedField,
  addSmokeAlarm,
  removeSmokeAlarm,
  updateDirectField,
  resetForm,
  setFormData,
} from '../redux/formSlice';
import ImageAppendixList from '../components/Form/ImageAppendixList';
import axios from 'axios';
import { Alert, Spin, Modal, Input } from 'antd';
import { useLocation } from 'react-router-dom';
import { generateFormPayload } from '../utils/formInitialState';

const { TextArea } = Input;

const FormPage = () => {
  const dispatch = useDispatch();
  const { formData, currentStep } = useSelector((state) => state.forms.electricityAndSmokeForm);
  const { user } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, type: '', message: '' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState(''); // 'approve' or 'decline'


  const location = useLocation();
  const initialFormData = location.state?.formData;
  const reportId = location.state?.reportId;
  
  const formAction = generateFormPayload('electricityAndSmokeForm');

  useEffect(() => {
    if (initialFormData) {
      dispatch(setFormData(formAction({ formData: initialFormData })));
    }
    // eslint-disable-next-line
  }, []);

  const totalSteps = 6;

  const handleCheckboxChange = (section, field) => (e) => {
    dispatch(updateField(formAction({ section, field, value: e.target.checked })));
  };
  
  const handleNestedInputChange = (section, index, field) => (e) => {
    dispatch(updateNestedField(formAction({ section, index, field, value: e.target.value })));
  };

  const handleAddSmokeAlarm = () => {
    dispatch(addSmokeAlarm(formAction()));
  };

  const handleRemoveSmokeAlarm = (index) => {
    dispatch(removeSmokeAlarm(formAction({ index })));
  };

  const handleNext = () => dispatch(setStep(formAction({ step: Math.min(currentStep + 1, totalSteps) })));
  const handleBack = () => dispatch(setStep(formAction({ step: Math.max(currentStep - 1, 1) })));

  const handleClearForm = () => {
    dispatch(resetForm(formAction()));
  };

  const handleApprove = () => {
    setActionType('approve');
    setIsModalVisible(true);
  };

  const handleDecline = () => {
    setActionType('decline');
    setIsModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (!reportId) {
      setError('No report ID found for updating.');
      setAlert({ visible: true, type: 'error', message: 'Report ID missing.' });
      setTimeout(() => setAlert({ visible: false, type: '', message: '' }), 3000);
      return;
    }

    setIsSubmitting(true);
    setAlert({ visible: false, type: '', message: '' });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const payload = {
        form_data: formData,
        is_approved: actionType === 'approve',
        reviewer_id: user?.id,
        comment: comment,
      };
      await axios.put(`${apiUrl}/reports/update/${reportId}`, payload);
      setAlert({ visible: true, type: 'success', message: `Report ${actionType}d successfully!` });
      dispatch(resetForm(formAction()));
      setTimeout(() => {
        setAlert({ visible: false, type: '', message: '' });
        // Optionally navigate away after action
        // navigate('/reports'); 
      }, 3000);
    } catch (err) {
      setAlert({ visible: true, type: 'error', message: `Failed to ${actionType} report. Please try again.` });
       setTimeout(() => setAlert({ visible: false, type: '', message: '' }), 3000);
    } finally {
      setIsSubmitting(false);
      setIsModalVisible(false);
      setComment('');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setComment('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert({ visible: false, type: '', message: '' });

    // UPDATE logic if reportId exists
    if (reportId) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const payload = { form_data: formData };
        await axios.put(`${apiUrl}/reports/update/${reportId}`, payload);
        setAlert({ visible: true, type: 'success', message: 'Report updated successfully!' });
        setTimeout(() => {
          setAlert({ visible: false, type: '', message: '' });
          // navigate('/reports'); // Optional: navigate away after update
        }, 3000);
      } catch (err) {
        setAlert({ visible: true, type: 'error', message: 'Failed to update report.' });
        setTimeout(() => setAlert({ visible: false, type: '', message: '' }), 3000);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // CREATE logic if no reportId
    try {
      const publisher_id = user?.id;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const payload = {
        form_data: formData,
        publisher_id,
        address: formData.propertyAddress,
      };
      const res = await axios.post(`${apiUrl}/reports/create`, payload);
      if (res.status === 200 || res.status === 201) {
        dispatch(resetForm(formAction()));
        setAlert({ visible: true, type: 'success', message: 'Report created successfully!' });
        setTimeout(() => setAlert({ visible: false, type: '', message: '' }), 3000);
      }
    } catch (err) {
      setError('Failed to create report. Please try again.');
      setAlert({ visible: true, type: 'error', message: 'Failed to create report. Please try again.' });
      setTimeout(() => setAlert({ visible: false, type: '', message: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWrapper title="Report and Property Details">
            <InputField label="Property Address" value={formData.propertyAddress} onChange={(e)=>dispatch(updateDirectField(formAction({ field: 'propertyAddress', value: e.target.value })))} />
            <InputField label="Inspection Date" type="date" value={formData.reportDate} onChange={(e)=>dispatch(updateDirectField(formAction({ field: 'reportDate', value: e.target.value })))} />
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Extent of Installation Covered by this Report">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {Object.keys(formData.installationExtent).map((field) => (
                <CheckboxField
                  key={field}
                  label={field}
                  checked={formData.installationExtent[field]}
                  onChange={handleCheckboxChange('installationExtent', field)}
                />
              ))}
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Visual Inspection of the Switchboard and Installation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {Object.keys(formData.visualInspection).map((field) => (
                <CheckboxField
                  key={field}
                  label={field}
                  checked={formData.visualInspection[field]}
                  onChange={handleCheckboxChange('visualInspection', field)}
                />
              ))}
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Testing">
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Polarity Testing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {Object.keys(formData.polarityTesting).map((field) => (
                <CheckboxField
                  key={field}
                  label={field}
                  checked={formData.polarityTesting[field]}
                  onChange={handleCheckboxChange('polarityTesting', field)}
                />
              ))}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Earth Fault Loop Impedance Testing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {Object.keys(formData.earthContinuityTesting).map((field) => (
                <CheckboxField
                  key={field}
                  label={field}
                  checked={formData.earthContinuityTesting[field]}
                  onChange={handleCheckboxChange('earthContinuityTesting', field)}
                />
              ))}
            </div>
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Smoke Alarm Details">
             {formData.smokeAlarmDetails.map((alarm, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-lg items-center">
                    <InputField label="Voltage" value={alarm.voltage} onChange={handleNestedInputChange('smokeAlarmDetails', index, 'voltage')} />
                    <InputField label="Status" value={alarm.status} onChange={handleNestedInputChange('smokeAlarmDetails', index, 'status')} />
                    <InputField label="Location" value={alarm.location} onChange={handleNestedInputChange('smokeAlarmDetails', index, 'location')} />
                    <InputField label="Expiration" value={alarm.expiration} onChange={handleNestedInputChange('smokeAlarmDetails', index, 'expiration')} />
                    <button type="button" onClick={() => handleRemoveSmokeAlarm(index)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 self-end">Remove</button>
                </div>
            ))}
            <button type="button" onClick={handleAddSmokeAlarm} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Add Smoke Alarm
            </button>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Observations and Recommendations">
            <TextAreaField label="Observations" value={formData.observation} onChange={(e) => dispatch(updateDirectField(formAction({ field: 'observation', value: e.target.value })))} />
            <TextAreaField label="Recommendations" value={formData.recommendation} onChange={(e) => dispatch(updateDirectField(formAction({ field: 'recommendation', value: e.target.value })))} />
            <div className="mt-6">
              <h3 className="text-base font-semibold mb-2">Image Appendix:</h3>
              <ImageAppendixList
                value={formData.imageAppendix || []}
                onChange={(list) => dispatch(updateDirectField(formAction({ field: 'imageAppendix', value: list })))}
              />
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Electrical Safety Check Report</h1>
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full">
            <div
              className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-1 leading-none rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        </div>
        {alert.visible && (
          <Alert
            message={alert.message}
            type={alert.type}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Spin spinning={isSubmitting} tip="Submitting...">
          <form>
            {renderFormStep()}
            <div className="flex justify-between mt-8">
              <div>
                <button type="button" onClick={handleBack} disabled={currentStep === 1} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50">Back</button>
                <button type="button" onClick={handleClearForm} className="ml-4 px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Clear All</button>
              </div>
              <div>
                {currentStep === totalSteps ? (
                  user && user.user_type_id === 1 && reportId ? (
                    <div className="flex gap-4">
                      <button type="button" onClick={handleDecline} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Decline</button>
                      <button type="button" onClick={handleApprove} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Approve</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (reportId ? 'Updating...' : 'Submitting...') : (reportId ? 'Update' : 'Submit')}
                    </button>
                  )
                ) : (
                  <button type="button" onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Next</button>
                )}
              </div>
            </div>
          </form>
        </Spin>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
      <Modal
        title={`Confirm ${actionType}`}
        visible={isModalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
        confirmLoading={isSubmitting}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Please provide a comment for this action.</p>
        <TextArea
          rows={4}
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
};

export default FormPage; 