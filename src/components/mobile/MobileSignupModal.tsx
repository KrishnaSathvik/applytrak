import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, User, UserPlus, LogIn } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { signupSchema } from '../../utils/validation';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

interface MobileSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const MobileSignupModal: React.FC<MobileSignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const { signUp, showToast } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema as any)
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName || data.email.split('@')[0]);
      showToast({
        type: 'success',
        message: 'Account created successfully! Please check your email to verify your account.',
        duration: 5000
      });
      reset();
      onClose();
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast({
        type: 'error',
        message: error.message || 'Failed to create account. Please try again.',
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
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/30 rounded-lg border border-green-400/20">
                <UserPlus className="h-6 w-6 text-green-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Create Account
                </h2>
                <p className="text-sm text-white/80">
                  Start tracking your job applications
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
            {/* Display Name Field */}
            <div className="space-y-2">
              <label className="form-label-enhanced">Display Name (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('displayName')}
                    type="text"
                    className="form-input-enhanced pl-10"
                    placeholder="How should we call you?"
                    disabled={isLoading}
                  />
                </div>
                {errors.displayName && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-600">{errors.displayName.message}</p>
                  </div>
                )}
              </div>

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
                    placeholder="Create a strong password"
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="form-label-enhanced">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input-enhanced pl-10 pr-10"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm mobile-font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Password Requirements:
                  </h4>
                  <ul className="mobile-space-y-1">
                    <li className={`mobile-text-xs flex items-center gap-2 ${
                      password.length >= 8 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <CheckCircle className="h-3 w-3" />
                      At least 8 characters
                    </li>
                    <li className={`mobile-text-xs flex items-center gap-2 ${
                      /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <CheckCircle className="h-3 w-3" />
                      One uppercase letter
                    </li>
                    <li className={`mobile-text-xs flex items-center gap-2 ${
                      /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <CheckCircle className="h-3 w-3" />
                      One lowercase letter
                    </li>
                    <li className={`mobile-text-xs flex items-center gap-2 ${
                      /\d/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <CheckCircle className="h-3 w-3" />
                      One number
                    </li>
                  </ul>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center mobile-justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="mobile-spinner" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-white" />
                    Create Account
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
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Switch to Login */}
            <button
              onClick={onSwitchToLogin}
              disabled={isLoading}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4 text-blue-600" />
              Sign In Instead
            </button>
          </div>

          {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSignupModal;
