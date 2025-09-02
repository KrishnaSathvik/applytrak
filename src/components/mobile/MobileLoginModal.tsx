import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { loginSchema } from '../../utils/validation';

interface LoginFormData {
  email: string;
  password: string;
}

interface MobileLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const MobileLoginModal: React.FC<MobileLoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup
}) => {
  const { signIn, showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema as any)
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      showToast({
        type: 'success',
        message: 'Welcome back! You\'re now signed in.',
        duration: 3000
      });
      reset();
      onClose();
    } catch (error: any) {
      console.error('Login error:', error);
      showToast({
        type: 'error',
        message: error.message || 'Failed to sign in. Please check your credentials.',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-fullscreen">
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/30 rounded-lg border border-blue-400/20">
                <LogIn className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Welcome Back
                </h2>
                <p className="text-sm text-white/80">
                  Sign in to continue tracking
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="form-label-enhanced">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="form-input-enhanced pl-10"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="form-label-enhanced">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="form-input-enhanced pl-10 pr-10"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center mobile-justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="mobile-spinner" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 text-white" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Switch to Signup */}
            <button
              onClick={onSwitchToSignup}
              disabled={isLoading}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4 text-green-600" />
              Create New Account
            </button>
          </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginModal;
