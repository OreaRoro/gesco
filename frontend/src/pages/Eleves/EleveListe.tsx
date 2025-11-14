import { useEffect, useState } from "react";
import { eleveService } from "../../services/eleveService";
import { Eleve, ElevesResponse } from "../../interfaces/eleve.interface";
import { useApi } from "../../hooks/useApi";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import ComponentCard from "../../components/common/ComponentCard";
import { DownloadIcon, SearchIcon, PencilIcon } from "../../icons/index";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaEye,
  FaArchive,
  FaHistory,
  FaFileArchive,
  FaExclamationTriangle,
  FaUserSlash,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Spinner from "../../components/common/Spinner";
import Badge from "../../components/ui/badge/Badge";
import { useImageUrl } from "../../hooks/useImageUrl";
import { toast } from "sonner";
import { usePagination } from "../../hooks/usePagination";

const EleveListe = () => {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [desactivationLoading, setDesactivationLoading] = useState<
    number | null
  >(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Utilisation du contexte année scolaire avec anneeActive
  const { anneeActive, loading: anneeLoading } = useAnneeScolaire();

  const { data, loading, error, execute } = useApi<ElevesResponse>();
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();
  const { getImageUrl } = useImageUrl();

  // Données avec fallbacks sécurisés
  const eleves = data?.data?.eleves || [];

  // Utilisation du hook usePagination
  const {
    currentPage,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    pagination,
    hasNextPage,
    hasPreviousPage,
    totalItems,
    totalPages,
  } = usePagination(data?.data?.pagination);

  // Calcul des valeurs pour l'affichage
  const from = pagination?.from || (currentPage - 1) * itemsPerPage + 1;
  const to = pagination?.to || Math.min(currentPage * itemsPerPage, totalItems);

  useEffect(() => {
    loadEleves();
  }, [currentPage, search, statut, anneeActive, itemsPerPage]);

  const loadEleves = () => {
    // Vérifier si une année active est disponible
    if (!anneeActive?.id) {
      return;
    }

    const filters = {
      page: currentPage,
      perPage: itemsPerPage,
      search,
      statut: statut || "actif",
      annee_scolaire_id: anneeActive.id,
    };

    execute(() => eleveService.getAll(filters));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatutChange = (value: string) => {
    setStatut(value);
    setCurrentPage(1);
  };

  // Nouvelle fonction pour gérer le changement d'éléments par page
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStatut("");
    setCurrentPage(1);
  };

  const handleDesactiver = async (id: number, eleveNom: string) => {
    setDesactivationLoading(id);
    try {
      const confirmDesactivation = await openModal({
        title: "Désactiver l'élève",
        message: `Êtes-vous sûr de vouloir désactiver l'élève "${eleveNom}" ? 
        L'élève ne sera pas supprimé définitivement mais marqué comme inactif. Vous pourrez le restaurer plus tard si nécessaire.`,
        type: "danger",
        confirmText: "Désactiver",
        cancelText: "Annuler",
      });

      if (confirmDesactivation) {
        await eleveService.desactiver(id);
        toast.success("Élève désactivé avec succès");
        loadEleves();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la désactivation";
      toast.error(errorMessage);
    } finally {
      setDesactivationLoading(null);
    }
  };

  const handleRestaurer = async (id: number, eleveNom: string) => {
    setDesactivationLoading(id);
    try {
      const confirmRestoration = await openModal({
        title: "Restaurer l'élève",
        message: `Êtes-vous sûr de vouloir restaurer l'élève "${eleveNom}" ?`,
        type: "info",
        confirmText: "Restaurer",
        cancelText: "Annuler",
      });

      if (confirmRestoration) {
        await eleveService.restaurer(id);
        toast.success("Élève restauré avec succès");
        loadEleves();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la restauration";
      toast.error(errorMessage);
    } finally {
      setDesactivationLoading(null);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "actif":
        return "success";
      case "inactif":
        return "warning";
      case "transfere":
        return "error";
      case "diplome":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case "actif":
        return "Actif";
      case "inactif":
        return "Inactif";
      case "transfere":
        return "Transféré";
      case "diplome":
        return "Diplômé";
      default:
        return statut;
    }
  };

  const shouldShowRestaurerButton = (eleve: Eleve) => {
    return eleve.statut === "inactif";
  };

  const shouldShowDesactiverButton = (eleve: Eleve) => {
    return eleve.statut === "actif";
  };

  const shouldShowModifierButton = (eleve: Eleve) => {
    return eleve.statut === "actif" || eleve.statut === "inactif";
  };

  const getClasseNom = (eleve: Eleve) => {
    return eleve.classe_nom || "Non assigné";
  };

  const getNiveauNom = (eleve: Eleve) => {
    return eleve.niveau_nom || "";
  };

  const getCodeEleve = (eleve: Eleve) => {
    return eleve.code_eleve || eleve.matricule;
  };

  const getInscriptionStatus = (eleve: Eleve) => {
    console.log(eleve.inscription_statut);
    if (eleve.inscription_statut === "inscrit") {
      return (
        <Badge size="sm" color="success">
          Inscrit
        </Badge>
      );
    } else if (eleve.inscription_statut === "reinscrit") {
      return (
        <Badge size="sm" color="success">
          Réinscrit
        </Badge>
      );
    }
    return (
      <Badge size="sm" color="warning">
        Non inscrit
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Erreur de chargement</h3>
          </div>
          <p className="mb-3">{error}</p>
          <button
            onClick={loadEleves}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Réessayer le chargement
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Gestion des Élèves | Système de Gestion Scolaire"
        description="Page de gestion des élèves - Liste, recherche et gestion des étudiants"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Élèves"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
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
              {!anneeActive && (
                <div className="p-2 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-sm text-yellow-800">
                    Aucune année scolaire active sélectionnée
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <ComponentCard title="Liste des Élèves">
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Rechercher un élève..."
                  disabled={!anneeActive}
                />
              </div>

              {/* Filtre statut */}
              <select
                value={statut}
                onChange={(e) => handleStatutChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                disabled={!anneeActive}
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actifs seulement</option>
                <option value="inactif">Inactifs seulement</option>
                <option value="transfere">Transférés</option>
                <option value="diplome">Diplômés</option>
              </select>

              {(search || statut) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={!anneeActive}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/eleves/inactifs"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <FaArchive className="w-4 h-4" />
                Élèves inactifs
              </Link>

              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={!anneeActive}
              >
                <DownloadIcon className="w-4 h-4" />
                Exporter
              </button>

              <Link
                to="/eleves/nouveau"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => !anneeActive && e.preventDefault()}
                title={
                  !anneeActive
                    ? "Veuillez sélectionner une année scolaire active"
                    : ""
                }
              >
                <FaPlus className="w-4 h-4" />
                Nouvel élève
              </Link>
            </div>
          </div>

          {/* Message si pas d'année active */}
          {!anneeActive && (
            <div className="p-4 mx-6 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Veuillez sélectionner une année scolaire active pour afficher
                  et gérer les élèves.
                </p>
              </div>
            </div>
          )}

          {/* Tableau des élèves */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Élève
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Classe
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Contact Parent
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Inscription
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
                  {loading || anneeLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <Spinner size="sm" label="Chargement..." />
                      </TableCell>
                    </TableRow>
                  ) : !anneeActive ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <span>Aucune année scolaire active sélectionnée</span>
                      </TableCell>
                    </TableRow>
                  ) : data?.data?.eleves?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <span>
                          Aucun élève trouvé pour l'année scolaire{" "}
                          {anneeActive.annee}
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    eleves.map((eleve: Eleve) => (
                      <TableRow
                        key={eleve.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/2"
                      >
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full">
                              <img
                                width={40}
                                height={40}
                                src={getImageUrl(eleve)}
                                alt={`${eleve.prenom} ${eleve.nom}`}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                <Link
                                  to={`/eleves/${eleve.id}`}
                                  className="hover:text-brand-300 hover:underline"
                                >
                                  {eleve.nom} {eleve.prenom}
                                </Link>
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {getCodeEleve(eleve)}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {getNiveauNom(eleve)}
                          </span>
                          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                            {getClasseNom(eleve)}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="text-theme-sm">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {eleve.telephone_parent || "Non renseigné"}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {eleve.email_parent || "-"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <Badge size="sm" color={getStatusColor(eleve.statut)}>
                            {getStatusText(eleve.statut)}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <Link
                            to={`/eleves/${eleve.id}`}
                            className="hover:underline"
                            title="Voir le profil pour réinscrire"
                          >
                            {getInscriptionStatus(eleve)}
                          </Link>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-1">
                            {/* Bouton Restaurer */}
                            {shouldShowRestaurerButton(eleve) && (
                              <button
                                onClick={() =>
                                  handleRestaurer(
                                    eleve.id,
                                    `${eleve.prenom} ${eleve.nom}`
                                  )
                                }
                                disabled={
                                  desactivationLoading === eleve.id ||
                                  !anneeActive
                                }
                                className={`flex items-center justify-center w-8 h-8 transition-colors rounded ${
                                  desactivationLoading === eleve.id ||
                                  !anneeActive
                                    ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                    : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                                title={
                                  !anneeActive
                                    ? "Année scolaire requise"
                                    : "Restaurer l'élève"
                                }
                              >
                                {desactivationLoading === eleve.id ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FaHistory className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Bouton Voir le profil */}
                            <Link
                              to={`/eleves/${eleve.id}`}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded hover:bg-gray-100 hover:text-gray-700"
                              title="Voir le profil"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>

                            {/* Bouton Modifier */}
                            {shouldShowModifierButton(eleve) && (
                              <Link
                                to={`/eleves/${eleve.id}/modifier`}
                                className="flex items-center justify-center w-8 h-8 text-blue-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-700"
                                title="Modifier"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Link>
                            )}

                            {/* Bouton Désactiver */}
                            {shouldShowDesactiverButton(eleve) && (
                              <button
                                onClick={() =>
                                  handleDesactiver(
                                    eleve.id,
                                    `${eleve.prenom} ${eleve.nom}`
                                  )
                                }
                                disabled={
                                  desactivationLoading === eleve.id ||
                                  !anneeActive
                                }
                                className={`flex items-center justify-center w-8 h-8 transition-colors rounded ${
                                  desactivationLoading === eleve.id ||
                                  !anneeActive
                                    ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                    : "text-red-600 hover:bg-orange-50 hover:text-orange-700"
                                }`}
                                title={
                                  !anneeActive
                                    ? "Année scolaire requise"
                                    : "Désactiver l'élève"
                                }
                              >
                                {desactivationLoading === eleve.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FaUserSlash className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {/* Indicateur pour élèves transférés/diplômés */}
                            {(eleve.statut === "transfere" ||
                              eleve.statut === "diplome") && (
                              <span
                                className="flex items-center justify-center w-8 h-8 text-gray-400 cursor-not-allowed"
                                title={`Élève ${getStatusText(
                                  eleve.statut
                                ).toLowerCase()} - Action non disponible`}
                              >
                                <FaFileArchive className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && totalItems > 0 && anneeActive && (
            <div className="flex flex-col items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Affichage de {from} à {to} sur {totalItems} élève(s) pour{" "}
                {anneeActive.annee}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Afficher
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    disabled={!anneeActive}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    par page
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousPage}
                    disabled={!hasPreviousPage || !anneeActive}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    aria-label="Page précédente"
                  >
                    ←
                  </button>

                  <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} sur {totalPages}
                  </span>

                  <button
                    onClick={goToNextPage}
                    disabled={!hasNextPage || !anneeActive}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    aria-label="Page suivante"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default EleveListe;
