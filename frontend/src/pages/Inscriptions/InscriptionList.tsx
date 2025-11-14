import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { inscriptionService } from "../../services/inscriptionService";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import {
  FaSearch,
  FaSchool,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  Inscription,
  InscriptionFilter,
} from "../../interfaces/inscription.interface";

// Importez vos composants de table personnalisés
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { useImageUrl } from "../../hooks/useImageUrl";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";

const InscriptionList: React.FC = () => {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  // État pour la pagination
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    from: 0,
    to: 0,
  });

  const { getImageUrl } = useImageUrl();

  // Utilisation du contexte année scolaire
  const {
    anneeActive,
    anneesScolaires,
    loading: anneeLoading,
    changeAnneeActive,
  } = useAnneeScolaire();

  useEffect(() => {
    if (!anneeLoading) {
      loadAllInscriptions();
    }
  }, [
    paginationData.currentPage,
    itemsPerPage,
    anneeActive?.id, // Dépend de l'année active du contexte
    statutFilter,
    searchTerm,
    anneeLoading, // Recharge quand le chargement des années change
  ]);

  const loadAllInscriptions = async (): Promise<void> => {
    // Ne pas charger si pas d'année active
    if (!anneeActive?.id) {
      setInscriptions([]);
      setLoading(false);
      return;
    }

    setFilterLoading(true);
    try {
      const filters: InscriptionFilter = {
        page: paginationData.currentPage,
        perPage: itemsPerPage,
        search: searchTerm,
        statut: statutFilter,
        annee_scolaire_id: anneeActive.id,
      };

      const response = await inscriptionService.getAll(filters);

      // Mettez à jour les inscriptions et la pagination
      setInscriptions(response.data?.inscriptions || []);

      if (response.data?.pagination) {
        setPaginationData({
          currentPage: response.data.pagination.current_page,
          totalItems: response.data.pagination.total,
          totalPages: response.data.pagination.total_pages,
          from: response.data.pagination.from,
          to: response.data.pagination.to,
        });
      }
    } catch (error: any) {
      console.error("Erreur chargement des inscriptions:", error);
      toast.error("Erreur lors du chargement des inscriptions");
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // Gestionnaires de pagination
  const goToNextPage = () => {
    if (paginationData.currentPage < paginationData.totalPages) {
      setPaginationData((prev) => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  };

  const goToPreviousPage = () => {
    if (paginationData.currentPage > 1) {
      setPaginationData((prev) => ({
        ...prev,
        currentPage: prev.currentPage - 1,
      }));
    }
  };

  const handleAnneeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ): Promise<void> => {
    const anneeId = e.target.value;

    if (anneeId === "") {
      toast.info("Veuillez sélectionner une année scolaire spécifique");
      return;
    }

    try {
      await changeAnneeActive(parseInt(anneeId));
      setPaginationData((prev) => ({ ...prev, currentPage: 1 }));
      toast.success("Année scolaire changée avec succès");
    } catch (error: any) {
      console.error("Erreur changement année scolaire:", error);
      toast.error("Erreur lors du changement d'année scolaire");
    }
  };

  const handleStatutChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatutFilter(e.target.value);
    setPaginationData((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setPaginationData((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleItemsPerPageChange = (value: string): void => {
    const newItemsPerPage = Number(value);
    setItemsPerPage(newItemsPerPage);
    setPaginationData((prev) => ({ ...prev, currentPage: 1 }));
  };

  const getStatutBadge = (statut: string) => {
    const config: { [key: string]: { color: string; label: string } } = {
      inscrit: { color: "blue", label: "Inscrit" },
      reinscrit: { color: "green", label: "Réinscrit" },
      transfere: { color: "orange", label: "Transféré" },
      abandon: { color: "red", label: "Abandon" },
    };

    const { label } = config[statut] || config.inscrit;
    return <Badge size="sm">{label}</Badge>;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Non spécifié";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount: number | undefined): string => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
    }).format(amount || 0);
  };

  const handleExport = (): void => {
    toast.info("Fonction d'export à implémenter");
  };

  const handleDeleteInscription = async (
    inscriptionId: number
  ): Promise<void> => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message: `Êtes-vous sûr de vouloir supprimer cette inscription ?`,
        type: "danger",
        confirmText: "Désactiver",
        cancelText: "Annuler",
      });
      if (confirmSuppression) {
        await inscriptionService.delete(inscriptionId);
        toast.success("Inscription supprimée avec succès");
        loadAllInscriptions();
      }
    } catch (error: any) {
      console.error("Erreur suppression inscription:", error);
      console.log(error.response?.data?.messages);

      toast.error(
        error.response?.data?.messages?.error ||
          "Erreur lors de la suppressionssss"
      );
    }
  };

  // Calcul des statistiques basé sur les données actuelles
  const calculateStatistics = () => {
    const totalInscriptions = inscriptions.length;
    const nouvellesInscriptions = inscriptions.filter(
      (i) => i.statut === "inscrit"
    ).length;
    const reinscriptions = inscriptions.filter(
      (i) => i.statut === "reinscrit"
    ).length;
    const totalFrais = inscriptions.reduce(
      (sum, i) => sum + (i.montant_inscription || 0),
      0
    );

    return {
      totalInscriptions,
      nouvellesInscriptions,
      reinscriptions,
      totalFrais,
    };
  };

  const stats = calculateStatistics();

  if (anneeLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Gestion des Inscriptions | Système de Gestion Scolaire"
        description="Page de gestion des Inscriptions - Liste, recherche et gestion des étudiants"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Inscriptions"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Inscriptions", path: "/eleve-inscriptions" },
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
        {/* Bannière année scolaire active */}
        {anneeActive && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Année Scolaire :
                </h3>
                <p className="text-blue-700">
                  {anneeActive.annee} - {anneeActive.statut}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {paginationData.totalItems} inscription(s) pour cette année
                </p>
              </div>
            </div>
          </div>
        )}

        {/* En-tête avec filtres */}
        <ComponentCard title="Liste des Inscriptions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année Scolaire
              </label>
              <select
                value={anneeActive?.id.toString() || ""}
                onChange={handleAnneeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={anneeLoading}
              >
                <option value="">Sélectionner une année</option>
                {anneesScolaires.map((annee) => (
                  <option key={annee.id} value={annee.id.toString()}>
                    {annee.annee} {annee.statut === "courante" && "(Courante)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statutFilter}
                onChange={handleStatutChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!anneeActive}
              >
                <option value="">Tous les statuts</option>
                <option value="inscrit">Inscrit</option>
                <option value="reinscrit">Réinscrit</option>
                <option value="transfere">Transféré</option>
                <option value="abandon">Abandon</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nom, prénom, matricule ou classe..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={!anneeActive}
                />
              </div>
            </div>

            <div className="lg:mt-7 mt-0">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!anneeActive || inscriptions.length === 0}
              >
                <FaDownload className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {/* Message si pas d'année active */}
          {!anneeActive && !anneeLoading && (
            <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaSchool className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  Veuillez sélectionner une année scolaire pour afficher les
                  inscriptions.
                </p>
              </div>
            </div>
          )}

          {/* Liste des inscriptions avec Table personnalisée */}
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
                      Année Scolaire
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
                      Montant
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
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filterLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <Spinner size="sm" label="Chargement..." />
                      </TableCell>
                    </TableRow>
                  ) : inscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center py-8">
                          <FaSchool className="w-12 h-12 text-gray-400 mb-4" />
                          <span className="text-sm font-medium text-gray-900 mb-1">
                            Aucune inscription
                          </span>
                          <span className="text-sm text-gray-500">
                            Aucune inscription trouvée avec les critères
                            sélectionnés.
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    inscriptions.map((inscription: Inscription) => (
                      <TableRow
                        key={inscription.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/2"
                      >
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full">
                              <img
                                width={40}
                                height={40}
                                src={getImageUrl(inscription.eleve)}
                                alt={`${inscription.eleve.prenom} ${inscription.eleve.nom}`}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                <Link
                                  to={`/eleves/${inscription.eleve_id}`}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {inscription.eleve.prenom}{" "}
                                  {inscription.eleve.nom}
                                </Link>
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {inscription.eleve.matricule}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {inscription.classe.niveau.nom}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {inscription.classe.nom}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2 text-theme-sm">
                            <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white/90">
                                {inscription.annee_scolaire.annee}
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                {formatDate(
                                  inscription.annee_scolaire.date_debut
                                )}{" "}
                                -{" "}
                                {formatDate(
                                  inscription.annee_scolaire.date_fin
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="text-theme-sm">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {formatDate(inscription.date_inscription)}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              ID: {inscription.id}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2 text-theme-sm">
                            <FaMoneyBillWave className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-white/90">
                                {formatCurrency(
                                  inscription.montant_inscription
                                )}
                              </div>
                              <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                                Payé: {formatCurrency(inscription.montant_paye)}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          {getStatutBadge(inscription.statut)}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/eleve-inscriptions/${inscription.id}`}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded hover:bg-gray-100 hover:text-gray-700"
                              title="Voir détails"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/eleves/${inscription.id}/modifier-inscription`}
                              className="flex items-center justify-center w-8 h-8 text-blue-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-700"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() =>
                                handleDeleteInscription(inscription.id)
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

            {/* Pagination */}
            {paginationData.totalItems > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Affichage de {paginationData.from} à {paginationData.to} sur{" "}
                  {paginationData.totalItems} inscription(s)
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Afficher
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      par page
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={goToPreviousPage}
                      disabled={paginationData.currentPage === 1}
                      className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Page précédente"
                    >
                      ←
                    </button>

                    <span className="px-3 py-1 text-sm text-gray-500">
                      Page {paginationData.currentPage} sur{" "}
                      {paginationData.totalPages}
                    </span>

                    <button
                      onClick={goToNextPage}
                      disabled={
                        paginationData.currentPage === paginationData.totalPages
                      }
                      className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      aria-label="Page suivante"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Statistiques */}
        {inscriptions.length > 0 && (
          <ComponentCard title="Statistiques">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalInscriptions}
                </p>
                <p className="text-sm text-blue-800">Total inscriptions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats.nouvellesInscriptions}
                </p>
                <p className="text-sm text-green-800">Nouvelles inscriptions</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.reinscriptions}
                </p>
                <p className="text-sm text-orange-800">Réinscriptions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.totalFrais)}
                </p>
                <p className="text-sm text-purple-800">Total frais</p>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
};

export default InscriptionList;
