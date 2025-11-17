import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { examenService } from "../../services/examenService";
import { Examen } from "../../interfaces/examen.interface";
import { useApi } from "../../hooks/useApi";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import { SearchIcon, PencilIcon } from "../../icons";
import { FaPlus, FaFileAlt, FaTrash, FaEye } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Spinner from "../../components/common/Spinner.tsx";
import Badge from "../../components/ui/badge/Badge.tsx";
import ConfirmationModal from "../../components/common/ConfirmationModal.tsx";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { toast } from "sonner";

const ExamenListe: React.FC = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const { anneeActive } = useAnneeScolaire();
  const { data, loading, execute } = useApi<any>();
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const examens: Examen[] = data?.data?.examens || [];

  useEffect(() => {
    loadExamens();
  }, [anneeActive, search, type]);

  const loadExamens = () => {
    if (!anneeActive?.id) return;

    const filters = {
      annee_scolaire_id: anneeActive.id,
      search,
      type,
    };

    execute(() => examenService.getAll(filters));
  };

  const handleDelete = async (id: number, nom: string) => {
    try {
      const confirmDelete = await openModal({
        title: "Supprimer l'examen",
        message: `Êtes-vous sûr de vouloir supprimer l'examen "${nom}" ?`,
        type: "danger",
        confirmText: "Supprimer",
        cancelText: "Annuler",
      });

      if (confirmDelete) {
        await examenService.delete(id);
        toast.success("Examen supprimé avec succès");
        loadExamens();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la suppression";
      toast.error(errorMessage);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "trimestriel":
        return "primary";
      case "semestriel":
        return "info";
      case "annuel":
        return "success";
      case "composition":
        return "warning";
      default:
        return "default";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "trimestriel":
        return "Trimestriel";
      case "semestriel":
        return "Semestriel";
      case "annuel":
        return "Annuel";
      case "composition":
        return "Composition";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <>
      <PageMeta
        title="Gestion des Examens | Système de Gestion Scolaire"
        description="Page de gestion des examens - Liste, création et gestion des évaluations"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Examens"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Examens", path: "/examens" },
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
        <ComponentCard title="Liste des Examens">
          {/* En-tête avec actions */}
          <div className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Barre de recherche */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Rechercher un examen..."
                  disabled={!anneeActive}
                />
              </div>

              {/* Filtre type */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={!anneeActive}
              >
                <option value="">Tous les types</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="semestriel">Semestriel</option>
                <option value="annuel">Annuel</option>
                <option value="composition">Composition</option>
              </select>
            </div>

            <Link
              to="/examens/nouveau"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => !anneeActive && e.preventDefault()}
              title={
                !anneeActive
                  ? "Veuillez sélectionner une année scolaire active"
                  : ""
              }
            >
              <FaPlus className="w-4 h-4" />
              Nouvel examen
            </Link>
          </div>

          {/* Tableau des examens */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Nom
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Période
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Dates
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
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <Spinner size="sm" label="Chargement..." />
                      </TableCell>
                    </TableRow>
                  ) : !anneeActive ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <span>Aucune année scolaire active sélectionnée</span>
                      </TableCell>
                    </TableRow>
                  ) : examens.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <span>Aucun examen trouvé</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    examens.map((examen) => (
                      <TableRow
                        key={examen.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/2"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {examen.nom}
                          </div>
                          {examen.periode_nom && (
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {examen.periode_nom}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <Badge size="sm" color={getTypeColor(examen.type)}>
                            {getTypeText(examen.type)}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {examen.annee || "-"}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="text-gray-800 dark:text-white/90">
                            Du {formatDate(examen.date_debut)}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                            au {formatDate(examen.date_fin)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/examens/${examen.id}/notes`}
                              className="flex items-center justify-center w-8 h-8 text-green-600 transition-colors rounded hover:bg-green-50 hover:text-green-700"
                              title="Saisir les notes"
                            >
                              <FaFileAlt className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/examens/${examen.id}`}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded hover:bg-gray-100 hover:text-gray-700"
                              title="Voir les détails"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/examens/${examen.id}/modifier`}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-700"
                              title="Modifier"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() =>
                                handleDelete(examen.id, examen.nom)
                              }
                              className="flex items-center justify-center w-8 h-8 text-red-600 transition-colors rounded hover:bg-red-50 hover:text-red-700"
                              title="Supprimer"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
};

export default ExamenListe;
