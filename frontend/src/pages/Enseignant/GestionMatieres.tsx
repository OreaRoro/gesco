import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  enseignantService,
  MatiereEnseignee,
} from "../../services/enseignantService";
import { matiereService } from "../../services/matiereService";
import { classeService } from "../../services/classeService";
import { anneeScolaireService } from "../../services/anneeScolaireService";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Spinner from "../../components/common/Spinner";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { FaPlus, FaTrash, FaBook, FaChalkboardTeacher } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Input from "../../components/form/input/InputField.tsx";
import Label from "../../components/form/Label.tsx";

interface AssignationFormData {
  enseignant_id: number;
  matiere_id: number;
  classe_id: number;
  annee_scolaire_id: number;
  heures_semaine: number;
}

interface FilterFormData {
  enseignant_id: string;
  annee_scolaire_id: string;
}

const GestionMatieres: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [assignations, setAssignations] = useState<MatiereEnseignee[]>([]);
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [anneesScolaires, setAnneesScolaires] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { isOpen, modalConfig, openModal, closeModal, confirm } =
    useConfirmationModal();

  const { register: registerFilter, watch: watchFilter } =
    useForm<FilterFormData>({
      defaultValues: {
        enseignant_id: "",
        annee_scolaire_id: "",
      },
    });

  const {
    register: registerForm,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignationFormData>({
    defaultValues: {
      enseignant_id: 0,
      matiere_id: 0,
      classe_id: 0,
      annee_scolaire_id: 0,
      heures_semaine: 0,
    },
  });

  const watchedEnseignant = watchFilter("enseignant_id");
  const watchedAnneeScolaire = watchFilter("annee_scolaire_id");

  useEffect(() => {
    loadSelectData();
  }, []);

  useEffect(() => {
    if (enseignants.length > 0 && anneesScolaires.length > 0) {
      loadAssignations();
    }
  }, [watchedEnseignant, watchedAnneeScolaire, enseignants, anneesScolaires]);

  const loadAssignations = async () => {
    setLoading(true);
    try {
      // Pour l'instant, on charge toutes les assignations
      // Dans une version future, on pourrait filtrer par enseignant et année
      const allAssignations: MatiereEnseignee[] = [];

      // Charger les assignations pour chaque enseignant
      for (const enseignant of enseignants) {
        try {
          const response = await enseignantService.getMatieresEnseignees(
            enseignant.id
          );
          if (response.data.matieres) {
            allAssignations.push(...response.data.matieres);
          }
        } catch (error) {
          console.error(
            `Erreur chargement matières pour enseignant ${enseignant.id}:`,
            error
          );
        }
      }

      // Filtrer les assignations
      let filteredAssignations = allAssignations;

      if (watchedEnseignant) {
        filteredAssignations = filteredAssignations.filter(
          (a) => a.enseignant_id === parseInt(watchedEnseignant)
        );
      }

      if (watchedAnneeScolaire) {
        filteredAssignations = filteredAssignations.filter(
          (a) => a.annee_scolaire_id === parseInt(watchedAnneeScolaire)
        );
      }

      setAssignations(filteredAssignations);
    } catch (error: any) {
      console.error("Erreur chargement assignations:", error);
      toast.error("Erreur lors du chargement des assignations de matières");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectData = async () => {
    try {
      const [enseignantsList, matieresList, classesList, anneesList] =
        await Promise.all([
          enseignantService.getAll(),
          matiereService.getAll(),
          classeService.getAll(),
          anneeScolaireService.getAll(),
        ]);

      setEnseignants(enseignantsList.data.personnel || []);
      setMatieres(matieresList.data.matieres || []);
      setClasses(classesList.data.classes || []);
      setAnneesScolaires(anneesList.data.annees_scolaires || []);
    } catch (error: any) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const onSubmitAssignation = async (data: AssignationFormData) => {
    try {
      await enseignantService.assignerMatiere(
        data.enseignant_id,
        data.matiere_id,
        data.classe_id,
        data.annee_scolaire_id,
        data.heures_semaine
      );

      toast.success("Matière assignée avec succès");
      setShowForm(false);
      reset();
      loadAssignations();
    } catch (error: any) {
      console.error("Erreur assignation matière:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'assignation de la matière"
      );
    }
  };

  const handleRetirerMatiere = async (assignmentId: number) => {
    try {
      const confirmRetrait = await openModal({
        title: "Retirer la matière",
        message:
          "Êtes-vous sûr de vouloir retirer cette matière à l'enseignant ?",
        type: "warning",
        confirmText: "Oui, Retirer",
        cancelText: "Annuler",
      });

      if (confirmRetrait) {
        await enseignantService.retirerMatiere(assignmentId);
        toast.success("Matière retirée avec succès");
        loadAssignations();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors du retrait de la matière"
      );
    }
  };

  const getEnseignantNom = (enseignantId: number) => {
    const enseignant = enseignants.find((e) => e.id === enseignantId);
    return enseignant ? `${enseignant.nom} ${enseignant.prenom}` : "Inconnu";
  };

  const getMatiereNom = (matiereId: number) => {
    const matiere = matieres.find((m) => m.id === matiereId);
    return matiere ? matiere.nom : "Inconnue";
  };

  const getClasseNom = (classeId: number) => {
    const classe = classes.find((c) => c.id === classeId);
    return classe ? classe.nom : "Inconnue";
  };

  const getAnneeScolaire = (anneeId: number) => {
    const annee = anneesScolaires.find((a) => a.id === anneeId);
    return annee ? annee.annee : "Inconnue";
  };

  return (
    <>
      <PageMeta
        title="Gestion des Matières | Système de Gestion Scolaire"
        description="Gérer l'assignation des matières aux enseignants"
      />

      <PageBreadcrumb
        pageTitle="Gestion des Matières"
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Enseignants", path: "/enseignants" },
          { label: "Matières", path: "/enseignants/matieres" },
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
              Gestion des Matières
            </h1>
            <p className="text-gray-600">
              Assigner les matières aux enseignants
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            <FaPlus className="w-4 h-4" />
            {showForm ? "Annuler" : "Nouvelle Assignation"}
          </button>
        </div>

        {/* Formulaire d'assignation */}
        {showForm && (
          <ComponentCard title="Assigner une Matière">
            <form
              onSubmit={handleSubmit(onSubmitAssignation)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Enseignant */}
                <div>
                  <Label htmlFor="enseignant_id">Enseignant *</Label>
                  <select
                    {...registerForm("enseignant_id", {
                      required: "L'enseignant est obligatoire",
                      valueAsNumber: true,
                    })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
                  >
                    <option value={0}>Sélectionner un enseignant</option>
                    {enseignants.map((enseignant) => (
                      <option key={enseignant.id} value={enseignant.id}>
                        {enseignant.nom} {enseignant.prenom}
                      </option>
                    ))}
                  </select>
                  {errors.enseignant_id && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {errors.enseignant_id.message}
                    </p>
                  )}
                </div>

                {/* Matière */}
                <div>
                  <Label htmlFor="matiere_id">Matière *</Label>
                  <select
                    {...registerForm("matiere_id", {
                      required: "La matière est obligatoire",
                      valueAsNumber: true,
                    })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
                  >
                    <option value={0}>Sélectionner une matière</option>
                    {matieres.map((matiere) => (
                      <option key={matiere.id} value={matiere.id}>
                        {matiere.nom} - {matiere.code}
                      </option>
                    ))}
                  </select>
                  {errors.matiere_id && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {errors.matiere_id.message}
                    </p>
                  )}
                </div>

                {/* Classe */}
                <div>
                  <Label htmlFor="classe_id">Classe *</Label>
                  <select
                    {...registerForm("classe_id", {
                      required: "La classe est obligatoire",
                      valueAsNumber: true,
                    })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
                  >
                    <option value={0}>Sélectionner une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nom}
                      </option>
                    ))}
                  </select>
                  {errors.classe_id && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {errors.classe_id.message}
                    </p>
                  )}
                </div>

                {/* Année scolaire */}
                <div>
                  <Label htmlFor="annee_scolaire_id">Année scolaire *</Label>
                  <select
                    {...registerForm("annee_scolaire_id", {
                      required: "L'année scolaire est obligatoire",
                      valueAsNumber: true,
                    })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
                  >
                    <option value={0}>Sélectionner une année</option>
                    {anneesScolaires.map((annee) => (
                      <option key={annee.id} value={annee.id}>
                        {annee.annee}
                      </option>
                    ))}
                  </select>
                  {errors.annee_scolaire_id && (
                    <p className="mt-1.5 text-xs text-error-500">
                      {errors.annee_scolaire_id.message}
                    </p>
                  )}
                </div>

                {/* Heures par semaine */}
                <div>
                  <Label htmlFor="heures_semaine">Heures/semaine *</Label>
                  <Input
                    type="number"
                    id="heures_semaine"
                    name="heures_semaine"
                    placeholder="0"
                    min="1"
                    max="40"
                    register={registerForm}
                    validation={{
                      required: "Le nombre d'heures est obligatoire",
                      min: { value: 1, message: "Minimum 1 heure" },
                      max: { value: 40, message: "Maximum 40 heures" },
                      valueAsNumber: true,
                    }}
                    error={errors.heures_semaine}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  Assigner la matière
                </button>
              </div>
            </form>
          </ComponentCard>
        )}

        {/* Filtres */}
        <ComponentCard title="Filtres">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Enseignant */}
            <div>
              <Label htmlFor="enseignant_id">Enseignant</Label>
              <select
                {...registerFilter("enseignant_id")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
              >
                <option value="">Tous les enseignants</option>
                {enseignants.map((enseignant) => (
                  <option key={enseignant.id} value={enseignant.id}>
                    {enseignant.nom} {enseignant.prenom}
                  </option>
                ))}
              </select>
            </div>

            {/* Année scolaire */}
            <div>
              <Label htmlFor="annee_scolaire_id">Année scolaire</Label>
              <select
                {...registerFilter("annee_scolaire_id")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20"
              >
                <option value="">Toutes les années</option>
                {anneesScolaires.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.annee}
                  </option>
                ))}
              </select>
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {assignations.length}
                </p>
                <p className="text-sm text-gray-600">Assignations</p>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Liste des assignations */}
        <ComponentCard
          title="Assignations de Matières"
          desc={
            !loading && (
              <span className="text-sm font-normal text-gray-500">
                {assignations.length} assignation(s) trouvée(s)
              </span>
            )
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : assignations.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-100">
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
                        Matière
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
                        Année scolaire
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Heures/semaine
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
                    {assignations.map((assignation) => (
                      <TableRow
                        key={assignation.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                              <FaChalkboardTeacher className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {getEnseignantNom(assignation.enseignant_id)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <div className="flex items-center gap-2">
                            <FaBook className="w-4 h-4 text-purple-500" />
                            <span>{getMatiereNom(assignation.matiere_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {getClasseNom(assignation.classe_id)}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          {getAnneeScolaire(assignation.annee_scolaire_id)}
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <span className="font-medium text-orange-600">
                            {assignation.heures_semaine}h
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-6 text-gray-500">
                          <button
                            onClick={() => handleRetirerMatiere(assignation.id)}
                            className="p-2 text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700"
                            title="Retirer la matière"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
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
                Aucune assignation trouvée
              </p>
              <p className="text-gray-500">
                Aucune matière n'est assignée aux enseignants.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                <FaPlus className="w-4 h-4" />
                Créer la première assignation
              </button>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default GestionMatieres;
