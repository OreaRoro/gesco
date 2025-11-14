import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { gsap } from "gsap";
import Spinner from "../../components/common/Spinner";
import DatePicker from "../../components/form/date-picker";
import Input from "../../components/form/input/InputField";
import { FaSave, FaTimes, FaTrash } from "react-icons/fa";

interface PointageModalData {
  id?: number;
  date_pointage: string;
  statut: "present" | "absent" | "retard" | "justifie" | "exclu";
  heure_arrivee?: string;
  heure_depart?: string;
  remarque?: string;
  justification?: string;
}

interface PointageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  pointage?: PointageModalData;
  eleve: any;
  onSave: (data: PointageModalData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

const PointageModal: React.FC<PointageModalProps> = ({
  isOpen,
  onClose,
  mode,
  pointage,
  eleve,
  onSave,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Réfs pour les animations GSAP
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PointageModalData>({
    defaultValues: {
      date_pointage: new Date().toISOString().split("T")[0],
      statut: "present",
      heure_arrivee: "",
      heure_depart: "",
      remarque: "",
      justification: "",
    },
  });

  // Watch pour les champs conditionnels
  const watchedStatut = watch("statut");
  const watchedDatePointage = watch("date_pointage");

  // Animations d'ouverture et fermeture
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);

      // Animation d'entrée - seulement overlay et modal
      const tl = gsap.timeline();

      tl.set([overlayRef.current, modalRef.current], { opacity: 0 })
        .to(overlayRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        })
        .to(
          modalRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.2)",
          },
          "-=0.2"
        );
    } else if (!isOpen && isVisible) {
      // Animation de sortie - seulement overlay et modal
      const tl = gsap.timeline();

      tl.to(modalRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: "power2.in",
      })
        .to(
          overlayRef.current,
          {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.2"
        )
        .eventCallback("onComplete", () => setIsVisible(false));
    }
  }, [isOpen, isVisible]);

  // Réinitialiser le formulaire quand le pointage change
  useEffect(() => {
    if (pointage) {
      reset({
        ...pointage,
        date_pointage: pointage.date_pointage,
      });
    } else {
      reset({
        date_pointage: new Date().toISOString().split("T")[0],
        statut: "present",
        heure_arrivee: "",
        heure_depart: "",
        remarque: "",
        justification: "",
      });
    }
  }, [pointage, reset]);

  // Fermer le modal avec Échap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const statutOptions = [
    { value: "present", label: "Présent", color: "text-green-600" },
    { value: "absent", label: "Absent", color: "text-red-600" },
    { value: "retard", label: "Retard", color: "text-orange-600" },
    { value: "justifie", label: "Absence justifiée", color: "text-blue-600" },
    { value: "exclu", label: "Exclu", color: "text-purple-600" },
  ];

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const onSubmit = async (formData: PointageModalData) => {
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);

    // Animation de shake sur les champs en erreur (conservée car c'est une animation interactive)
    gsap.to(".error-shake", {
      x: "+=10",
      duration: 0.1,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 5,
      stagger: 0.1,
    });

    toast.error("Veuillez corriger les erreurs dans le formulaire");
  };

  const handleDelete = async () => {
    if (pointage?.id && onDelete) {
      try {
        await onDelete(pointage.id);
      } catch (error) {
        console.error("Erreur suppression:", error);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl mx-4 bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden transform-gpu"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" && "Nouveau Pointage"}
            {mode === "edit" && "Modifier le Pointage"}
            {mode === "view" && "Détails du Pointage"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-gray-600 hover:bg-gray-100 hover:scale-110 active:scale-95"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col h-full lg:flex-row">
          {/* Formulaire - Partie principale */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
              {/* Informations élève */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-900">Élève</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nom complet:</span>
                    <p className="font-medium">
                      {eleve.prenom} {eleve.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Matricule:</span>
                    <p className="font-medium">{eleve.matricule}</p>
                  </div>
                </div>
              </div>

              {/* Date et statut */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className={errors.date_pointage ? "error-shake" : ""}>
                  <DatePicker
                    id="date_pointage"
                    name="date_pointage"
                    label="Date du pointage"
                    placeholder="Sélectionnez la date"
                    register={register}
                    setValue={setValue}
                    validation={{
                      required: "La date du pointage est obligatoire",
                      validate: {
                        futureDate: (value) =>
                          new Date(value) <= new Date() ||
                          "La date du pointage ne peut pas être dans le futur",
                      },
                    }}
                    error={errors.date_pointage}
                  />
                </div>

                {/* Sélecteur de statut */}
                <div className={errors.statut ? "error-shake" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("statut", {
                      required: "Le statut est obligatoire",
                    })}
                    disabled={mode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
                      errors.statut
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    } ${
                      mode === "view"
                        ? "bg-gray-100 cursor-not-allowed"
                        : "hover:border-gray-400"
                    }`}
                  >
                    {statutOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className={option.color}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.statut && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.statut.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Heures (conditionnel pour présent et retard) */}
              {(watchedStatut === "present" || watchedStatut === "retard") && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className={errors.heure_arrivee ? "error-shake" : ""}>
                    <Input
                      type="time"
                      name="heure_arrivee"
                      label="Heure d'arrivée"
                      placeholder="HH:MM"
                      register={register}
                      validation={{
                        required:
                          watchedStatut === "retard"
                            ? "L'heure d'arrivée est requise pour un retard"
                            : false,
                      }}
                      error={errors.heure_arrivee}
                      disabled={mode === "view"}
                    />
                  </div>

                  <div className={errors.heure_depart ? "error-shake" : ""}>
                    <Input
                      type="time"
                      name="heure_depart"
                      label="Heure de départ"
                      placeholder="HH:MM"
                      register={register}
                      error={errors.heure_depart}
                      disabled={mode === "view"}
                    />
                  </div>
                </div>
              )}

              {/* Justification (conditionnel pour absence justifiée) */}
              {watchedStatut === "justifie" && (
                <div className={errors.justification ? "error-shake" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("justification", {
                      required:
                        watchedStatut === "justifie"
                          ? "La justification est obligatoire"
                          : false,
                    })}
                    rows={3}
                    disabled={mode === "view"}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
                      errors.justification
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    } ${
                      mode === "view"
                        ? "bg-gray-100 cursor-not-allowed"
                        : "hover:border-gray-400"
                    }`}
                    placeholder="Motif de l'absence justifiée..."
                  />
                  {errors.justification && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.justification.message}
                    </p>
                  )}
                </div>
              )}

              {/* Remarque générale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarques
                </label>
                <textarea
                  {...register("remarque")}
                  rows={3}
                  disabled={mode === "view"}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
                    mode === "view"
                      ? "bg-gray-100 cursor-not-allowed"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Remarques supplémentaires..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-between sm:items-center">
                <div>
                  {mode === "edit" && onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <FaTrash className="w-4 h-4" />
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FaTimes className="w-4 h-4" />
                    Annuler
                  </button>

                  {mode !== "view" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-200 rounded-lg hover:scale-105 active:scale-95 disabled:transform-none ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-lg hover:shadow-xl"
                      }`}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaSave className="w-4 h-4" />
                          {mode === "create"
                            ? "Créer le pointage"
                            : "Modifier le pointage"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Informations */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6">
            <div className="space-y-6">
              {/* Informations sur les statuts */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Informations sur les statuts
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {statutOptions.map((option) => (
                    <div key={option.value} className="flex items-start gap-2">
                      <div
                        className={`w-2 h-2 mt-1.5 rounded-full ${
                          option.value === "present"
                            ? "bg-green-500"
                            : option.value === "absent"
                            ? "bg-red-500"
                            : option.value === "retard"
                            ? "bg-orange-500"
                            : option.value === "justifie"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      />
                      <div>
                        <strong className={option.color}>
                          {option.label}:
                        </strong>
                        <p
                          className={option.color
                            .replace("text", "text")
                            .replace("600", "500")}
                        >
                          {option.value === "present" &&
                            "L'élève était présent en classe"}
                          {option.value === "absent" &&
                            "L'élève était absent sans justification"}
                          {option.value === "retard" &&
                            "L'élève est arrivé en retard"}
                          {option.value === "justifie" &&
                            "Absence avec justification valide"}
                          {option.value === "exclu" && "Exclusion temporaire"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails du pointage */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Détails du pointage
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Élève:</span>
                    <span className="font-medium text-right">
                      {eleve.prenom} {eleve.nom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matricule:</span>
                    <span className="font-medium">{eleve.matricule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {watchedDatePointage
                        ? new Date(watchedDatePointage).toLocaleDateString(
                            "fr-FR"
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className="font-medium capitalize">
                      {
                        statutOptions.find((opt) => opt.value === watchedStatut)
                          ?.label
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointageModal;
