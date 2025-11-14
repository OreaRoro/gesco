import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { niveauService } from "../../services/niveauService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import {
  Niveau,
  NiveauCreateRequest,
} from "../../interfaces/reference.interface";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Spinner from "../../components/common/Spinner";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import ConfirmationModal from "../../components/common/ConfirmationModal.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import PageMeta from "../../components/common/PageMeta.tsx";

const NiveauManager: React.FC = () => {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingNiveau, setEditingNiveau] = useState<Niveau | null>(null);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  // Utiliser le contexte année scolaire
  const { anneeActive } = useAnneeScolaire();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NiveauCreateRequest>();

  useEffect(() => {
    loadNiveaux();
  }, []);

  const loadNiveaux = async () => {
    setLoading(true);
    try {
      const response = await niveauService.getAll();
      setNiveaux(response.data?.niveaux || []);
    } catch (error: any) {
      console.error("Erreur chargement niveaux:", error);
      toast.error("Erreur lors du chargement des niveaux");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: NiveauCreateRequest) => {
    setSubmitting(true);
    try {
      if (editingNiveau) {
        await niveauService.update(editingNiveau.id, data);
        toast.success("Niveau modifié avec succès");
      } else {
        await niveauService.create(data);
        toast.success("Niveau créé avec succès");
      }
      reset();
      setEditingNiveau(null);
      loadNiveaux();
    } catch (error: any) {
      toast.error(
        error.response?.data?.messages?.nom || "Erreur lors de la sauvegarde"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (niveau: Niveau) => {
    setEditingNiveau(niveau);
    setValue("nom", niveau.nom);
    setValue("cycle", niveau.cycle);
    setValue("ordre", niveau.ordre);
  };

  const handleDelete = async (id: number, niveau_nom: string) => {
    try {
      const confirmDelete = await openModal({
        title: "Supprimer le niveau",
        message: `Êtes-vous sûr de vouloir supprimer le niveau: "${niveau_nom}" ?`,
        type: "warning",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (confirmDelete) {
        await niveauService.delete(id);
        toast.success("Niveau supprimé avec succès");
        loadNiveaux();
      }
    } catch (error: any) {
      console.error("Erreur suppression niveau:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleCancel = () => {
    setEditingNiveau(null);
    reset();
  };

  const cycles = ["Préscolaire", "Primaire", "Collège", "Lycée"];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Gestion des Niveaux | Système de Gestion Scolaire"
        description="Page de gestion des niveaux scolaires"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Niveaux"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Paramétrage", path: "/parametres" },
          { label: "Niveaux", path: "/parametres/niveaux" },
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
        {/* En-tête avec contexte année scolaire */}
        {anneeActive && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Contexte Actuel
                </h3>
                <p className="text-blue-700">
                  Année Scolaire: <strong>{anneeActive.annee}</strong>
                </p>
              </div>
              <div className="text-sm text-blue-600">
                {niveaux.length} niveau(x) configuré(s)
              </div>
            </div>
          </div>
        )}

        <ComponentCard
          title={editingNiveau ? "Modifier le Niveau" : "Ajouter un Niveau"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du niveau <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nom"
                  placeholder="Ex: 6ème, CP, Terminale"
                  register={register}
                  validation={{ required: "Le nom est obligatoire" }}
                  error={errors.nom}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("cycle", {
                    required: "Le cycle est obligatoire",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un cycle</option>
                  {cycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle}
                    </option>
                  ))}
                </select>
                {errors.cycle && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.cycle.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre <span className="text-red-500">*</span>
                </label>
                <Input
                  name="ordre"
                  type="number"
                  placeholder="1, 2, 3..."
                  register={register}
                  validation={{
                    required: "L'ordre est obligatoire",
                    min: {
                      value: 1,
                      message: "L'ordre doit être supérieur à 0",
                    },
                  }}
                  error={errors.ordre}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Définit l'ordre d'affichage
                </p>
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
                  <FaPlus className="w-4 h-4" />
                )}
                {editingNiveau ? "Modifier le niveau" : "Ajouter le niveau"}
              </button>

              {editingNiveau && (
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

        <ComponentCard
          title={`Liste des Niveaux ${
            anneeActive ? `- ${anneeActive.annee}` : ""
          }`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {niveaux
                  .sort((a, b) => a.ordre - b.ordre)
                  .map((niveau) => (
                    <tr key={niveau.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {niveau.nom}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            niveau.cycle === "Préscolaire"
                              ? "bg-purple-100 text-purple-800"
                              : niveau.cycle === "Primaire"
                              ? "bg-green-100 text-green-800"
                              : niveau.cycle === "Collège"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {niveau.cycle}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {niveau.ordre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleEdit(niveau);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier le niveau"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(niveau.id, niveau.nom)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer le niveau"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {niveaux.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaPlus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun niveau configuré
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par ajouter votre premier niveau scolaire.
                </p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Statistiques rapides */}
        {niveaux.length > 0 && (
          <ComponentCard title="Répartition par Cycle">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {cycles.map((cycle) => {
                const count = niveaux.filter((n) => n.cycle === cycle).length;
                return (
                  <div
                    key={cycle}
                    className="text-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">{cycle}</div>
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
};

export default NiveauManager;
