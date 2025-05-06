"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import Navbar from "../components/Navbar";
import Link from "next/link";

const socialPlatforms = ["tiktok", "instagram", "facebook", "pinterest", "linkedin"];
const DEFAULT_AVATAR = "/default-avatar.png";

const socialLinkSchema = Yup.string()
  .test(
    'is-url-or-empty',
    'Vnesite veljaven URL',
    (value) => !value || isValidUrl(value)
  )
  .test(
    'matches-platform',
    'URL ne ustreza platformi',
    function(value) {
      if (!value) return true;
      const platform = this.path.split('.')[1];
      return checkPlatformUrl(value, platform);
    }
  );

const profileSchema = Yup.object().shape({
  username: Yup.string()
    .required("Uporabniško ime je obvezno")
    .min(3, "Uporabniško ime mora vsebovati vsaj 3 znake")
    .max(20, "Uporabniško ime ne sme presegati 20 znakov")
    .matches(
      /^[a-z0-9_-]+$/,
      "Samo male črke (a-z), številke (0-9), podčrtaj (_) in vezaj (-)"
    )
    .test(
      'username-available',
      'Uporabniško ime je že zasedeno',
      async function(value) {
        if (!value || (this.parent.username === this.options.context?.initialUsername)) {
          return true;
        }
        const supabase = createClientComponentClient();
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', value)
          .neq('id', this.options.context?.userId || '')
          .maybeSingle();
        return !data;
      }
    ),
  first_name: Yup.string()
    .required("Ime je obvezno")
    .matches(/^[a-zA-Z]+$/, "Ime ne sme vsebovati posebnih znakov"),
  last_name: Yup.string()
    .required("Priimek je obvezen")
    .matches(/^[a-zA-Z]+$/, "Priimek ne sme vsebovati posebnih znakov"),
  bio: Yup.string()
    .max(200, "Opis ne sme presegati 200 znakov"),
  website_url: Yup.string()
    .url("Vnesite veljaven URL"),
  socialLinks: Yup.object().shape({
    tiktok: socialLinkSchema,
    instagram: socialLinkSchema,
    facebook: socialLinkSchema,
    pinterest: socialLinkSchema,
    linkedin: socialLinkSchema,
  }),
});

