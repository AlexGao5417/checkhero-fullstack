import React, { useEffect, useState } from 'react';
import { Select, Spin } from 'antd';
import axios from '@utils/axios';
import { API_ENDPOINTS } from '@utils/constants';

const AgentSelect = ({ value, onChange, style, className }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(API_ENDPOINTS.agents)
      .then(res => {
        setOptions(
          res.data.map(agent => ({
            value: agent.id,
            label: agent.username,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select
      showSearch
      placeholder="Select Agent"
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      style={style}
      className={className}
      filterOption={(input, option) =>
        option.label.toLowerCase().includes(input.toLowerCase())
      }
      allowClear
    />
  );
};

export default AgentSelect; 