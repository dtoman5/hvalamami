"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '../../lib/supabase/client';
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import PasswordStrengthIndicator from "../auth/components/PasswordStrengthIndicator";
import Navbar from "../components/Navbar";

const schema = yup.object().shape({
  oldPassword: yup
    .string()
    .required("Trenutno geslo je obvezno"),
  newPassword: yup
    .string()
    .required("Novo geslo je obvezno")
    .min(8, "Geslo mora vsebovati vsaj 8 znakov")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Geslo mora vsebovati vsaj eno veliko črko, eno malo črko, eno številko in en poseben znak"
    ),
  confirmPassword: yup
    .string()
    .required("Potrditev gesla je obvezna")
    .oneOf([yup.ref("newPassword")], "Gesli se ne ujemata"),
});

export default function SpremeniGesloPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/prijava");
      }
    })();
  }, [supabase, router]);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) {
        setErrorMessage("Uporabnik ni prijavljen.");
        return;
      }

      // re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.oldPassword,
      });
      if (authError) {
        setErrorMessage("Napačno staro geslo.");
        return;
      }

      // update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (updateError) throw updateError;

      toast.success("Geslo uspešno posodobljeno!");
      router.push("/geslo-zamenjano");
    } catch (err) {
      toast.error(err.message || "Napaka pri posodabljanju gesla");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="center-position">
        <div className="right-side-content">
          <h1 className="m-b-1">Spremeni geslo</h1>
          <p>Vpiši staro geslo in novo geslo, da ga spremeniš.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                type="password"
                placeholder="Vpiši staro geslo"
                {...register("oldPassword")}
                className={errors.oldPassword || errorMessage ? "is-invalid" : ""}
              />
              {errors.oldPassword && (
                <p className="invalid-feedback">{errors.oldPassword.message}</p>
              )}
              {!errors.oldPassword && errorMessage && (
                <p className="invalid-feedback">{errorMessage}</p>
              )}
            </div>

            <div className="form-group m-t-3">
              <input
                type="password"
                placeholder="Vpiši novo geslo"
                {...register("newPassword")}
                className={errors.newPassword ? "is-invalid" : ""}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.newPassword && (
                <p className="invalid-feedback">{errors.newPassword.message}</p>
              )}
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="form-group m-b-2">
              <input
                type="password"
                placeholder="Ponovno vpiši novo geslo"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "is-invalid" : ""}
              />
              {errors.confirmPassword && (
                <p className="invalid-feedback">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="form-group m-b-2">
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Posodabljanje..." : "Ponastavi geslo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}