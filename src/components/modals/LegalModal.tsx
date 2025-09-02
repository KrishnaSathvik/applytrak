// src/components/modals/LegalModal.tsx
import React, {useEffect, useMemo, useState} from "react";
import {Modal} from "../ui/Modal";
import {Shield, FileText, CheckCircle, Lock} from "lucide-react";

type Kind = "terms" | "privacy";

interface Props {
    isOpen: boolean;
    kind?: Kind;
    onClose: () => void;
}

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
                                                                                                   active,
                                                                                                   onClick,
                                                                                                   children
                                                                                               }) => (
    <button
        type="button"
        onClick={onClick}
        className={[
            "px-6 py-3 rounded-lg text-sm font-medium border-2 transition-all duration-200",
            active
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg"
                : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
        ].join(" ")}
    >
        {children}
    </button>
);

const LegalModal: React.FC<Props> = ({isOpen, kind = "terms", onClose}) => {
    const [tab, setTab] = useState<Kind>(kind);
    useEffect(() => {
        if (isOpen) setTab(kind);
    }, [isOpen, kind]);

    const title = useMemo(() => (tab === "terms" ? "Terms of Service" : "Privacy Policy"), [tab]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
            <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-t-lg" />
                </div>

                {/* Content */}
                <div className="pt-8 pb-6 px-8">
                    {/* Header Section */}
                    <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30 mb-8">
                        <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4 shadow-lg">
                                {tab === "terms" ? (
                                    <FileText className="h-8 w-8 text-blue-600" />
                                ) : (
                                    <Shield className="h-8 w-8 text-blue-600" />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                {title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {tab === "terms" 
                                    ? "Simple terms for using ApplyTrak"
                                    : "How we protect your data"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="glass-card mb-8">
                        <div className="flex justify-center gap-4 p-6">
                            <TabBtn active={tab === "terms"} onClick={() => setTab("terms")}>
                                <FileText className="h-4 w-4 mr-2 inline" />
                                Terms
                            </TabBtn>
                            <TabBtn active={tab === "privacy"} onClick={() => setTab("privacy")}>
                                <Shield className="h-4 w-4 mr-2 inline" />
                                Privacy
                            </TabBtn>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="glass-card">
                        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6 text-sm leading-relaxed">
                            {tab === "terms" ? (
                                <>
                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Acceptance</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            By using ApplyTrak, you agree to these terms. We provide a simple tool to track your job applications.
                                        </p>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Use of Service</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            Use ApplyTrak for tracking job applications only. Don't misuse or try to break the service.
                                        </p>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                                <CheckCircle className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Your Data</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            Your job applications and data belong to you. We only use it to provide the service you requested.
                                        </p>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                                <CheckCircle className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Service</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            ApplyTrak is provided "as-is". We do our best to keep it working, but we can't guarantee it will always be perfect.
                                        </p>
                                    </section>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Last updated: August 2025
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">What We Collect</h3>
                                        </div>
                                        <div className="ml-11 space-y-2">
                                            <p className="text-gray-700 dark:text-gray-300">We only collect what we need:</p>
                                            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                                                <li>Your name and email for your account</li>
                                                <li>Your job applications and notes</li>
                                                <li>Basic usage info to improve the app</li>
                                            </ul>
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                                                <Lock className="h-4 w-4 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">How We Use It</h3>
                                        </div>
                                        <div className="ml-11 space-y-2">
                                            <p className="text-gray-700 dark:text-gray-300">Your data is used to:</p>
                                            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                                                <li>Save and sync your applications</li>
                                                <li>Keep your account secure</li>
                                                <li>Make the app work better</li>
                                            </ul>
                                            <p className="text-green-700 dark:text-green-300 font-medium mt-2">
                                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                                We never sell your data to anyone
                                            </p>
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                                <CheckCircle className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Your Control</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            You can update your settings, delete your data, or close your account anytime. You're always in control.
                                        </p>
                                    </section>

                                    <section className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                                <CheckCircle className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Data Storage</h3>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 ml-11">
                                            We keep your data while you use ApplyTrak. If you delete your account, we delete your data within 30 days.
                                        </p>
                                    </section>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Last updated: August 2025
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LegalModal;
