import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  absenceService,
  PointageEleve,
  StatistiquesAbsences,
} from "../../services/absenceService";
import { eleveService } from "../../services/eleveService";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import Spinner from "../../components/common/Spinner.tsx";
import DatePicker from "../../components/form/date-picker";
import { ArrowLeftIcon } from "../../icons";
import {
  FaPlus,
  FaTrash,
  FaPrint,
  FaHistory,
  FaCalendar,
  FaCheck,
  FaTimes,
  FaClock,
  FaFileMedical,
  FaBan,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";

interface FilterFormData {
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  pointage?: PointageEleve;
  isToday: boolean;
}

const EleveAbsence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { anneeActive, loading: loadingAnnee } = useAnneeScolaire();
  const [loading, setLoading] = useState(true);
  const [eleve, setEleve] = useState<any>(null);
  const [pointages, setPointages] = useState<PointageEleve[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesAbsences | null>(
    null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const {
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FilterFormData>({
    defaultValues: {
      date_debut: "",
      date_fin: "",
      statut: "",
    },
  });

  // Watch les valeurs des filtres pour le rechargement automatique
  const watchedDateDebut = watch("date_debut");
  const watchedDateFin = watch("date_fin");
  const watchedStatut = watch("statut");

  const loadData = useCallback(
    async (eleveId: number) => {
      setLoading(true);
      try {
        // Charger les données de l'élève
        const eleveResponse = await eleveService.getById(eleveId);
        setEleve(eleveResponse.data.eleve);

        // Préparer les filtres avec l'année scolaire
        const filters = {
          date_debut: watchedDateDebut,
          date_fin: watchedDateFin,
          statut: watchedStatut,
          annee_scolaire_id: anneeActive?.id,
        };

        // Charger les données en parallèle
        const [pointagesResponse, statsResponse] = await Promise.all([
          absenceService.getByEleve(eleveId, filters),
          absenceService.getStatistiques(eleveId, anneeActive?.id),
        ]);

        setPointages(pointagesResponse.data.pointages);
        setStatistiques(statsResponse.data.statistiques);
      } catch (error: any) {
        console.error("Erreur chargement absences:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    },
    [watchedDateDebut, watchedDateFin, watchedStatut, anneeActive?.id]
  );

  // Générer le calendrier
  // Générer le calendrier
  const generateCalendar = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);

    // Premier jour à afficher (peut être du mois précédent)
    // On commence par le lundi de la semaine du premier jour
    const startDay = new Date(firstDay);
    const dayOfWeek = startDay.getDay(); // 0=dimanche, 1=lundi, etc.

    // Ajuster pour commencer le lundi (si dimanche, reculer de 6 jours, sinon reculer de (dayOfWeek - 1) jours)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDay.setDate(startDay.getDate() - daysToSubtract);

    // Dernier jour à afficher (peut être du mois suivant)
    const endDay = new Date(lastDay);
    const endDayOfWeek = endDay.getDay(); // 0=dimanche, 1=lundi, etc.

    // Ajuster pour terminer le dimanche (si pas dimanche, avancer jusqu'au dimanche)
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDay.setDate(endDay.getDate() + daysToAdd);

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDay);
    const today = new Date();

    // Créer un map des pointages par date pour un accès rapide
    const pointagesMap = new Map();
    pointages.forEach((pointage) => {
      const pointageDate = new Date(pointage.date_pointage);
      const dateKey = `${pointageDate.getFullYear()}-${
        pointageDate.getMonth() + 1
      }-${pointageDate.getDate()}`;
      pointagesMap.set(dateKey, pointage);
    });

    while (currentDate <= endDay) {
      const date = new Date(currentDate);
      const dateKey = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;
      const pointage = pointagesMap.get(dateKey);

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        pointage,
        isToday: date.toDateString() === today.toDateString(),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalendarDays(days);
  }, [currentMonth, pointages]);

  // Recharger quand les filtres, l'année scolaire ou le mois changent
  useEffect(() => {
    if (id && !loadingAnnee) {
      loadData(parseInt(id));
    }
  }, [id, loadData, loadingAnnee]);

  useEffect(() => {
    generateCalendar();
  }, [generateCalendar]);

  const getStatutBadge = (statut: string) => {
    const config = {
      present: {
        class: "bg-green-100 text-green-800",
        text: "Présent",
        icon: FaCheck,
      },
      absent: {
        class: "bg-red-100 text-red-800",
        text: "Absent",
        icon: FaTimes,
      },
      retard: {
        class: "bg-orange-100 text-orange-800",
        text: "Retard",
        icon: FaClock,
      },
      justifie: {
        class: "bg-blue-100 text-blue-800",
        text: "Justifié",
        icon: FaFileMedical,
      },
      exclu: {
        class: "bg-purple-100 text-purple-800",
        text: "Exclu",
        icon: FaBan,
      },
    }[statut] || {
      class: "bg-gray-100 text-gray-800",
      text: "Inconnu",
      icon: FaHistory,
    };

    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.class}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getDayClassNames = (day: CalendarDay) => {
    const baseClasses =
      "h-24 p-2 border border-gray-200 cursor-pointer transition-colors hover:bg-gray-50";

    if (!day.isCurrentMonth) {
      return `${baseClasses} bg-gray-50 text-gray-400`;
    }

    if (day.isToday) {
      return `${baseClasses} bg-blue-50 border-blue-200`;
    }

    if (day.pointage) {
      const statusClasses =
        {
          present: "bg-green-50 border-green-200",
          absent: "bg-red-50 border-red-200",
          retard: "bg-orange-50 border-orange-200",
          justifie: "bg-blue-50 border-blue-200",
          exclu: "bg-purple-50 border-purple-200",
        }[day.pointage.statut] || "bg-gray-50";

      return `${baseClasses} ${statusClasses}`;
    }

    return `${baseClasses} bg-white`;
  };

  const getStatusIcon = (statut: string) => {
    const icons = {
      present: <FaCheck className="w-4 h-4 text-green-600" />,
      absent: <FaTimes className="w-4 h-4 text-red-600" />,
      retard: <FaClock className="w-4 h-4 text-orange-600" />,
      justifie: <FaFileMedical className="w-4 h-4 text-blue-600" />,
      exclu: <FaBan className="w-4 h-4 text-purple-600" />,
    };
    return icons[statut as keyof typeof icons] || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleResetFilters = () => {
    reset({
      date_debut: "",
      date_fin: "",
      statut: "",
    });
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    if (day.pointage) {
      // TODO: Ouvrir modal de détails ou d'édition
      toast.info(
        `Pointage du ${day.date.toLocaleDateString("fr-FR")}: ${
          day.pointage.statut
        }`
      );
    } else {
      // TODO: Ouvrir modal pour créer un nouveau pointage
      toast.info(
        `Créer un pointage pour le ${day.date.toLocaleDateString("fr-FR")}`
      );
    }
  };

  const handleDeletePointage = async (pointageId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message: `Êtes-vous sûr de vouloir supprimer ce pointage ?`,
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await absenceService.delete(pointageId);
        toast.success("Pointage supprimé avec succès");
        loadData(parseInt(id!));
      }
    } catch (error: any) {
      toast.error("Erreur lors de la suppression du pointage");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Absences - ${eleve?.prenom} ${eleve?.nom} | Système de Gestion Scolaire`}
        description={`Gestion des absences pour ${eleve?.prenom} ${eleve?.nom}`}
      />

      <PageBreadcrumb
        pageTitle={`Absences - ${eleve?.prenom} ${eleve?.nom}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Élèves", path: "/eleves" },
          { label: `${eleve?.prenom} ${eleve?.nom}`, path: `/eleves/${id}` },
          { label: "Absences", path: `/eleves/${id}/absences` },
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
          <Link
            to={`/eleves/${id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Retour au profil
          </Link>

          <div className="flex gap-3">
            <Link
              to={`/eleves/${id}/absences/nouveau`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              <FaPlus className="w-4 h-4" />
              Nouveau pointage
            </Link>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <FaPrint className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {statistiques && (
          <ComponentCard title="Statistiques des Absences">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {statistiques.total_jours}
                </p>
                <p className="text-sm text-blue-600">Jours total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {statistiques.presents}
                </p>
                <p className="text-sm text-green-600">Présents</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {statistiques.absences}
                </p>
                <p className="text-sm text-red-600">Absences</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {statistiques.retards}
                </p>
                <p className="text-sm text-orange-600">Retards</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {statistiques.justifies}
                </p>
                <p className="text-sm text-blue-600">Justifiés</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {statistiques.exclus}
                </p>
                <p className="text-sm text-purple-600">Exclus</p>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Calendrier des pointages */}
        <ComponentCard
          title={`Calendrier des pointages - ${currentMonth.toLocaleDateString(
            "fr-FR",
            { month: "long", year: "numeric" }
          )}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 dark:text-gray-25 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-25 bg-white border dark:bg-gray-800 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Aujourd'hui
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 dark:text-gray-25 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div
                key={day}
                className="p-2 text-sm font-medium text-center text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 ">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={getDayClassNames(day)}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-1 ">
                  <span
                    className={`text-sm font-medium  ${
                      day.isToday
                        ? "text-blue-600"
                        : !day.isCurrentMonth
                        ? "text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.pointage && getStatusIcon(day.pointage.statut)}
                </div>

                {day.pointage && (
                  <div className="text-xs space-y-1">
                    {day.pointage.heure_arrivee && (
                      <div className="text-gray-600">
                        Arr: {day.pointage.heure_arrivee}
                      </div>
                    )}
                    {day.pointage.heure_depart && (
                      <div className="text-gray-600">
                        Dep: {day.pointage.heure_depart}
                      </div>
                    )}
                    {day.pointage.remarque && (
                      <div
                        className="truncate text-gray-500"
                        title={day.pointage.remarque}
                      >
                        {day.pointage.remarque}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">Légende:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1">
                <FaCheck className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Présent</span>
              </div>
              <div className="flex items-center gap-1">
                <FaTimes className="w-4 h-4 text-red-600" />
                <span className="text-xs text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <FaClock className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-gray-600">Retard</span>
              </div>
              <div className="flex items-center gap-1">
                <FaFileMedical className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">Justifié</span>
              </div>
              <div className="flex items-center gap-1">
                <FaBan className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">Exclu</span>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <DatePicker
              id="date_debut"
              name="date_debut"
              label="Date de début"
              placeholder="Sélectionnez la date de début"
              register={register}
              setValue={setValue}
              error={errors.date_debut}
            />

            <DatePicker
              id="date_fin"
              name="date_fin"
              label="Date de fin"
              placeholder="Sélectionnez la date de fin"
              register={register}
              setValue={setValue}
              validation={{
                validate: {
                  afterStart: (value) =>
                    !value ||
                    !watchedDateDebut ||
                    new Date(value) >= new Date(watchedDateDebut) ||
                    "La date de fin doit être après la date de début",
                },
              }}
              error={errors.date_fin}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                {...register("statut")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Tous les statuts</option>
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
                <option value="retard">Retard</option>
                <option value="justifie">Justifié</option>
                <option value="exclu">Exclu</option>
              </select>
            </div>

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

        {/* Liste détaillée (optionnelle - vous pouvez la cacher si vous préférez seulement le calendrier) */}
        <ComponentCard title="Historique détaillé">
          {pointages.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
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
                      Statut
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
                <TableBody>
                  {pointages.map((pointage) => (
                    <TableRow key={pointage.id}>
                      <TableCell className="px-5  text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendar className="w-4 h-4 text-gray-600" />
                          <span>{formatDate(pointage.date_pointage)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatutBadge(pointage.statut)}</TableCell>
                      <TableCell className="px-5 text-gray-500">
                        {pointage.heure_arrivee && (
                          <div className="space-y-1">
                            <div>Arrivée: {pointage.heure_arrivee}</div>
                            {pointage.heure_depart && (
                              <div>Départ: {pointage.heure_depart}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-5 text-gray-500">
                        {pointage.remarque || pointage.justification || "-"}
                      </TableCell>
                      <TableCell className="px-5 text-center text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeletePointage(pointage.id)}
                            className="p-2 text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100"
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
          ) : (
            <div className="text-center py-12">
              <FaHistory className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucun pointage trouvé
              </p>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default EleveAbsence;
