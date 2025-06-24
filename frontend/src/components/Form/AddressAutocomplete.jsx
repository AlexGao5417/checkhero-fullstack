import React from 'react';
import AsyncAutocomplete from './AsyncAutocomplete';
import { API_ENDPOINTS } from '@utils/constants';

const AddressAutocomplete = ({ value, onChange, style }) => {
  return (
    <AsyncAutocomplete
      placeholder="Property Address"
      value={value}
      onChange={onChange}
      fetchUrl={API_ENDPOINTS.addresses}
      searchParamName="search"
      displayField="full_address"
      idField="address_id"
      style={style}
    />
  );
};

export default AddressAutocomplete; 