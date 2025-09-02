import React, { useState } from 'react';
import MobileLoginModal from './MobileLoginModal';
import MobileSignupModal from './MobileSignupModal';

interface MobileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

const MobileAuthModal: React.FC<MobileAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);

  // Update authMode when initialMode changes
  React.useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const handleSwitchToSignup = () => {
    setAuthMode('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleClose = () => {
    setAuthMode(initialMode); // Reset to initial mode when closing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {authMode === 'login' ? (
        <MobileLoginModal
          isOpen={isOpen}
          onClose={handleClose}
          onSwitchToSignup={handleSwitchToSignup}
        />
      ) : (
        <MobileSignupModal
          isOpen={isOpen}
          onClose={handleClose}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </>
  );
};

export default MobileAuthModal;
