import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { absenceService } from "../../services/absenceService";
import { eleveService } from "../../services/eleveService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/form/input/InputField";
import DatePicker from "../../components/form/date-picker";
import { ArrowLeftIcon } from "../../icons";
import { FaSave, FaTimes } from "react-icons/fa";

interface PointageFormData {
  date_pointage: string;
  statut: "present" | "absent" | "retard" | "justifie" | "exclu";
  heure_arrivee?: string;
  heure_depart?: string;
  remarque?: string;
  justification?: string;
}

const ElevePointage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { anneeActive } = useAnneeScolaire();
  const [loading, setLoading] = useState(false);
  const [eleve, setEleve] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PointageFormData>({
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

  useEffect(() => {
    if (id) {
      loadEleve(parseInt(id));
    }
  }, [id]);

  const loadEleve = async (eleveId: number) => {
    try {
      const response = await eleveService.getById(eleveId);
      setEleve(response.data.eleve);
    } catch (error: any) {
      console.error("Erreur chargement élève:", error);
      toast.error("Erreur lors du chargement des données");
      navigate(`/eleves/${id}/absences`);
    }
  };

  const onSubmit = async (formData: PointageFormData) => {
    if (!id) return;

    setLoading(true);
    try {
      await absenceService.create(parseInt(id), formData);
      toast.success("Pointage enregistré avec succès");
      navigate(`/eleves/${id}/absences`);
    } catch (error: any) {
      console.error("Erreur création pointage:", error);
      const errorMessage =
        error.response?.data?.messages?.error ||
        "Erreur lors de l'enregistrement du pointage";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erreurs de validation:", errors);
    toast.error("Veuillez corriger les erreurs dans le formulaire");
  };

  const statutOptions = [
    { value: "present", label: "Présent", color: "text-green-600" },
    { value: "absent", label: "Absent", color: "text-red-600" },
    { value: "retard", label: "Retard", color: "text-orange-600" },
    { value: "justifie", label: "Absence justifiée", color: "text-blue-600" },
    { value: "exclu", label: "Exclu", color: "text-purple-600" },
  ];

  if (!eleve) {
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
        title={`Nouveau Pointage - ${eleve.prenom} ${eleve.nom} | Système de Gestion Scolaire`}
        description={`Nouveau pointage pour ${eleve.prenom} ${eleve.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Nouveau Pointage - ${eleve.prenom} ${eleve.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: `${eleve.prenom} ${eleve.nom}`, path: `/eleves/${id}` },
          { label: "Absences", path: `/eleves/${id}/absences` },
          { label: "Nouveau Pointage", path: `/eleves/${id}/absences/nouveau` },
        ]}
      />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={`/eleves/${id}/absences`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour aux absences
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <ComponentCard title="Nouveau Pointage">
              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* Informations élève */}
                <div className="p-4 bg-gray-50 rounded-lg">
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

                  {/* Sélecteur de statut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("statut", {
                        required: "Le statut est obligatoire",
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                        errors.statut ? "border-red-500" : "border-gray-300"
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

                {/* Heures (conditionnel pour retard) */}
                {watchedStatut === "retard" && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Heure d'arrivée */}
                    <Input
                      type="time"
                      name="heure_arrivee"
                      //   label="Heure d'arrivée"
                      placeholder="HH:MM"
                      register={register}
                      validation={{
                        required:
                          watchedStatut === "retard"
                            ? "L'heure d'arrivée est requise pour un retard"
                            : false,
                      }}
                      error={errors.heure_arrivee}
                    />

                    {/* Heure de départ */}
                    <Input
                      type="time"
                      name="heure_depart"
                      //   label="Heure de départ"
                      placeholder="HH:MM"
                      register={register}
                      error={errors.heure_depart}
                    />
                  </div>
                )}

                {/* Justification (conditionnel pour absence justifiée) */}
                {watchedStatut === "justifie" && (
                  <div>
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
                        errors.justification
                          ? "border-red-500"
                          : "border-gray-300"
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
                <Input
                  type="textarea"
                  name="remarque"
                  //   label="Remarques"
                  placeholder="Remarques supplémentaires..."
                  register={register}
                  //   rows={3}
                  error={errors.remarque}
                />

                {/* Actions */}
                <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end sm:items-center">
                  <Link
                    to={`/eleves/${id}/absences`}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FaTimes className="w-4 h-4" />
                    Annuler
                  </Link>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors rounded-lg ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-brand-600 hover:bg-brand-700"
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
                        Enregistrer le pointage
                      </>
                    )}
                  </button>
                </div>
              </form>
            </ComponentCard>
          </div>

          {/* Informations */}
          <div className="space-y-6">
            <ComponentCard title="Informations sur les statuts">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full"></div>
                  <div>
                    <strong className="text-green-700">Présent:</strong>
                    <p className="text-green-600">
                      L'élève était présent en classe
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full"></div>
                  <div>
                    <strong className="text-red-700">Absent:</strong>
                    <p className="text-red-600">
                      L'élève était absent sans justification
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-orange-500 rounded-full"></div>
                  <div>
                    <strong className="text-orange-700">Retard:</strong>
                    <p className="text-orange-600">
                      L'élève est arrivé en retard
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
                  <div>
                    <strong className="text-blue-700">Justifié:</strong>
                    <p className="text-blue-600">
                      Absence avec justification valide
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 bg-purple-500 rounded-full"></div>
                  <div>
                    <strong className="text-purple-700">Exclu:</strong>
                    <p className="text-purple-600">
                      Exclusion temporaire de l'établissement
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Détails du pointage">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Élève:</span>
                  <span className="font-medium">
                    {eleve.prenom} {eleve.nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matricule:</span>
                  <span className="font-medium">{eleve.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date sélectionnée:</span>
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
            </ComponentCard>

            <ComponentCard title="Année Scolaire">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">
                  {anneeActive?.annee || "Non définie"}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {anneeActive ? "Année active" : "Aucune année active"}
                </p>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default ElevePointage;
