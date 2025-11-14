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
