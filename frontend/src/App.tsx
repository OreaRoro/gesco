import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import PublicRoute from "./components/common/PublicRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";

import AppLayout from "./layout/AppLayout";
import NotFound from "./pages/OtherPage/NotFound";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import Home from "./pages/Dashboard/Home";
import EleveListe from "./pages/Eleves/EleveListe";
import EleveAjout from "./pages/Eleves/EleveAjout";
import EleveProfil from "./pages/Eleves/EleveProfil";
import InscriptionForm from "./pages/Inscriptions/InscriptionForm";
import EleveEdit from "./pages/Eleves/EleveEdit";
import NiveauManager from "./pages/Niveaux/NiveauManager";
import AnneeScolaireManager from "./pages/AnneeScolaire/AnneeScolaireManager";
import ClasseManager from "./pages/Classes/ClasseManager";
import FraisManager from "./pages/Frais/FraisManager";
import EleveInactifs from "./pages/Eleves/EleveInactifs";
import InscriptionList from "./pages/Inscriptions/InscriptionList";
import GestionPaiementsPage from "./pages/Paiements/GestionPaiementsPage";
import { AnneeScolaireProvider } from "./context/AnneeScolaireContext";
import InscriptionEditForm from "./pages/Inscriptions/InscriptionEditForm";
import InscriptionView from "./pages/Inscriptions/InscriptionView";
import ReinscriptionForm from "./pages/Inscriptions/ReinscriptionForm.tsx";
import EleveAbsence from "./pages/Eleves/EleveAbsence.tsx";
import ElevePointage from "./pages/Eleves/ElevePointage.tsx";
import MatieresList from "./pages/Matieres/MatieresList.tsx";
import MatiereForm from "./pages/Matieres/MatiereForm.tsx";
import PersonnelList from "./pages/Personnel/PersonnelList.tsx";
import PersonnelForm from "./pages/Personnel/PersonnelForm.tsx";
import SalairesList from "./pages/Salaire/SalairesList.tsx";
import SalaireForm from "./pages/Salaire/SalaireForm.tsx";
import PointageList from "./pages/Personnel/PointageList.tsx";
import PointageForm from "./pages/Personnel/PointageForm.tsx";
import EnseignantList from "./pages/Enseignant/EnseignantList.tsx";
import EnseignantForm from "./pages/Enseignant/EnseignantForm.tsx";
import EnseignantDetails from "./pages/Enseignant/EnseignantDetails.tsx";
import GestionMatieres from "./pages/Enseignant/GestionMatieres.tsx";
import PointageEnseignants from "./pages/Enseignant/PointageEnseignants.tsx";
import PointageRapideEnseignants from "./pages/Enseignant/PointageRapideEnseignants.tsx";
import PointageFormEnseignants from "./pages/Enseignant/PointageFormEnseignants.tsx";
import ExamenListe from "./pages/Examens/ExamenListe.tsx";
import SaisieNotes from "./pages/Examens/SaisieNotes.tsx";
import ExamenForm from "./pages/Examens/ExamenForm.tsx";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AnneeScolaireProvider>
                  <AppLayout />
                </AnneeScolaireProvider>
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />

            {/* Eleve */}
            <Route path="/eleves" element={<EleveListe />} />
            <Route path="/eleves/nouveau" element={<EleveAjout />} />
            <Route path="/eleves/:id" element={<EleveProfil />} />
            <Route path="/eleves/:id/modifier" element={<EleveEdit />} />
            <Route path="/eleves/inactifs" element={<EleveInactifs />} />
            <Route path="/eleves/:id/absences" element={<EleveAbsence />} />
            <Route
              path="/eleves/:id/absences/nouveau"
              element={<ElevePointage />}
            />

            {/* Inscription */}
            <Route path="/eleves/:id/inscrire" element={<InscriptionForm />} />
            <Route path="/eleve-inscriptions" element={<InscriptionList />} />
            <Route
              path="/eleves/:id/reinscrire"
              element={<ReinscriptionForm />}
            />
            <Route
              path="/eleve-inscriptions/:id"
              element={<InscriptionView />}
            />
            <Route
              path="/eleves/:id/modifier-inscription"
              element={<InscriptionEditForm />}
            />

            {/* Paramètes */}
            <Route path="/niveaux-scolaires" element={<NiveauManager />} />
            <Route path="/classes" element={<ClasseManager />} />
            <Route
              path="/annees-scolaires"
              element={<AnneeScolaireManager />}
            />
            <Route path="/frais-scolarite" element={<FraisManager />} />
            <Route
              path="/eleves/:id/paiements"
              element={<GestionPaiementsPage />}
            />

            {/* Matières */}
            <Route path="/matieres" element={<MatieresList />} />
            <Route path="/matieres/nouveau" element={<MatiereForm />} />
            <Route path="/matieres/:id/modifier" element={<MatiereForm />} />
            {/* Personnel */}
            <Route path="/personnel" element={<PersonnelList />} />
            <Route path="/personnel/nouveau" element={<PersonnelForm />} />
            <Route path="/personnel/:id/modifier" element={<PersonnelForm />} />
            {/* Salaires */}
            <Route path="/personnel/salaires" element={<SalairesList />} />
            <Route
              path="/personnel/salaires/nouveau"
              element={<SalaireForm />}
            />
            <Route
              path="/personnel/salaires/:id/modifier"
              element={<SalaireForm />}
            />

            {/* Pointage */}
            <Route path="/personnel/pointage" element={<PointageList />} />
            <Route
              path="/personnel/pointage/nouveau"
              element={<PointageForm />}
            />
            <Route
              path="/personnel/pointage/:id/modifier"
              element={<PointageForm />}
            />

            {/* Enseignant */}
            <Route path="/enseignants" element={<EnseignantList />} />
            <Route path="/enseignants/nouveau" element={<EnseignantForm />} />
            <Route
              path="/enseignants/:id/modifier"
              element={<EnseignantForm />}
            />
            <Route path="/enseignants/:id" element={<EnseignantDetails />} />
            <Route path="/enseignants/matieres" element={<GestionMatieres />} />
            <Route
              path="/enseignants/pointage"
              element={<PointageEnseignants />}
            />
            <Route
              path="/enseignants/pointage/rapide"
              element={<PointageRapideEnseignants />}
            />
            <Route
              path="/enseignants/pointage/nouveau"
              element={<PointageFormEnseignants />}
            />
            <Route
              path="/enseignants/pointage/:id/modifier"
              element={<PointageFormEnseignants isEdit={true} />}
            />

            {/* Notes & Examens */}
            <Route path="/examens" element={<ExamenListe />} />
            <Route path="/examens/nouveau" element={<ExamenForm />} />
            <Route path="/examens/:id/modifier" element={<ExamenForm />} />
            <Route path="/examens/:id/notes" element={<SaisieNotes />} />
            {/* <Route path="/eleves/:id/bulletin" element={<BulletinEleve />} /> */}
          </Route>

          {/* Auth Layout */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      {/* Toast */}
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
