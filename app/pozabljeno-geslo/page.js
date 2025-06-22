"use client";
import { useState } from "react";
import { createClient } from '../../lib/supabase/client'
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";

const schema = yup.object().shape({
  email: yup.string().email("Vnesite veljaven e-poštni naslov").required("E-pošta je obvezna"),
});

export default function PozabljenoGesloPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/posodobi-geslo`,
      });

      if (error) throw error;

      toast.success("Povezava za ponastavitev poslana na e-pošto");
      setEmailSent(true);
    } catch (error) {
      toast.error(error.message || "Napaka pri pošiljanju e-pošte");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text text-center">
            <h1 className="m-b-1">Preverite e-pošto</h1>
            <p className="m-b-2">
              Poslali smo vam povezavo za ponastavitev gesla.
              Če e-poštnega sporočila ne najdete, preverite mapo »Nezaželena pošta«.
            </p>
            <Link scroll={false} href="/prijava" className="submit-btn">
              Nazaj na prijavo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="logo-f-p">
        <div className="logo">
          <img src="https://cdn.prod.website-files.com/652dbebd0c8e37e771b32d9c/652ddafb178c90f84e21cb60_Group%204.svg" alt="logo" />
        </div>
      </div>
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text">
            <h1 className="m-b-1">Pozabljeno geslo</h1>
            <p>Vnesite e-poštni naslov za ponastavitev gesla</p>
            
            <div className="form-group m-t-3 m-b-2">
              <input
                type="email"
                placeholder="Vaš e-poštni naslov"
                {...register("email")}
                className={errors.email ? "is-invalid" : ""}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="form-group m-b-2">
              <button
                className="submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Pošiljanje..." : "Pošlji povezavo"}
              </button>
            </div>
            
            <div className="text-center m-t-2">
              <Link scroll={false} href="/prijava" className="text-muted">
                Nazaj na prijavo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}