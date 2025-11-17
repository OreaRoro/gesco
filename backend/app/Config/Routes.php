<?php

use CodeIgniter\Router\RouteCollection;
use App\Filters\JWTAuth;

/**
 * @var RouteCollection $routes
 */

// Routes publiques
$routes->group('api/auth', ['namespace' => 'App\Controllers\Api'], function ($routes) {
    $routes->post('register', 'AuthController::register');
    $routes->post('login', 'AuthController::login');
});

// Routes pour la gestion des élèves
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => JWTAuth::class], function ($routes) {
    // Auth
    $routes->get('auth/me', 'AuthController::me');
    $routes->post('auth/refresh', 'AuthController::refresh');

    // Élèves
    $routes->group('eleves', function ($routes) {
        $routes->get('/', 'ElevesController::index');
        $routes->get('statistiques', 'ElevesController::statistiques');
        $routes->get('(:num)', 'ElevesController::show/$1');
        $routes->get('inactifs', 'ElevesController::inactifs');
        $routes->get('(:num)/inscriptions', 'ElevesController::getInscriptions/$1');
        $routes->post('/', 'ElevesController::create');
        $routes->post('(:num)/reinscrire', 'ElevesController::reinscrire/$1');
        $routes->post('(:num)/restaurer', 'ElevesController::restore/$1');
        $routes->post('(:num)/inscrire', 'ElevesController::inscrire/$1');
        $routes->post('(:num)/photo', 'ElevesController::uploadPhoto/$1');
        $routes->put('(:num)', 'ElevesController::update/$1');
        $routes->patch('(:num)/desactiver', 'ElevesController::desactiver/$1');
        $routes->patch('(:num)/restaurer', 'ElevesController::restaurer/$1');
        $routes->delete('(:num)', 'ElevesController::delete/$1');

        $routes->get('(:num)/notes', 'NotesController::getNotesEleve/$1');
        $routes->get('(:num)/moyennes', 'NotesController::getMoyennesEleve/$1');
        $routes->get('(:num)/bulletin', 'NotesController::getBulletin/$1');
    });

    // Inscriptions
    $routes->group('inscriptions', function ($routes) {
        $routes->get('/', 'InscriptionsController::index');
        $routes->get('(:num)', 'InscriptionsController::show/$1');
        $routes->get('(:num)/paiements', 'PaiementsController::getByInscription/$1');
        $routes->get('(:num)/solde', 'PaiementsController::getSolde/$1');
        $routes->post('/', 'InscriptionsController::create');
        $routes->post('/reinscrire', 'InscriptionsController::reinscrire');
        $routes->put('(:num)', 'InscriptionsController::update/$1');
        $routes->delete('(:num)', 'InscriptionsController::delete/$1');
    });

    // Années scolaires
    $routes->group('annees-scolaires', function ($routes) {
        $routes->get('/', 'AnneesScolairesController::index');
        $routes->post('/', 'AnneesScolairesController::create');
        $routes->get('current', 'AnneesScolairesController::current');
        $routes->get('(:num)', 'AnneesScolairesController::show/$1');
        $routes->put('(:num)', 'AnneesScolairesController::update/$1');
        $routes->delete('(:num)', 'AnneesScolairesController::delete/$1');
        $routes->patch('(:num)/set-current', 'AnneesScolairesController::setCurrent/$1');
        $routes->patch('(:num)/set-active', 'AnneesScolairesController::setActive/$1');
        $routes->patch('(:num)/close', 'AnneesScolairesController::close/$1');
    });

    // Classes
    $routes->group('classes', function ($routes) {
        $routes->get('/', 'ClassesController::index');
        $routes->get('with-details', 'ClassesController::index');
        $routes->get('niveau/(:num)', 'ClassesController::byNiveau/$1');
        $routes->get('(:num)', 'ClassesController::show/$1');
        $routes->get('(:num)/effectif', 'ClassesController::effectif/$1');
        $routes->post('/', 'ClassesController::create');
        $routes->put('(:num)', 'ClassesController::update/$1');
        $routes->delete('(:num)', 'ClassesController::delete/$1');
        $routes->get('(:num)/matieres', 'ExamensController::getMatieresPourClasse/$1');
        $routes->get('(:num)/notes', 'NotesController::getNotesClasse/$1');
    });

    // Niveaux
    $routes->group('niveaux', function ($routes) {
        $routes->get('/', 'NiveauxController::index');
        $routes->post('/', 'NiveauxController::create');
        $routes->put('(:num)', 'NiveauxController::update/$1');
        $routes->get('cycles', 'NiveauxController::cycles');
        $routes->get('cycle/(:any)', 'NiveauxController::byCycle/$1');
        $routes->get('(:num)', 'NiveauxController::show/$1');
        $routes->delete('(:num)', 'NiveauxController::delete/$1');
    });

    $routes->group('frais-scolarite', function ($routes) {
        $routes->get('/', 'FraisScolariteController::index');
        $routes->get('niveau', 'FraisScolariteController::getByNiveau');
        $routes->get('classe/(:num)', 'FraisScolariteController::getByClasse/$1');
        $routes->post('/', 'FraisScolariteController::create');
        $routes->put('(:num)', 'FraisScolariteController::update/$1');
        $routes->delete('(:num)', 'FraisScolariteController::delete/$1');
    });

    // Paiementes Eleves
    $routes->group('paiements', function ($routes) {
        $routes->get('/', 'PaiementsController::index');
        $routes->get('/(:num)', 'PaiementsController::show/$1');
        $routes->get('statistiques', 'PaiementsController::statistiques');
        $routes->get('(:num)/quittance', 'PaiementsController::genererQuittance/$1');
        $routes->post('/', 'PaiementsController::create');
        $routes->put('(:num)', 'PaiementsController::update/$1');
        $routes->delete('(:num)', 'PaiementsController::delete/$1');
    });

    // Gestion des absences
    $routes->group('/', function ($routes) {
        $routes->get('eleves/(:num)/absences', 'AbsencesController::index/$1');
        $routes->post('eleves/(:num)/absences', 'AbsencesController::create/$1');
        $routes->get('eleves/(:num)/absences/statistiques', 'AbsencesController::statistiques/$1');
        $routes->put('absences/(:num)', 'AbsencesController::update/$1');
        $routes->delete('absences/(:num)', 'AbsencesController::delete/$1');
    });

    //  matières
    $routes->group('matieres', function ($routes) {
        $routes->get('/', 'MatiereController::index');
        $routes->get('(:num)', 'MatiereController::show/$1');
        $routes->post('/', 'MatiereController::create');
        $routes->put('(:num)', 'MatiereController::update/$1');
        $routes->delete('(:num)', 'MatiereController::delete/$1');
        $routes->get('niveaux/(:num)/matieres', 'MatiereController::getByNiveau/$1');
    });

    // Salaires
    $routes->group('salaires', function ($routes) {
        $routes->get('/', 'SalairesController::index');
        $routes->get('(:num)', 'SalairesController::show/$1');
        $routes->post('/', 'SalairesController::create');
        $routes->post('(:num)', 'SalairesController::update/$1');
        $routes->delete('(:num)', 'SalairesController::delete/$1');
        $routes->post('(:num)/payer', 'SalairesController::payer/$1');
        $routes->get('(:num)/bulletin', 'SalairesController::bulletin/$1');
    });

    // Personnel 
    $routes->group('personnel', function ($routes) {
        $routes->get('/', 'PersonnelController::index');
        $routes->get('all', 'PersonnelController::all');
        $routes->get('(:num)', 'PersonnelController::show/$1');
        $routes->get('administratif', 'PersonnelController::administratif');
        $routes->post('/', 'PersonnelController::create');
        $routes->post('(:num)', 'PersonnelController::update/$1');
        $routes->delete('(:num)', 'PersonnelController::delete/$1');
    });

    // Pointages Personnels
    $routes->group('pointages/personnel',  function ($routes) {
        $routes->get('/', 'PointagesController::personnel');
        $routes->get('(:num)', 'PointagesController::showPersonnel/$1');
        $routes->post('/', 'PointagesController::createPersonnel');
        $routes->post('(:num)', 'PointagesController::updatePersonnel/$1');
        $routes->delete('(:num)', 'PointagesController::deletePersonnel/$1');
        $routes->post('rapide', 'PointagesController::rapidePersonnel');
        $routes->get('stats/mensuelles', 'PointagesController::statsMensuellesPersonnel');
    });

    // Enseignants
    $routes->group('enseignants', function ($routes) {
        $routes->get('/', 'EnseignantsController::index');
        $routes->get('(:num)/matieres', 'EnseignantsController::matieres/$1');
        $routes->get('(:num)/stats', 'EnseignantsController::stats/$1');
        $routes->get('(:num)/emploi-du-temps', 'EnseignantsController::emploiDuTemps/$1');
        $routes->post('(:num)/matieres', 'EnseignantsController::assignerMatiere/$1');
        $routes->delete('matieres/(:num)', 'EnseignantsController::retirerMatiere/$1');
    });

    // Gestion des examens
    $routes->group('examens', function ($routes) {
        $routes->get('/', 'ExamensController::index');
        $routes->get('(:num)', 'ExamensController::show/$1');
        $routes->post('/', 'ExamensController::create');
        $routes->put('(:num)', 'ExamensController::update/$1');
        $routes->delete('(:num)', 'ExamensController::delete/$1');

        // Gestion des notes
        $routes->get('(:num)/notes', 'ExamensController::getNotes/$1');
        $routes->post('(:num)/notes', 'ExamensController::sauvegarderNotes/$1');
        $routes->get('(:num)/classes', 'ExamensController::getClassesPourExamen/$1');
    });

    // Gestion des notes
    $routes->group('notes', function ($routes) {
        $routes->get('(:num)', 'NotesController::getNotesEleve/$1');
        $routes->post('/', 'NotesController::create');
        $routes->put('(:num)', 'NotesController::update/$1');
        $routes->delete('(:num)', 'NotesController::delete/$1');
    });
});

$routes->get('uploads/*', 'Api\FilesController::serveSingle/$1');
$routes->get('uploads/eleves/(:any)', 'Api\FilesController::serveEleveImage/$1');
