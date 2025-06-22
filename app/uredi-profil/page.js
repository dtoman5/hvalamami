'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '../../lib/supabase/client';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import Navbar from '../components/Navbar';
import Link from "next/link";

// ——— constants ———
const socialPlatforms = ["tiktok", "instagram", "facebook", "pinterest", "linkedin"];
const DEFAULT_AVATAR = "/default-avatar.png";

// ——— validation schemas ———
const socialLinkSchema = Yup.string()
  .test('is-url-or-empty', 'Vnesite veljaven URL', v => !v || isValidUrl(v))
  .test('matches-platform', 'URL ne ustreza platformi', function(v) {
    if (!v) return true;
    const platform = this.path.split('.')[1];
    return checkPlatformUrl(v, platform);
  });

const profileSchema = Yup.object().shape({
  username: Yup.string()
    .required("Uporabniško ime je obvezno")
    .min(3, "Uporabniško ime mora vsebovati vsaj 3 znake")
    .max(20, "Uporabniško ime ne sme presegati 20 znakov")
    .matches(/^[a-z0-9_-]+$/, "Samo male črke (a-z), številke (0-9), podčrtaj (_) in vezaj (-)")
    .test('username-available','Uporabniško ime je že zasedeno', async function(value) {
      if (!value || value === this.options.context?.initialUsername) return true;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', value)
        .neq('id', this.options.context?.userId || '')
        .maybeSingle();
      return !data;
    }),
  first_name: Yup.string()
    .required("Ime je obvezno")
    .matches(/^[a-zA-Z]+$/, "Ime ne sme vsebovati posebnih znakov"),
  last_name: Yup.string()
    .required("Priimek je obvezen")
    .matches(/^[a-zA-Z]+$/, "Priimek ne sme vsebovati posebnih znakov"),
  bio: Yup.string().max(200, "Opis ne sme presegati 200 znakov"),
  website_url: Yup.string().url("Vnesite veljaven URL"),
  socialLinks: Yup.object().shape(
    socialPlatforms.reduce((acc, plat) => {
      acc[plat] = socialLinkSchema;
      return acc;
    }, {})
  )
});

// ——— helper funcs ———
function isValidUrl(str) {
  try { new URL(str); return true; }
  catch { return false; }
}
function checkPlatformUrl(url, platform) {
  try {
    const host = new URL(url).hostname;
    const domains = {
      tiktok: ['tiktok.com'],
      instagram: ['instagram.com'],
      facebook: ['facebook.com'],
      pinterest: ['pinterest.com'],
      linkedin: ['linkedin.com']
    };
    return domains[platform].some(d => host.includes(d));
  } catch {
    return false;
  }
}

