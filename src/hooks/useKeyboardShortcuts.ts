import {useEffect} from 'react';
import {useAppStore} from '../store/useAppStore';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    callback: (e: KeyboardEvent) => void;
    preventDefault?: boolean;
    description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            const activeElement = document.activeElement as HTMLElement;
            const isTyping = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.contentEditable === 'true';

            // Allow escape key even when typing
            if (isTyping && e.key !== 'Escape') return;

            shortcuts.forEach(shortcut => {
                const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
                const ctrlMatch = !!shortcut.ctrlKey === (e.ctrlKey || e.metaKey);
                const shiftMatch = !!shortcut.shiftKey === e.shiftKey;
                const altMatch = !!shortcut.altKey === e.altKey;
                const metaMatch = !!shortcut.metaKey === (e.metaKey || e.ctrlKey);

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    if (shortcut.preventDefault !== false) {
                        e.preventDefault();
                    }
                    shortcut.callback(e);
                }
            });
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
};

// Predefined shortcuts hook for the job tracker - FIXED to work with your store
export const useJobTrackerShortcuts = () => {
    const {setSelectedTab, setTheme, ui, setSearchQuery, showToast} = useAppStore();

    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'n',
            ctrlKey: true,
            description: 'New application (focus company field)',
            callback: () => {
                // Focus on the company input field to start new application
                const companyInput = document.getElementById('company') as HTMLInputElement;
                if (companyInput) {
                    companyInput.focus();
                    companyInput.scrollIntoView({behavior: 'smooth', block: 'center'});
                    showToast({
                        type: 'info',
                        message: 'Ready to add new application!',
                        duration: 2000
                    });
                }
            }
        },
        {
            key: 's',
            ctrlKey: true,
            description: 'Save form',
            callback: (e) => {
                e.preventDefault();
                // Find and trigger form submission
                const activeForm = document.querySelector('form:focus-within') as HTMLFormElement;
                if (activeForm) {
                    const submitButton = activeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton && !submitButton.disabled) {
                        submitButton.click();
                    }
                } else {
                    // If no form is focused, try to find the main application form
                    const jobForm = document.getElementById('jobForm') as HTMLFormElement;
                    if (jobForm) {
                        const submitButton = jobForm.querySelector('button[type="submit"]') as HTMLButtonElement;
                        if (submitButton && !submitButton.disabled) {
                            submitButton.click();
                        }
                    }
                }
            }
        },
        {
            key: 'Escape',
            description: 'Close modals or clear search',
            callback: () => {
                // Clear search if focused
                const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                if (searchInput && document.activeElement === searchInput) {
                    setSearchQuery('');
                    searchInput.blur();
                    return;
                }

                // Close modals using store actions
                const store = useAppStore.getState();
                if (store.modals.editApplication.isOpen) {
                    store.closeEditModal();
                } else if (store.modals.goalSetting.isOpen) {
                    store.closeGoalModal();
                } else if (store.modals.milestone.isOpen) {
                    store.closeMilestone();
                }
            }
        },
        {
            key: 'f',
            ctrlKey: true,
            description: 'Search applications',
            callback: (e) => {
                e.preventDefault();
                // Focus search input
                const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                    showToast({
                        type: 'info',
                        message: 'Search applications...',
                        duration: 2000
                    });
                }
            }
        },
        {
            key: 't',
            ctrlKey: true,
            description: 'Toggle theme',
            callback: (e) => {
                e.preventDefault();
                const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                showToast({
                    type: 'info',
                    message: `Switched to ${newTheme} mode`,
                    duration: 2000
                });
            }
        },
        {
            key: '1',
            ctrlKey: true,
            description: 'Switch to Tracker tab',
            callback: (e) => {
                e.preventDefault();
                setSelectedTab('tracker');
                showToast({
                    type: 'info',
                    message: 'Switched to Tracker',
                    duration: 1500
                });
            }
        },
        {
            key: '2',
            ctrlKey: true,
            description: 'Switch to Analytics tab',
            callback: (e) => {
                e.preventDefault();
                setSelectedTab('analytics');
                showToast({
                    type: 'info',
                    message: 'Switched to Analytics',
                    duration: 1500
                });
            }
        },
        {
            key: 'g',
            ctrlKey: true,
            description: 'Open goal settings',
            callback: (e) => {
                e.preventDefault();
                const store = useAppStore.getState();
                store.openGoalModal();
            }
        },
        {
            key: '?',
            shiftKey: true,
            description: 'Show keyboard shortcuts',
            callback: (e) => {
                e.preventDefault();
                showKeyboardShortcutsHelp();
            }
        }
    ];

    const showKeyboardShortcutsHelp = () => {
        const shortcutList = shortcuts
            .map(shortcut => {
                const keys = [];
                if (shortcut.ctrlKey) keys.push('Ctrl');
                if (shortcut.shiftKey) keys.push('Shift');
                if (shortcut.altKey) keys.push('Alt');
                keys.push(shortcut.key.toUpperCase());
                return `${keys.join(' + ')}: ${shortcut.description || 'No description'}`;
            })
            .join('\n');

        showToast({
            type: 'info',
            message: 'Keyboard Shortcuts Available',
            duration: 5000,
            action: {
                label: 'View All',
                onClick: () => {
                    alert(`⌨️ Keyboard Shortcuts:\n\n${shortcutList}`);
                }
            }
        });
    };

    useKeyboardShortcuts(shortcuts);

    return {
        shortcuts,
        showKeyboardShortcutsHelp
    };
};