const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .required("Geslo je obvezno")
    .min(8, "Geslo mora vsebovati vsaj 8 znakov")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      "Geslo mora vsebovati vsaj eno veliko črko, eno malo črko, eno številko in en poseben znak"
    )
    .test(
      'not-empty',
      'Geslo je obvezno',
      value => !!value && value.trim() !== ''
    ),
  confirmPassword: Yup.string()
    .required("Potrdite geslo")
    .oneOf([Yup.ref("password"), null], "Gesli se morata ujemati")
});

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function checkPlatformUrl(url, platform) {
  try {
    const { hostname } = new URL(url);
    const domains = {
      tiktok: ['tiktok.com'],
      instagram: ['instagram.com'],
      facebook: ['facebook.com'],
      pinterest: ['pinterest.com'],
      linkedin: ['linkedin.com']
    };
    return domains[platform].some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export default function UrediProfilComponent() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    bio: "",
    website_url: "",
    profile_picture: null,
    profile_picture_url: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    tiktok: "",
    instagram: "",
    facebook: "",
    pinterest: "",
    linkedin: "",
  });
  const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [initialProfile, setInitialProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/prijava");
      else {
        setUser(user);
        fetchProfile(user.id);
      }
    });
  }, [router]);

  async function fetchProfile(userId) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        const initialProfileData = {
          username: profileData.username || "",
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          bio: profileData.bio || "",
          website_url: profileData.website_url || "",
          profile_picture_url: profileData.profile_picture_url || "",
        };

        setProfile(initialProfileData);
        setInitialProfile(initialProfileData);
        setPreviewImage(profileData.profile_picture_url || DEFAULT_AVATAR);

        const { data: socialData } = await supabase
          .from("social_media_links")
          .select("platform, link")
          .eq("profile_id", userId);

        const socialMap = {};
        socialPlatforms.forEach((platform) => {
          const link = socialData?.find((s) => s.platform === platform)?.link || "";
          socialMap[platform] = link;
        });

        setSocialLinks(socialMap);
      }
    } catch (error) {
      toast.error("Napaka pri pridobivanju profila");
    } finally {
      setLoading(false);
    }
  }

  const hasProfileChanges = () => {
    if (!initialProfile) return false;
    
    const profileFieldsChanged = 
      profile.username !== initialProfile.username ||
      profile.first_name !== initialProfile.first_name ||
      profile.last_name !== initialProfile.last_name ||
      profile.bio !== initialProfile.bio ||
      profile.website_url !== initialProfile.website_url ||
      profile.profile_picture !== null;

    const socialLinksChanged = socialPlatforms.some(
      platform => socialLinks[platform] !== initialProfile.socialLinks?.[platform]
    );

    return profileFieldsChanged || socialLinksChanged;
  };

  const hasPasswordChanges = () => {
    return password.trim() !== "" || confirmPassword.trim() !== "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [`socialLinks.${name}`]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Izberite sliko v formatu .png, .jpg, .jpeg ali .gif.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Slika ne sme biti večja od 5MB");
        return;
      }

      setPreviewImage(URL.createObjectURL(file));
      setProfile(prev => ({ ...prev, profile_picture: file }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors(prev => ({ ...prev, password: "" }));
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setErrors(prev => ({ ...prev, confirmPassword: "" }));
  };

  const handleSaveProfile = async () => {
    if (!hasProfileChanges()) {
      toast.info("Ni sprememb za shranjevanje");
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const validationContext = {
        initialUsername: initialProfile?.username,
        userId: user?.id
      };

      await profileSchema.validate(
        { ...profile, socialLinks },
        { abortEarly: false, context: validationContext }
      );

      let newImageUrl = profile.profile_picture_url;

      if (profile.profile_picture) {
        const compressedImage = await compressImage(profile.profile_picture);
        const fileExtension = 'webp';
        const filePath = `${user.id}/${uuidv4()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, compressedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = await supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);

        newImageUrl = publicUrl;

        if (initialProfile.profile_picture_url && initialProfile.profile_picture_url.includes("supabase.co/storage/")) {
          const oldPath = initialProfile.profile_picture_url.split("/storage/v1/object/public/profile-pictures/")[1];
          if (oldPath) {
            await supabase.storage.from("profile-pictures").remove([oldPath]);
          }
        }
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          username: profile.username.toLowerCase(),
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          website_url: profile.website_url,
          profile_picture_url: newImageUrl,
        })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      for (const platform of socialPlatforms) {
        if (socialLinks[platform]) {
          await supabase.from("social_media_links").upsert({
            profile_id: user.id,
            platform,
            link: socialLinks[platform],
          }, { onConflict: ["profile_id", "platform"] });
        } else {
          await supabase
            .from("social_media_links")
            .delete()
            .eq("profile_id", user.id)
            .eq("platform", platform);
        }
      }

      toast.success("Profil uspešno posodobljen");
      await fetchProfile(user.id);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        error.inner.forEach((err) => {
          const pathParts = err.path.split('.');
          if (pathParts.length > 1 && pathParts[0] === 'socialLinks') {
            validationErrors[`socialLinks.${pathParts[1]}`] = err.message;
          } else {
            validationErrors[err.path] = err.message;
          }
        });
        setErrors(validationErrors);
      } else {
        toast.error(`Napaka: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!hasPasswordChanges()) {
      toast.info("Ni sprememb gesla za shranjevanje");
      return;
    }

    setIsSavingPassword(true);
    setErrors(prev => ({ ...prev, password: "", confirmPassword: "" }));

    try {
      await passwordSchema.validate(
        { password, confirmPassword },
        { abortEarly: false }
      );

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (error.message.includes('should be different')) {
          throw new Yup.ValidationError(
            'Novo geslo mora biti drugačno od trenutnega',
            null,
            'password'
          );
        }
        throw error;
      }

      toast.success("Geslo uspešno posodobljeno");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        error.inner?.forEach((err) => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else {
        toast.error(`Napaka pri posodabljanju gesla: ${error.message}`);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  async function compressImage(image) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const size = 300;
          canvas.width = size;
          canvas.height = size;

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(
            img,
            sx, sy, minDim, minDim,
            0, 0, size, size
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Napaka pri ustvarjanju blob-a");
                resolve(image);
                return;
              }
              resolve(new File([blob], image.name, { type: 'image/webp' }));
            },
            'image/webp',
            0.7
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(image);
    });
  }

  if (loading) return <p>Nalaganje...</p>;

  return (
    <div>
      <Navbar />
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="m-b-5">
                <h1>Uredi profil</h1>
                <p>Keep your personal details private. Information you add here is visible to anyone who can view your profile.</p>
              </div>

              <div className="m-t-5 m-b-5">
                <div className="flex-content m-b-1">
                  <div className="menu-title">Profilna slika</div>
                </div>
                <div className="change-avatar">
                  <div className="profile-avatar">
                    <img 
                      src={previewImage} 
                      alt="Profilna slika" 
                      onError={(e) => {
                        e.target.src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <div className="change-btn-avatar">
                    <input
                      type="file"
                      accept=".png, .jpg, .jpeg, .gif, .webp"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                      id="upload-avatar"
                    />
                    <label htmlFor="upload-avatar" className="btn-1 m-l-2">
                      Spremeni sliko
                    </label>
                  </div>
                </div>
              </div>

              <div className="m-b-5">
                <div className="m-b-1">
                  <div className="menu-title">Osnovni podatki</div>
                </div>
                <div className="form-group">
                  <input
                    name="username"
                    value={profile.username || ""}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase();
                      setProfile(prev => ({ ...prev, username: value }));
                      setErrors(prev => ({ ...prev, username: "" }));
                    }}
                    placeholder="Uporabniško ime"
                    className={errors.username ? "invalid" : ""}
                  />
                  {errors.username && <p className="invalid-feedback">{errors.username}</p>}
                </div>
                <div className="form-group">
                  <input
                    name="first_name"
                    value={profile.first_name || ""}
                    onChange={handleChange}
                    placeholder="Ime"
                    className={errors.first_name ? "invalid" : ""}
                  />
                  {errors.first_name && <p className="invalid-feedback">{errors.first_name}</p>}
                </div>
                <div className="form-group">
                  <input
                    name="last_name"
                    value={profile.last_name || ""}
                    onChange={handleChange}
                    placeholder="Priimek"
                    className={errors.last_name ? "invalid" : ""}
                  />
                  {errors.last_name && <p className="invalid-feedback">{errors.last_name}</p>}
                </div>
              </div>

              <div className="m-b-5">
                <div className="m-b-1">
                  <div className="menu-title">BIO in URL povezava</div>
                </div>
                <div className="text-length">
                  <span>{200 - (profile.bio?.length || 0)}</span>
                </div>
                <div className="form-group m-t-2">
                  <textarea
                    name="bio"
                    value={profile.bio || ""}
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
                    value={profile.website_url || ""}
                    onChange={handleChange}
                    placeholder="Vpiši url strani"
                    className={errors.website_url ? "invalid" : ""}
                  />
                  {errors.website_url && <p className="invalid-feedback">{errors.website_url}</p>}
                </div>
              </div>

              <div className="m-b-5">
                <div className="m-b-2">
                  <div className="menu-title m-b-1">Socialna omrežja</div>
                  <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
                </div>
                {socialPlatforms.map((platform) => (
                  <div className="form-group" key={platform}>
                    <input
                      type="url"
                      name={platform}
                      value={socialLinks[platform] || ""}
                      onChange={handleSocialChange}
                      placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} povezava`}
                      className={errors[`socialLinks.${platform}`] ? "invalid" : ""}
                    />
                    {errors[`socialLinks.${platform}`] && (
                      <p className="invalid-feedback">{errors[`socialLinks.${platform}`]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="row-inner-bg">
                <div className="menu-title m-b-1">Change password or deactivate account</div>
                <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
                <div className="p-t-2 p-b-3">
                  <Link href="/" className="deactivate-btn">Deaktiviraj profil</Link>
                  <Link href="/spremeni-geslo" className="btn-1">Spremeni geslo</Link>
                </div>
              </div>

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
    </div>
  );
}