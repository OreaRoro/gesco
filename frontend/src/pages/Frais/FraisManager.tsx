import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { fraisService } from "../../services/fraisService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import { useReferenceData } from "../../hooks/useReferenceData";
import {
  FraisScolarite,
  FraisScolariteCreateRequest,
} from "../../interfaces/frais.interface";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Spinner from "../../components/common/Spinner";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaMoneyBillWave,
  FaCopy,
} from "react-icons/fa";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import ConfirmationModal from "../../components/common/ConfirmationModal.tsx";

const FraisManager: React.FC = () => {
  const { anneeActive, anneesScolaires } = useAnneeScolaire();
  const { niveaux, loading: loadingRef } = useReferenceData();
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const [frais, setFrais] = useState<FraisScolarite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingFrais, setEditingFrais] = useState<FraisScolarite | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FraisScolariteCreateRequest>();

  const watchedMontant = watch("montant") || 0;
  const watchedFraisInscription = watch("frais_inscription") || 0;
  const watchedFraisDossier = watch("frais_dossier") || 0;

  // Charger les frais quand l'année active change
  useEffect(() => {
    loadFrais();
  }, [anneeActive?.id]);

  // Réinitialiser le formulaire quand l'édition ou l'année active change
  useEffect(() => {
    if (editingFrais) {
      setValue("niveau_id", editingFrais.niveau_id);
      setValue("annee_scolaire_id", editingFrais.annee_scolaire_id);
      setValue("montant", editingFrais.montant);
      setValue("frais_inscription", editingFrais.frais_inscription);
      setValue("frais_dossier", editingFrais.frais_dossier);
    } else {
      reset({
        niveau_id: undefined,
        annee_scolaire_id: anneeActive?.id || 0,
        montant: 0,
        frais_inscription: 0,
        frais_dossier: 0,
      });
    }
  }, [editingFrais, anneeActive?.id, setValue, reset]);

  const loadFrais = async () => {
    // Vérifier d'abord si une année active existe
    if (!anneeActive?.id) {
      setLoading(false);
      setFrais([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fraisService.getFraisScolarite({
        annee_scolaire_id: anneeActive.id,
      });
      setFrais(response.data?.frais_scolarite || []);
    } catch (error: any) {
      console.error("Erreur chargement frais:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des frais de scolarité"
      );
      setFrais([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FraisScolariteCreateRequest) => {
    setSubmitting(true);
    try {
      // Vérification robuste de l'année scolaire
      if (!anneeActive?.id) {
        toast.error("Aucune année scolaire active sélectionnée");
        setSubmitting(false);
        return;
      }

      // Validation des données requises
      if (!data.niveau_id) {
        toast.error("Le niveau est obligatoire");
        setSubmitting(false);
        return;
      }

      const fraisData: FraisScolariteCreateRequest = {
        ...data,
        annee_scolaire_id: anneeActive.id, // Toujours utiliser l'année active
      };

      if (editingFrais) {
        await fraisService.updateFraisScolarite(editingFrais.id, fraisData);
        toast.success("Frais de scolarité modifiés avec succès");
      } else {
        await fraisService.createFraisScolarite(fraisData);
        toast.success("Frais de scolarité créés avec succès");
      }

      reset();
      setEditingFrais(null);
      loadFrais();
    } catch (error: any) {
      console.error("Erreur sauvegarde frais:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fraisItem: FraisScolarite) => {
    setEditingFrais(fraisItem);
  };

  const handleDelete = async (id: number) => {
    try {
      const confirmDesactivation = await openModal({
        title: "Suppression",
        message: `Êtes-vous sûr de vouloir supprimer ce frais de scolarité?`,
        type: "danger",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await fraisService.deleteFraisScolarite(id);
        toast.success("Frais de scolarité supprimés avec succès");
        loadFrais();
      }
    } catch (error: any) {
      console.error("Erreur suppression frais:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleCancel = () => {
    setEditingFrais(null);
    reset();
  };

  const handleCopyFromPreviousYear = async () => {
    if (!anneeActive?.id) {
      toast.error("Aucune année scolaire active sélectionnée");
      return;
    }

    // Trouver l'année précédente de manière plus fiable
    const currentYear = parseInt(anneeActive.annee.split("-")[0]);
    const previousYearData = anneesScolaires.find((a) => {
      const year = parseInt(a.annee.split("-")[0]);
      return year === currentYear - 1;
    });

    if (!previousYearData) {
      toast.error("Aucune année scolaire précédente trouvée");
      return;
    }

    try {
      const previousFrais = await fraisService.getFraisScolarite({
        annee_scolaire_id: previousYearData.id,
      });

      if (!previousFrais.data?.frais_scolarite?.length) {
        toast.error("Aucun frais trouvé pour l'année précédente");
        return;
      }

      // Copier chaque frais avec la nouvelle année scolaire
      let copiedCount = 0;
      let skippedCount = 0;

      for (const fraisItem of previousFrais.data.frais_scolarite) {
        // Vérifier si des frais existent déjà pour ce niveau et cette année
        const fraisExistant = frais.find(
          (f) =>
            f.niveau_id === fraisItem.niveau_id &&
            f.annee_scolaire_id === anneeActive.id
        );

        if (fraisExistant) {
          skippedCount++;
          continue;
        }

        try {
          await fraisService.createFraisScolarite({
            niveau_id: fraisItem.niveau_id,
            annee_scolaire_id: anneeActive.id,
            montant: fraisItem.montant,
            frais_inscription: fraisItem.frais_inscription,
            frais_dossier: fraisItem.frais_dossier,
          });
          copiedCount++;
        } catch (error) {
          console.error(
            `Erreur copie frais niveau ${fraisItem.niveau_id}:`,
            error
          );
        }
      }

      let message = `${copiedCount} frais copiés depuis ${previousYearData.annee}`;
      if (skippedCount > 0) {
        message += ` (${skippedCount} déjà existants)`;
      }

      toast.success(message);
      loadFrais();
    } catch (error) {
      console.error("Erreur copie frais:", error);
      toast.error("Erreur lors de la copie des frais");
    }
  };

  const getNiveauNom = (niveauId: number) => {
    return niveaux.find((n) => n.id === niveauId)?.nom || "Niveau inconnu";
  };

  // Niveaux sans frais configurés pour l'année active
  const niveauxSansFrais = niveaux.filter(
    (niveau) => !frais.some((f) => f.niveau_id === niveau.id)
  );

  // Calculs pour les statistiques
  const totalScolarite = frais.reduce((sum, f) => sum + Number(f.montant), 0);
  const totalInscription = frais.reduce(
    (sum, f) => sum + Number(f.frais_inscription),
    0
  );
  const totalDossier = frais.reduce(
    (sum, f) => sum + Number(f.frais_dossier),
    0
  );
  const mensuelMax =
    frais.length > 0 ? Math.max(...frais.map((f) => f.montant / 10)) : 0;

  if (loadingRef || !anneeActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        {!anneeActive && (
          <p className="mt-4 text-gray-600">
            Chargement de l'année scolaire active...
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Gestion des Frais de Scolarité"
        description="Configuration des frais de scolarité par niveau et année scolaire"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Frais de Scolarité"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Paramétrage", path: "/parametres" },
          { label: "Frais de Scolarité", path: "/parametres/frais" },
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
        {/* En-tête avec année scolaire active */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                Année Scolaire Active
              </h3>
              <p className="text-blue-700">
                {anneeActive.annee} - {anneeActive.statut}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {frais.length} niveau(x) avec frais configurés sur{" "}
                {niveaux.length} au total
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyFromPreviousYear}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                title="Copier les frais de l'année précédente"
              >
                <FaCopy className="w-4 h-4" />
                Copier depuis année précédente
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout/modification */}
        <ComponentCard
          title={editingFrais ? "Modifier les Frais" : "Ajouter des Frais"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("niveau_id", {
                    required: "Le niveau est obligatoire",
                    valueAsNumber: true,
                  })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.niveau_id ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={editingFrais !== null}
                >
                  <option value="">Sélectionnez un niveau</option>
                  {editingFrais ? (
                    <option value={editingFrais.niveau_id}>
                      {getNiveauNom(editingFrais.niveau_id)} (En cours de
                      modification)
                    </option>
                  ) : (
                    niveauxSansFrais.map((niveau) => (
                      <option key={niveau.id} value={niveau.id}>
                        {niveau.nom} ({niveau.cycle})
                      </option>
                    ))
                  )}
                </select>
                {errors.niveau_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.niveau_id.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {editingFrais
                    ? "1 niveau en modification"
                    : `${niveauxSansFrais.length} niveau(x) disponibles`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année Scolaire
                </label>
                <div className="p-2 bg-gray-100 rounded border">
                  <p className="text-sm font-medium text-gray-900">
                    {anneeActive.annee}
                  </p>
                  <p className="text-xs text-gray-500">
                    {anneeActive.statut === "courante"
                      ? "Année active"
                      : anneeActive.statut}
                  </p>
                </div>
                <input
                  type="hidden"
                  {...register("annee_scolaire_id", {
                    value: anneeActive.id,
                  })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Les frais seront associés à l'année active
                </p>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de Scolarité Annuels{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="montant"
                    type="number"
                    placeholder="0"
                    register={register}
                    validation={{
                      required: "Les frais de scolarité sont obligatoires",
                      min: {
                        value: 1,
                        message: "Les frais de scolarité sont obligatoires",
                      },
                    }}
                    error={errors.montant}
                  />
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais d'Inscription <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="frais_inscription"
                    type="number"
                    placeholder="0"
                    register={register}
                    validation={{
                      required: "Les frais d'inscription sont obligatoires",
                      min: {
                        value: 1,
                        message: "Les frais d'inscription sont obligatoires",
                      },
                    }}
                    error={errors.frais_inscription}
                  />
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frais de Dossier <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="frais_dossier"
                    type="number"
                    placeholder="0"
                    register={register}
                    validation={{
                      min: {
                        value: 0,
                        message:
                          "Les frais de dossier ne doivent pas être négatif.",
                      },
                    }}
                    error={errors.frais_dossier}
                  />
                </div>
              </div>
            </div>

            {/* Calcul automatique des frais mensuels */}
            {(watchedMontant > 0 ||
              watchedFraisInscription > 0 ||
              watchedFraisDossier > 0) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Calcul automatique
                </h4>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-gray-600">
                      Frais mensuels estimés:
                    </span>
                    <p className="font-medium">
                      {fraisService.formatMontant(Number(watchedMontant) / 10)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Total à l'inscription:
                    </span>
                    <p className="font-medium">
                      {fraisService.formatMontant(
                        Number(watchedFraisInscription) +
                          Number(watchedFraisDossier)
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Coût total annuel:</span>
                    <p className="font-medium">
                      {fraisService.formatMontant(
                        Number(watchedMontant) +
                          Number(watchedFraisInscription) +
                          Number(watchedFraisDossier)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={
                  submitting || !anneeActive || niveauxSansFrais.length === 0
                }
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <FaPlus className="w-4 h-4" />
                )}
                {editingFrais ? "Modifier les frais" : "Ajouter les frais"}
              </button>

              {editingFrais && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}
            </div>

            {niveauxSansFrais.length === 0 && !editingFrais && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Tous les niveaux ont déjà des frais configurés pour cette
                  année scolaire. Vous pouvez modifier les frais existants en
                  utilisant les boutons d'édition.
                </p>
              </div>
            )}
          </form>
        </ComponentCard>

        {/* Reste du code inchangé... */}
        <ComponentCard title={`Frais Configurés - ${anneeActive.annee}`}>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" />
            </div>
          ) : frais.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Niveau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frais Scolarité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frais Inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frais Dossier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensuel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {frais.map((fraisItem) => (
                    <tr key={fraisItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fraisItem.niveau?.nom ||
                            getNiveauNom(fraisItem.niveau_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {fraisItem.niveau?.cycle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fraisService.formatMontant(fraisItem.montant)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fraisService.formatMontant(
                            fraisItem.frais_inscription
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fraisService.formatMontant(fraisItem.frais_dossier)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {fraisService.formatMontant(fraisItem.montant / 10)}
                        </div>
                        <div className="text-xs text-gray-500">/ mois</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(fraisItem)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fraisItem.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaMoneyBillWave className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun frais configuré
              </h3>
              <p className="text-gray-500 mb-4">
                Aucun frais n'a été configuré pour l'année scolaire{" "}
                {anneeActive.annee}.
              </p>
              {niveauxSansFrais.length > 0 && (
                <p className="text-sm text-gray-500">
                  {niveauxSansFrais.length} niveau(x) disponibles pour
                  configuration
                </p>
              )}
            </div>
          )}
        </ComponentCard>

        {/* Statistiques rapides */}
        {frais.length > 0 && (
          <ComponentCard title="Aperçu des Frais">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {fraisService.formatMontant(totalScolarite)}
                </div>
                <div className="text-sm text-blue-700">
                  Total scolarité annuelle
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {fraisService.formatMontant(totalInscription)}
                </div>
                <div className="text-sm text-green-700">
                  Total frais d'inscription
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {frais.length}
                </div>
                <div className="text-sm text-purple-700">
                  Niveaux configurés
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {fraisService.formatMontant(mensuelMax)}
                </div>
                <div className="text-sm text-orange-700">Mensuel max</div>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
};

export default FraisManager;
