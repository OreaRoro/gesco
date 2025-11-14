import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { classeService } from "../../services/classeService";
import { niveauService } from "../../services/niveauService";
import { fraisService } from "../../services/fraisService";
import { personnelService } from "../../services/personnelService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import {
  Classe,
  ClasseCreateRequest,
} from "../../interfaces/reference.interface";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Spinner from "../../components/common/Spinner";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUsers,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ConfirmationModal from "../../components/common/ConfirmationModal.tsx";

const ClasseManager: React.FC = () => {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [fraisParAnnee, setFraisParAnnee] = useState<Record<number, any[]>>({});
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [surveillant, setSurveillant] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [effectifs, setEffectifs] = useState<Record<number, number>>({});

  const { anneeActive } = useAnneeScolaire();

  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClasseCreateRequest>();

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand l'année active change
  useEffect(() => {
    if (anneeActive?.id) {
      loadClassesForCurrentYear();
    } else {
      // Si pas d'année active, vider la liste des classes
      setClasses([]);
    }
  }, [anneeActive?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [niveauxRes, fraisRes, personnelRes, surveillantRes] =
        await Promise.all([
          niveauService.getAll(),
          fraisService.getFraisScolarite(),
          personnelService.getAdministratif(),
          personnelService.getAdministratif(),
        ]);

      setNiveaux(niveauxRes.data?.niveaux || []);
      setPersonnel(personnelRes?.data?.administratif || []);
      setSurveillant(surveillantRes?.data?.administratif || []);

      // Organiser les frais par année scolaire
      const fraisOrganises: Record<number, any[]> = {};
      if (fraisRes.data?.frais_scolarite) {
        fraisRes.data.frais_scolarite.forEach((frais: any) => {
          if (!fraisOrganises[frais.annee_scolaire_id]) {
            fraisOrganises[frais.annee_scolaire_id] = [];
          }
          fraisOrganises[frais.annee_scolaire_id].push(frais);
        });
      }
      setFraisParAnnee(fraisOrganises);

      // Charger les classes pour l'année active si disponible
      if (anneeActive?.id) {
        await loadClassesForCurrentYear();
      }
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadClassesForCurrentYear = async () => {
    if (!anneeActive?.id) {
      setClasses([]);
      return;
    }

    try {
      // Charger toutes les classes puis filtrer côté client par année scolaire
      const classesRes = await classeService.getClassesWithDetails();
      const classesFiltrees =
        classesRes.data?.classes?.filter(
          (classe: Classe) => classe.annee_scolaire_id === anneeActive.id
        ) || [];
      setClasses(classesFiltrees);
    } catch (error: any) {
      console.error("Erreur chargement classes:", error);
      toast.error("Erreur lors du chargement des classes");
      setClasses([]);
    }
  };

  // Obtenir les niveaux disponibles pour l'année active
  const getNiveauxDisponibles = () => {
    if (!anneeActive?.id) return [];

    const fraisAnnee = fraisParAnnee[anneeActive.id] || [];
    const niveauxAvecFrais = fraisAnnee.map((frais: any) => frais.niveau_id);

    return niveaux.filter((niveau) => niveauxAvecFrais.includes(niveau.id));
  };

  const onSubmit = async (data: ClasseCreateRequest) => {
    setSubmitting(true);
    try {
      // Utiliser automatiquement l'année active
      if (!anneeActive?.id) {
        toast.error("Aucune année scolaire active sélectionnée");
        setSubmitting(false);
        return;
      }

      const classeData = {
        ...data,
        annee_scolaire_id: anneeActive.id, // Toujours utiliser l'année active
      };

      if (editingClasse) {
        await classeService.update(editingClasse.id, classeData);
        toast.success("Classe modifiée avec succès");
      } else {
        await classeService.create(classeData);
        toast.success("Classe créée avec succès");
      }
      reset();
      setEditingClasse(null);
      loadClassesForCurrentYear();
    } catch (error: any) {
      console.error("Erreur sauvegarde classe:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la sauvegarde"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (classe: Classe) => {
    setEditingClasse(classe);
    setValue("nom", classe.nom);
    setValue("niveau_id", classe.niveau_id);
    setValue("capacite_max", classe.capacite_max);
    setValue(
      "professeur_principal_id",
      classe.professeur_principal_id || undefined
    );
    setValue("surveillant_id", classe.surveillant_id || undefined);
  };

  const handleDelete = async (id: number) => {
    try {
      const confirmDesactivation = await openModal({
        title: "Suppression",
        message: `Êtes-vous sûr de vouloir supprimer cette classe?`,
        type: "danger",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await classeService.delete(id);
        toast.success("Classe supprimée avec succès");
        loadClassesForCurrentYear();
      }
    } catch (error: any) {
      console.error("Erreur suppression classe:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleCancel = () => {
    setEditingClasse(null);
    reset();
  };

  useEffect(() => {
    const fetchEffectifs = async () => {
      const result: Record<number, number> = {};
      for (const classe of classes) {
        try {
          const response = await classeService.getEffectif(classe.id);
          result[classe.id] = response.data.effectif;
        } catch {
          result[classe.id] = 0;
        }
      }
      console.log(result);
      setEffectifs(result);
    };

    if (classes.length > 0) {
      fetchEffectifs();
    }
  }, [classes]);

  const enseignants = personnel.filter(
    (p) => p.type_personnel === "enseignant"
  );
  const surveillants = personnel.filter(
    (p) => p.type_personnel === "surveillant"
  );

  const niveauxDisponibles = getNiveauxDisponibles();

  // Filtrer les classes pour n'afficher que celles de l'année active
  const classesActives = anneeActive
    ? classes.filter((classe) => classe.annee_scolaire_id === anneeActive.id)
    : [];

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
        title="Gestion des Classes"
        description="Configuration des classes par niveau et année scolaire"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Classes"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Paramétrage", path: "/parametres" },
          { label: "Classes", path: "/parametres/classes" },
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
        {/* En-tête avec l'année active */}
        {anneeActive ? (
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
                  {classesActives.length} classe(s) configurée(s) -{" "}
                  {niveauxDisponibles.length} niveau(x) disponible(s)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900">
                  Aucune année scolaire active
                </h3>
                <p className="text-yellow-700">
                  Veuillez sélectionner une année scolaire active pour gérer les
                  classes.
                </p>
              </div>
            </div>
          </div>
        )}

        <ComponentCard
          title={editingClasse ? "Modifier la Classe" : "Ajouter une Classe"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la classe <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nom"
                  placeholder="Ex: 6ème A, Terminale S"
                  register={register}
                  validation={{ required: "Le nom est obligatoire" }}
                  error={errors.nom}
                  disabled={!anneeActive}
                />
              </div>

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
                  } ${!anneeActive ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  disabled={!anneeActive || niveauxDisponibles.length === 0}
                >
                  <option value="">Sélectionnez un niveau</option>
                  {niveauxDisponibles.map((niveau) => {
                    const fraisAnnee = anneeActive
                      ? fraisParAnnee[anneeActive.id]
                      : [];
                    const fraisNiveau = fraisAnnee?.find(
                      (f: any) => f.niveau_id === niveau.id
                    );

                    return (
                      <option key={niveau.id} value={niveau.id}>
                        {niveau.nom} ({niveau.cycle})
                        {fraisNiveau &&
                          ` - ${fraisService.formatMontant(
                            fraisNiveau.montant
                          )}`}
                      </option>
                    );
                  })}
                </select>
                {errors.niveau_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.niveau_id.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {!anneeActive
                    ? "Sélectionnez une année scolaire active"
                    : `${niveauxDisponibles.length} niveau(x) avec frais configurés`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité maximale <span className="text-red-500">*</span>
                </label>
                <Input
                  name="capacite_max"
                  type="number"
                  placeholder="30"
                  register={register}
                  validation={{
                    required: "La capacité est obligatoire",
                    min: {
                      value: 1,
                      message: "La capacité doit être d'au moins 1",
                    },
                    max: {
                      value: 100,
                      message: "La capacité ne peut pas dépasser 100",
                    },
                  }}
                  error={errors.capacite_max}
                  disabled={!anneeActive}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professeur principal
                </label>
                <select
                  {...register("professeur_principal_id", {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !anneeActive ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={!anneeActive}
                >
                  <option value="">Aucun professeur principal</option>
                  {enseignants.map((enseignant) => (
                    <option key={enseignant.id} value={enseignant.id}>
                      {enseignant.prenom} {enseignant.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surveillant
                </label>
                <select
                  {...register("surveillant_id", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !anneeActive ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={!anneeActive}
                >
                  <option value="">Aucun surveillant</option>
                  {surveillants.map((surveillant) => (
                    <option key={surveillant.id} value={surveillant.id}>
                      {surveillant.prenom} {surveillant.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Champ caché pour l'année scolaire */}
              <input
                type="hidden"
                {...register("annee_scolaire_id", {
                  value: anneeActive?.id || 0,
                })}
              />
            </div>

            {/* Aperçu des frais */}
            {anneeActive && niveauxDisponibles.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Frais de scolarité pour {anneeActive.annee}
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-3">
                  {niveauxDisponibles.map((niveau) => {
                    const frais = fraisParAnnee[anneeActive.id]?.find(
                      (f: any) => f.niveau_id === niveau.id
                    );
                    return frais ? (
                      <div
                        key={niveau.id}
                        className="flex items-center justify-between p-2 bg-white rounded"
                      >
                        <span className="font-medium">{niveau.nom}</span>
                        <span className="text-green-600 font-semibold">
                          {fraisService.formatMontant(frais.montant)}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {anneeActive && niveauxDisponibles.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Aucun frais configuré pour cette année scolaire.
                    <a
                      href="/parametres/frais"
                      className="ml-1 text-yellow-800 underline"
                    >
                      Configurer les frais
                    </a>
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={
                  submitting || !anneeActive || niveauxDisponibles.length === 0
                }
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <FaPlus className="w-4 h-4" />
                )}
                {editingClasse ? "Modifier la classe" : "Ajouter la classe"}
              </button>

              {editingClasse && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}
            </div>

            {!anneeActive && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Veuillez sélectionner une année scolaire active pour pouvoir
                  créer des classes.
                </p>
              </div>
            )}
          </form>
        </ComponentCard>

        <ComponentCard
          title={`Liste des Classes ${
            anneeActive ? `- ${anneeActive.annee}` : ""
          }`}
        >
          {anneeActive ? (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Affichage des classes de l'année scolaire active :{" "}
                  <strong>{anneeActive.annee}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {classesActives.length} classe(s) trouvée(s)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Niveau
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Professeur Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classesActives.map((classe) => (
                      <tr key={classe.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {classe.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            <FaUsers className="inline w-3 h-3 mr-1" />
                            Effectif: {effectifs[classe.id] ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {classe?.niveau_nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {classe.niveau?.cycle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {classe.capacite_max}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((effectifs[classe.id] ?? 0) /
                                    (classe.capacite_max || 1)) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {classe.professeur_principal ? (
                            <div className="text-sm text-gray-900">
                              {classe.professeur_principal.prenom}{" "}
                              {classe.professeur_principal.nom}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Non assigné
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleEdit(classe);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(classe.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {classesActives.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Aucune classe configurée pour l'année {anneeActive.annee}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Utilisez le formulaire ci-dessus pour créer la première
                      classe.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Aucune année scolaire active sélectionnée
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Veuillez sélectionner une année scolaire active pour afficher
                les classes.
              </p>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default ClasseManager;
