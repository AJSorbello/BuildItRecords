import React, { useState, useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  style
}) => {
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const handleChange = useCallback((newValue: string) => {
    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      onChange(newValue);
    }, 300);
    setTimer(newTimer);
  }, [onChange, timer]);

  React.useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return (
    <Input
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      style={style}
      allowClear
    />
  );
};
