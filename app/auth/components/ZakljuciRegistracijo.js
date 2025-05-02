'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export default function CompleteProfile() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Uporaba useEffect za asinhrono nalaganje `window.location.search` na klientu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromSearch = params.get("email");
      if (emailFromSearch) {
        setEmail(emailFromSearch);
      }
    }
  }, []); // Samo na klientu se bo izvedlo

  const years = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i).reverse();

  const handleCompleteProfile = async (data) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        toast.error("Uporabnik ni najden");
        return;
      }

      await supabase.from("profiles").upsert({
        id: userData.user.id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        age: parseInt(data.age) // age mora biti integer
      });

      toast.success("Profil uspešno dopolnjen");
      router.push("/zid"); // preusmeritev na profil
    } catch (error) {
      toast.error(error.message || "Napaka pri dopolnjevanju profila");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="logo-f-p">
        {/* ... logo ... */}
      </div>
      <div className="center-position">
        <div className="right-side-content text-center">
          <div className="right-side-text">
            <div className="naslov">
              <h1 className="text-center">Zaključi registracijo in prični odkrivati</h1>
              <p className="text-center m-t-1 m-b-5">Vpiši še zadnje podatke in neomejeno dostopajte</p>
            </div>
            <form onSubmit={handleSubmit(handleCompleteProfile)}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši @username"
                  {...register("username")}
                  className={errors.username ? "is-invalid" : ""}
                />
                {errors.username && (
                  <p className="invalid-feedback">{errors.username.message}</p>
                )}
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši ime"
                  {...register("first_name")}
                  className={errors.first_name ? "is-invalid" : ""}
                />
                {errors.first_name && (
                  <p className="invalid-feedback">{errors.first_name.message}</p>
                )}
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši priimek"
                  {...register("last_name")}
                  className={errors.last_name ? "is-invalid" : ""}
                />
                {errors.last_name && (
                  <p className="invalid-feedback">{errors.last_name.message}</p>
                )}
              </div>
              <div className="form-group form-age m-b-2">
                <div className="form-age-icon">
                  <i className="bi bi-arrow-down-short"></i>
                </div>
                <select id="user-age" {...register("age")} className={errors.age ? "is-invalid" : ""}>
                  <option value="" hidden>
                    Izberi letnico rojstva
                  </option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.age && <p className="invalid-feedback">{errors.age.message}</p>}
              </div>
              <div className="form-group m-b-2">
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? "Dopolnjevanje..." : "Dokončaj registracijo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
}