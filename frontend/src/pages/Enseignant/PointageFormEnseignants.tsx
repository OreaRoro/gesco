import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  enseignantPointageService,
  type PointageFormData,
} from "../../services/enseignantPointageService";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import { FaSave, FaTimes, FaChalkboardTeacher, FaClock } from "react-icons/fa";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField.tsx";
import TextArea from "../../components/form/input/TextArea.tsx";
import DatePicker from "../../components/form/date-picker.tsx";

interface PointageFormProps {
  isEdit?: boolean;
}

const PointageFormEnseignants: React.FC<PointageFormProps> = ({
  isEdit = false,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const [pointageData, setPointageData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PointageFormData>();

  const watchStatut = watch("statut");
  const watchHeureArrivee = watch("heure_arrivee");
  const watchHeureDepart = watch("heure_depart");

  useEffect(() => {
    loadSelectData();
    if (isEdit && id) {
      loadPointageData(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    // Calcul automatique des heures travaillées quand les heures changent
    if (watchHeureArrivee && watchHeureDepart && watchStatut === "present") {
      const heuresTravail = enseignantPointageService.calculerHeuresTravail(
        watchHeureArrivee,
        watchHeureDepart
      );
      // Vous pouvez afficher ce calcul à l'utilisateur si besoin
      console.log("Heures travaillées calculées:", heuresTravail);
    }
  }, [watchHeureArrivee, watchHeureDepart, watchStatut]);

  const loadSelectData = async () => {
    try {
      const [enseignantsList, statutsList] = await Promise.all([
        enseignantPointageService.getEnseignants(),
        enseignantPointageService.getStatuts(),
      ]);

      setEnseignants(enseignantsList);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const loadPointageData = async (pointageId: number) => {
    try {
      setLoading(true);
      const response = await enseignantPointageService.getById(pointageId);
      const pointage = response.data.pointage;
      setPointageData(pointage);

      // Pré-remplir le formulaire
      reset({
        personnel_id: pointage.personnel_id,
        date_pointage: pointage.date_pointage,
        heure_arrivee: pointage.heure_arrivee || "",
        heure_depart: pointage.heure_depart || "",
        statut: pointage.statut,
        remarque: pointage.remarque || "",
      });
    } catch (error: any) {
      console.error("Erreur chargement pointage:", error);
      toast.error("Erreur lors du chargement du pointage");
      navigate("/enseignants/pointage");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PointageFormData) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await enseignantPointageService.update(parseInt(id), data);
        toast.success("Pointage modifié avec succès");
      } else {
        await enseignantPointageService.create(data);
        toast.success("Pointage créé avec succès");
      }
      navigate("/enseignants/pointage");
    } catch (error: any) {
      console.error("Erreur sauvegarde pointage:", error);
      toast.error(
        error.response?.data?.message ||
          `Erreur lors de la ${isEdit ? "modification" : "création"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const validateHeures = (heureArrivee: string, heureDepart: string) => {
    if (heureArrivee && heureDepart) {
      const arrivee = new Date(`2000-01-01T${heureArrivee}`);
      const depart = new Date(`2000-01-01T${heureDepart}`);
      return depart > arrivee;
    }
    return true;
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${
          isEdit ? "Modifier" : "Nouveau"
        } Pointage - Enseignants | Système de Gestion Scolaire`}
        description={`${
          isEdit ? "Modifier" : "Créer"
        } un pointage d'enseignant`}
      />

      <PageBreadcrumb
        pageTitle={`${
          isEdit ? "Modifier le" : "Nouveau"
        } Pointage - Enseignants`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Pointage", path: "/enseignants/pointage" },
          {
            label: `${isEdit ? "Modifier" : "Nouveau"}`,
            path: "/enseignants/pointage/nouveau",
          },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Modifier le Pointage" : "Nouveau Pointage"} -
              Enseignants
            </h1>
            <p className="text-gray-600">
              {isEdit
                ? "Modifier les informations du pointage"
                : "Créer un nouveau pointage pour un enseignant"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/enseignants/pointage")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaTimes className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <ComponentCard title="Informations du Pointage">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Enseignant */}
              <div>
                <Label htmlFor="personnel_id">Enseignant</Label>
                <select
                  {...register("personnel_id", {
                    required: "L'enseignant est requis",
                    valueAsNumber: true,
                  })}
                  className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
                    errors.personnel_id
                      ? "border-red-300 focus:border-red-300 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20"
                  }`}
                  disabled={isEdit}
                >
                  <option value="">Sélectionner un enseignant</option>
                  {enseignants.map((enseignant) => (
                    <option key={enseignant.id} value={enseignant.id}>
                      {enseignant.nom} {enseignant.prenom}
                      {enseignant.specialite && ` - ${enseignant.specialite}`}
                    </option>
                  ))}
                </select>
                {errors.personnel_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.personnel_id.message}
                  </p>
                )}
              </div>

              {/* Date de pointage */}
              <div>
                <Label htmlFor="date_pointage">Date de pointage</Label>
                <DatePicker
                  id="date_pointage"
                  name="date_pointage"
                  setValue={setValue}
                  defaultDate={
                    pointageData?.date_pointage ||
                    new Date().toISOString().split("T")[0]
                  }
                  label=""
                />
                {errors.date_pointage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.date_pointage.message}
                  </p>
                )}
              </div>

              {/* Statut */}
              <div>
                <Label htmlFor="statut">Statut</Label>
                <select
                  {...register("statut", { required: "Le statut est requis" })}
                  className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${
                    errors.statut
                      ? "border-red-300 focus:border-red-300 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20"
                  }`}
                >
                  <option value="">Sélectionner un statut</option>
                  {statuts.map((statut) => (
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

              {/* Heure d'arrivée */}
              <div>
                <Label htmlFor="heure_arrivee">Heure d'arrivée</Label>
                <Input
                  type="time"
                  id="heure_arrivee"
                  {...register("heure_arrivee", {
                    required:
                      watchStatut === "present"
                        ? "L'heure d'arrivée est requise pour un statut \"Présent\""
                        : false,
                    validate: {
                      validFormat: (value) =>
                        !value ||
                        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) ||
                        "Format d'heure invalide (HH:MM)",
                      beforeDepart: (value) =>
                        !value ||
                        !watchHeureDepart ||
                        validateHeures(value, watchHeureDepart) ||
                        "L'heure d'arrivée doit être avant l'heure de départ",
                    },
                  })}
                  //   error={errors.heure_arrivee?.message}
                  disabled={watchStatut !== "present"}
                />
              </div>

              {/* Heure de départ */}
              <div>
                <Label htmlFor="heure_depart">Heure de départ</Label>
                <Input
                  type="time"
                  id="heure_depart"
                  {...register("heure_depart", {
                    required:
                      watchStatut === "present"
                        ? 'L\'heure de départ est requise pour un statut "Présent"'
                        : false,
                    validate: {
                      validFormat: (value) =>
                        !value ||
                        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) ||
                        "Format d'heure invalide (HH:MM)",
                      afterArrival: (value) =>
                        !value ||
                        !watchHeureArrivee ||
                        validateHeures(watchHeureArrivee, value) ||
                        "L'heure de départ doit être après l'heure d'arrivée",
                    },
                  })}
                  //   error={errors.heure_depart?.message}
                  disabled={watchStatut !== "present"}
                />
              </div>
            </div>

            {/* Remarque */}
            <div>
              <Label htmlFor="remarque">Remarque</Label>
              <textarea
                {...register("remarque")}
                rows={3}
                placeholder="Notes supplémentaires sur le pointage..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            {/* Calcul des heures travaillées */}
            {watchStatut === "present" &&
              watchHeureArrivee &&
              watchHeureDepart &&
              validateHeures(watchHeureArrivee, watchHeureDepart) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FaClock className="w-4 h-4" />
                    <span className="font-medium">
                      Calcul des heures travaillées:
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-blue-700">
                    {watchHeureArrivee} - {watchHeureDepart} ={" "}
                    {enseignantPointageService.formatHeures(
                      enseignantPointageService.calculerHeuresTravail(
                        watchHeureArrivee,
                        watchHeureDepart
                      )
                    )}
                  </p>
                </div>
              )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/enseignants/pointage")}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                {isEdit ? "Modifier le pointage" : "Créer le pointage"}
              </button>
            </div>
          </form>
        </ComponentCard>

        {/* Informations */}
        <ComponentCard title="Instructions">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <FaChalkboardTeacher className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <strong>Enseignant :</strong> Sélectionnez l'enseignant concerné
                par le pointage
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FaClock className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <strong>Statut "Présent" :</strong> Les heures d'arrivée et de
                départ sont obligatoires
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FaClock className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <strong>Autres statuts :</strong> Les heures ne sont pas
                obligatoires pour les absences, congés, etc.
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
};

export default PointageFormEnseignants;
