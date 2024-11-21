import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Switch } from '@headlessui/react';
import WatchlistDropdown from './WatchlistDropdown';

const Slider = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm font-['Press_Start_2P'] text-pepe-light">
        {label}
      </label>
      <span className="text-sm font-['Press_Start_2P'] text-pepe-primary">
        {value}%
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-pepe-dark rounded-lg appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-pepe-primary
                 [&::-webkit-slider-thumb]:hover:bg-pepe-secondary
                 [&::-webkit-slider-thumb]:transition-colors
                 [&::-webkit-slider-thumb]:duration-200"
    />
  </div>
);

const ReinvestmentPanel = ({ userId }) => {
  const [settings, setSettings] = useState({
    isAutomated: true,
    profitThreshold: 5,
    shortTermAllocation: 70,
    longTermAllocation: 30,
    watchlist: []
  });

  const [isDirty, setIsDirty] = useState(false);

  const socket = useWebSocket('reinvestment', (update) => {
    if (update.type === 'settings' && !isDirty) {
      setSettings(update.data);
    }
  });

  useEffect(() => {
    // Load initial settings
    fetch(`/api/reinvestment/settings/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data);
        }
      })
      .catch(error => console.error('Failed to load reinvestment settings:', error));
  }, [userId]);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    
    // Update local state
    setSettings(newSettings);
    setIsDirty(true);

    try {
      // Send to backend
      const response = await fetch(`/api/reinvestment/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save reinvestment settings:', error);
    }
  };

  const handleAllocationChange = (shortTerm) => {
    const longTerm = 100 - shortTerm;
    setSettings(prev => ({
      ...prev,
      shortTermAllocation: shortTerm,
      longTermAllocation: longTerm
    }));
    setIsDirty(true);
  };

  const handleWatchlistChange = (coins) => {
    handleSettingChange('watchlist', coins);
  };

  return (
    <div className="bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary p-6
                    shadow-pepe hover:shadow-pepe-hover transition-shadow duration-300">
      <h2 className="text-xl font-['Press_Start_2P'] text-pepe-primary mb-6 flex items-center">
        <span className="w-3 h-3 rounded-full bg-pepe-primary animate-usb-pulse mr-3" />
        Reinvestment Controls
      </h2>

      <div className="space-y-6">
        {/* Automation Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-['Press_Start_2P'] text-pepe-light">
            Automated Reinvestment
          </span>
          <Switch
            checked={settings.isAutomated}
            onChange={(checked) => handleSettingChange('isAutomated', checked)}
            className={`${
              settings.isAutomated ? 'bg-pepe-primary' : 'bg-pepe-dark'
            } relative inline-flex h-6 w-11 items-center rounded-full border-2 border-pepe-primary
              transition-colors duration-200 ease-in-out focus:outline-none`}
          >
            <span
              className={`${
                settings.isAutomated ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-pepe-dark
                transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>

        {/* Profit Threshold */}
        <motion.div
          animate={{ opacity: settings.isAutomated ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <Slider
            label="Profit Threshold"
            value={settings.profitThreshold}
            onChange={(value) => handleSettingChange('profitThreshold', value)}
            min={1}
            max={50}
            step={0.5}
          />
        </motion.div>

        {/* Allocation Sliders */}
        <motion.div
          animate={{ opacity: settings.isAutomated ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <Slider
            label="Short-term Allocation"
            value={settings.shortTermAllocation}
            onChange={handleAllocationChange}
          />
          <div className="flex justify-between text-xs text-pepe-light">
            <span>Long-term: {settings.longTermAllocation}%</span>
          </div>
        </motion.div>

        {/* Watchlist */}
        <motion.div
          animate={{ opacity: settings.isAutomated ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <WatchlistDropdown
            selectedCoins={settings.watchlist}
            onSelectionChange={handleWatchlistChange}
          />
        </motion.div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              settings.isAutomated ? 'bg-pepe-primary' : 'bg-pepe-warning'
            } animate-usb-pulse`}
          />
          <span className="text-xs text-pepe-light">
            {settings.isAutomated ? 'Automated' : 'Manual'} Mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReinvestmentPanel;