"use client";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function GesloZamenjanoPage() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/uredi-profil"); // Preusmeri na stran za urejanje profila
  };

  return (
    <>
    < Navbar />
    <div className="center-position">
      <div className="right-side-content">
        <div className="right-side-text text-center">
          <h1 className="m-b-1">Geslo je bilo uspešno spremenjeno!</h1>
          <p>Vaše geslo je bilo uspešno spremenjeno. Bodite pozorni, da ga ne delite z nikomer in shranite v varen zapisnik.</p>
          <p>Za večjo varnost priporočamo, da redno spreminjate gesla in uporabljate edinstvena gesla za različne račune.</p>
          <p>Skrbimo za vašo varnost in zasebnost, zato smo poskrbeli, da je sprememba gesla popolnoma varna.</p>
          
          <div className="form-group m-b-2">
            <button
              className="submit-btn"
              onClick={handleRedirect}
            >
              Nadaljuj z urejanjem profila
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}