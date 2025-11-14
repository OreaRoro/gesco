import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { French } from "flatpickr/dist/l10n/fr.js";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import type {
  UseFormRegister,
  RegisterOptions,
  FieldError,
  UseFormSetValue,
} from "react-hook-form";

interface DatePickerProps {
  id: string;
  name: string;
  register?: UseFormRegister<any>;
  setValue?: UseFormSetValue<any>;
  validation?: RegisterOptions;
  mode?: "single" | "multiple" | "range" | "time";
  defaultDate?: string | Date;
  label?: string;
  placeholder?: string;
  error?: FieldError;
  success?: boolean;
}

export default function DatePicker({
  id,
  name,
  register,
  setValue,
  validation,
  mode,
  defaultDate,
  label,
  placeholder,
  error,
  success,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<any>(null);

  // Combiner ref RHF et inputRef
  const combinedRef = (el: HTMLInputElement) => {
    inputRef.current = el;
    if (register) {
      const registered = register(name, validation);
      if (registered && typeof registered.ref === "function") {
        registered.ref(el);
      }
    }
  };

  useEffect(() => {
    if (!inputRef.current) return;

    // Détruire l'instance existante
    if (flatpickrRef.current) {
      flatpickrRef.current.destroy();
    }

    // Convertir la date par défaut en format compatible flatpickr
    const getValidDate = (date: string | Date | undefined) => {
      if (!date) return undefined;

      if (typeof date === "string") {
        // Si la date est au format YYYY-MM-DD (format backend)
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Créer un objet Date à partir de YYYY-MM-DD
          const [year, month, day] = date.split("-").map(Number);
          return new Date(Date.UTC(year, month - 1, day));
        }
        // Si c'est déjà un format reconnu par flatpickr
        return date;
      }

      return date;
    };

    const fp = flatpickr(inputRef.current, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "d/m/Y", // Format d'affichage
      altFormat: "d/m/Y", // Format alternatif
      altInput: false,
      locale: French,
      defaultDate: getValidDate(defaultDate),
      parseDate: (dateStr: string, format: string) => {
        // Parser explicitement le format d/m/Y
        if (format === "d/m/Y" && dateStr) {
          const [day, month, year] = dateStr.split("/").map(Number);
          if (day && month && year) {
            // Créer la date en UTC pour éviter les problèmes de timezone
            return new Date(Date.UTC(year, month - 1, day));
          }
        }
        // Retourner une date par défaut si le parsing échoue
        return new Date();
      },
      onChange: (selectedDates) => {
        if (selectedDates.length === 0) return;

        // Convertir en YYYY-MM-DD pour backend
        const date = selectedDates[0];
        const isoDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        // Mettre à jour react-hook-form
        if (setValue) {
          setValue(name, isoDate, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      },
    });

    flatpickrRef.current = fp;

    return () => {
      if (flatpickrRef.current) {
        flatpickrRef.current.destroy();
      }
    };
  }, [mode, name, setValue, defaultDate]);

  const inputClasses = [
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    error
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
      : success
      ? "border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800"
      : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800",
  ].join(" ");

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          ref={combinedRef}
          className={inputClasses}
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-error-500">{error.message}</p>
      )}
    </div>
  );
}
