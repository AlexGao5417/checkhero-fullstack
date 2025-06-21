import { createSlice } from '@reduxjs/toolkit';
import { initialFormData } from '../utils/formInitialState';

const formSlice = createSlice({
  name: 'form',
  initialState: {
    formData: initialFormData,
    currentStep: 1,
  },
  reducers: {
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    updateField: (state, action) => {
      const { section, field, value } = action.payload;
      state.formData[section][field] = value;
    },
    updateNestedField: (state, action) => {
      const { section, index, field, value } = action.payload;
      state.formData[section][index][field] = value;
    },
    addSmokeAlarm: (state) => {
      state.formData.smokeAlarmDetails.push({ voltage: '', status: '', location: '', expiration: '' });
    },
    removeSmokeAlarm: (state, action) => {
      state.formData.smokeAlarmDetails.splice(action.payload, 1);
    },
    updateDirectField: (state, action) => {
        const { field, value } = action.payload;
        state.formData[field] = value;
    },
    resetForm: (state) => {
      state.formData = initialFormData;
      state.currentStep = 1;
    },
    setFormData: (state, action) => {
      state.formData = action.payload;
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