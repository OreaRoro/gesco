import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  personnelService,
  Personnel,
  PersonnelFilters,
} from "../../services/personnelService";
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
  FaUser,
  FaMoneyBillWave,
  FaChalkboardTeacher,
  FaUserShield,
  FaUserTie,
  FaBroom,
  FaUserCog,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface FilterFormData {
  search: string;
  type_personnel: string;
  statut: string;
}

const PersonnelList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [typesPersonnel, setTypesPersonnel] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register, watch, reset } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      type_personnel: "",
      statut: "",
    },
  });

  const watchedSearch = watch("search");
  const watchedTypePersonnel = watch("type_personnel");
  const watchedStatut = watch("statut");

  useEffect(() => {
    loadData();
    loadTypesAndStatuts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedSearch, watchedTypePersonnel, watchedStatut]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: PersonnelFilters = {};

      if (watchedSearch) {
        filters.search = watchedSearch;
      }
      if (watchedTypePersonnel) {
        filters.type_personnel = watchedTypePersonnel;
      }
      if (watchedStatut) {
        filters.statut = watchedStatut;
      }

      const response = await personnelService.getAll(filters);

      setPersonnel(response.data.personnel || []);
    } catch (error: any) {
      //   console.error("Erreur chargement personnel:", error);
      toast.error("Erreur lors du chargement du personnel");
    } finally {
      setLoading(false);
    }
  };

  const loadTypesAndStatuts = async () => {
    try {
      const [types, statutsList] = await Promise.all([
        personnelService.getTypesPersonnel(),
        personnelService.getStatuts(),
      ]);
      setTypesPersonnel(types);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement types et statuts:", error);
    }
  };

  const handleDelete = async (personnelId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message:
          "Êtes-vous sûr de vouloir supprimer ce membre du personnel ? Cette action est irréversible.",
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await personnelService.delete(personnelId);
        toast.success("Membre du personnel supprimé avec succès");
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
      type_personnel: "",
      statut: "",
    });
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      enseignant: FaChalkboardTeacher,
      surveillant: FaUserShield,
      administratif: FaUserTie,
      menage: FaBroom,
      direction: FaUserCog,
      autre: FaUser,
    };

    const IconComponent = icons[type as keyof typeof icons] || FaUser;
    return <IconComponent className="w-5 h-5" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      enseignant: "bg-blue-100 text-blue-600",
      surveillant: "bg-green-100 text-green-600",
      administratif: "bg-purple-100 text-purple-600",
      menage: "bg-orange-100 text-orange-600",
      direction: "bg-red-100 text-red-600",
      autre: "bg-gray-100 text-gray-600",
    };

    return colors[type as keyof typeof colors] || colors.autre;
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

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  return (
    <>
      <PageMeta
        title="Gestion du Personnel | Système de Gestion Scolaire"
        description="Gérer les membres du personnel de l'établissement"
      />

      <PageBreadcrumb
        pageTitle="Gestion du Personnel"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Personnel", path: "/personnel" },
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
            <h1 className="text-2xl font-bold text-gray-900">Personnel</h1>
            <p className="text-gray-600">Gérer les membres du personnel</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/personnel/pointage"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaUser className="w-4 h-4" />
              Pointage
            </Link>
            <Link
              to="/personnel/salaires"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <FaMoneyBillWave className="w-4 h-4" />
              Salaires
            </Link>
            <Link
              to="/personnel/nouveau"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              <FaPlus className="w-4 h-4" />
              Nouveau personnel
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register("search")}
                  placeholder="Nom, prénom ou matricule..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Type de personnel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de personnel
              </label>
              <select
                {...register("type_personnel")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Tous les types</option>
                {typesPersonnel.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                {...register("statut")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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

        {/* Liste du personnel */}
        <ComponentCard
          title="Liste du Personnel"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {personnel.length} membre(s) du personnel trouvé(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : personnel.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/5">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Personnel
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
                        Contact
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Salaire de base
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
                        Date embauche
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
                    {personnel.map((person) => (
                      <TableRow key={person.id} className="hover:bg-gray-50">
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-10 h-10 rounded-lg ${getTypeColor(
                                person.type_personnel
                              )}`}
                            >
                              {getTypeIcon(person.type_personnel)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {person.nom} {person.prenom}
                              </p>
                              <p className="text-sm text-gray-500">
                                {person.matricule}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                              person.type_personnel
                            )}`}
                          >
                            {typesPersonnel.find(
                              (t) => t.value === person.type_personnel
                            )?.label || person.type_personnel}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="text-sm">
                            <p>{person.telephone || "Non renseigné"}</p>
                            <p className="text-gray-400">
                              {person.email || ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="font-medium text-green-600">
                            {formatCurrency(person.salaire_base)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {getStatutBadge(person.statut)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {formatDate(person.date_embauche)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex gap-2">
                            <Link
                              to={`/personnel/${person.id}/modifier`}
                              className="p-2 text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(person.id)}
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
              <FaUser className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucun membre du personnel trouvé
              </p>
              <p className="text-gray-500">
                {watchedSearch || watchedTypePersonnel || watchedStatut
                  ? "Aucun membre du personnel ne correspond aux critères de recherche."
                  : "Aucun membre du personnel enregistré pour le moment."}
              </p>
              {(watchedSearch || watchedTypePersonnel || watchedStatut) && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
              {!watchedSearch && !watchedTypePersonnel && !watchedStatut && (
                <Link
                  to="/personnel/nouveau"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  <FaPlus className="w-4 h-4" />
                  Ajouter le premier membre
                </Link>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default PersonnelList;
