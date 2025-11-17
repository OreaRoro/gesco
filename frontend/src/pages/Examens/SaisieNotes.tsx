import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { examenService } from "../../services/examenService";
import { noteService } from "../../services/noteService";
import { Note } from "../../interfaces/note.interface";
import { useApi } from "../../hooks/useApi";
import { useAnneeScolaire } from "../../context/AnneeScolaireContext";
import PageMeta from "../../components/common/PageMeta.tsx";
import PageBreadcrumb from "../../components/common/PageBreadCrumb.tsx";
import ComponentCard from "../../components/common/ComponentCard.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table/index";
import Spinner from "../../components/common/Spinner.tsx";
import { toast } from "sonner";

const SaisieNotes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classeId, setClasseId] = useState<number | null>(null);
  const [matiereId, setMatiereId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const { anneeActive } = useAnneeScolaire();
  const {
    data: examenData,
    loading: examenLoading,
    execute: loadExamen,
  } = useApi<any>();
  const {
    data: notesData,
    loading: notesLoading,
    execute: loadNotes,
  } = useApi<any>();

  const examen = examenData?.data?.examen;

  useEffect(() => {
    if (id) {
      loadExamen(() => examenService.getById(parseInt(id)));
    }
  }, [id]);

  useEffect(() => {
    if (examen && anneeActive) {
      loadClasses();
    }
  }, [examen, anneeActive]);

  useEffect(() => {
    if (classeId) {
      loadMatieres();
    }
  }, [classeId]);

  useEffect(() => {
    if (examen && classeId && matiereId) {
      loadNotesData();
    }
  }, [examen, classeId, matiereId]);

  const loadClasses = async () => {
    try {
      const response = await examenService.getClassesPourExamen(parseInt(id!));
      setClasses(response.data.classes || response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des classes");
    }
  };

  const loadMatieres = async () => {
    try {
      const response = await examenService.getMatieresPourClasse(classeId!);
      setMatieres(response.data.matieres || response.data);
      setMatiereId(null);
    } catch (error) {
      toast.error("Erreur lors du chargement des matières");
    }
  };

  const loadNotesData = async () => {
    if (!examen || !classeId || !matiereId) return;

    const filters = {
      classe_id: classeId,
      matiere_id: matiereId,
    };

    try {
      await loadNotes(() => examenService.getNotes(parseInt(id!), filters));
    } catch (error) {
      console.error("Erreur détaillée:", error);
      toast.error("Erreur lors du chargement des notes");
    }
  };

  useEffect(() => {
    if (notesData?.data) {
      // Gérer les différents formats de réponse
      const notesArray = Array.isArray(notesData.data)
        ? notesData.data
        : notesData.data.notes || [];

      setNotes(notesArray);
    }
  }, [notesData]);

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    const noteValue = parseFloat(value);

    if (!isNaN(noteValue) && noteValue >= 0 && noteValue <= 20) {
      newNotes[index].note = noteValue;
      setNotes(newNotes);
    } else if (value === "") {
      newNotes[index].note = 0;
      setNotes(newNotes);
    }
  };

  const handleAppreciationChange = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index].appreciation = value;
    setNotes(newNotes);
  };

  const handleSave = async () => {
    if (!classeId || !matiereId) {
      toast.error("Veuillez sélectionner une classe et une matière");
      return;
    }

    if (!notes.length) {
      toast.error("Aucune note à sauvegarder");
      return;
    }

    setSaving(true);
    try {
      // Préparer les données pour la sauvegarde - SEULEMENT les champs nécessaires
      const notesToSave = notes.map((note) => ({
        eleve_id: note.eleve_id,
        inscription_id: note.inscription_id,
        matiere_id: matiereId,
        examen_id: parseInt(id!),
        note: note.note,
        coefficient: note.coefficient || 1,
        appreciation: note.appreciation || null,
      }));

      console.log("Données envoyées:", notesToSave);

      await examenService.sauvegarderNotes(parseInt(id!), notesToSave);
      toast.success("Notes sauvegardées avec succès");

      // Recharger les notes pour avoir les IDs si c'était une création
      loadNotesData();
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Erreur lors de la sauvegarde";
      toast.error(
        typeof errorMessage === "string" ? errorMessage : "Erreur de validation"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividualNote = async (note: Note, index: number) => {
    if (!noteService.validerNote(note.note)) {
      toast.error("La note doit être comprise entre 0 et 20");
      return;
    }

    try {
      if (note.note_id) {
        // Mise à jour d'une note existante - seulement les champs modifiables
        await noteService.update(note.note_id, {
          note: note.note,
          coefficient: note.coefficient || 1,
          appreciation: note.appreciation || null,
        });
      } else {
        // Création d'une nouvelle note - seulement les champs requis
        const newNote = await noteService.create({
          eleve_id: note.eleve_id,
          inscription_id: note.inscription_id,
          matiere_id: matiereId,
          examen_id: parseInt(id!),
          note: note.note,
          coefficient: note.coefficient || 1,
          appreciation: note.appreciation || null,
        });

        // Mettre à jour l'ID de la note dans l'état local
        const newNotes = [...notes];
        newNotes[index] = { ...newNotes[index], id: newNote.data.note.note_id };
        setNotes(newNotes);
      }

      toast.success("Note sauvegardée avec succès");
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    }
  };
  const getNoteColor = (note: number) => {
    if (note >= 16) return "text-green-600 bg-green-50 border-green-200";
    if (note >= 12) return "text-blue-600 bg-blue-50 border-blue-200";
    if (note >= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getNoteStatus = (note: number) => {
    if (note >= 16) return "Excellent";
    if (note >= 12) return "Bon";
    if (note >= 10) return "Passable";
    return "Insuffisant";
  };

  const formatNote = (note: number) => {
    return noteService.formatNote(note);
  };

  if (examenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Chargement de l'examen..." />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Saisie des Notes | Système de Gestion Scolaire"
        description="Page de saisie des notes pour les examens"
      />

      <PageBreadcrumb
        pageTitle={`Saisie des Notes - ${examen?.nom || "Examen"}`}
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Examens", path: "/examens" },
          { label: "Saisie des notes", path: `/examens/${id}/notes` },
        ]}
      />

      <div className="space-y-6">
        <ComponentCard title={`Saisie des notes - ${examen?.nom}`}>
          {/* En-tête avec informations de l'examen */}
          {examen && (
            <div className="p-6 bg-blue-50 border-b border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    Type:
                  </span>
                  <p className="text-blue-700">
                    {
                      examenService
                        .getTypesExamen()
                        .find((t) => t.value === examen.type)?.label
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    Période:
                  </span>
                  <p className="text-blue-700">
                    Du {examenService.formatDateExamen(examen.date_debut)} au{" "}
                    {examenService.formatDateExamen(examen.date_fin)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    Statut:
                  </span>
                  <p className="text-blue-700">
                    {
                      examenService
                        .getStatutsExamen()
                        .find((s) => s.value === examen.statut)?.label
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Classe
                </label>
                <select
                  value={classeId || ""}
                  onChange={(e) =>
                    setClasseId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => {
                    return (
                      <option key={classe.niveau_id} value={classe.id}>
                        {classe.nom}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matière
                </label>
                <select
                  value={matiereId || ""}
                  onChange={(e) =>
                    setMatiereId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={!classeId}
                >
                  <option value="">Sélectionner une matière</option>
                  {matieres.map((matiere) => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom} (Coeff: {matiere.coefficient})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadNotesData}
                  disabled={!classeId || !matiereId}
                  className="w-full px-4 py-2 text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Charger les élèves
                </button>
              </div>
            </div>
          </div>

          {/* Tableau de saisie des notes */}
          {notesLoading ? (
            <div className="p-8 text-center">
              <Spinner size="sm" label="Chargement des élèves..." />
            </div>
          ) : notes.length > 0 ? (
            <div className="overflow-hidden">
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
                        Matricule
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs"
                      >
                        Note (/20)
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
                        Appréciation
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
                    {notes.map((note, index) => (
                      <TableRow
                        key={`${note.eleve_id}-${note.matiere_id}`}
                        className="hover:bg-gray-50 dark:hover:bg-white/2"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {note.eleve_nom} {note.eleve_prenom}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                            {note.classe_nom}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {note.matricule}
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              value={note.note || ""}
                              onChange={(e) =>
                                handleNoteChange(index, e.target.value)
                              }
                              className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-center font-medium ${getNoteColor(
                                note.note
                              )}`}
                            />
                            <span className="text-sm text-gray-500">
                              {formatNote(note.note || 0)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNoteColor(
                              note.note
                            )
                              .replace("text-", "bg-")
                              .replace("border-", "")}`}
                          >
                            {getNoteStatus(note.note)}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <input
                            type="text"
                            value={note.appreciation || ""}
                            onChange={(e) =>
                              handleAppreciationChange(index, e.target.value)
                            }
                            placeholder="Appréciation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            maxLength={100}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {note.appreciation ? note.appreciation.length : 0}
                            /100 caractères
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() =>
                              handleSaveIndividualNote(note, index)
                            }
                            disabled={
                              saving || !noteService.validerNote(note.note)
                            }
                            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {note.note_id ? "Mettre à jour" : "Sauvegarder"}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Statistiques et bouton de sauvegarde globale */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>{notes.length}</strong> élève(s) chargé(s)
                    </p>
                    <p>
                      Notes saisies:{" "}
                      <strong>{notes.filter((n) => n.note > 0).length}</strong>{" "}
                      / {notes.length}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setClasseId(null);
                        setMatiereId(null);
                        setNotes([]);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Réinitialiser
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={
                        saving || notes.filter((n) => n.note > 0).length === 0
                      }
                      className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        "Sauvegarder toutes les notes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {classeId && matiereId
                ? "Aucun élève trouvé pour cette classe et matière"
                : "Veuillez sélectionner une classe et une matière"}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default SaisieNotes;
