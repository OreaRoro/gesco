import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  enseignantService,
  Enseignant,
  EnseignantFilters,
} from "../../services/enseignantService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaChalkboardTeacher,
  FaBook,
  FaClock,
  FaUserGraduate,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Input from "../../components/form/input/InputField.tsx";
import Label from "../../components/form/Label.tsx";

interface FilterFormData {
  search: string;
  specialite: string;
  statut: string;
}

const EnseignantList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [specialites, setSpecialites] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register, watch, reset } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      specialite: "",
      statut: "",
    },
  });

  const watchedSearch = watch("search");
  const watchedSpecialite = watch("specialite");
  const watchedStatut = watch("statut");

  useEffect(() => {
    loadData();
    loadSelectData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedSearch, watchedSpecialite, watchedStatut]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: EnseignantFilters = {};

      if (watchedSearch) {
        filters.search = watchedSearch;
      }
      if (watchedSpecialite) {
        filters.specialite = watchedSpecialite;
      }
      if (watchedStatut) {
        filters.statut = watchedStatut;
      }

      const response = await enseignantService.getAll(filters);
      setEnseignants(response.data.personnel || []);
    } catch (error: any) {
      console.error("Erreur chargement enseignants:", error);
      toast.error("Erreur lors du chargement des enseignants");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [specialitesList, statutsList] = await Promise.all([
        enseignantService.getSpecialites(),
        enseignantService.getStatuts(),
      ]);

      setSpecialites(specialitesList);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleDelete = async (enseignantId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message:
          "Êtes-vous sûr de vouloir supprimer cet enseignant ? Cette action est irréversible.",
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await enseignantService.delete(enseignantId);
        toast.success("Enseignant supprimé avec succès");
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
      specialite: "",
      statut: "",
    });
  };

  const getStatutBadge = (statut: string) => {
    const colors = {
      actif: "bg-green-100 text-green-800",
      inactif: "bg-gray-100 text-gray-800",
      congé: "bg-blue-100 text-blue-800",
      licencie: "bg-red-100 text-red-800",
    };

    const colorClass = colors[statut as keyof typeof colors] || colors.inactif;
    const labels = {
      actif: "Actif",
      inactif: "Inactif",
      congé: "En Congé",
      licencie: "Licencié",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
      >
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const getSpecialiteBadge = (specialite: string) => {
    const specialiteObj = specialites.find((s) => s.value === specialite);
    return (
      <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">
        {specialiteObj?.label || specialite}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <>
      <PageMeta
        title="Gestion des Enseignants | Système de Gestion Scolaire"
        description="Gérer les enseignants de l'établissement"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Enseignants"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
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
            <h1 className="text-2xl font-bold text-gray-900">Enseignants</h1>
            <p className="text-gray-600">
              Gérer les enseignants de l'établissement
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/enseignants/matieres"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaBook className="w-4 h-4" />
              Matières
            </Link>
            <Link
              to="/enseignants/emploi-du-temps"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaClock className="w-4 h-4" />
              Emploi du temps
            </Link>
            <Link
              to="/enseignants/nouveau"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              <FaPlus className="w-4 h-4" />
              Nouvel enseignant
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Recherche */}
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Input
                  type="text"
                  id="search"
                  name="search"
                  placeholder="Nom, prénom ou matricule..."
                  register={register}
                />
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Spécialité */}
            <div>
              <Label htmlFor="specialite">Spécialité</Label>
              <select
                {...register("specialite")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Toutes les spécialités</option>
                {specialites.map((specialite) => (
                  <option key={specialite.value} value={specialite.value}>
                    {specialite.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <Label htmlFor="statut">Statut</Label>
              <select
                {...register("statut")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tous les statuts</option>
                {statuts.map((statut) => (
                  <option key={statut.value} value={statut.value}>
                    {statut.label}
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

        {/* Liste des enseignants */}
        <ComponentCard
          title="Liste des Enseignants"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {enseignants.length} enseignant(s) trouvé(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : enseignants.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/5">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Enseignant
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Spécialité
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Contact
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Salaire
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Date embauche
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
                    {enseignants.map((enseignant) => (
                      <TableRow
                        key={enseignant.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                              <FaChalkboardTeacher className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {enseignant.nom} {enseignant.prenom}
                              </p>
                              <p className="text-sm text-gray-500">
                                {enseignant.matricule}
                              </p>
                              {enseignant.niveau_etude && (
                                <p className="text-xs text-gray-400">
                                  <FaUserGraduate className="inline w-3 h-3 mr-1" />
                                  {enseignant.niveau_etude}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {enseignant.specialite ? (
                            getSpecialiteBadge(enseignant.specialite)
                          ) : (
                            <span className="text-gray-400">Non spécifié</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="text-sm">
                            <p>{enseignant.telephone || "Non renseigné"}</p>
                            <p className="text-gray-400">
                              {enseignant.email || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="font-medium text-green-600">
                            {formatCurrency(enseignant.salaire_base)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {formatDate(enseignant.date_embauche)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {getStatutBadge(enseignant.statut)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex gap-2">
                            <Link
                              to={`/enseignants/${enseignant.id}`}
                              className="p-2 text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700"
                              title="Voir détails"
                            >
                              <FaBook className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/enseignants/${enseignant.id}/modifier`}
                              className="p-2 text-green-600 transition-colors bg-green-50 rounded-lg hover:bg-green-100 hover:text-green-700"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(enseignant.id)}
                              className="p-2 text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700"
                              title="Supprimer"
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
              <FaChalkboardTeacher className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucun enseignant trouvé
              </p>
              <p className="text-gray-500">
                {watchedSearch || watchedSpecialite || watchedStatut
                  ? "Aucun enseignant ne correspond aux critères de recherche."
                  : "Aucun enseignant enregistré pour le moment."}
              </p>
              {(watchedSearch || watchedSpecialite || watchedStatut) && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
              {!watchedSearch && !watchedSpecialite && !watchedStatut && (
                <Link
                  to="/enseignants/nouveau"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  <FaPlus className="w-4 h-4" />
                  Ajouter le premier enseignant
                </Link>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default EnseignantList;
