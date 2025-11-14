<?php

namespace App\Controllers\Api;

use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class FilesController extends Controller
{
    use ResponseTrait;

    /**
     * Méthode pour servir n'importe quel fichier avec le wildcard *
     */
    public function serveSingle()
    {
        // Headers CORS
        header('Access-Control-Allow-Origin: http://localhost:5173');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: *');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return $this->response->setStatusCode(200);
        }

        // Récupérer le chemin complet depuis l'URI
        $uri = $this->request->getUri();
        $path = $uri->getPath();

        // Extraire la partie après "/uploads/"
        $basePattern = '/uploads/';
        $startPos = strpos($path, $basePattern);

        if ($startPos === false) {
            return $this->response->setStatusCode(400)->setJSON(['error' => 'URL invalide']);
        }

        $relativePath = substr($path, $startPos + strlen($basePattern));
        $filePath = WRITEPATH . 'uploads/' . $relativePath;

        log_message('debug', '=== SERVING FILE (WILDCARD) ===');
        log_message('debug', 'Full URI: ' . $path);
        log_message('debug', 'Relative path: ' . $relativePath);
        log_message('debug', 'File path: ' . $filePath);

        return $this->serveFile($filePath);
    }

    /**
     * Méthode spécifique pour les images d'élèves
     */
    public function serveEleveImage($filename)
    {
        $filePath = WRITEPATH . 'uploads/eleves/' . $filename;

        if (!is_file($filePath)) {
            return $this->response->setStatusCode(404)->setBody('Image non trouvée');
        }

        $mime = mime_content_type($filePath);

        return $this->response
            ->setHeader('Content-Type', $mime)
            ->setBody(file_get_contents($filePath));
    }

    /**
     * Méthode helper pour servir un fichier
     */
    private function serveFile($filePath)
    {
        // Vérifier que le fichier existe
        if (!file_exists($filePath)) {
            log_message('error', 'FILE NOT FOUND: ' . $filePath);
            return $this->response
                ->setStatusCode(404)
                ->setJSON([
                    'error' => 'Fichier non trouvé',
                    'path' => $filePath
                ]);
        }

        // Vérifier que c'est un fichier
        if (!is_file($filePath)) {
            log_message('error', 'NOT A FILE: ' . $filePath);
            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'error' => 'Chemin invalide - Ce n\'est pas un fichier',
                    'is_dir' => is_dir($filePath),
                    'path' => $filePath
                ]);
        }

        // Vérifier que le fichier est lisible
        if (!is_readable($filePath)) {
            log_message('error', 'FILE NOT READABLE: ' . $filePath);
            return $this->response
                ->setStatusCode(403)
                ->setJSON(['error' => 'Fichier non accessible']);
        }

        // Déterminer le type MIME
        $mimeType = mime_content_type($filePath);
        log_message('debug', 'MIME type: ' . $mimeType);

        $allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        if (!in_array($mimeType, $allowedTypes)) {
            log_message('error', 'MIME TYPE NOT ALLOWED: ' . $mimeType);
            return $this->response
                ->setStatusCode(403)
                ->setJSON(['error' => 'Type de fichier non autorisé']);
        }

        // Lire le fichier
        $fileContent = file_get_contents($filePath);
        if ($fileContent === false) {
            log_message('error', 'UNABLE TO READ FILE: ' . $filePath);
            return $this->response
                ->setStatusCode(500)
                ->setJSON(['error' => 'Erreur de lecture du fichier']);
        }

        log_message('debug', 'FILE SERVED SUCCESSFULLY: ' . $filePath);

        // Servir le fichier
        return $this->response
            ->setContentType($mimeType)
            ->setHeader('Cache-Control', 'public, max-age=3600')
            ->setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->setBody($fileContent);
    }
}
