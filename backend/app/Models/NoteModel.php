<?php

namespace App\Models;

use CodeIgniter\Model;

class NoteModel extends Model
{
    protected $table = 'notes';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'eleve_id',
        'inscription_id',
        'matiere_id',
        'examen_id',
        'note',
        'coefficient',
        'appreciation',
        'saisie_par'
    ];
}
