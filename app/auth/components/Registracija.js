'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { createClient } from '../../../lib/supabase/client';
import Link from "next/link";

const supabase = createClient();

export default function Registracija() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/zid");
      }
    });
  }, [router]);

  const schema = yup.object().shape({
    email: yup
      .string()
      .email("Vnesite veljaven e-poštni naslov")
      .required("E-pošta je obvezna"),
    password: yup
      .string()
      .required("Geslo je obvezno")
      .min(8, "Geslo mora imeti vsaj 8 znakov")
      .matches(/[A-Z]/, "Geslo mora vsebovati vsaj eno veliko črko")
      .matches(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Geslo mora vsebovati vsaj en poseben znak"
      ),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Gesli se ne ujemata")
      .required("Potrditev gesla je obvezna"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleRegistracija = async (data) => {
    setIsLoading(true);
    try {
      // Preveri obstoj e-pošte
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) throw new Error("Napaka pri preverjanju e-pošte");

      const result = await res.json();
      if (result.exists) {
        toast.error("Uporabnik že obstaja. Prijavi se s klikom na prijava.");
        return;
      }

      // Ustvari uporabnika
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/zakljuci-registracijo`,
        },
      });

      if (error) throw error;

      toast.success("Preverite e-pošto za potrditveno povezavo!");
      router.push(
        `/potrdi-racun?email=${encodeURIComponent(data.email)}`
      );
    } catch (err) {
      toast.error(err.message || "Napaka pri registraciji");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleRegistracija)}>
      <div className="signup-content">
        <div className="left-side-page">
          <div className="left-side-content"></div>
        </div>
        <div className="right-side-page">
          <div className="action-btn">
            <Link scroll={false} className="action-btn-left" href="/prijava">
              Prijava
            </Link>
            <div className="action-btn-right btn-active">Registracija</div>
          </div>
          <div className="right-side-content text-center">
            <div className="right-side-logo m-t-10 m-b-2">
              <img src="logo-hm.png" alt="Logo" />
            </div>
            <div className="right-side-text">
              <div className="p-b-3">
                <h1>
                  Pridruži se <span>svetu mamic</span>
                </h1>
                <p className="p-t-1">
                  <i className="bi bi-check-lg"></i> 100% obseg objav brez
                  algoritmov
                </p>
                <p>
                  <i className="bi bi-check-lg"></i> Brez prekomernih reklam in
                  relevantna vsebina
                </p>
                <p>
                  <i className="bi bi-check-lg"></i> Deli vsebino in pomagaj
                </p>
              </div>
              <button className="google-btn" type="button">
                <i className="bi bi-google"></i> Nadaljuj z Google računom
              </button>
              <div className="form-group m-t-2">
                <input
                  type="email"
                  placeholder="Vpiši e-pošto"
                  {...register("email")}
                  className={errors.email ? "is-invalid" : ""}
                  required
                />
                {errors.email && (
                  <p className="invalid-feedback">{errors.email.message}</p>
                )}
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
              <div className="form-group m-b-2">
                <input
                  type="password"
                  placeholder="Ponovno vpiši geslo"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "is-invalid" : ""}
                  required
                />
                {errors.confirmPassword && (
                  <p className="invalid-feedback">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <div className="form-group m-b-2">
                <button
                  className="submit-btn"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Ustvarjam račun..." : "Registracija"}
                </button>
              </div>
              <div className="right-side-term m-b-10">
                Z registracijo sprejemate{" "}
                <a href="">Splošne pogoje uporabe</a> te spletne strani in
                potrjujete, da ste prebrali in razumeli Politiko zasebnosti.
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}