<?php

namespace App\Models;

use CodeIgniter\Model;

class NoteModel extends Model
{
    protected $table            = 'notes';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['eleve_id', 'inscription_id', 'matiere_id', 'examen_id', 'note', 'coefficient', 'appreciation', 'saisie_par'];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Validation
    protected $validationRules = [
        'eleve_id' => 'required|integer',
        'inscription_id' => 'required|integer',
        'matiere_id' => 'required|integer',
        'examen_id' => 'required|integer',
        'note' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[20]',
        'coefficient' => 'required|integer|greater_than[0]'
    ];

    public function getNotesParExamen($examenId, $classeId = null, $matiereId = null)
    {
        $builder = $this->db->table('inscriptions i');
        $builder->select('
        e.id as eleve_id,
        e.nom as eleve_nom, 
        e.prenom as eleve_prenom, 
        e.matricule,
        c.nom as classe_nom,
        i.id as inscription_id,
        m.id as matiere_id,
        m.nom as matiere_nom,
        m.coefficient as matiere_coefficient,
        n.id as note_id,
        n.note,
        n.appreciation,
        n.coefficient,
        n.created_at as note_created_at
    ');

        // Jointure avec les élèves et classes
        $builder->join('eleves e', 'e.id = i.eleve_id');
        $builder->join('classes c', 'c.id = i.classe_id');

        // Jointure avec les matières (supposons que matières sont liées aux niveaux)
        $builder->join('matieres m', 'm.niveau_id = c.niveau_id');

        // Jointure LEFT avec les notes (pour inclure même sans notes)
        $builder->join('notes n', 'n.eleve_id = e.id AND n.examen_id = ' . $examenId . ' AND n.matiere_id = m.id', 'left');

        // Filtres
        $builder->where('i.classe_id', $classeId);
        $builder->where('i.annee_scolaire_id', function ($query) use ($examenId) {
            $query->select('annee_scolaire_id')
                ->from('examens')
                ->where('id', $examenId);
        });

        if ($matiereId) {
            $builder->where('m.id', $matiereId);
        }

        $builder->orderBy('e.nom, e.prenom');

        return $builder->get()->getResultArray();
    }

    public function getNotesEleve($eleveId, $anneeScolaireId, $examenId = null)
    {
        $builder = $this->db->table('notes n');
        $builder->select('n.*, m.nom as matiere_nom, m.coefficient as matiere_coefficient,
                         ex.nom as examen_nom, ex.type as examen_type, ex.date_debut,
                         c.nom as classe_nom');
        $builder->join('matieres m', 'm.id = n.matiere_id');
        $builder->join('examens ex', 'ex.id = n.examen_id');
        $builder->join('inscriptions i', 'i.id = n.inscription_id');
        $builder->join('classes c', 'c.id = i.classe_id');
        $builder->where('n.eleve_id', $eleveId);
        $builder->where('i.annee_scolaire_id', $anneeScolaireId);

        if ($examenId) {
            $builder->where('n.examen_id', $examenId);
        }

        $builder->orderBy('ex.date_debut, m.nom');

        return $builder->get()->getResultArray();
    }

    public function getMoyennesEleve($eleveId, $anneeScolaireId)
    {
        $builder = $this->db->table('notes n');
        $builder->select('n.matiere_id, m.nom as matiere_nom, m.coefficient,
                         AVG(n.note) as moyenne, 
                         SUM(n.note * n.coefficient) / SUM(n.coefficient) as moyenne_ponderee,
                         COUNT(n.id) as nb_notes');
        $builder->join('matieres m', 'm.id = n.matiere_id');
        $builder->join('inscriptions i', 'i.id = n.inscription_id');
        $builder->where('n.eleve_id', $eleveId);
        $builder->where('i.annee_scolaire_id', $anneeScolaireId);
        $builder->groupBy('n.matiere_id, m.nom, m.coefficient');

        return $builder->get()->getResultArray();
    }

    public function getNotesClasse($classeId, $anneeScolaireId, $examenId = null, $matiereId = null)
    {
        $builder = $this->db->table('notes n');
        $builder->select('n.*, e.nom as eleve_nom, e.prenom as eleve_prenom, e.matricule,
                     m.nom as matiere_nom, m.coefficient as matiere_coefficient,
                     ex.nom as examen_nom, ex.type as examen_type');
        $builder->join('eleves e', 'e.id = n.eleve_id');
        $builder->join('matieres m', 'm.id = n.matiere_id');
        $builder->join('examens ex', 'ex.id = n.examen_id');
        $builder->join('inscriptions i', 'i.id = n.inscription_id');
        $builder->where('i.classe_id', $classeId);
        $builder->where('i.annee_scolaire_id', $anneeScolaireId);

        if ($examenId) {
            $builder->where('n.examen_id', $examenId);
        }

        if ($matiereId) {
            $builder->where('n.matiere_id', $matiereId);
        }

        $builder->orderBy('e.nom, e.prenom, m.nom');

        return $builder->get()->getResultArray();
    }

    public function getStatistiquesNotesExamen($examenId)
    {
        $builder = $this->db->table('notes n');
        $builder->select('
        COUNT(n.id) as total_notes,
        AVG(n.note) as moyenne_generale,
        MIN(n.note) as note_minimale,
        MAX(n.note) as note_maximale,
        COUNT(DISTINCT n.eleve_id) as nombre_eleves,
        COUNT(DISTINCT n.matiere_id) as nombre_matieres
    ');
        $builder->where('n.examen_id', $examenId);

        return $builder->get()->getRowArray();
    }

    public function sauvegarderNotes($examenId, $notes)
    {
        $this->db->transStart();

        $savedCount = 0;
        $errors = [];

        foreach ($notes as $index => $noteData) {
            try {
                // Conversion en tableau si objet
                if (is_object($noteData)) {
                    $noteData = (array)$noteData;
                }

                log_message('debug', "Traitement note index $index: " . print_r($noteData, true));

                // Validation des champs requis avec valeurs par défaut
                if (empty($noteData['eleve_id'])) {
                    $errors[] = "eleve_id manquant à l'index $index";
                    continue;
                }
                if (empty($noteData['matiere_id'])) {
                    $errors[] = "matiere_id manquant à l'index $index";
                    continue;
                }

                // Préparer les données avec valeurs par défaut
                $data = [
                    'eleve_id' => (int)$noteData['eleve_id'],
                    'inscription_id' => !empty($noteData['inscription_id']) ? (int)$noteData['inscription_id'] : $this->getInscriptionId($noteData['eleve_id'], $examenId),
                    'matiere_id' => (int)$noteData['matiere_id'],
                    'examen_id' => (int)$examenId,
                    'note' => isset($noteData['note']) && $noteData['note'] !== '' ? floatval($noteData['note']) : null,
                    'coefficient' => !empty($noteData['coefficient']) ? (int)$noteData['coefficient'] : 1,
                    'appreciation' => !empty($noteData['appreciation']) ? $noteData['appreciation'] : null,
                    'saisie_par' => 1, // ID utilisateur par défaut
                    'updated_at' => date('Y-m-d H:i:s')
                ];

                log_message('debug', "Données préparées: " . print_r($data, true));

                // Vérifier l'existence des relations
                if (!$this->eleveExists($data['eleve_id'])) {
                    $errors[] = "Élève ID {$data['eleve_id']} n'existe pas";
                    continue;
                }

                if (!$this->matiereExists($data['matiere_id'])) {
                    $errors[] = "Matière ID {$data['matiere_id']} n'existe pas";
                    continue;
                }

                if (!$this->examenExists($examenId)) {
                    $errors[] = "Examen ID $examenId n'existe pas";
                    continue;
                }

                // Vérifier si la note existe déjà
                $existingNote = $this->where([
                    'eleve_id' => $data['eleve_id'],
                    'matiere_id' => $data['matiere_id'],
                    'examen_id' => $examenId
                ])->first();

                if ($existingNote) {
                    // Mise à jour
                    log_message('debug', "Mise à jour note existante ID: " . $existingNote['id']);
                    if (!$this->update($existingNote['id'], $data)) {
                        $errors[] = "Erreur mise à jour note élève {$data['eleve_id']}: " . implode(', ', $this->errors());
                    } else {
                        $savedCount++;
                    }
                } else {
                    // Insertion
                    log_message('debug', "Insertion nouvelle note");
                    $data['created_at'] = date('Y-m-d H:i:s');

                    // Vérifier les données avant insertion
                    $validationErrors = $this->validateData($data);
                    if (!empty($validationErrors)) {
                        $errors[] = "Données invalides élève {$data['eleve_id']}: " . implode(', ', $validationErrors);
                        continue;
                    }

                    $insertId = $this->insert($data);
                    if (!$insertId) {
                        $errors[] = "Erreur insertion note élève {$data['eleve_id']}: " . implode(', ', $this->errors());
                    } else {
                        $savedCount++;
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "Erreur index $index: " . $e->getMessage();
                log_message('error', "Exception détaillée: " . $e->getTraceAsString());
            }
        }

        $this->db->transComplete();

        if (!empty($errors)) {
            log_message('error', 'Erreurs sauvegarde notes: ' . implode('; ', $errors));
            throw new \Exception("Échec de sauvegarde: " . implode('; ', $errors));
        }

        return [
            'saved_count' => $savedCount,
            'total_notes' => count($notes),
            'errors' => $errors
        ];
    }

    // Méthodes helper pour vérifier l'existence des relations
    protected function eleveExists($eleveId)
    {
        $result = $this->db->table('eleves')
            ->where('id', $eleveId)
            ->countAllResults();
        return $result > 0;
    }

    protected function matiereExists($matiereId)
    {
        $result = $this->db->table('matieres')
            ->where('id', $matiereId)
            ->countAllResults();
        return $result > 0;
    }

    protected function examenExists($examenId)
    {
        $result = $this->db->table('examens')
            ->where('id', $examenId)
            ->countAllResults();
        return $result > 0;
    }

    protected function getInscriptionId($eleveId, $examenId)
    {
        // Récupérer l'année scolaire de l'examen
        $examen = $this->db->table('examens')
            ->select('annee_scolaire_id')
            ->where('id', $examenId)
            ->get()
            ->getRowArray();

        if (!$examen) {
            return null;
        }

        // Récupérer l'inscription active
        $inscription = $this->db->table('inscriptions')
            ->select('id')
            ->where('eleve_id', $eleveId)
            ->where('annee_scolaire_id', $examen['annee_scolaire_id'])
            ->get()
            ->getRowArray();

        return $inscription ? $inscription['id'] : null;
    }

    protected function validateData($data)
    {
        $errors = [];

        // Vérifier les champs requis
        $required = ['eleve_id', 'matiere_id', 'examen_id', 'inscription_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $errors[] = "$field est requis";
            }
        }

        // Vérifier que la note est valide si elle est définie
        if (isset($data['note']) && $data['note'] !== null) {
            if ($data['note'] < 0 || $data['note'] > 20) {
                $errors[] = "La note doit être entre 0 et 20";
            }
        }

        return $errors;
    }
}
