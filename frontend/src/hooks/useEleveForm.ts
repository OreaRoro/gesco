import { useState } from "react";
import { EleveFormData, EleveFormErrors } from "../interfaces/eleve.interface";

export const useEleveForm = () => {
  const [errors, setErrors] = useState<EleveFormErrors>({});

  const validateField = (
    name: keyof EleveFormData,
    value: string
  ): string | null => {
    switch (name) {
      case "nom":
        if (!value.trim()) return "Le nom est obligatoire";
        if (value.length < 2)
          return "Le nom doit contenir au moins 2 caractères";
        return null;

      case "prenom":
        if (!value.trim()) return "Le prénom est obligatoire";
        if (value.length < 2)
          return "Le prénom doit contenir au moins 2 caractères";
        return null;

      case "date_naissance":
        if (!value) return "La date de naissance est obligatoire";
        if (new Date(value) > new Date())
          return "La date de naissance ne peut pas être dans le futur";
        return null;

      case "date_inscription":
        if (!value) return "La date d'inscription est obligatoire";
        return null;

      case "email_parent":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Adresse email invalide";
        }
        return null;

      case "telephone_parent":
        if (value && !/^[0-9+\-\s()]*$/.test(value)) {
          return "Numéro de téléphone invalide";
        }
        return null;

      default:
        return null;
    }
  };

  const validateForm = (data: EleveFormData): boolean => {
    const newErrors: EleveFormErrors = {};

    Object.keys(data).forEach((key) => {
      const fieldName = key as keyof EleveFormData;
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    validateField,
    validateForm,
    setErrors,
  };
};
