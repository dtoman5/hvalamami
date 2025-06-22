'use client';
import { useState, useEffect } from "react";
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";

const schema = yup.object().shape({
  email: yup.string().email("Vnesite veljaven e-poštni naslov").required("E-pošta je obvezna"),
  password: yup.string().required("Geslo je obvezno"),
});

export default function Prijava() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/zid");
      }
    });
  }, [supabase, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handlePrijava = async (data) => {
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword(data);
      if (signInError) {
        toast.error(
          signInError.message === "Invalid login credentials"
            ? "Neuspešna prijava uporabnika"
            : signInError.message
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Napaka pri pridobivanju uporabnika.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        router.push("/zid");
      } else {
        router.push("/zakljuci-registracijo");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: location.origin },
      });
      if (error) toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handlePrijava)}>
      <div className="signup-content">
        <div className="left-side-page">
          <div className="left-side-content"></div>
        </div>
        <div className="right-side-page">
          <div className="action-btn">
            <div className="action-btn-left btn-active">Prijava</div>
            <Link scroll={false} className="action-btn-right" href="/registracija">
              Registracija
            </Link>
          </div>
          <div className="right-side-content text-center">
            <div className="right-side-logo m-t-10 m-b-2">
              <img src="logo-hm.png" alt="Logo" />
            </div>
            <div className="right-side-text">
              <div className="p-b-3">
                <h1>
                  Pozdravljena <span>nazaj!</span>
                </h1>
                <p className="p-t-1">Prijavi se in odkrivaj svet Hvala mami</p>
              </div>
              <button
                className="google-btn"
                onClick={handleGoogleSignIn}
                type="button"
                disabled={isLoading}
              >
                <i className="bi bi-google"></i> Nadaljuj z google računom
              </button>
              <div className="form-group m-t-2">
                <input
                  type="email"
                  placeholder="Vpiši e-pošto"
                  {...register("email")}
                  className={errors.email ? "is-invalid" : ""}
                  required
                />
                {errors.email && <p className="invalid-feedback">{errors.email.message}</p>}
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Vpiši geslo"
                  {...register("password")}
                  className={errors.password ? "is-invalid" : ""}
                  required
                />
                {errors.password && (
                  <p className="invalid-feedback">{errors.password.message}</p>
                )}
              </div>
              <div className="form-group m-t-2 m-b-2">
                <button className="submit-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Prijavljam..." : "Prijava"}
                </button>
              </div>
              <div className="right-side-pass m-t-2 m-b-10">
                Pozabljeno geslo?{" "}
                <Link scroll={false} href="/pozabljeno-geslo">
                  Obnovi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}