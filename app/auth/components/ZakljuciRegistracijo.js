'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { createClient } from '../../../lib/supabase/client';

const supabase = createClient();

// 1) схема валидации
const schema = yup.object().shape({
  username: yup
    .string()
    .required('Uporabniško ime je obvezno')
    .min(3, 'Uporabniško ime mora vsebovati vsaj 3 znake')
    .max(20, 'Uporabniško ime ne sme presegati 20 znakov')
    .matches(
      /^[a-z0-9_-]+$/,
      'Samo male črke (a–z), številke (0–9), podčrtaj (_) in vezaj (-)'
    )
    .test(
      'username-available',
      'Uporabniško ime je že zasedeno',
      async (val) => {
        if (!val) return false;
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('username', val);
        return count === 0;
      }
    ),
  first_name: yup.string().required('Ime je obvezno'),
  last_name: yup.string().required('Priimek je obvezen'),
  age: yup
    .number()
    .typeError('Letnica je obvezna')
    .required('Letnica je obvezna')
    .min(1900, 'Neveljavna letnica')
    .max(new Date().getFullYear(), 'Neveljavna letnica'),
});

export default function CompleteProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [years] = useState(
    Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) =>
      1900 + i
    ).reverse()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 2) če uporabnik že ima username, ga preusmeri
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/prijava');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profile?.username) {
        router.push('/zid');
      }
    })();
  }, [router]);

  // 3) ob kliku na "Dokončaj registracijo"
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Uporabnik ni najden');

      await supabase.from('profiles').upsert({
        id: user.id,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        age: parseInt(data.age, 10),
      });

      toast.success('Profil uspešno dopolnjen');
      router.push('/zid');
    } catch (err) {
      toast.error(err.message || 'Napaka pri dopolnjevanju profila');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="logo-f-p" />
      <div className="center-position">
        <div className="right-side-content text-center">
          <div className="right-side-text">
            <div className="naslov">
              <h1 className="text-center">
                Zaključi registracijo in prični odkrivati
              </h1>
              <p className="text-center m-t-1 m-b-5">
                Vpiši še zadnje podatke in neomejeno dostopajte
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* username всегда lowercase */}
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši @username"
                  {...register('username', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toLowerCase();
                    },
                  })}
                  className={errors.username ? 'is-invalid' : ''}
                />
                {errors.username && (
                  <p className="invalid-feedback">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši ime"
                  {...register('first_name')}
                  className={errors.first_name ? 'is-invalid' : ''}
                />
                {errors.first_name && (
                  <p className="invalid-feedback">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vpiši priimek"
                  {...register('last_name')}
                  className={errors.last_name ? 'is-invalid' : ''}
                />
                {errors.last_name && (
                  <p className="invalid-feedback">
                    {errors.last_name.message}
                  </p>
                )}
              </div>

              <div className="form-group form-age m-b-2">
                <div className="form-age-icon">
                  <i className="bi bi-arrow-down-short" />
                </div>
                <select
                  id="user-age"
                  {...register('age')}
                  className={errors.age ? 'is-invalid' : ''}
                >
                  <option value="" hidden>
                    Izberi letnico rojstva
                  </option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.age && (
                  <p className="invalid-feedback">{errors.age.message}</p>
                )}
              </div>

              <div className="form-group m-b-2">
                <button
                  className="submit-btn"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Dopolnjevanje...'
                    : 'Dokončaj registracijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
}