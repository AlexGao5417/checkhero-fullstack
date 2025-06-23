import { createSlice } from '@reduxjs/toolkit';
import { initialFormData } from '../utils/formInitialState';
import { REPORT_TYPES } from '../utils/constants';

// Gas form initial data
const gasFormInitialData = {
  propertyDetails: {
    propertyAddress: "",
    dateOfInspection: ""
  },
  checksConducted: {
    gasSafetyCheckStatus: "Pass"
  },
  contactDetails: {
    email: "",
    phone: ""
  },
  faultsRemedialActions: [
    {
      observation: "",
      recommendation: "",
      image: ""
    }
  ],
  gasSafetyReportDetails: {
    reportDate: "",
    vbaRecordNumber: "",
    licensedPersonEmail: "",
    licensedPersonLicenseNo: "",
    checkCompletedBy: "",
    checkCompletedByLicenseNo: "",
    clientName: "",
    clientContactNo: "",
    streetAddress: "",
    suburb: "",
    postcode: ""
  },
  gasInstallation: {
    lpGasCylindersCorrectlyInstalled: "Yes",
    leakageTestResult: "Pass",
    comments: ""
  },
  gasAppliances: [
    {
      applianceName: "",
      applianceImage: "",
      isolationValvePresent: "Yes",
      electricallySafe: "Yes",
      adequateVentilation: "Yes",
      adequateClearances: "Yes",
      serviceInAccordanceWithAS4575: "Yes",
      comments: ""
    }
  ],
  applianceServicingCompliance: {
    servicedInAccordanceWithAS4575: false,
    recordCreatedAndProvidedToRentalProvider: false
  },
  declaration: {
    applianceStatus: "Compliant",
    nextGasSafetyCheckDue: "",
    gasfitterSignatureImage: ""
  },
  annexPhotos: []
};

const smokeFormInitialData = {
  propertyDetails: {
    propertyAddress: "449 Mount Dandenong Road, Kilsyth",
    dateOfInspection: "2024-02-02"
  },
  inspectorDetails: {
    inspectorName: "support@checkhero.com.au",
    inspectorSignature: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1"
  },
  agentName: "John Doe",
  smokeAlarmDetails: [
      {
          voltage: "120",
          status: "Pass",
          location: "Kitchen",
          expiration: "2024-02-02"
      },
      {
          voltage: "120",
          status: "Pass",
          location: "Kitchen",
          expiration: "2024-02-02"
      }
  ],
  imageAppendix: [
      {
          image: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1",
          description: "Kitchen"
      },
      {
          image: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1",
          description: "Kitchen"
      }
  ]
};

const formSlice = createSlice({
  name: 'forms',
  initialState: {
    [REPORT_TYPES.ELECTRICITY_AND_SMOKE]: {
      formData: initialFormData,
      currentStep: 1,
    },
    [REPORT_TYPES.GAS]: {
      formData: gasFormInitialData,
      currentStep: 1,
    },
    [REPORT_TYPES.SMOKE]: {
      formData: smokeFormInitialData,
      currentStep: 1,
    },
  },
  reducers: {
    setStep: (state, action) => {
      const { formType, step } = action.payload;
      state[formType].currentStep = step;
    },
    updateField: (state, action) => {
      const { formType, section, field, value } = action.payload;
      state[formType].formData[section][field] = value;
    },
    updateNestedField: (state, action) => {
      const { formType, section, index, field, value } = action.payload;
      state[formType].formData[section][index][field] = value;
    },
    addSmokeAlarm: (state, action) => {
      const { formType } = action.payload;
      state[formType].formData.smokeAlarmDetails.push({ voltage: '', status: '', location: '', expiration: '' });
    },
    removeSmokeAlarm: (state, action) => {
      const { formType, index } = action.payload;
      state[formType].formData.smokeAlarmDetails.splice(index, 1);
    },
    updateDirectField: (state, action) => {
      const { formType, field, value } = action.payload;
      state[formType].formData[field] = value;
    },
    resetForm: (state, action) => {
      const { formType } = action.payload;
      if (formType === REPORT_TYPES.ELECTRICITY_AND_SMOKE) {
        state[formType].formData = initialFormData;
      } else if (formType === REPORT_TYPES.GAS) {
        state[formType].formData = gasFormInitialData;
      } else if (formType === REPORT_TYPES.SMOKE) {
        state[formType].formData = smokeFormInitialData;
      }
      state[formType].currentStep = 1;
    },
    setFormData: (state, action) => {
      const { formType, formData } = action.payload;
      state[formType].formData = formData;
    },
  },
});

export const {
  setStep,
  updateField,
  updateNestedField,
  addSmokeAlarm,
  removeSmokeAlarm,
  updateDirectField,
  resetForm,
  setFormData
} = formSlice.actions;

export default formSlice.reducer; 