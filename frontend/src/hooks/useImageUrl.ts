import { useCallback } from "react";

// Interface pour les services qui ont une méthode getPhotoUrl
export interface ImageService {
  getPhotoUrl?: (path: string) => string;
}

// Interface pour les entités avec photo
export interface EntityWithPhoto {
  photo?: string;
}

export const useImageUrl = () => {
  const getImageUrl = useCallback((entity: EntityWithPhoto) => {
    if (entity.photo) {
      // Si c'est une URL complète
      if (entity.photo.startsWith("http")) {
        return entity.photo;
      }
      // Si c'est un chemin relatif
      return `http://localhost:8080/${entity.photo}`;
    }
    // Image par défaut
    return "/images/user/empty-profile.webp";
  }, []);

  return { getImageUrl };
};

// Version alternative si vous voulez garder la signature originale
// export const useImageUrlAlt = (service?: any) => {
//   const getImageUrl = useCallback((entity: EntityWithPhoto) => {
//     if (entity.photo) {
//       if (entity.photo.startsWith("http")) {
//         return entity.photo;
//       }
//       return `http://localhost:8080/${entity.photo}`;
//     }
//     return "/images/user/empty-profile.webp";
//   }, []);

//   return { getImageUrl };
// };
