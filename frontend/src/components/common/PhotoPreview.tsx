import React from "react";
import { UserIcon } from "../../icons";
import { FiX } from "react-icons/fi";
interface PhotoPreviewProps {
  currentPhotoUrl?: string;
  newPhotoUrl?: string;
  onRemovePhoto: () => void;
  onRemoveNewPhoto: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  currentPhotoUrl,
  newPhotoUrl,
  onRemovePhoto,
  onRemoveNewPhoto,
}) => {
  return (
    <div className="space-y-4">
      {/* Photo actuelle */}
      {currentPhotoUrl && !newPhotoUrl && (
        <div className="relative inline-block">
          <img
            src={currentPhotoUrl}
            alt="Photo actuelle"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
          <button
            type="button"
            onClick={onRemovePhoto}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nouvelle photo */}
      {newPhotoUrl && (
        <div className="relative inline-block">
          <img
            src={newPhotoUrl}
            alt="Nouvelle photo"
            className="w-32 h-32 rounded-full object-cover border-2 border-brand-500"
          />
          <button
            type="button"
            onClick={onRemoveNewPhoto}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-brand-500 text-white text-xs text-center py-1">
            Nouvelle
          </div>
        </div>
      )}

      {/* Aucune photo */}
      {!currentPhotoUrl && !newPhotoUrl && (
        <div className="relative">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon className="w-16 h-16 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoPreview;
