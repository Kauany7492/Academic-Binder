import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import driveLight from '../assets/icons/drive-light.svg';
import driveDark from '../assets/icons/drive-dark.svg';

const DriveButton = ({ onClick, disabled }) => {
  const { isDark } = useTheme();

  return (
    <button
      className="drive-button"
      onClick={onClick}
      disabled={disabled}
      title="Enviar para o Google Drive"
    >
      <img
        src={isDark ? driveDark : driveLight}
        alt="Drive"
        className="drive-icon"
      />
    </button>
  );
};

export default DriveButton;
