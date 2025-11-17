import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  salaireService,
  Salaire,
  SalaireFilters,
} from "../../services/salaireService";
import { personnelService } from "../../services/personnelService";
import { anneeScolaireService } from "../../services/anneeScolaireService";
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
  FaMoneyBillWave,
  FaFilePdf,
  FaCheck,
  FaTimes,
  FaPrint,
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
  mois: string;
  annee_scolaire_id: string;
  personnel_id: string;
  statut_paiement: string;
  type_personnel: string;
}

const SalairesList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [moisDisponibles, setMoisDisponibles] = useState<any[]>([]);
  const [statutsPaiement, setStatutsPaiement] = useState<any[]>([]);
  const [typesPersonnel, setTypesPersonnel] = useState<any[]>([]);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register, watch, reset } = useForm<FilterFormData>({
    defaultValues: {
      mois: "",
      annee_scolaire_id: "",
      personnel_id: "",
      statut_paiement: "",
      type_personnel: "",
    },
  });

  const watchedMois = watch("mois");
  const watchedAnneeScolaire = watch("annee_scolaire_id");
  const watchedPersonnel = watch("personnel_id");
  const watchedStatut = watch("statut_paiement");
  const watchedTypePersonnel = watch("type_personnel");

  useEffect(() => {
    loadData();
    loadSelectData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    watchedMois,
    watchedAnneeScolaire,
    watchedPersonnel,
    watchedStatut,
    watchedTypePersonnel,
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: SalaireFilters = {};

      if (watchedMois) filters.mois = watchedMois;
      if (watchedAnneeScolaire)
        filters.annee_scolaire_id = parseInt(watchedAnneeScolaire);
      if (watchedPersonnel) filters.personnel_id = parseInt(watchedPersonnel);
      if (watchedStatut) filters.statut_paiement = watchedStatut;
      if (watchedTypePersonnel) filters.type_personnel = watchedTypePersonnel;

      const response = await salaireService.getAll(filters);
      setSalaires(response.data.salaires || []);
    } catch (error: any) {
      console.error("Erreur chargement salaires:", error);
      toast.error("Erreur lors du chargement des salaires");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [mois, statuts, types, personnel, annees] = await Promise.all([
        salaireService.getMoisDisponibles(),
        salaireService.getStatutsPaiement(),
        personnelService.getTypesPersonnel(),
        personnelService.getAll(),
        anneeScolaireService.getAll(),
      ]);

      setMoisDisponibles(mois);
      setStatutsPaiement(statuts);
      setTypesPersonnel(types);
      setPersonnelList(personnel.data.personnel || []);
      setAnneesScolaires(annees.data.annees_scolaires || []);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
    }
  };

  const handleDelete = async (salaireId: number) => {
    try {
      const confirmSuppression = await openModal({
        title: "Suppression",
        message:
          "Êtes-vous sûr de vouloir supprimer cette fiche de salaire ? Cette action est irréversible.",
        type: "danger",
        confirmText: "Oui, Supprimer",
        cancelText: "Annuler",
      });

      if (confirmSuppression) {
        await salaireService.delete(salaireId);
        toast.success("Fiche de salaire supprimée avec succès");
        loadData();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    }
  };

  const handlePaiement = async (salaireId: number) => {
    try {
      const confirmPaiement = await openModal({
        title: "Paiement du salaire",
        message: "Marquer ce salaire comme payé ?",
        type: "warning",
        confirmText: "Oui, Marquer comme payé",
        cancelText: "Annuler",
      });

      if (confirmPaiement) {
        const today = new Date().toISOString().split("T")[0];
        await salaireService.payerSalaire(salaireId, today);
        toast.success("Salaire marqué comme payé avec succès");
        loadData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors du paiement");
    }
  };

  const handleResetFilters = () => {
    reset({
      mois: "",
      annee_scolaire_id: "",
      personnel_id: "",
      statut_paiement: "",
      type_personnel: "",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatMois = (mois: string) => {
    const [year, month] = mois.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const getStatutBadge = (statut: string) => {
    if (statut === "paye") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
          <FaCheck className="w-3 h-3" />
          Payé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
        <FaTimes className="w-3 h-3" />
        Impayé
      </span>
    );
  };

  const getTotalSalaires = () => {
    return salaires.reduce(
      (total, salaire) => total + parseFloat(salaire.salaire_net),
      0
    );
  };

  const getTotalPayes = () => {
    return salaires
      .filter((s) => s.statut_paiement === "paye")
      .reduce((total, salaire) => total + parseFloat(salaire.salaire_net), 0);
  };

  return (
    <>
      <PageMeta
        title="Gestion des Salaires | Système de Gestion Scolaire"
        description="Gérer les salaires du personnel"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Salaires"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Personnel", path: "/personnel" },
          { label: "Salaires", path: "/personnel/salaires" },
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
            <h1 className="text-2xl font-bold text-gray-900">Salaires</h1>
            <p className="text-gray-600">Gérer les salaires du personnel</p>
          </div>

          <Link
            to="/personnel/salaires/nouveau"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            <FaPlus className="w-4 h-4" />
            Nouvelle fiche de salaire
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total salaires
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalSalaires().toString())}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Salaires payés
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalPayes().toString())}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaFilePdf className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Fiches de salaire
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {salaires.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Mois */}
            <div>
              <Label htmlFor="mois">Mois</Label>
              <select
                {...register("mois")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tous les mois</option>
                {moisDisponibles.map((mois) => (
                  <option key={mois.value} value={mois.value}>
                    {mois.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Année scolaire */}
            <div>
              <Label htmlFor="annee_scolaire_id">Année scolaire</Label>
              <select
                {...register("annee_scolaire_id")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Toutes les années</option>
                {anneesScolaires.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.annee}
                  </option>
                ))}
              </select>
            </div>

            {/* Personnel */}
            <div>
              <Label htmlFor="personnel_id">Personnel</Label>
              <select
                {...register("personnel_id")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tout le personnel</option>
                {personnelList.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.nom} {person.prenom}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut paiement */}
            <div>
              <Label htmlFor="statut_paiement">Statut paiement</Label>
              <select
                {...register("statut_paiement")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tous les statuts</option>
                {statutsPaiement.map((statut) => (
                  <option key={statut.value} value={statut.value}>
                    {statut.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type personnel */}
            <div>
              <Label htmlFor="type_personnel">Type personnel</Label>
              <select
                {...register("type_personnel")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Tous les types</option>
                {typesPersonnel.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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

        {/* Liste des salaires */}
        <ComponentCard
          title="Liste des Salaires"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {salaires.length} fiche(s) de salaire trouvée(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : salaires.length > 0 ? (
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
                        Période
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
                        Prime
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Heures supp.
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Déductions
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Net à payer
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
                    {salaires.map((salaire) => (
                      <TableRow key={salaire.id} className="hover:bg-gray-50">
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div>
                            <p className="font-medium text-gray-900">
                              {salaire.personnel_nom} {salaire.personnel_prenom}
                            </p>
                            <p className="text-sm text-gray-500">
                              {salaire.personnel_matricule}
                            </p>
                            <p className="text-xs text-gray-400">
                              {salaire.personnel_type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {formatMois(salaire.mois)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="font-medium">
                            {formatCurrency(salaire.salaire_base)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {formatCurrency(salaire.prime)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="text-sm">
                            <div>{salaire.heures_supp} h</div>
                            <div className="text-gray-400">
                              {formatCurrency(salaire.taux_heure_supp)}/h
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="text-red-600">
                            -{formatCurrency(salaire.deduction)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="font-bold text-green-600">
                            {formatCurrency(salaire.salaire_net)}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {getStatutBadge(salaire.statut_paiement)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                salaireService.genererBulletin(salaire.id)
                              }
                              className="p-2 text-blue-600 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700"
                              title="Générer bulletin"
                            >
                              <FaPrint className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/personnel/salaires/${salaire.id}/modifier`}
                              className="p-2 text-green-600 transition-colors bg-green-50 rounded-lg hover:bg-green-100 hover:text-green-700"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Link>
                            {salaire.statut_paiement === "impaye" && (
                              <button
                                onClick={() => handlePaiement(salaire.id)}
                                className="p-2 text-orange-600 transition-colors bg-orange-50 rounded-lg hover:bg-orange-100 hover:text-orange-700"
                                title="Marquer comme payé"
                              >
                                <FaCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(salaire.id)}
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
              <FaMoneyBillWave className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                Aucune fiche de salaire trouvée
              </p>
              <p className="text-gray-500">
                Aucune fiche de salaire ne correspond aux critères de recherche.
              </p>
              <Link
                to="/personnel/salaires/nouveau"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                <FaPlus className="w-4 h-4" />
                Créer la première fiche de salaire
              </Link>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default SalairesList;
