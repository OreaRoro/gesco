import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  pointageService,
  PointageFormData,
} from "../../services/pointageService";
import { personnelService } from "../../services/personnelService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField.tsx";
("");
import Label from "../../components/form/Label.tsx";
import DatePicker from "../../components/form/date-picker.tsx";
import { FaSave, FaTimes, FaClock } from "react-icons/fa";

const PointageForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const [heuresTravail, setHeuresTravail] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PointageFormData>({
    defaultValues: {
      personnel_id: 0,
      date_pointage: new Date().toISOString().split("T")[0],
      heure_arrivee: "08:00",
      heure_depart: "17:00",
      statut: "present",
      remarque: "",
    },
  });

  // Watch les champs pour le calcul automatique
  const watchedHeureArrivee = watch("heure_arrivee");
  const watchedHeureDepart = watch("heure_depart");

  useEffect(() => {
    loadSelectData();
    if (isEdit && id) {
      loadPointage(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    // Calcul automatique des heures de travail
    if (watchedHeureArrivee && watchedHeureDepart) {
      const heures = pointageService.calculerHeuresTravail(
        watchedHeureArrivee,
        watchedHeureDepart
      );
      setHeuresTravail(heures);
    }
  }, [watchedHeureArrivee, watchedHeureDepart]);

  const loadPointage = async (pointageId: number) => {
    setLoading(true);
    try {
      const response = await pointageService.getById(pointageId);
      const pointage = response.data.pointage;

      reset({
        personnel_id: pointage.personnel_id,
        date_pointage: pointage.date_pointage,
        heure_arrivee: pointage.heure_arrivee || "08:00",
        heure_depart: pointage.heure_depart || "17:00",
        statut: pointage.statut,
        remarque: pointage.remarque || "",
      });

      // Calculer les heures de travail
      if (pointage.heure_arrivee && pointage.heure_depart) {
        const heures = pointageService.calculerHeuresTravail(
          pointage.heure_arrivee,
          pointage.heure_depart
        );
        setHeuresTravail(heures);
      }
    } catch (error: any) {
      console.error("Erreur chargement pointage:", error);
      toast.error("Erreur lors du chargement des données du pointage");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [personnel, statutsList] = await Promise.all([
        personnelService.getAll(),
        pointageService.getStatuts(),
      ]);

      setPersonnelList(personnel.data.personnel || []);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const onSubmit = async (data: PointageFormData) => {
    setLoading(true);
    try {
      // Pour les statuts autres que "present", on efface les heures
      if (data.statut !== "present") {
        data.heure_arrivee = "";
        data.heure_depart = "";
      }

      if (isEdit && id) {
        await pointageService.update(parseInt(id), data);
        toast.success("Pointage modifié avec succès");
      } else {
        await pointageService.create(data);
        toast.success("Pointage créé avec succès");
      }

      navigate("/personnel/pointage");
    } catch (error: any) {
      console.error("Erreur sauvegarde pointage:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = (statut: string) => {
    setValue("statut", statut as any);

    // Si le statut n'est pas "present", effacer les heures
    if (statut !== "present") {
      setValue("heure_arrivee", "");
      setValue("heure_depart", "");
      setHeuresTravail(0);
    } else {
      // Remettre les heures par défaut
      setValue("heure_arrivee", "08:00");
      setValue("heure_depart", "17:00");
      setHeuresTravail(8); // 8 heures par défaut
    }
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
          isEdit ? "Modifier" : "Ajouter"
        } Pointage | Système de Gestion Scolaire`}
        description={`${isEdit ? "Modifier" : "Ajouter"} un pointage`}
      />

      <PageBreadcrumb
        pageTitle={isEdit ? "Modifier le Pointage" : "Ajouter un Pointage"}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Personnel", path: "/personnel" },
          { label: "Pointage", path: "/personnel/pointage" },
          { label: isEdit ? "Modifier" : "Ajouter", path: "#" },
        ]}
      />

      <div className="space-y-6">
        <ComponentCard title={`${isEdit ? "Modifier" : "Ajouter"} un Pointage`}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Colonne gauche - Informations de base */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations de Base
                  </h3>

                  <div className="space-y-4">
                    {/* Personnel */}
                    <div>
                      <Label htmlFor="personnel_id">Personnel *</Label>
                      <select
                        {...register("personnel_id", {
                          required: "Le personnel est obligatoire",
                          valueAsNumber: true,
                        })}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value={0}>Sélectionner un personnel</option>
                        {personnelList.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.nom} {person.prenom} - {person.matricule}
                          </option>
                        ))}
                      </select>
                      {errors.personnel_id && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.personnel_id.message}
                        </p>
                      )}
                    </div>

                    {/* Date de pointage */}
                    <div>
                      <Label htmlFor="date_pointage">Date de pointage *</Label>
                      <DatePicker
                        id="date_pointage"
                        name="date_pointage"
                        setValue={setValue}
                        defaultDate={watch("date_pointage")}
                        label=""
                      />
                    </div>

                    {/* Statut */}
                    <div>
                      <Label htmlFor="statut">Statut *</Label>
                      <select
                        {...register("statut", {
                          required: "Le statut est obligatoire",
                        })}
                        onChange={(e) => handleStatutChange(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        {statuts.map((statut) => (
                          <option key={statut.value} value={statut.value}>
                            {statut.label}
                          </option>
                        ))}
                      </select>
                      {errors.statut && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.statut.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite - Horaires */}
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Horaires de Travail
                  </h3>

                  <div className="space-y-4">
                    {/* Heure d'arrivée */}
                    <div>
                      <Label htmlFor="heure_arrivee">Heure d'arrivée</Label>
                      <Input
                        type="time"
                        id="heure_arrivee"
                        name="heure_arrivee"
                        register={register}
                        disabled={watch("statut") !== "present"}
                      />
                    </div>

                    {/* Heure de départ */}
                    <div>
                      <Label htmlFor="heure_depart">Heure de départ</Label>
                      <Input
                        type="time"
                        id="heure_depart"
                        name="heure_depart"
                        register={register}
                        disabled={watch("statut") !== "present"}
                      />
                    </div>

                    {/* Heures travaillées (calculées) */}
                    {watch("statut") === "present" && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">
                            Heures travaillées:
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {pointageService.formatHeures(heuresTravail)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                          <FaClock className="w-4 h-4" />
                          <span>Calculé automatiquement</span>
                        </div>
                      </div>
                    )}

                    {/* Message pour autres statuts */}
                    {watch("statut") !== "present" && (
                      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Les heures ne sont pas requises pour le statut "
                          {
                            statuts.find((s) => s.value === watch("statut"))
                              ?.label
                          }
                          ".
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remarque */}
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Remarques
                  </h3>

                  <div>
                    <Label htmlFor="remarque">Remarque</Label>
                    <textarea
                      {...register("remarque")}
                      rows={4}
                      placeholder="Notez toute observation concernant ce pointage..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/personnel/pointage")}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="w-4 h-4" />
                {loading ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
};

export default PointageForm;
