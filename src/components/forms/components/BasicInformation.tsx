// src/components/forms/components/BasicInformation.tsx
import React from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ApplicationFormData } from '../../../types';

interface BasicInformationProps {
    register: UseFormRegister<ApplicationFormData>;
    errors: FieldErrors<ApplicationFormData>;
    setValue: UseFormSetValue<ApplicationFormData>;
}

export const BasicInformation: React.FC<BasicInformationProps> = ({
    register,
    errors
}) => {
    return (
        <div className="space-y-6 p-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Basic Information
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Essential details about the job application
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name *
                    </label>
                    <input
                        type="text"
                        id="company"
                        {...register('company')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                            errors.company ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter company name"
                    />
                    {errors.company && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.company.message}
                        </p>
                    )}
                </div>

                {/* Position */}
                <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Position *
                    </label>
                    <input
                        type="text"
                        id="position"
                        {...register('position')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                            errors.position ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter job position"
                    />
                    {errors.position && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.position.message}
                        </p>
                    )}
                </div>

                {/* Date Applied */}
                <div>
                    <label htmlFor="dateApplied" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Applied *
                    </label>
                    <input
                        type="date"
                        id="dateApplied"
                        {...register('dateApplied')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                            errors.dateApplied ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.dateApplied && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.dateApplied.message}
                        </p>
                    )}
                </div>

                {/* Job Type */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Type
                    </label>
                    <select
                        id="type"
                        {...register('type')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                            errors.type ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="Remote">Remote</option>
                        <option value="Onsite">Onsite</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                    {errors.type && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.type.message}
                        </p>
                    )}
                </div>

                {/* Employment Type */}
                <div>
                    <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Employment Type
                    </label>
                    <select
                        id="employmentType"
                        {...register('employmentType')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                            errors.employmentType ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                    </select>
                    {errors.employmentType && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.employmentType.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
