// src/components/modals/LegalModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";

type Kind = "terms" | "privacy";

interface Props {
    isOpen: boolean;
    kind?: Kind;
    onClose: () => void;
}

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={[
            "px-3 py-1 rounded-full text-sm border transition",
            active
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent"
                : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        ].join(" ")}
    >
        {children}
    </button>
);

const LegalModal: React.FC<Props> = ({ isOpen, kind = "terms", onClose }) => {
    const [tab, setTab] = useState<Kind>(kind);
    useEffect(() => { if (isOpen) setTab(kind); }, [isOpen, kind]);

    const title = useMemo(() => (tab === "terms" ? "Terms of Service" : "Privacy Policy"), [tab]);

    return (
        // IMPORTANT: give Modal the title so it shows its own single X; we don't render a second one.
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl" variant="primary">
            <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <TabBtn active={tab === "terms"} onClick={() => setTab("terms")}>Terms</TabBtn>
                    <TabBtn active={tab === "privacy"} onClick={() => setTab("privacy")}>Privacy</TabBtn>
                </div>

                <div className="max-h-[70vh] overflow-y-auto space-y-5 text-sm leading-6">
                    {tab === "terms" ? (
                        <>
                            <section><h3 className="font-semibold mb-1">Acceptance of Terms</h3><p>By creating an account or using ApplyTrak, you agree to these Terms.</p></section>
                            <section><h3 className="font-semibold mb-1">Use of Service</h3><p>Don’t misuse or disrupt the service.</p></section>
                            <section><h3 className="font-semibold mb-1">Your Content</h3><p>You retain rights to your content; we process it to provide features.</p></section>
                            <section><h3 className="font-semibold mb-1">Disclaimers</h3><p>Service is provided “as-is” without warranties as allowed by law.</p></section>
                            <p className="text-xs text-gray-500">Last updated: Aug 24, 2025</p>
                        </>
                    ) : (
                        <>
                            <section><h3 className="font-semibold mb-1">What We Collect</h3><ul className="list-disc pl-5 space-y-1"><li>Account info (name, email)</li><li>Applications, notes, attachments</li><li>Optional analytics & product update prefs</li></ul></section>
                            <section><h3 className="font-semibold mb-1">How We Use Data</h3><p>Provide core features, improve product, secure the service. We never sell data.</p></section>
                            <section><h3 className="font-semibold mb-1">Your Choices</h3><p>Control analytics/updates anytime; unsubscribe from emails.</p></section>
                            <section><h3 className="font-semibold mb-1">Retention</h3><p>We keep data while your account is active; then delete/anonymize.</p></section>
                            <p className="text-xs text-gray-500">Last updated: Aug 24, 2025</p>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LegalModal;
