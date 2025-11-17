import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  matiereService,
  Matiere,
  MatiereFilters,
} from "../../services/matiereService";
import { niveauService } from "../../services/niveauService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBook } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface FilterFormData {
  search: string;
  niveau_id: string;
}

const MatieresList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register, watch, reset } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      niveau_id: "",
    },
  });

  const watchedSearch = watch("search");
  const watchedNiveauId = watch("niveau_id");

  useEffect(() => {
    loadData();
    loadNiveaux();
  }, []);

  useEffect(() => {
    // Recharger quand les filtres changent
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedSearch, watchedNiveauId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: MatiereFilters = {};

      if (watchedSearch) {
        filters.search = watchedSearch;
      }
      if (watchedNiveauId) {
        filters.niveau_id = parseInt(watchedNiveauId);
      }

      const response = await matiereService.getAll(filters);

      setMatieres(response.data.matieres || []);
    } catch (error: any) {
      console.error("Erreur chargement matières:", error);
      toast.error("Erreur lors du chargement des matières");
    } finally {
      setLoading(false);
    }
  };

  const loadNiveaux = async () => {
    try {
      const response = await niveauService.getAll();
      setNiveaux(response.data.niveaux || []);
    } catch (error: any) {
      console.error("Erreur chargement niveaux:", error);
    }
  };

  const handleDelete = async (matiereId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message:
          "Êtes-vous sûr de vouloir supprimer cette matière ? Cette action est irréversible.",
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await matiereService.delete(matiereId);
        toast.success("Matière supprimée avec succès");
        loadData();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handleResetFilters = () => {
    reset({
      search: "",
      niveau_id: "",
    });
  };

  const getCoefficientBadge = (coefficient: number) => {
    const colors = {
      1: "bg-gray-100 text-gray-800",
      2: "bg-blue-100 text-blue-800",
      3: "bg-green-100 text-green-800",
      4: "bg-orange-100 text-orange-800",
      5: "bg-red-100 text-red-800",
    };

    const colorClass = colors[coefficient as keyof typeof colors] || colors[1];

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
      >
        Coef. {coefficient}
      </span>
    );
  };

  return (
    <>
      <PageMeta
        title="Gestion des Matières | Système de Gestion Scolaire"
        description="Gérer les matières enseignées dans l'établissement"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Matières"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Matières", path: "/matieres" },
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
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Matières</h1>
            <p className="text-gray-600">Gérer les matières enseignées</p>
          </div>

          <Link
            to="/matieres/nouveau"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            <FaPlus className="w-4 h-4" />
            Nouvelle matière
          </Link>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register("search")}
                  placeholder="Nom ou code de la matière..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Niveau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <select
                {...register("niveau_id")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Tous les niveaux</option>
                {niveaux.map((niveau) => (
                  <option key={niveau.id} value={niveau.id}>
                    {niveau.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton Réinitialiser */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </ComponentCard>

        {/* Liste des matières */}
        <ComponentCard
          title="Liste des Matières"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {matieres.length} matière(s) trouvée(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : matieres.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/5">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Matière
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Code
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Coefficient
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Niveau
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                    {matieres.map((matiere) => (
                      <TableRow key={matiere.id} className="hover:bg-gray-50">
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                              <FaBook className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {matiere.nom}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <code className="px-2 py-1 text-sm bg-gray-100 rounded text-gray-800">
                            {matiere.code}
                          </code>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {getCoefficientBadge(matiere.coefficient)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                            {matiere.niveau_nom || "Non assigné"}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex gap-2">
                            <Link
                              to={`/matieres/${matiere.id}/modifier`}
                              className="p-2 text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700"
                              title="Modifier la matière"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(matiere.id)}
                              className="p-2 text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700"
                              title="Supprimer la matière"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaBook className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucune matière trouvée
              </p>
              <p className="text-gray-500">
                {watchedSearch || watchedNiveauId
                  ? "Aucune matière ne correspond aux critères de recherche."
                  : "Aucune matière enregistrée pour le moment."}
              </p>
              {(watchedSearch || watchedNiveauId) && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
              {!watchedSearch && !watchedNiveauId && (
                <Link
                  to="/matieres/nouveau"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  <FaPlus className="w-4 h-4" />
                  Créer la première matière
                </Link>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default MatieresList;
