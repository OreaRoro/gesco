import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { anneeScolaireService } from "../../services/anneeScolaireService";
import {
  AnneeScolaire,
  AnneeScolaireCreateRequest,
} from "../../interfaces/reference.interface";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Spinner from "../../components/common/Spinner";
import DatePicker from "../../components/form/date-picker";
import { FaCheck, FaEdit, FaTrash, FaPlay, FaStop } from "react-icons/fa";
import { useConfirmationModal } from "../../hooks/useConfirmationModal.ts";
import ConfirmationModal from "../../components/common/ConfirmationModal.tsx";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";

const AnneeScolaireManager: React.FC = () => {
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingAnnee, setEditingAnnee] = useState<AnneeScolaire | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AnneeScolaireCreateRequest>();

  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  useEffect(() => {
    loadAnneesScolaires();
  }, []);

  const loadAnneesScolaires = async () => {
    setLoading(true);
    try {
      const response = await anneeScolaireService.getAll();
      setAnneesScolaires(response.data?.annees_scolaires || []);
    } catch (error: any) {
      console.error("Erreur chargement années scolaires:", error);
      toast.error("Erreur lors du chargement des années scolaires");
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultAnnee = () => {
    const currentYear = new Date().getFullYear();
    return {
      annee: `${currentYear}-${currentYear + 1}`,
      date_debut: `${currentYear}-09-01`,
      date_fin: `${currentYear + 1}-07-31`,
      statut: "planifie" as const,
    };
  };

  useEffect(() => {
    if (!editingAnnee) {
      const defaultAnnee = generateDefaultAnnee();
      reset(defaultAnnee);
    }
  }, [editingAnnee, reset]);

  const onSubmit = async (data: AnneeScolaireCreateRequest) => {
    setSubmitting(true);
    try {
      if (editingAnnee) {
        console.log(data);

        const response = await anneeScolaireService.update(
          editingAnnee.id,
          data
        );

        toast.success(
          response?.message || "Année scolaire modifiée avec succès"
        );
      } else {
        const response = await anneeScolaireService.create(data);
        toast.success(response?.message || "Année scolaire créée avec succès");
      }
      reset(generateDefaultAnnee());
      setEditingAnnee(null);
      loadAnneesScolaires();
    } catch (error: any) {
      console.error("Erreur sauvegarde année scolaire:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (id: number) => {
    try {
      const confirmDesactivation = await openModal({
        title: "changement année courante",
        message: `Êtes-vous sûr de vouloir changement année courante?`,
        type: "info",
        confirmText: "Changer",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await anneeScolaireService.setAsCurrent(id);
        toast.success("Année scolaire définie comme courante");
        loadAnneesScolaires();
      }
    } catch (error: any) {
      console.error("Erreur changement année courante:", error);
      toast.error(error.response?.data?.message || "Erreur lors du changement");
    }
  };

  const handleCloseAnnee = async (id: number) => {
    try {
      const confirmDesactivation = await openModal({
        title: "clôturer cette année scolaire",
        message: `Êtes-vous sûr de vouloir clôturer cette année scolaire ? Cette action est irréversible.`,
        type: "warning",
        confirmText: "Clôturer",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await anneeScolaireService.closeAnneeScolaire(id);
        toast.success("Année scolaire clôturée avec succès");
        loadAnneesScolaires();
      }
    } catch (error: any) {
      console.error("Erreur clôture année scolaire:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la clôture");
    }
  };

  const handleEdit = (annee: AnneeScolaire) => {
    setEditingAnnee(annee);
    setValue("annee", annee.annee);
    setValue("date_debut", annee.date_debut);
    setValue("date_fin", annee.date_fin);
    setValue("statut", annee.statut);
  };

  const handleDelete = async (id: number) => {
    try {
      const confirmDesactivation = await openModal({
        title: "Suppression",
        message: `Êtes-vous sûr de vouloir supprimer cette année scolaire ?`,
        type: "danger",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await anneeScolaireService.delete(id);
        toast.success("Année scolaire supprimée avec succès");
        loadAnneesScolaires();
      }
    } catch (error: any) {
      console.error("Erreur suppression année scolaire:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleCancel = () => {
    setEditingAnnee(null);
    reset(generateDefaultAnnee());
  };

  const getStatutBadge = (statut: string) => {
    const config = {
      planifie: { class: "bg-yellow-100 text-yellow-800", label: "Planifiée" },
      courante: { class: "bg-green-100 text-green-800", label: "En cours" },
      terminee: { class: "bg-gray-100 text-gray-800", label: "Terminée" },
      archivee: { class: "bg-blue-100 text-blue-800", label: "Archivée" },
    };

    const { class: className, label } =
      config[statut as keyof typeof config] || config.planifie;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}
      >
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  const anneeCourante = anneesScolaires.find((a) => a.statut === "courante");

  return (
    <>
      <PageMeta
        title="Gestion de l'Année Scolaire"
        description="Configuration de l'année scolaire"
      />

      <PageBreadcrumb
        pageTitle="Gestion de l'Année Scolaire"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Paramétrage", path: "/parametres" },
          { label: "Année scolaire", path: "/parametres/année-scolaire" },
        ]}
      />
      {modalConfig && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={closeModal}
          onConfirm={confirm}
          {...modalConfig}
        />
      )}
      <div className="space-y-6">
        {anneeCourante && (
          <ComponentCard title="Année Scolaire Courante">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    {anneeCourante.annee}
                  </h3>
                  <p className="text-green-600">
                    Du{" "}
                    {new Date(anneeCourante.date_debut).toLocaleDateString(
                      "fr-FR"
                    )}
                    au{" "}
                    {new Date(anneeCourante.date_fin).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>
                {getStatutBadge(anneeCourante.statut)}
              </div>
            </div>
          </ComponentCard>
        )}

        <ComponentCard
          title={
            editingAnnee
              ? "Modifier l'Année Scolaire"
              : "Créer une Année Scolaire"
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année Scolaire <span className="text-red-500">*</span>
                </label>
                <Input
                  name="annee"
                  placeholder="2024-2025"
                  register={register}
                  validation={{ required: "L'année scolaire est obligatoire" }}
                  error={errors.annee}
                />
              </div>

              <DatePicker
                id="date_debut"
                name="date_debut"
                label="Date de Début"
                register={register}
                setValue={setValue}
                validation={{ required: "La date de début est obligatoire" }}
                error={errors.date_debut}
              />

              <DatePicker
                id="date_fin"
                name="date_fin"
                label="Date de Fin"
                register={register}
                setValue={setValue}
                validation={{ required: "La date de fin est obligatoire" }}
                error={errors.date_fin}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  {...register("statut")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planifie">Planifiée</option>
                  <option value="courante">En cours</option>
                  <option value="terminee">Terminée</option>
                  <option value="archivee">Archivée</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <FaCheck className="w-4 h-4" />
                )}
                {editingAnnee ? "Modifier l'année" : "Créer l'année scolaire"}
              </button>

              {editingAnnee && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </ComponentCard>

        <ComponentCard title="Liste des Années Scolaires">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Année Scolaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anneesScolaires.map((annee) => (
                  <tr key={annee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {annee.annee}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(annee.date_debut).toLocaleDateString("fr-FR")}{" "}
                        - {new Date(annee.date_fin).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(annee.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {annee.statut !== "courante" &&
                          annee.statut !== "terminee" && (
                            <button
                              onClick={() => handleSetCurrent(annee.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Définir comme année courante"
                            >
                              <FaPlay className="w-4 h-4" />
                            </button>
                          )}

                        {annee.statut === "courante" && (
                          <button
                            onClick={() => handleCloseAnnee(annee.id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Clôturer l'année scolaire"
                          >
                            <FaStop className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            handleEdit(annee);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>

                        {annee.statut !== "courante" && (
                          <button
                            onClick={() => handleDelete(annee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {anneesScolaires.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Aucune année scolaire configurée
                </p>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
};

export default AnneeScolaireManager;
