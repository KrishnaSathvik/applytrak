// src/components/ui/NotesIcon.tsx - Interactive Notes Icon Component
import {FileText} from "lucide-react";

interface NotesIconProps {
    hasNotes: boolean;
    onClick: () => void;
    className?: string;
}

export const NotesIcon: React.FC<NotesIconProps> = ({hasNotes, onClick, className = ""}) => {
    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 
                ${hasNotes
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-110'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
                ${className}
            `}
            title={hasNotes ? "View notes" : "No notes"}
        >
            <FileText className="h-4 w-4"/>
        </button>
    );
};