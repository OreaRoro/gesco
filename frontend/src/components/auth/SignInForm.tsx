import { useState } from "react";
import { Link } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import Spinner from "../common/Spinner.tsx";
import PageMeta from "../common/PageMeta.tsx";

interface SignInFormValues {
  identifier: string;
  password: string;
}

export default function SignInForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>();

  const onSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    try {
      await login(data);
      toast.success("Connexion réussie !");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.messages?.error || "Erreur lors de la connexion"
      );
    }
  };

  return (
    <>
      <PageMeta
        title="Connexion | Système de Gestion Scolaire"
        description="Page de Connexion - Connectez vous pour accèder à votre compte"
      />

      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Se connecter
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Veuillez saisir votre adresse e-mail et votre mot de passe pour
                vous connecter.
              </p>
            </div>
            <div>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Nom d'utilisateur{" "}
                      <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nom d'utilisateur"
                      register={register}
                      name="identifier"
                      validation={{
                        required: "Nom d'utilisateur requis",
                      }}
                      error={errors.identifier}
                      autocomplete="current-identifier"
                    />
                  </div>
                  <div>
                    <Label>
                      Mot de passe <span className="text-error-500">*</span>{" "}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Entrer votre mot de passe"
                        name="password"
                        register={register}
                        validation={{
                          required: "Mot de passe requis",
                          minLength: {
                            value: 6,
                            message: "Au moins 6 caractères",
                          },
                        }}
                        autocomplete="current-password"
                        error={errors.password}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                      />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                        Rester connecté
                      </span>
                    </div>
                    <Link
                      to="/reset-password"
                      className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Mot de passe oublié?
                    </Link>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg ${
                        isSubmitting
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-brand-500 hover:bg-brand-600 shadow-theme-xs"
                      }`}
                    >
                      {isSubmitting ? (
                        <Spinner size="sm" color="white" label="Connexion" />
                      ) : (
                        "Se connecter"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
