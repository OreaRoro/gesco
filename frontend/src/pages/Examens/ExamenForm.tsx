import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { examenService } from "../../services/examenService";
import { useApi } from "../../hooks/useApi";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField.tsx";
import DatePicker from "../../components/form/date-picker.tsx";
import { toast } from "sonner";

interface ExamenFormData {
  nom: string;
  type: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: number;
  statut: string;
}

const ExamenForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { anneeActive } = useAnneeScolaire();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamenFormData>({
    defaultValues: {
      nom: "",
      type: "trimestriel",
      date_debut: "",
      date_fin: "",
      annee_scolaire_id: anneeActive?.id || 0,
      statut: "planifie",
    },
  });

  const {
    data: examenData,
    loading: loadingExamen,
    execute: loadExamen,
  } = useApi<any>();

  // Surveiller les dates pour calculer la durée
  const dateDebut = watch("date_debut");
  const dateFin = watch("date_fin");

  // Charger les données de l'examen en mode édition
  useEffect(() => {
    if (isEditMode && id) {
      loadExamen(() => examenService.getById(parseInt(id)));
    }
  }, [isEditMode, id]);

  // Mettre à jour le formulaire avec les données de l'examen
  useEffect(() => {
    if (isEditMode && examenData?.data?.examen) {
      const examen = examenData.data.examen;
      reset({
        nom: examen.nom || "",
        type: examen.type || "trimestriel",
        date_debut: examen.date_debut || "",
        date_fin: examen.date_fin || "",
        annee_scolaire_id: examen.annee_scolaire_id || anneeActive?.id || 0,
        statut: examen.statut || "planifie",
      });
    }
  }, [examenData, isEditMode, anneeActive, reset]);

  // Mettre à jour l'année scolaire active
  useEffect(() => {
    if (anneeActive && !isEditMode) {
      setValue("annee_scolaire_id", anneeActive.id);
    }
  }, [anneeActive, isEditMode, setValue]);

  const onSubmit = async (data: ExamenFormData) => {
    if (!anneeActive) {
      toast.error("Aucune année scolaire active sélectionnée");
      return;
    }

    try {
      if (isEditMode && id) {
        // Mode édition
        await examenService.update(parseInt(id), data);
        toast.success("Examen modifié avec succès");
      } else {
        // Mode création
        await examenService.create(data);
        toast.success("Examen créé avec succès");
      }

      // Rediriger vers la liste des examens
      navigate("/examens");
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Une erreur est survenue lors de la sauvegarde";

      toast.error(
        typeof errorMessage === "string" ? errorMessage : "Erreur de validation"
      );
    }
  };

  const handleCancel = () => {
    navigate("/examens");
  };

  const getPageTitle = () => {
    return isEditMode ? "Modifier l'Examen" : "Nouvel Examen";
  };

  const getBreadcrumbs = () => {
    const baseBreadcrumbs = [
      { label: "Dashboard", path: "/" },
      { label: "Examens", path: "/examens" },
    ];

    if (isEditMode) {
      return [
        ...baseBreadcrumbs,
        { label: "Modifier l'examen", path: `/examens/${id}/modifier` },
      ];
    } else {
      return [
        ...baseBreadcrumbs,
        { label: "Nouvel examen", path: "/examens/nouveau" },
      ];
    }
  };

  // Calculer la durée de l'examen
  const calculerDuree = () => {
    if (dateDebut && dateFin) {
      return examenService.calculerDureeExamen(dateDebut, dateFin);
    }
    return 0;
  };

  // Afficher le spinner pendant le chargement en mode édition
  if (isEditMode && loadingExamen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Chargement de l'examen..." />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${getPageTitle()} | Système de Gestion Scolaire`}
        description={`Page ${
          isEditMode ? "de modification" : "de création"
        } d'examen`}
      />

      <PageBreadcrumb
        pageTitle={getPageTitle()}
        breadcrumbs={getBreadcrumbs()}
      />

      <div className="space-y-6">
        <ComponentCard title={getPageTitle()}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations sur l'année scolaire */}
            {anneeActive && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Année Scolaire
                    </h3>
                    <p className="text-blue-700">
                      {anneeActive.annee} - {anneeActive.statut}
                    </p>
                  </div>
                  <div className="text-sm text-blue-600">
                    L'examen sera associé à cette année scolaire
                  </div>
                </div>
              </div>
            )}

            {!anneeActive && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-yellow-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-yellow-800">
                    Aucune année scolaire active sélectionnée. Veuillez en
                    sélectionner une dans le sélecteur en haut de la page.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Nom de l'examen */}
              <div>
                <label
                  htmlFor="nom"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nom de l'examen <span className="text-red-500">*</span>
                </label>
                {/* <Input
                  type="text"
                  id="nom"
                  placeholder="Ex: Examen du 1er trimestre"
                  disabled={!anneeActive}
                  error={errors.nom}
                  {...register("nom", {
                    required: "Le nom de l'examen est requis",
                    minLength: {
                      value: 2,
                      message: "Le nom doit contenir au moins 2 caractères",
                    },
                  })}
                /> */}
                <Input
                  type="text"
                  id="nom"
                  name="nom"
                  placeholder="Ex: Examen du 1er trimestre"
                  disabled={!anneeActive}
                  register={register}
                  validation={{
                    required: "Le nom de l'examen est requis",
                    minLength: {
                      value: 2,
                      message: "Le nom doit contenir au moins 2 caractères",
                    },
                  }}
                  error={errors.nom}
                />
              </div>

              {/* Type d'examen */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Type d'examen <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  disabled={!anneeActive}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                  {...register("type", {
                    required: "Le type d'examen est requis",
                  })}
                >
                  <option value="">Sélectionnez un type</option>
                  {examenService.getTypesExamen().map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Date de début */}
              <div>
                <label
                  htmlFor="date_debut"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Date de début <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="date_debut"
                  control={control}
                  rules={{ required: "La date de début est requise" }}
                  render={({ field }) => (
                    <DatePicker
                      id="date_debut"
                      name={field.name}
                      placeholder="Sélectionnez une date de début"
                      defaultDate={field.value || undefined}
                      error={errors.date_debut}
                      setValue={(_name: string, value: string) => {
                        field.onChange(value);
                      }}
                    />
                  )}
                />
              </div>

              {/* Date de fin */}
              <div>
                <label
                  htmlFor="date_fin"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="date_fin"
                  control={control}
                  rules={{
                    required: "La date de fin est requise",
                    validate: (value) => {
                      if (dateDebut && value) {
                        const debut = new Date(dateDebut);
                        const fin = new Date(value);
                        if (fin < debut) {
                          return "La date de fin ne peut pas être antérieure à la date de début";
                        }
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <DatePicker
                      id="date_fin"
                      name={field.name}
                      placeholder="Sélectionnez une date de fin"
                      defaultDate={field.value || undefined}
                      error={errors.date_fin}
                      setValue={(_name: string, value: string) => {
                        field.onChange(value);
                      }}
                    />
                  )}
                />
                {dateDebut && dateFin && !errors.date_fin && (
                  <p className="mt-1 text-sm text-gray-500">
                    Durée: {calculerDuree()} jour(s)
                  </p>
                )}
              </div>

              {/* Statut (uniquement en mode édition) */}
              {isEditMode && (
                <div>
                  <label
                    htmlFor="statut"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="statut"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      errors.statut ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("statut", {
                      required: "Le statut est requis",
                    })}
                  >
                    {examenService.getStatutsExamen().map((statut) => (
                      <option key={statut.value} value={statut.value}>
                        {statut.label}
                      </option>
                    ))}
                  </select>
                  {errors.statut && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.statut.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Informations supplémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <strong>Année scolaire:</strong>{" "}
                  {anneeActive?.annee || "Non définie"}
                </div>
                <div>
                  <strong>Mode:</strong>{" "}
                  {isEditMode ? "Modification" : "Création"}
                </div>
                {isEditMode && examenData?.data?.examen && (
                  <>
                    <div>
                      <strong>Créé le:</strong>{" "}
                      {new Date(
                        examenData.data.examen.created_at
                      ).toLocaleDateString("fr-FR")}
                    </div>
                    <div>
                      <strong>Modifié le:</strong>{" "}
                      {new Date(
                        examenData.data.examen.updated_at
                      ).toLocaleDateString("fr-FR")}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !anneeActive}
                className="flex items-center gap-2 px-6 py-2 text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditMode ? "Modification..." : "Création..."}
                  </>
                ) : isEditMode ? (
                  "Modifier l'examen"
                ) : (
                  "Créer l'examen"
                )}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
};

export default ExamenForm;
