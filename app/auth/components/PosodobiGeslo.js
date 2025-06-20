'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { createClient } from '../../../lib/supabase/client';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const supabase = createClient();

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .required("Novo geslo je obvezno")
    .min(8, "Geslo mora vsebovati vsaj 8 znakov"),
  confirmPassword: yup
    .string()
    .required("Potrditev gesla je obvezna")
    .oneOf([yup.ref("newPassword")], "Gesli se ne ujemata"),
});

export default function PosodobiGeslo() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Uporaba useEffect za asinhrono nalaganje `window.location.search` na klientu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromSearch = params.get("email");
      if (emailFromSearch) {
        setEmail(emailFromSearch);
      }
    }
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) throw error;

      toast.success("Geslo uspešno posodobljeno!");
      router.push("/zid");
    } catch (error) {
      toast.error(error.message || "Napaka pri posodabljanju gesla");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="logo-f-p">
        <div className="logo">
          <img
            src="https://cdn.prod.website-files.com/652dbebd0c8e37e771b32d9c/652ddafb178c90f84e21cb60_Group%204.svg"
            alt="logo"
          />
        </div>
      </div>
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text">
            <h1 className="m-b-1">Ponastavi geslo zdaj</h1>
            <p>Vpiši novo željeno geslo.</p>

            <form onSubmit={handleSubmit(onSubmit)}>
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
                  <p className="invalid-feedback">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="form-group m-b-2">
                <button
                  className="submit-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Posodabljanje..." : "Ponastavi geslo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
}