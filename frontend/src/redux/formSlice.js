import { createSlice } from '@reduxjs/toolkit';
import { REPORT_TYPES } from '@utils/constants';

// Electrical and Smoke form initial data (imported)
const initialFormData = {
  agentName: '',
  agent_id: null,
  propertyAddress: '',
  address_id: null,
  reportDate: '',
  electricalSafetyCheck: false,
  smokeSafetyCheck: false,
  installationExtent: {
      'Main Switchboard': false,
      'Other living areas': false,
      'Main earthing system': false,
      'Laundry': false,
      'Kitchen': false,
      'Garage': false,
      'Bathroom (main)': false,
      'Solar/battery system': false,
      'Other bathrooms/ensuites': false,
      'Installation - Electric water heater': false,
      'Bedroom (main)': false,
      'Installation - Dishwasher': false,
      'Other bedrooms': false,
      'Installation - Electric room/space heaters': false,
      'Living room': false,
      'Installation - Swimming pool equipment': false,
  },
  visualInspection: {
      'Visual - Consumers mains': false,
      'Visual - Space heaters': false,
      'Visual - Switchboards': false,
      'Visual - Cooking equipment': false,
      'Visual - Exposed earth electrode': false,
      'Visual - Dishwasher': false,
      'Visual - Metallic water pipe bond': false,
      'Visual - Exhaust fans': false,
      'Visual - RCDs (Safety switches)': false,
      'Visual - Celling fans': false,
      'Visual - Circuit protection (circuit breakers/fuses)': false,
      'Visual - Washing machinedryer/': false,
      'Visual - Socket-outlets': false,
      'Visual - Installation wiring': false,
      'Visual - Light fittings': false,
      'Visual - Solar and other renewable systems': false,
      'Visual - Electric water heater': false,
      'Visual - Swimming pool equipment': false,
      'Visual - Air conditioners': false,
      'Visual - Vehicle chargers': false,
  },
  polarityTesting: {
      'Polarity - Consumers mains': false,
      'Polarity - Electric water heater': false,
      'Polarity - Circuit protection (circuit breakers/fuses)': false,
      'Polarity - Air conditioners': false,
      'Polarity - RCDs (Safety switches)': false,
      'Polarity - Cooking equipment': false,
      'Polarity - Dishwasher': false,
      'Polarity - Circuit protection (circuit breakers/fuses) (D2)': false,
      'Polarity - Solar and other renewable systems': false,
      'Polarity - Socket-outlets': false,
      'Polarity - Swimming pool equipment': false,
      'Polarity - Vehicle chargers': false,
  },
  earthContinuityTesting: {
      'Earth - Mains earth conductor': false,
      'Earth - Electric water heater': false,
      'Earth - Metallic water pipe bond': false,
      'Earth - Air conditioners': false,
      'Earth - Socket-outlets': false,
      'Earth - Cooking equipment': false,
      'Earth - Light fittings': false,
      'Earth - Dishwasher': false,
      'Earth - Exhaust fans': false,
      'Earth - Solar and other renewable systems': false,
      'Earth - Celling fans': false,
      'Earth - Swimming pool equipment': false,
      'Earth - Vehicle chargers': false,
  },
  rcdTestingPassed: false,
  smokeAlarmsWorking: false,
  nextSmokeAlarmCheckDate: '',
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
  observation: '',
  recommendation: '',
  imageAppendix: [
    {
        image: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1",
        description: "Kitchen"
    },
    {
        image: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1",
        description: "Kitchen"
    }
],
  electricalSafetyCheckCompletedBy: '',
  licenceNumber: '',
  inspectionDate: '',
  nextInspectionDueDate: '',
  signatureDate: '',
};

// Gas form initial data
const gasFormInitialData = {
  agentName: "",
  agent_id: null,
  propertyAddress: "449 Mount Dandenong Road, Kilsyth",
  address_id: null,
  dateOfInspection: "2024-02-02",
  checksConducted: {
    gasSafetyCheckStatus: "Fail"
  },
  inspectorDetails: {
    inspectorName: "",
    inspectorSignature: ""
  },
  faultsRemedialActions: [
    {
      observation: "",
      recommendation: "",
      image: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1"
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
    postcode: "3137"
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
  propertyAddress: "449 Mount Dandenong Road, Kilsyth",
  address_id: null,
  dateOfInspection: "2024-02-02",
  inspectorDetails: {
    inspectorName: "support@checkhero.com.au",
    inspectorSignature: "https://placehold.co/600x400/FF5733/FFFFFF?text=Fault+Image+1"
  },
  agentName: "John Doe",
  agent_id: null,
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