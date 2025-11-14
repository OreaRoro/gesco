import React from "react";
import { FaPrint, FaDownload, FaShare } from "react-icons/fa";

interface StudentCardActionsProps {
  onPrint: () => void;
  onDownload: () => void;
  onShare?: () => void;
  className?: string;
}

export const StudentCardActions: React.FC<StudentCardActionsProps> = ({
  onPrint,
  onDownload,
  onShare,
  className = "",
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={onPrint}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FaPrint className="w-4 h-4" />
        Imprimer
      </button>

      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FaDownload className="w-4 h-4" />
        Télécharger
      </button>

      {onShare && (
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaShare className="w-4 h-4" />
          Partager
        </button>
      )}
    </div>
  );
};
