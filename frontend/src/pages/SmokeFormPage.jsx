import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StepWrapper from '@components/Form/StepWrapper';
import ImageDropzone from '@components/Form/ImageDropzone';
import TextAreaField from '@components/Form/TextAreaField';
import InputField from '@components/Form/InputField';
import {
  setStep,
  updateField,
  updateNestedField,
  updateDirectField,
  resetForm,
  setFormData,
} from '../redux/formSlice';
import ImageAppendixList from '@components/Form/ImageAppendixList';
import axios from '@utils/axios';
import {
  Alert,
  Spin,
  Modal,
  Input,
  Select,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Card,
  Divider,
  Anchor,
  Checkbox,
  DatePicker,
  notification,
  message,
  InputNumber
} from 'antd';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { generateFormPayload } from '@utils/formInitialState';
import { ACTION_TYPES, REPORT_TYPES, REPORT_TYPE_IDS } from '@utils/constants';
import AgentSelect from '@components/Form/AgentSelect';
import AddressAutocomplete from '@components/Form/AddressAutocomplete';
import FormFooter from '@components/Form/FormFooter';


const SmokeFormPage = () => {
  const dispatch = useDispatch();
  const { formData, currentStep } = useSelector((state) => state.forms[REPORT_TYPES.SMOKE]);
  const { user } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, type: '', message: '' });
  const [comment, setComment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isRewardModalVisible, setIsRewardModalVisible] = useState(false);
  const [reward, setReward] = useState(0);
  const alertTimerRef = useRef();
  const [addressError, setAddressError] = useState('');
  const [addressErrorActive, setAddressErrorActive] = useState(false);
  const addressErrorTimerRef = useRef();

  const navigate = useNavigate();
  const location = useLocation();
  const { reportId, isAffiliate, formData: initialFormData } = location.state ?? {};

  const smokeFormAction = generateFormPayload(REPORT_TYPES.SMOKE);

  useEffect(() => {
    if (initialFormData) {
      dispatch(setFormData(smokeFormAction({ formData: initialFormData })));
    }
  }, [dispatch, initialFormData, smokeFormAction]);

  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId) {
        try {
          const res = await axios.get(`/reports/${reportId}`);
          const formData = res.data.form_data;
          dispatch(setFormData(smokeFormAction({ formData })));
          setReportData(res.data);
        } catch (error) {
          notification.error({ message: 'Failed to fetch report data.' });
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    if (user) {
      setIsAdmin(user.user_type_id === 1);
      fetchReportData();
    }
  }, [reportId, user.id]);

  useEffect(() => {
    if (alert.visible) {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        setAlert({ visible: false, type: '', message: '' });
      }, 5000);
    }
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [alert.visible]);

  const totalSteps = 3;

  const handleNestedInputChange = (section, index, field) => (e) => {
    dispatch(updateNestedField(smokeFormAction({ section, index, field, value: e.target.value })));
  };

  const handleAddSmokeAlarm = () => {
    const newAlarm = {
        voltage: "",
        status: "Pass",
        location: "",
        expiration: ""
    };
    dispatch(updateDirectField(smokeFormAction({ 
      field: 'smokeAlarmDetails', 
      value: [...formData.smokeAlarmDetails, newAlarm] 
    })));
  };

  const handleRemoveSmokeAlarm = (index) => {
    const updatedAlarms = formData.smokeAlarmDetails.filter((_, i) => i !== index);
    dispatch(updateDirectField(smokeFormAction({ field: 'smokeAlarmDetails', value: updatedAlarms })));
  };
  
  const handleNext = () => {
    if (currentStep === 1 && (!formData.propertyAddress || formData.propertyAddress.trim() === '')) {
      setAddressError('Address is required');
      setAddressErrorActive(true);
      if (addressErrorTimerRef.current) clearTimeout(addressErrorTimerRef.current);
      addressErrorTimerRef.current = setTimeout(() => {
        setAddressError('');
        setAddressErrorActive(false);
      }, 3000);
      return;
    }
    dispatch(setStep(smokeFormAction({ step: Math.min(currentStep + 1, totalSteps) })));
  };
  const handleBack = () => dispatch(setStep(smokeFormAction({ step: Math.max(currentStep - 1, 1) })));

  const handleClearForm = () => {
    dispatch(resetForm(smokeFormAction()));
  };

  const handleApprove = () => {
    if (isAffiliate) {
        setIsRewardModalVisible(true);
    } else {
        submitApproval();
    }
  };

  const submitApproval = async (rewardAmount = null) => {
    setIsSubmitting(true);
    try {
        await axios.put(`/reports/approve/${reportId}`, {
            comment: comment,
            reward: rewardAmount
        });
        message.success('Report approved successfully!');
        navigate('/reports');
    } catch (error) {
        message.error(error.response?.data?.detail || 'Failed to approve report.');
        console.error("Approval error:", error);
    } finally {
        setIsSubmitting(false);
        setIsRewardModalVisible(false);
    }
  };
  
  const handleDecline = async (comment) => {
    if (!reportId) return;
    try {
      await axios.put(`/reports/decline/${reportId}`, { comment });
      message.success('Report declined successfully!');
      navigate('/reports');
    } catch (err) {
      message.error('Failed to decline report.');
    }
  };

  const handleRewardModalOk = () => {
    if (!reward || reward <= 0) {
        message.error("Reward must be a positive number for an affiliated agent.");
        return;
    }
    submitApproval(reward);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert({ visible: false, type: '', message: '' });

    // UPDATE logic
    if (reportId) {
      try {
        const payload = { form_data: formData, comment: comment };
        await axios.put(`/reports/update/${reportId}`, payload);
        setAlert({ visible: true, type: 'success', message: 'Report updated successfully!' });
      } catch (err) {
        setAlert({ visible: true, type: 'error', message: 'Failed to update report.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // CREATE logic
    try {
      const payload = {
        form_data: formData,
        address: formData.propertyAddress,
        report_type_id: REPORT_TYPE_IDS[REPORT_TYPES.SMOKE],
      };
      const res = await axios.post(`/reports/create`, payload);
      dispatch(resetForm(smokeFormAction()));
      setAlert({ visible: true, type: 'success', message: 'Report created successfully!' });
    } catch (err) {
      setAlert({ visible: true, type: 'error', message: 'Failed to create report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSelectAndChange = ({ value, id }) => {
    dispatch(updateDirectField(smokeFormAction({ field: 'propertyAddress', value })));
    dispatch(updateDirectField(smokeFormAction({ field: 'address_id', value: id })));
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWrapper title="Property & Inspector Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-gray-700 text-base font-semibold mb-2">Property Address</label>
                <AddressAutocomplete
                  value={formData.propertyAddress}
                  onChange={handleAddressSelectAndChange}
                  onSelect={handleAddressSelectAndChange}
                  style={{ height: '48px', borderColor: addressErrorActive ? '#ff4d4f' : undefined, boxShadow: addressErrorActive ? '0 0 0 2px #ff4d4f33' : undefined }}
                />
                {addressError && <div style={{ color: '#ff4d4f', marginTop: 4 }}>{addressError}</div>}
              </div>
              <div>
                <label className="block text-gray-700 text-base font-semibold mb-2">Agent Name</label>
                <AgentSelect
                  value={formData.agentId}
                  onChange={value => {
                    dispatch(updateDirectField(smokeFormAction({ field: 'agentId', value })));
                  }}
                  style={{ height: '47px', width: '100%' }}
                />
              </div>
              <div>
                <InputField
                  label="Inspector Name"
                  value={formData.inspectorName || formData.inspectorDetails?.inspectorName || ''}
                  onChange={e => dispatch(updateDirectField(smokeFormAction({ field: 'inspectorName', value: e.target.value })))}
                  className="mb-0"
                />
              </div>
              <div>
                <InputField
                  label="Inspection Date"
                  type="date"
                  value={formData.inspectionDate || formData.dateOfInspection || ''}
                  onChange={e => dispatch(updateDirectField(smokeFormAction({ field: 'inspectionDate', value: e.target.value })))}
                  className="mb-0"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Inspector Signature</label>
              <ImageDropzone
                value={formData.inspectorSignature ? [formData.inspectorSignature] : (formData.inspectorDetails?.inspectorSignature ? [formData.inspectorDetails.inspectorSignature] : [])}
                onChange={urls => dispatch(updateDirectField(smokeFormAction({ field: 'inspectorSignature', value: urls[0] || '' })))}
                maxCount={1}
              />
            </div>
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Smoke Alarm Details">
            {formData.smokeAlarmDetails?.map((alarm, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputField 
                    label="Voltage" 
                    value={alarm.voltage} 
                    onChange={handleNestedInputChange('smokeAlarmDetails', index, 'voltage')} 
                  />
                   <InputField 
                    label="Status" 
                    value={alarm.status} 
                    onChange={handleNestedInputChange('smokeAlarmDetails', index, 'status')} 
                  />
                   <InputField 
                    label="Location" 
                    value={alarm.location} 
                    onChange={handleNestedInputChange('smokeAlarmDetails', index, 'location')} 
                  />
                  <InputField 
                    label="Expiration"
                    type="date"
                    value={alarm.expiration} 
                    onChange={handleNestedInputChange('smokeAlarmDetails', index, 'expiration')} 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveSmokeAlarm(index)} 
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove Alarm
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddSmokeAlarm} 
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Smoke Alarm
            </button>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Image Appendix">
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Annex Photos</h3>
              <ImageAppendixList
                value={formData.imageAppendix || []}
                onChange={(list) => dispatch(updateDirectField(smokeFormAction({ field: 'imageAppendix', value: list })))}
              />
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[75%] mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Smoke Alarm Check Report</h1>
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
            type={alert.type}
            message={alert.message}
            closable
            onClose={() => setAlert({ visible: false, type: '', message: '' })}
            style={{ marginBottom: 16 }}
          />
        )}
        <Spin spinning={isSubmitting} tip="Submitting...">
          <form>
            {renderFormStep()}
            <FormFooter
              currentStep={currentStep}
              totalSteps={totalSteps}
              onBack={handleBack}
              onNext={handleNext}
              onClear={handleClearForm}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isLastStep={currentStep === totalSteps}
              isAdmin={user && user.user_type_id === 1}
              reportId={reportId}
              onApprove={handleApprove}
              onDecline={handleDecline}
              user={user}
              submitText={reportId ? 'Update' : 'Submit'}
              updateText={reportId ? 'Updating...' : 'Submitting...'}
            />
          </form>
        </Spin>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
      <Modal
        title="Enter Reward"
        open={isRewardModalVisible}
        onOk={handleRewardModalOk}
        onCancel={() => setIsRewardModalVisible(false)}
        okText="Approve with Reward"
      >
        <p>This report was submitted by an affiliated agent. Please enter a reward amount.</p>
        <InputNumber
            style={{ width: '100%' }}
            placeholder="Reward amount"
            value={reward}
            onChange={setReward}
            min={1}
        />
      </Modal>
    </div>
  );
};

export default SmokeFormPage; 