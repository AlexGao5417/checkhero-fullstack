import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StepWrapper from '@components/Form/StepWrapper';
import ImageDropzone from '@components/Form/ImageDropzone';
import CheckboxField from '@components/Form/CheckboxField';
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
import { USER_ROLES, REPORT_TYPES, REPORT_TYPE_IDS } from '@utils/constants';
import AgentSelect from '@components/Form/AgentSelect';
import AddressAutocomplete from '@components/Form/AddressAutocomplete';

const { TextArea } = Input;
const { Option } = Select;

const GasFormPage = () => {
  const dispatch = useDispatch();
  const { formData, currentStep } = useSelector((state) => state.forms[REPORT_TYPES.GAS]);
  const { user } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ visible: false, type: '', message: '' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isRewardModalVisible, setIsRewardModalVisible] = useState(false);
  const [reward, setReward] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { reportId, isAffiliate, formData: initialFormData } = location.state ?? {};

  const gasFormAction = generateFormPayload(REPORT_TYPES.GAS);

  useEffect(() => {
    if (initialFormData) {
      dispatch(setFormData(gasFormAction({ formData: initialFormData })));
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/${reportId}`);
          const formData = res.data.form_data;
          dispatch(setFormData(gasFormAction({ formData })));
          setReportData(res.data);
        } catch (error) {
          notification.error({ message: 'Failed to fetch report data.' });
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    if (user) {
      setIsAdmin(user.user_type_id === user.user_type_id === USER_ROLES.ADMIN);
      fetchReportData();
    }
  }, [reportId, user.id]);

  const totalSteps = 7;

  
  const handleNestedInputChange = (section, index, field) => (e) => {
    dispatch(updateNestedField(gasFormAction({ section, index, field, value: e.target.value })));
  };

  const handleSelectChange = (section, field) => (value) => {
    dispatch(updateField(gasFormAction({ section, field, value })));
  };

  const handleNestedSelectChange = (section, index, field) => (value) => {
    dispatch(updateNestedField(gasFormAction({ section, index, field, value })));
  };

  const handleNestedCheckboxChange = (section, index, field) => (e) => {
    const value = e.target.checked ? 'Yes' : 'No';
    dispatch(updateNestedField(gasFormAction({ section, index, field, value })));
  };

  const handleAddGasAppliance = () => {
    const newAppliance = {
      applianceName: "",
      applianceImage: "",
      isolationValvePresent: "Yes",
      electricallySafe: "Yes",
      adequateVentilation: "Yes",
      adequateClearances: "Yes",
      serviceInAccordanceWithAS4575: "Yes",
      comments: ""
    };
    dispatch(updateDirectField(gasFormAction({
      field: 'gasAppliances', 
      value: [...formData.gasAppliances, newAppliance] 
    })));
  };

  const handleRemoveGasAppliance = (index) => {
    const updatedAppliances = formData.gasAppliances.filter((_, i) => i !== index);
    dispatch(updateDirectField(gasFormAction({ field: 'gasAppliances', value: updatedAppliances })));
  };

  const handleAddFaultRemedialAction = () => {
    const newAction = {
      observation: "",
      recommendation: "",
      image: ""
    };
    dispatch(updateDirectField(gasFormAction({
      field: 'faultsRemedialActions', 
      value: [...formData.faultsRemedialActions, newAction] 
    })));
  };

  const handleRemoveFaultRemedialAction = (index) => {
    const updatedActions = formData.faultsRemedialActions.filter((_, i) => i !== index);
    dispatch(updateDirectField(gasFormAction({ field: 'faultsRemedialActions', value: updatedActions })));
  };

  const handleNext = () => dispatch(setStep(gasFormAction({ step: Math.min(currentStep + 1, totalSteps) })));
  const handleBack = () => dispatch(setStep(gasFormAction({ step: Math.max(currentStep - 1, 1) })));

  const handleClearForm = () => {
    dispatch(resetForm(gasFormAction()));
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
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/reports/approve/${reportId}`, {
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
  
  const handleDecline = () => {
    console.log("Deny action triggered");
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

    const reportId = reportId;

    if (reportId) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const payload = { form_data: formData, comment: comment };
        await axios.put(`${apiUrl}/reports/update/${reportId}`, payload);
        message.success('Report updated successfully!');
      } catch (err) {
        message.error('Failed to update report.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const payload = {
        form_data: formData,
        address: formData.propertyAddress,
        report_type_id: REPORT_TYPE_IDS[REPORT_TYPES.GAS],
      };
      const res = await axios.post(`${apiUrl}/reports/create`, payload);
      dispatch(resetForm(gasFormAction()));
      message.success('Report created successfully!');
    } catch (err) {
      message.error('Failed to create report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSelectAndChange = ({ value, id }) => {
    dispatch(updateDirectField(gasFormAction({ field: 'propertyAddress', value })));
    dispatch(updateDirectField(gasFormAction({ field: 'address_id', value: id })));
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
                  style={{ height: '48px' }}
                  className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 transition-all duration-200 text-lg border-gray-300 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-base font-semibold mb-2">Agent Name</label>
                <AgentSelect
                  value={formData.agentId}
                  onChange={value => {
                    dispatch(updateDirectField(gasFormAction({ field: 'agentId', value })));
                  }}
                  style={{ height: '47px', width: '100%' }}
                  className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 transition-all duration-200 text-lg border-gray-300 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              <div>
                <InputField
                  label="Inspector Name"
                  value={formData.inspectorName || formData.inspectorDetails?.inspectorName || ''}
                  onChange={e => dispatch(updateDirectField(gasFormAction({ field: 'inspectorName', value: e.target.value })))}
                  className="mb-0"
                />
              </div>
              <div>
                <InputField
                  label="Inspection Date"
                  type="date"
                  value={formData.inspectionDate || formData.dateOfInspection || ''}
                  onChange={e => dispatch(updateDirectField(gasFormAction({ field: 'inspectionDate', value: e.target.value })))}
                  className="mb-0"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Inspector Signature</label>
              <ImageDropzone
                value={formData.inspectorSignature ? [formData.inspectorSignature] : (formData.inspectorDetails?.inspectorSignature ? [formData.inspectorDetails.inspectorSignature] : [])}
                onChange={urls => dispatch(updateDirectField(gasFormAction({ field: 'inspectorSignature', value: urls[0] || '' })))}
                maxCount={1}
              />
            </div>
          </StepWrapper>
        );
      case 2:
        return (
          <StepWrapper title="Checks Conducted">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gas Safety Check Status</label>
              <Select
                value={formData.checksConducted?.gasSafetyCheckStatus || 'Pass'}
                onChange={handleSelectChange('checksConducted', 'gasSafetyCheckStatus')}
                className="w-full"
              >
                <Option value="Pass">Pass</Option>
                <Option value="Fail">Fail</Option>
              </Select>
            </div>
          </StepWrapper>
        );
      case 3:
        return (
          <StepWrapper title="Gas Safety Report Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                label="Report Date" 
                type="date"
                value={formData.gasSafetyReportDetails?.reportDate || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'reportDate', value: e.target.value })))} 
              />
              <InputField 
                label="VBA Record Number" 
                value={formData.gasSafetyReportDetails?.vbaRecordNumber || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'vbaRecordNumber', value: e.target.value })))} 
              />
              <InputField 
                label="Licensed Person Email" 
                type="email"
                value={formData.gasSafetyReportDetails?.licensedPersonEmail || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'licensedPersonEmail', value: e.target.value })))} 
              />
              <InputField 
                label="Licensed Person License No" 
                value={formData.gasSafetyReportDetails?.licensedPersonLicenseNo || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'licensedPersonLicenseNo', value: e.target.value })))} 
              />
              <InputField 
                label="Check Completed By" 
                value={formData.gasSafetyReportDetails?.checkCompletedBy || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'checkCompletedBy', value: e.target.value })))} 
              />
              <InputField 
                label="Check Completed By License No" 
                value={formData.gasSafetyReportDetails?.checkCompletedByLicenseNo || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'checkCompletedByLicenseNo', value: e.target.value })))} 
              />
              <InputField 
                label="Client Name" 
                value={formData.gasSafetyReportDetails?.clientName || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'clientName', value: e.target.value })))} 
              />
              <InputField 
                label="Client Contact No" 
                value={formData.gasSafetyReportDetails?.clientContactNo || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'clientContactNo', value: e.target.value })))} 
              />
              <InputField 
                label="Street Address" 
                value={formData.gasSafetyReportDetails?.streetAddress || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'streetAddress', value: e.target.value })))} 
              />
              <InputField 
                label="Suburb" 
                value={formData.gasSafetyReportDetails?.suburb || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'suburb', value: e.target.value })))} 
              />
              <InputField 
                label="Postcode" 
                value={formData.gasSafetyReportDetails?.postcode || ''} 
                onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasSafetyReportDetails', field: 'postcode', value: e.target.value })))} 
              />
            </div>
          </StepWrapper>
        );
      case 4:
        return (
          <StepWrapper title="Gas Installation">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">LP Gas Cylinders Correctly Installed</label>
              <Select
                value={formData.gasInstallation?.lpGasCylindersCorrectlyInstalled || 'Yes'}
                onChange={handleSelectChange('gasInstallation', 'lpGasCylindersCorrectlyInstalled')}
                className="w-full"
              >
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
                <Option value="N/A">N/A</Option>
              </Select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Leakage Test Result</label>
              <Select
                value={formData.gasInstallation?.leakageTestResult || 'Pass'}
                onChange={handleSelectChange('gasInstallation', 'leakageTestResult')}
                className="w-full"
              >
                <Option value="Pass">Pass</Option>
                <Option value="Fail">Fail</Option>
              </Select>
            </div>
            <TextAreaField 
              label="Comments" 
              value={formData.gasInstallation?.comments || ''} 
              onChange={(e) => dispatch(updateField(gasFormAction({ section: 'gasInstallation', field: 'comments', value: e.target.value })))} 
            />
          </StepWrapper>
        );
      case 5:
        return (
          <StepWrapper title="Gas Appliances">
            {formData.gasAppliances?.map((appliance, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <InputField 
                    label="Appliance Name" 
                    value={appliance.applianceName} 
                    onChange={handleNestedInputChange('gasAppliances', index, 'applianceName')} 
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appliance Image</label>
                    <ImageDropzone
                      value={appliance.applianceImage ? [appliance.applianceImage] : []}
                      onChange={(urls) => dispatch(updateNestedField(gasFormAction({ section: 'gasAppliances', index, field: 'applianceImage', value: urls[0] || '' })))}
                      maxCount={1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <CheckboxField
                    label="Isolation Valve Present"
                    checked={appliance.isolationValvePresent === 'Yes'}
                    onChange={handleNestedCheckboxChange('gasAppliances', index, 'isolationValvePresent')}
                  />
                  <CheckboxField
                    label="Electrically Safe"
                    checked={appliance.electricallySafe === 'Yes'}
                    onChange={handleNestedCheckboxChange('gasAppliances', index, 'electricallySafe')}
                  />
                  <CheckboxField
                    label="Adequate Ventilation"
                    checked={appliance.adequateVentilation === 'Yes'}
                    onChange={handleNestedCheckboxChange('gasAppliances', index, 'adequateVentilation')}
                  />
                  <CheckboxField
                    label="Adequate Clearances"
                    checked={appliance.adequateClearances === 'Yes'}
                    onChange={handleNestedCheckboxChange('gasAppliances', index, 'adequateClearances')}
                  />
                  <CheckboxField
                    label="Service in Accordance with AS4575"
                    checked={appliance.serviceInAccordanceWithAS4575 === 'Yes'}
                    onChange={handleNestedCheckboxChange('gasAppliances', index, 'serviceInAccordanceWithAS4575')}
                  />
                </div>
                <TextAreaField 
                  label="Comments" 
                  value={appliance.comments} 
                  onChange={handleNestedInputChange('gasAppliances', index, 'comments')} 
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveGasAppliance(index)} 
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove Appliance
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddGasAppliance} 
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Gas Appliance
            </button>
          </StepWrapper>
        );
      case 6:
        return (
          <StepWrapper title="Appliance Servicing Compliance & Declaration">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Appliance Servicing Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckboxField
                  label="Serviced in Accordance with AS4575"
                  checked={formData.applianceServicingCompliance?.servicedInAccordanceWithAS4575 || false}
                  onChange={(e) => dispatch(updateField(gasFormAction({ section: 'applianceServicingCompliance', field: 'servicedInAccordanceWithAS4575', value: e.target.checked })))}
                />
                <CheckboxField
                  label="Record Created and Provided to Rental Provider"
                  checked={formData.applianceServicingCompliance?.recordCreatedAndProvidedToRentalProvider || false}
                  onChange={(e) => dispatch(updateField(gasFormAction({ section: 'applianceServicingCompliance', field: 'recordCreatedAndProvidedToRentalProvider', value: e.target.checked })))}
                />
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Declaration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appliance Status</label>
                  <Select
                    value={formData.declaration?.applianceStatus || 'Compliant'}
                    onChange={handleSelectChange('declaration', 'applianceStatus')}
                    className="w-full"
                  >
                    <Option value="Compliant">Compliant</Option>
                    <Option value="Non-Compliant">Non-Compliant</Option>
                    <Option value="Unsafe">Unsafe</Option>
                  </Select>
                </div>
                <InputField 
                  label="Next Gas Safety Check Due" 
                  type="date"
                  value={formData.declaration?.nextGasSafetyCheckDue || ''} 
                  onChange={(e) => dispatch(updateField(gasFormAction({ section: 'declaration', field: 'nextGasSafetyCheckDue', value: e.target.value })))} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gasfitter Signature Image</label>
                <ImageDropzone
                  value={formData.declaration?.gasfitterSignatureImage ? [formData.declaration.gasfitterSignatureImage] : []}
                  onChange={(urls) => dispatch(updateField(gasFormAction({ section: 'declaration', field: 'gasfitterSignatureImage', value: urls[0] || '' })))}
                  maxCount={1}
                />
              </div>
            </div>
          </StepWrapper>
        );
      case 7:
        return (
          <StepWrapper title="Faults/Remedial Actions & Annex Photos">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Faults/Remedial Actions</h3>
              {formData.faultsRemedialActions?.map((action, index) => (
                <div key={index} className="mb-4 p-4 border rounded-lg">
                  <TextAreaField 
                    label="Observation" 
                    value={action.observation} 
                    onChange={handleNestedInputChange('faultsRemedialActions', index, 'observation')} 
                  />
                  <TextAreaField 
                    label="Recommendation" 
                    value={action.recommendation} 
                    onChange={handleNestedInputChange('faultsRemedialActions', index, 'recommendation')} 
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <ImageDropzone
                      value={action.image ? [action.image] : []}
                      onChange={(urls) => dispatch(updateNestedField(gasFormAction({ section: 'faultsRemedialActions', index, field: 'image', value: urls[0] || '' })))}
                      maxCount={1}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFaultRemedialAction(index)} 
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={handleAddFaultRemedialAction} 
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Fault/Remedial Action
              </button>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Annex Photos</h3>
              <ImageAppendixList
                value={formData.annexPhotos || []}
                onChange={(list) => dispatch(updateDirectField(gasFormAction({ field: 'annexPhotos', value: list })))}
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
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gas Safety Check Report</h1>
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
                  user.user_type_id === USER_ROLES.ADMIN ? (
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
                      {isSubmitting ? (user.user_type_id === USER_ROLES.ADMIN ? 'Updating...' : 'Submitting...') : (user.user_type_id === USER_ROLES.ADMIN ? 'Update' : 'Submit')}
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
            precision={0}
            step={1}
        />
      </Modal>
    </div>
  );
};

export default GasFormPage;