import React from 'react';
import {useAppStore} from '../../store/useAppStore';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import ResetPasswordModal from './ResetPasswordModal';

const AuthModal: React.FC = () => {
    const {modals} = useAppStore();

    return (
        <>
            <LoginModal/>
            <SignupModal/>
            <ResetPasswordModal/>
        </>
    );
};

export default AuthModal;