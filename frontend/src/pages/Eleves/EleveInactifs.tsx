import { useEffect, useState } from "react";
import { eleveService } from "../../services/eleveService";
import { Eleve } from "../../interfaces/eleve.interface";
import { useApi } from "../../hooks/useApi";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import ComponentCard from "../../components/common/ComponentCard";
import { SearchIcon } from "../../icons/index";
import { Link } from "react-router-dom";
import { FaEye, FaHistory, FaArrowLeft } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Spinner from "../../components/common/Spinner.tsx";
import { useImageUrl } from "../../hooks/useImageUrl";
import { toast } from "sonner";

const EleveInactifs = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [restaurationLoading, setRestaurationLoading] = useState<number | null>(
    null
  );

  const { data, loading, error, execute } = useApi<any>();
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();
  const { getImageUrl } = useImageUrl();

  useEffect(() => {
    loadElevesInactifs();
  }, [page, search]);

  const loadElevesInactifs = () => {
    const filters = {
      page,
      perPage: 10,
      search,
    };

    execute(() => eleveService.getInactifs(filters));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRestaurer = async (id: number, eleveNom: string) => {
    setRestaurationLoading(id);
    try {
      const confirmRestoration = await openModal({
        title: "Restaurer l'élève",
        message: `Êtes-vous sûr de vouloir restaurer l'élève "${eleveNom}" ? 
        
        L'élève redeviendra actif et apparaîtra dans la liste principale.`,
        type: "info",
        confirmText: "Restaurer",
        cancelText: "Annuler",
      });

      if (confirmRestoration) {
        await eleveService.restaurer(id);
        toast.success("Élève restauré avec succès");
        loadElevesInactifs(); // Recharger la liste
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la restauration";
      toast.error(errorMessage);
    } finally {
      setRestaurationLoading(null);
    }
  };

  const getClasseNom = (eleve: Eleve) => {
    return eleve.classe_nom || "Non assigné";
  };

  const getCodeEleve = (eleve: Eleve) => {
    return eleve.code_eleve || eleve.matricule;
  };

  if (error) return <div>Erreur: {error}</div>;

  return (
    <>
      <PageMeta
        title="Élèves Inactifs | Système de Gestion Scolaire"
        description="Gestion des élèves désactivés - Restauration et historique"
      />

      <PageBreadcrumb
        pageTitle="Élèves Inactifs"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: "Élèves Inactifs", path: "/eleves/inactifs" },
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
        <ComponentCard title="Élèves Inactifs">
          {/* En-tête avec actions */}
          <div className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/eleves"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FaArrowLeft className="w-4 h-4" />
                Retour aux élèves actifs
              </Link>

              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Rechercher un élève inactif..."
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {data?.data?.pagination?.total || 0} élève(s) inactif(s)
            </div>
          </div>

          {/* Tableau des élèves inactifs */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100">
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
                      Dernière Classe
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
                      Date de désactivation
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        <Spinner size="sm" label="Chargement..." />
                      </TableCell>
                    </TableRow>
                  ) : data?.data?.eleves?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-gray-500"
                      >
                        {search
                          ? "Aucun élève inactif trouvé"
                          : "Aucun élève inactif"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data?.eleves?.map((eleve: Eleve) => (
                      <TableRow
                        key={eleve.id}
                        className="hover:bg-gray-50 bg-orange-50"
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
                              <span className="block font-medium text-gray-800 text-theme-sm">
                                <Link
                                  to={`/eleves/${eleve.id}`}
                                  className="hover:text-brand-300 hover:underline"
                                >
                                  {eleve.prenom} {eleve.nom}
                                </Link>
                              </span>
                              <span className="block text-gray-500 text-theme-xs">
                                {getCodeEleve(eleve)}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm">
                          <span className="font-medium text-gray-800">
                            {getClasseNom(eleve)}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="text-theme-sm">
                            <div className="font-medium text-gray-800">
                              {eleve.telephone_parent || "Non renseigné"}
                            </div>
                            <div className="text-gray-500 text-theme-xs">
                              {eleve.email_parent || "-"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500">
                          {eleve.updated_at
                            ? new Date(eleve.updated_at).toLocaleDateString(
                                "fr-FR"
                              )
                            : "Non disponible"}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-1">
                            {/* Bouton Voir le profil */}
                            <Link
                              to={`/eleves/${eleve.id}`}
                              className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors rounded hover:bg-gray-100 hover:text-gray-700"
                              title="Voir le profil"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>

                            {/* Bouton Restaurer */}
                            <button
                              onClick={() =>
                                handleRestaurer(
                                  eleve.id,
                                  `${eleve.prenom} ${eleve.nom}`
                                )
                              }
                              disabled={restaurationLoading === eleve.id}
                              className={`flex items-center justify-center w-8 h-8 transition-colors rounded ${
                                restaurationLoading === eleve.id
                                  ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                  : "text-green-600 hover:bg-green-50 hover:text-green-700"
                              }`}
                              title="Restaurer l'élève"
                            >
                              {restaurationLoading === eleve.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FaHistory className="w-4 h-4" />
                              )}
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

          {/* Pagination */}
          {data?.data?.pagination && data.data.pagination.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 p-4 border-t border-gray-200 sm:flex-row">
              <div className="text-sm text-gray-500">
                Affichage de {data.data.pagination.from} à{" "}
                {data.data.pagination.to} sur {data.data.pagination.total}{" "}
                élève(s) inactif(s)
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ←
                  </button>

                  <span className="px-3 py-1 text-sm text-gray-500">
                    Page {page} sur {data.data.pagination.last_page}
                  </span>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.data.pagination.last_page}
                    className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

export default EleveInactifs;
