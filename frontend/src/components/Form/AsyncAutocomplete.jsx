import React, { useState, useMemo, useRef } from 'react';
import { AutoComplete, Spin, Input } from 'antd';
import axios from '@utils/axios';
import debounce from 'lodash/debounce';

const MIN_SEARCH_LENGTH = 2;

const AsyncAutocomplete = ({
  value,
  onChange,
  onSelect: onSelectProp,
  placeholder,
  fetchUrl,
  searchParamName,
  displayField,
  idField = 'id',
  style,
  allowCustomValue = true,
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const justSelected = useRef(false);

  const fetchOptions = async (searchText) => {
    if (!searchText || searchText.length < MIN_SEARCH_LENGTH) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const params = { [searchParamName]: searchText };
      const response = await axios.get(fetchUrl, { params });
      const data = response.data.map((item) => ({
        label: item[displayField],
        value: item[displayField],
        id: item[idField],
      }));
      setOptions(data);
    } catch (error) {
      console.error(`Failed to fetch autocomplete options from ${fetchUrl}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchOptions = useMemo(() => debounce(fetchOptions, 500), [fetchUrl]);

  const onSelect = (selectedValue, option) => {
    justSelected.current = true;
    if (onSelectProp) {
      onSelectProp({ value: selectedValue, id: option.id });
    } else if (onChange) {
      onChange({ value: selectedValue, id: option.id });
    }
  };

  const handleInputChange = (text) => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (allowCustomValue && onChange) {
      onChange({ value: text, id: null });
    }
    // If not allowCustomValue, ignore typing
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={debouncedFetchOptions}
      onSelect={onSelect}
      onChange={handleInputChange}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      notFoundContent={loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}><Spin size="small" /></div> : null}
      allowClear
    />
  );
};

export default AsyncAutocomplete; 