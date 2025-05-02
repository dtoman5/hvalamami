"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handlePrijava = async (data) => {
    const { error: signInError } = await supabase.auth.signInWithPassword(data);
    if (signInError) {
      toast.error(signInError.message);
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
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
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
            <div className="action-btn-left btn-active">
              Prijava
            </div>
            <Link className="action-btn-right" href="/registracija">Registracija</Link>
          </div>
          <div className="right-side-content text-center">
            <div className="right-side-logo m-t-10 m-b-2">
              <img src="logo-hm2.png" alt="Logo" />
            </div>
            <div className="right-side-text">
              <div className="p-b-3">
                <h1>Pozdravljena <span>nazaj!</span></h1>
                <p className="p-t-1">Prijavi se in odkrivaj svet Hvala mami</p>
              </div>
              <button className="google-btn" onClick={handleGoogleSignIn} type="button">
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
                {errors.password && <p className="invalid-feedback">{errors.password.message}</p>}
              </div>
              <div className="form-group m-t-2 m-b-2">
                <button className="submit-btn" type="submit">
                  Prijava
                </button>
              </div>
              <div className="right-side-pass m-t-2 m-b-10">
                Pozabljeno geslo? <Link href="/pozabljeno-geslo">Obnovi</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}