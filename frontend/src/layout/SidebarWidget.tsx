import { toast } from "sonner";
import { useAuth } from "../context/AuthContext.tsx";
import { useNavigate } from "react-router";

export default function SidebarWidget() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Vous êtes maintenant déconnecté !");
    navigate("/signin");
  };
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <button
        onClick={handleLogout}
        className="flex items-center justify-center p-3 w-full font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
      >
        Déconnexion
      </button>
    </div>
  );
}
