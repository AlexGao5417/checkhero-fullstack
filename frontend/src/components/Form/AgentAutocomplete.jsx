import React from 'react';
import AsyncAutocomplete from './AsyncAutocomplete';
import { API_ENDPOINTS } from '@utils/constants';

const AgentAutocomplete = ({ value, onChange, style }) => {
  return (
    <AsyncAutocomplete
      placeholder="Agent Name"
      value={value}
      onChange={() => {}}
      onSelect={onChange}
      fetchUrl={API_ENDPOINTS.agents}
      searchParamName="username"
      displayField="username"
      idField="id"
      allowCustomValue={false}
      style={style}
    />
  );
};

export default AgentAutocomplete; 