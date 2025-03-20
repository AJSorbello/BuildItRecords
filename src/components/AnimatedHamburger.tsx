import React, { useState } from 'react';
import './AnimatedHamburger.css';

interface AnimatedHamburgerProps {
  onClick?: () => void;
}

const AnimatedHamburger: React.FC<AnimatedHamburgerProps> = ({ onClick }) => {
  const [checked, setChecked] = useState(false);
  
  const handleClick = () => {
    setChecked(!checked);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div id="menu-btn-container">
      <div id="menu-btn">
        <input 
          type="checkbox" 
          id="menu-checkbox" 
          checked={checked}
          onChange={handleClick}
        />
        <label htmlFor="menu-checkbox" id="menu-label">
          <div id="menu-bar"></div>
        </label>
      </div>
    </div>
  );
};

export default AnimatedHamburger;