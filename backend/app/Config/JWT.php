<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class JWT extends BaseConfig
{
    public $key = 'votre_cle_secrete_jwt_tres_longue_et_securisee_2025_gestion_scolaire';
    public $algorithm = 'HS256';
    public $expiration = 7200;
}
