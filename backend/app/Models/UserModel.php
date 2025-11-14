<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'username',
        'password',
        'email',
        'role',
        'personnel_id',
        'is_active',
        'last_login'
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    protected function hashPassword(array $data)
    {
        if (isset($data['data']['password'])) {
            $data['data']['password'] = password_hash($data['data']['password'], PASSWORD_DEFAULT);
        }
        return $data;
    }

    public function verifyPassword($password, $hashedPassword)
    {
        return password_verify($password, $hashedPassword);
    }

    public function getUserByIdentifier($identifier)
    {
        return $this->where('is_active', 1)
            ->groupStart()
            ->where('users.email', $identifier)
            ->orWhere('users.username', $identifier)
            ->groupEnd()
            ->join('personnel', 'personnel.id = users.personnel_id')
            ->select('users.*, personnel.nom, personnel.prenom, personnel.type_personnel')
            ->first();
    }

    public function getUserByUsername($username)
    {
        return $this->where('username', $username)
            ->where('is_active', 1)
            ->join('personnel', 'personnel.id = users.personnel_id')
            ->select('users.*, personnel.nom, personnel.prenom, personnel.type_personnel')
            ->first();
    }

    public function getUserByEmail($email)
    {
        return $this->where('email', $email)
            ->where('is_active', 1)
            ->join('personnel', 'personnel.id = users.personnel_id')
            ->select('users.*, personnel.nom, personnel.prenom, personnel.type_personnel')
            ->first();
    }
}
