<?php

namespace App\Models;

use CodeIgniter\Model;

class PaiementFraisModel extends Model
{
    protected $table = 'paiements_frais';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'eleve_id',
        'inscription_id',
        'annee_scolaire_id',
        'mois',
        'montant',
        'date_paiement',
        'mode_paiement',
        'reference_paiement',
        'statut',
        'encaisse_par'
    ];

    protected $validationRules = [
        'eleve_id' => 'required|integer',
        'inscription_id' => 'required|integer',
        'annee_scolaire_id' => 'required|integer',
        'mois' => 'required|max_length[10]',
        'montant' => 'required|decimal',
        'date_paiement' => 'required|valid_date',
        'mode_paiement' => 'required|in_list[especes,cheque,virement,mobile]',
        'statut' => 'required|in_list[paye,impaye,partiel]'
    ];

    public function enregistrerPaiement($data)
    {
        $this->db->transStart();

        try {
            // Validation des données requises
            $requiredFields = ['inscription_id', 'eleve_id', 'annee_scolaire_id', 'mois', 'montant', 'date_paiement', 'mode_paiement', 'statut'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new \Exception("Champ requis manquant: {$field}");
                }
            }

            // Vérifier la cohérence inscription/année scolaire
            $this->verifierCohérenceInscriptionAnneeScolaire($data['inscription_id'], $data['annee_scolaire_id']);

            log_message('debug', 'Tentative d\'insertion paiement: ' . print_r($data, true));

            // Insérer le paiement
            $this->insert($data);
            $paiementId = $this->db->insertID();

            if (!$paiementId) {
                $errors = $this->errors();
                $errorMessage = 'Erreur lors de l\'enregistrement du paiement';

                if (!empty($errors)) {
                    $errorMessage .= ': ' . implode(', ', $errors);
                } else {
                    $errorMessage .= ' (erreur inconnue)';
                }

                throw new \Exception($errorMessage);
            }

            log_message('debug', 'Paiement inséré avec ID: ' . $paiementId);

            // Mettre à jour le montant_paye dans la table inscriptions
            $updateSuccess = $this->updateMontantPaye($data['inscription_id']);

            if (!$updateSuccess) {
                throw new \Exception('Erreur lors de la mise à jour du montant payé');
            }

            $this->db->transComplete();

            log_message('debug', 'Transaction paiement terminée avec succès');

            return $paiementId;
        } catch (\Exception $e) {
            $this->db->transRollback();
            log_message('error', 'Erreur transaction paiement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie la cohérence entre l'inscription et l'année scolaire
     */
    protected function verifierCohérenceInscriptionAnneeScolaire($inscriptionId, $anneeScolaireId)
    {
        $inscriptionModel = new InscriptionModel();
        $inscription = $inscriptionModel->find($inscriptionId);

        if (!$inscription) {
            throw new \Exception("Inscription non trouvée");
        }

        if ($inscription['annee_scolaire_id'] != $anneeScolaireId) {
            throw new \Exception("L'année scolaire du paiement ne correspond pas à celle de l'inscription");
        }

        return true;
    }

    protected function updateMontantPaye($inscriptionId)
    {
        try {
            log_message('debug', 'Début updateMontantPaye pour inscription: ' . $inscriptionId);

            // Vérifier d'abord si l'inscription existe
            $inscription = $this->db->table('inscriptions')
                ->where('id', $inscriptionId)
                ->get()
                ->getRow();

            if (!$inscription) {
                log_message('error', 'Inscription non trouvée: ' . $inscriptionId);
                return false;
            }

            log_message('debug', 'Inscription trouvée: ' . print_r($inscription, true));

            // Calculer le total des paiements pour cette inscription
            $totalPaiements = $this->db->table($this->table)
                ->selectSum('montant', 'total_paye')
                ->where('inscription_id', $inscriptionId)
                // ->where('statut', 'paye')
                ->get()
                ->getRow();

            $montantTotalPaye = $totalPaiements->total_paye ?? 0;

            log_message('debug', 'Montant total payé calculé: ' . $montantTotalPaye);

            // Mettre à jour l'inscription
            $updateData = [
                'montant_paye' => $montantTotalPaye,
            ];

            log_message('debug', 'Données de mise à jour: ' . print_r($updateData, true));

            $success = $this->db->table('inscriptions')
                ->where('id', $inscriptionId)
                ->update($updateData);

            if (!$success) {
                $error = $this->db->error();
                log_message('error', 'Erreur SQL update inscription: ' . print_r($error, true));
                return false;
            }

            // Vérifier que la mise à jour a bien été effectuée
            $inscriptionApresUpdate = $this->db->table('inscriptions')
                ->select('montant_paye')
                ->where('id', $inscriptionId)
                ->get()
                ->getRow();

            log_message('debug', 'Montant payé après mise à jour: ' . ($inscriptionApresUpdate->montant_paye ?? 'null'));

            log_message('debug', 'Mise à jour inscription réussie');
            return true;
        } catch (\Exception $e) {
            log_message('error', 'Exception updateMontantPaye: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprime un paiement et met à jour le montant_paye
     */
    public function supprimerPaiement($paiementId)
    {
        $this->db->transStart();

        try {
            // Récupérer le paiement avant suppression
            $paiement = $this->find($paiementId);
            if (!$paiement) {
                throw new \Exception('Paiement non trouvé');
            }

            // Supprimer le paiement
            $deleted = $this->delete($paiementId);
            if (!$deleted) {
                throw new \Exception('Erreur lors de la suppression du paiement');
            }

            // Mettre à jour le montant_paye
            $this->updateMontantPaye($paiement['inscription_id']);

            $this->db->transComplete();

            return true;
        } catch (\Exception $e) {
            $this->db->transRollback();
            throw $e;
        }
    }

    /**
     * Récupère les paiements d'une inscription
     */
    public function getPaiementsByInscription($inscriptionId)
    {
        return $this->select('paiements_frais.*, users.username as encaisse_par_nom')
            ->join('users', 'users.id = paiements_frais.encaisse_par', 'left')
            ->where('inscription_id', $inscriptionId)
            ->orderBy('date_paiement', 'DESC')
            ->findAll();
    }

    /**
     * Récupère les paiements d'un élève pour une année scolaire spécifique
     */
    public function getPaiementsByEleveAndAnnee($eleveId, $anneeScolaireId)
    {
        return $this->select('paiements_frais.*, users.username as encaisse_par_nom, inscriptions.classe_id')
            ->join('users', 'users.id = paiements_frais.encaisse_par', 'left')
            ->join('inscriptions', 'inscriptions.id = paiements_frais.inscription_id')
            ->where('paiements_frais.eleve_id', $eleveId)
            ->where('paiements_frais.annee_scolaire_id', $anneeScolaireId)
            ->orderBy('paiements_frais.date_paiement', 'DESC')
            ->findAll();
    }

    /**
     * Récupère le solde restant d'une inscription
     */
    public function getSoldeRestant($inscriptionId)
    {
        $inscriptionModel = new InscriptionModel();
        $inscription = $inscriptionModel->find($inscriptionId);

        if (!$inscription) {
            return 0;
        }

        $totalPaiements = $this->where('inscription_id', $inscriptionId)
            ->where('statut', 'paye')
            ->selectSum('montant')
            ->get()
            ->getRow()
            ->montant;

        return ($inscription['montant_inscription'] ?? 0) - ($totalPaiements ?? 0);
    }

    /**
     * Récupère le total payé pour une inscription
     */
    public function getTotalPaye($inscriptionId)
    {
        $result = $this->db->table($this->table)
            ->selectSum('montant', 'total_paye')
            ->where('inscription_id', $inscriptionId)
            ->where('statut', 'paye')
            ->get()
            ->getRow();

        return $result->total_paye ?? 0;
    }

    /**
     * Récupère le solde restant d'un élève pour une année scolaire
     */
    public function getSoldeRestantByEleveAndAnnee($eleveId, $anneeScolaireId)
    {
        // Récupérer l'inscription de l'élève pour cette année scolaire
        $inscriptionModel = new InscriptionModel();
        $inscription = $inscriptionModel->where('eleve_id', $eleveId)
            ->where('annee_scolaire_id', $anneeScolaireId)
            ->where('statut', 'inscrit')
            ->first();

        if (!$inscription) {
            return 0;
        }

        return $this->getSoldeRestant($inscription['id']);
    }
}
