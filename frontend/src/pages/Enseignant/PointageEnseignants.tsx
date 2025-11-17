import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  enseignantPointageService,
  type EnseignantPointage,
} from "../../services/enseignantPointageService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import {
  FaChalkboardTeacher,
  FaPlus,
  FaEdit,
  FaTrash,
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaRunning,
  FaProcedures,
  FaUserInjured,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Label from "../../components/form/Label.tsx";
import DatePicker from "../../components/form/date-picker.tsx";

interface FilterFormData {
  date_debut: string;
  date_fin: string;
  enseignant_id: string;
  statut: string;
}

interface PointageFilters {
  date_debut?: string;
  date_fin?: string;
  personnel_id?: number;
  statut?: string;
  type_personnel?: string;
}

const PointageEnseignants: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pointages, setPointages] = useState<EnseignantPointage[]>([]);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register, watch, setValue, reset } = useForm<FilterFormData>({
    defaultValues: {
      date_debut: "",
      date_fin: "",
      enseignant_id: "",
      statut: "",
    },
  });

  const watchedDateDebut = watch("date_debut");
  const watchedDateFin = watch("date_fin");
  const watchedEnseignant = watch("enseignant_id");
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
  }, [watchedDateDebut, watchedDateFin, watchedEnseignant, watchedStatut]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: PointageFilters = {};

      if (watchedDateDebut) filters.date_debut = watchedDateDebut;
      if (watchedDateFin) filters.date_fin = watchedDateFin;
      if (watchedEnseignant) filters.personnel_id = parseInt(watchedEnseignant);
      if (watchedStatut) filters.statut = watchedStatut;

      const response = await enseignantPointageService.getAll(filters);
      setPointages(response.data.pointages || []);
    } catch (error: any) {
      console.error("Erreur chargement pointages enseignants:", error);
      toast.error("Erreur lors du chargement des pointages");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [enseignantsList, statutsList] = await Promise.all([
        enseignantPointageService.getEnseignants(),
        enseignantPointageService.getStatuts(),
      ]);

      setEnseignants(enseignantsList);
      setStatuts(statutsList);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleDelete = async (pointageId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message:
          "Êtes-vous sûr de vouloir supprimer ce pointage ? Cette action est irréversible.",
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await enseignantPointageService.delete(pointageId);
        toast.success("Pointage supprimé avec succès");
        loadData();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handlePointageRapide = async (
    enseignantId: number,
    type: "arrivee" | "depart"
  ) => {
    try {
      await enseignantPointageService.pointageRapide(enseignantId, type);
      toast.success(
        `Pointage ${type === "arrivee" ? "d'arrivée" : "de départ"} enregistré`
      );
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors du pointage rapide"
      );
    }
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    reset({
      date_debut: today,
      date_fin: today,
      enseignant_id: "",
      statut: "",
    });
  };

  const getStatutIcon = (statut: string) => {
    const icons = {
      present: FaUserCheck,
      absent: FaUserTimes,
      retard: FaRunning,
      congé: FaProcedures,
      maladie: FaUserInjured,
    };

    const IconComponent = icons[statut as keyof typeof icons] || FaClock;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatutColor = (statut: string) => {
    const colors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      retard: "bg-orange-100 text-orange-800",
      congé: "bg-blue-100 text-blue-800",
      maladie: "bg-purple-100 text-purple-800",
    };

    return colors[statut as keyof typeof colors] || colors.present;
  };

  const getStatutLabel = (statut: string) => {
    const labels = {
      present: "Présent",
      absent: "Absent",
      retard: "En retard",
      congé: "Congé",
      maladie: "Maladie",
    };

    return labels[statut as keyof typeof labels] || statut;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculerHeuresTravail = (pointage: EnseignantPointage) => {
    if (!pointage.heure_arrivee || !pointage.heure_depart) return "N/A";

    const heures = enseignantPointageService.calculerHeuresTravail(
      pointage.heure_arrivee,
      pointage.heure_depart
    );

    return enseignantPointageService.formatHeures(heures);
  };

  // Statistiques
  const getStats = () => {
    const total = pointages.length;
    const presents = pointages.filter((p) => p.statut === "present").length;
    const absents = pointages.filter((p) => p.statut === "absent").length;
    const retards = pointages.filter((p) => p.statut === "retard").length;

    return { total, presents, absents, retards };
  };

  const stats = getStats();

  return (
    <>
      <PageMeta
        title="Pointage des Enseignants | Système de Gestion Scolaire"
        description="Gérer les pointages des enseignants"
      />

      <PageBreadcrumb
        pageTitle="Pointage des Enseignants"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Pointage", path: "/enseignants/pointage" },
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
            <h1 className="text-2xl font-bold text-gray-900">
              Pointage des Enseignants
            </h1>
            <p className="text-gray-600">
              Gérer les présences et absences des enseignants
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/enseignants/pointage/rapide"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <FaClock className="w-4 h-4" />
              Pointage Rapide
            </Link>
            <Link
              to="/enseignants/pointage/nouveau"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              <FaPlus className="w-4 h-4" />
              Nouveau Pointage
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaChalkboardTeacher className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total pointages
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Présents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.presents}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <FaUserTimes className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Absents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.absents}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaRunning className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Retards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.retards}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Date début */}
            <div>
              <Label htmlFor="date_debut">Date de début</Label>
              <DatePicker
                id="date_debut"
                name="date_debut"
                setValue={setValue}
                defaultDate={watchedDateDebut}
                label=""
              />
            </div>

            {/* Date fin */}
            <div>
              <Label htmlFor="date_fin">Date de fin</Label>
              <DatePicker
                id="date_fin"
                name="date_fin"
                setValue={setValue}
                defaultDate={watchedDateFin}
                label=""
              />
            </div>

            {/* Enseignant */}
            <div>
              <Label htmlFor="enseignant_id">Enseignant</Label>
              <select
                {...register("enseignant_id")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tous les enseignants</option>
                {enseignants.map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>
                    {enseignant.nom} {enseignant.prenom}
                    {enseignant.specialite && ` - ${enseignant.specialite}`}
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
          </div>

          {/* Bouton Réinitialiser */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </ComponentCard>

        {/* Liste des pointages */}
        <ComponentCard
          title="Liste des Pointages"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {pointages.length} pointage(s) trouvé(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : pointages.length > 0 ? (
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
                        Date
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Heures
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
                        Heures travaillées
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Remarque
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
                    {pointages.map((pointage) => (
                      <TableRow key={pointage.id} className="hover:bg-gray-50">
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div>
                            <p className="font-medium text-gray-900">
                              {pointage.personnel_nom}{" "}
                              {pointage.personnel_prenom}
                            </p>
                            <p className="text-sm text-gray-500">
                              {pointage.personnel_matricule}
                            </p>
                            {pointage.specialite && (
                              <p className="text-xs text-gray-400">
                                {pointage.specialite}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {formatDate(pointage.date_pointage)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="text-sm">
                            <div>
                              Arrivée: {pointage.heure_arrivee || "N/A"}
                            </div>
                            <div>Départ: {pointage.heure_depart || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatutColor(
                              pointage.statut
                            )}`}
                          >
                            {getStatutIcon(pointage.statut)}
                            {getStatutLabel(pointage.statut)}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="font-medium">
                            {calculerHeuresTravail(pointage)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div
                            className="max-w-xs truncate"
                            title={pointage.remarque || ""}
                          >
                            {pointage.remarque || "Aucune remarque"}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex gap-2">
                            <Link
                              to={`/enseignants/pointage/${pointage.id}/modifier`}
                              className="p-2 text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(pointage.id)}
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
                Aucun pointage trouvé
              </p>
              <p className="text-gray-500">
                Aucun pointage ne correspond aux critères de recherche.
              </p>
              <Link
                to="/enseignants/pointage/nouveau"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                <FaPlus className="w-4 h-4" />
                Créer le premier pointage
              </Link>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default PointageEnseignants;