export default function UrediProfilComponent() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    bio: "",
    website_url: "",
    profile_picture: null,
    profile_picture_url: "",
  });
  const [initialProfile, setInitialProfile] = useState(null);

  const [socialLinks, setSocialLinks] = useState(
    socialPlatforms.reduce((o, p) => ({ ...o, [p]: "" }), {})
  );

  const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR);
  const [errors, setErrors] = useState({});

  // 1) on mount, get user & profile row
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/prijava");
      } else {
        setUser(user);
        fetchProfile(user.id);
      }
    });
  }, [router, supabase]);

  // fetch both profile and social links
  async function fetchProfile(userId) {
    try {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (profErr || !prof) throw profErr || new Error("Profil ni najden");

      const { data: socData, error: socErr } = await supabase
        .from("social_media_links")
        .select("platform, link")
        .eq("profile_id", userId);
      if (socErr) throw socErr;

      // map into our state shape
      const socialMap = {};
      socialPlatforms.forEach(plat => {
        const rec = socData.find(s => s.platform === plat);
        socialMap[plat] = rec?.link || "";
      });

      const initProf = {
        username: prof.username || "",
        first_name: prof.first_name || "",
        last_name: prof.last_name || "",
        bio: prof.bio || "",
        website_url: prof.website_url || "",
        profile_picture: null,
        profile_picture_url: prof.profile_picture_url || "",
      };

      setProfile(initProf);
      setInitialProfile({ ...initProf, socialLinks: socialMap });
      setSocialLinks(socialMap);
      setPreviewImage(prof.profile_picture_url || DEFAULT_AVATAR);
    } catch (err) {
      console.error(err);
      toast.error("Napaka pri pridobivanju profila");
    } finally {
      setLoading(false);
    }
  }

  // handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
    setErrors(e => ({ ...e, [name]: "" }));
  };

  const handleSocialChange = e => {
    const { name, value } = e.target;
    setSocialLinks(s => ({ ...s, [name]: value }));
    setErrors(e => ({ ...e, [`socialLinks.${name}`]: "" }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/png","image/jpeg","image/jpg","image/gif","image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Izberite validno sliko (.png,.jpg,.gif,.webp)");
      return;
    }
    if (file.size > 5*1024*1024) {
      toast.error("Slika ne sme presegati 5MB");
      return;
    }
    setProfile(p => ({ ...p, profile_picture: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  function hasProfileChanges() {
    if (!initialProfile) return false;
    const basicChanged =
      profile.username !== initialProfile.username ||
      profile.first_name !== initialProfile.first_name ||
      profile.last_name !== initialProfile.last_name ||
      profile.bio !== initialProfile.bio ||
      profile.website_url !== initialProfile.website_url ||
      profile.profile_picture;
    const socialChanged = socialPlatforms.some(
      plat => socialLinks[plat] !== initialProfile.socialLinks[plat]
    );
    return basicChanged || socialChanged;
  }

  async function compressImage(imageFile) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const size = 300;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = canvas.height = size;
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim)/2;
          const sy = (img.height - minDim)/2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          canvas.toBlob(blob => {
            if (!blob) return resolve(imageFile);
            resolve(new File([blob], `${uuidv4()}.webp`, { type: 'image/webp' }));
          }, 'image/webp', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }

  // save
  async function handleSaveProfile() {
    if (!hasProfileChanges()) {
      toast.info("Ni sprememb za shranjevanje");
      return;
    }
    setIsSaving(true);
    setErrors({});

    try {
      // validate
      await profileSchema.validate(
        { ...profile, socialLinks },
        { abortEarly: false, context: {
            initialUsername: initialProfile.username,
            userId: user.id
          }
        }
      );

      // upload new pic if any
      let newUrl = profile.profile_picture_url;
      if (profile.profile_picture) {
        const img = await compressImage(profile.profile_picture);
        const path = `${user.id}/${uuidv4()}.webp`;
        const { error: upErr } = await supabase
          .storage.from('profile-pictures')
          .upload(path, img);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = await supabase
          .storage.from('profile-pictures')
          .getPublicUrl(path);
        newUrl = publicUrl;

        // delete old
        if (initialProfile.profile_picture_url.includes('storage')) {
          const oldKey = initialProfile.profile_picture_url.split('/profile-pictures/')[1];
          if (oldKey) {
            await supabase.storage.from('profile-pictures').remove([oldKey]);
          }
        }
      }

      // update profiles table
      const { error: profUpErr } = await supabase
        .from('profiles')
        .update({
          username: profile.username.toLowerCase(),
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          website_url: profile.website_url,
          profile_picture_url: newUrl
        })
        .eq('id', user.id);
      if (profUpErr) throw profUpErr;

      // upsert social links
      for (let plat of socialPlatforms) {
        const link = socialLinks[plat];
        if (link) {
          await supabase.from('social_media_links').upsert({
            profile_id: user.id,
            platform: plat,
            link
          }, { onConflict: ['profile_id','platform'] });
        } else {
          await supabase
            .from('social_media_links')
            .delete()
            .eq('profile_id', user.id)
            .eq('platform', plat);
        }
      }

      toast.success("Profil uspešno posodobljen");
      await fetchProfile(user.id);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const valErrs = {};
        err.inner.forEach(e => {
          valErrs[e.path] = e.message;
        });
        setErrors(valErrs);
      } else {
        console.error(err);
        toast.error(err.message || "Napaka pri shranjevanju");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <p>Nalaganje...</p>;

  return (
    <>
      <Navbar />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        pauseOnHover
      />
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">

              <h1>Uredi profil</h1>

              <div className="row-inner-bg row-inner-bg-p">
              <div className="menu-title m-b-1">Convert to a personal account</div>
              <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
              <div className="user-type">
                <Link scroll={false} href="/nadgradi-profil" className="btn-1 1 m-t-2 m-r-3">Nadgradi profil</Link>
                <div className="position-center flex-inline-w-a">
                <div className="user-type-style type-one">
                  <i className="bi bi-bag-check-fill"></i>
                </div>
                <div className="user-type-style type-two">
                  <i className="bi bi-patch-check-fill"></i>
                </div>
                <div className="user-type-style type-three">
                  <i className="bi bi-patch-check-fill"></i>
                </div>
                </div>
              </div>
            </div>

              {/* Profilna slika */}
              <div className="flex-content m-b-1">
                <div className="menu-title">Profilna slika</div>
              </div>
              <div className="change-avatar">
                <div className="profile-avatar">
                  <img
                    src={previewImage}
                    alt="Profilna slika"
                    onError={e => e.currentTarget.src = DEFAULT_AVATAR}
                  />
                </div>
                <div className="change-btn-avatar">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp"
                    id="upload-avatar"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="upload-avatar" className="btn-1 m-l-2">
                    Spremeni sliko
                  </label>
                </div>
              </div>

              {/* Osnovni podatki */}
              <div className="m-b-5">
                <div className="menu-title">Osnovni podatki</div>
                <div className="form-group">
                  <input
                    name="username"
                    value={profile.username}
                    onChange={e => {
                      const v = e.target.value.toLowerCase();
                      setProfile(p => ({ ...p, username: v }));
                      setErrors(e => ({ ...e, username: "" }));
                    }}
                    placeholder="Uporabniško ime"
                    className={errors.username ? "invalid" : ""}
                  />
                  {errors.username && <p className="invalid-feedback">{errors.username}</p>}
                </div>
                <div className="form-group">
                  <input
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    placeholder="Ime"
                    className={errors.first_name ? "invalid" : ""}
                  />
                  {errors.first_name && <p className="invalid-feedback">{errors.first_name}</p>}
                </div>
                <div className="form-group">
                  <input
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    placeholder="Priimek"
                    className={errors.last_name ? "invalid" : ""}
                  />
                  {errors.last_name && <p className="invalid-feedback">{errors.last_name}</p>}
                </div>
              </div>

              {/* BIO in URL povezava */}
              <div className="m-b-5">
                <div className="menu-title">BIO in URL povezava</div>
                <div className="text-length">
                  <span>{200 - (profile.bio?.length || 0)}</span>
                </div>
                <div className="form-group m-t-2">
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="Bio (maks. 200 znakov)"
                    maxLength={200}
                    className={errors.bio ? "invalid" : ""}
                  />
                  {errors.bio && <p className="invalid-feedback">{errors.bio}</p>}
                </div>
                <div className="form-group">
                  <input
                    type="url"
                    name="website_url"
                    value={profile.website_url}
                    onChange={handleChange}
                    placeholder="Vpiši url strani"
                    className={errors.website_url ? "invalid" : ""}
                  />
                  {errors.website_url && <p className="invalid-feedback">{errors.website_url}</p>}
                </div>
              </div>

              {/* Socialna omrežja */}
              <div className="m-b-5">
                <div className="menu-title">Socialna omrežja</div>
                {socialPlatforms.map(plat => (
                  <div className="form-group" key={plat}>
                    <input
                      type="url"
                      name={plat}
                      value={socialLinks[plat]}
                      onChange={handleSocialChange}
                      placeholder={`${plat.charAt(0).toUpperCase() + plat.slice(1)} povezava`}
                      className={errors[`socialLinks.${plat}`] ? "invalid" : ""}
                    />
                    {errors[`socialLinks.${plat}`] && (
                      <p className="invalid-feedback">{errors[`socialLinks.${plat}`]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Change password or deactivate */}
              <div className="row-inner-bg row-inner-bg-p">
                <div className="menu-title m-b-1">Change password or deactivate account</div>
                <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
                <div className="p-t-2 p-b-3">
                  <Link scroll={false} href="/izbrisi-profil" className="btn-2">Izbriši profil</Link>
                  <Link scroll={false} href="/spremeni-geslo" className="btn-1">Spremeni geslo</Link>
                </div>
              </div>

              {/* Shrani gumb */}
              <div className="upgrade-profile text-center">
                <button
                  className="upgrade-btn"
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasProfileChanges()}
                >
                  {isSaving ? "Shranjujem..." : "Shrani spremembe"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}