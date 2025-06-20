"use client";
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { useState, useEffect } from "react";

const supabase = createClient();

export default function PotrdiProfil({ email }) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const fetchResendAttempts = async () => {
      if (email) {
        const { data, error } = await supabase
          .from("resend_confirmation_attempts")
          .select("*")
          .eq("email", email)
          .single();

        if (!error) {
          setResendAttempts(data);
          updateTimeRemaining(data);
        }
      }
    };

    fetchResendAttempts();

    const intervalId = setInterval(() => {
      fetchResendAttempts();
    }, 60000); // Preverjanje vsako minuto

    return () => clearInterval(intervalId);
  }, [email]);

  const updateTimeRemaining = (attempts) => {
    if (attempts) {
      const now = new Date();
      const timeLimit = 24 * 60 * 60 * 1000; // 24 ur v milisekundah
      const nextAttemptTime = new Date(attempts.timestamp).getTime() + timeLimit;
      const remaining = nextAttemptTime - now.getTime();

      setTimeRemaining(remaining > 0 ? remaining : 0);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("E-pošta ni bila najdena.");
      return;
    }

    if (timeRemaining > 0) {
      toast.error("Prosimo, počakajte 24 ur pred ponovnim pošiljanjem.");
      return;
    }

    setIsResending(true);
    try {
      // Preverjanje obstoječih poskusov
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from("resend_confirmation_attempts")
        .select("*")
        .eq("email", email)
        .single();

      if (attemptsError) {
        throw attemptsError;
      }

      const now = new Date();
      const maxAttempts = 3;
      const timeLimit = 60 * 60 * 1000; // 1 ura v milisekundah

      if (existingAttempts) {
        if (existingAttempts.count >= maxAttempts) {
          toast.error("Presegli ste omejitev ponovnih pošiljanj.");
          return;
        }

        const timeDifference = now - new Date(existingAttempts.timestamp);
        if (timeDifference < timeLimit) {
          toast.error("Prosimo, počakajte eno uro pred ponovnim pošiljanjem.");
          return;
        }

        // Posodobitev obstoječega zapisa
        await supabase
          .from("resend_confirmation_attempts")
          .update({ count: existingAttempts.count + 1, timestamp: now })
          .eq("email", email);
      } else {
        // Ustvarjanje novega zapisa
        await supabase.from("resend_confirmation_attempts").insert([
          { email: email, timestamp: now, count: 1 },
        ]);
      }

      // Pošiljanje potrditvene e-pošte
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (resendError) {
        throw resendError;
      }

      toast.success("Potrdilno e-pošto smo poslali ponovno");
    } catch (error) {
      toast.error("Prišlo je do napake pri ponovnem pošiljanju.");
      console.error(error);
    } finally {
      setIsResending(false);
    }
  };


  return (
    <div>
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
            <h1 className="m-b-1">Potrdi svoj račun</h1>
            <p className="m-b-1">
              Na e-pošto <strong>{email}</strong> smo poslali potrditveno sporočilo.
              Preverite svojo e-pošto – povezava v sporočilu vas bo vodila na stran <Link scroll={false} href="/prijava">Prijava</Link>.
            </p>
            <p className="m-b-1">
              Če niste prejeli e-pošte, lahko ponovno pošljete potrditveno sporočilo.
            </p>
            <div className="form-group m-b-2">
              <button 
                className="submit-btn" 
                type="button" 
                onClick={() => router.push("/prijava")}
              >
                Prijavi se zdaj!
              </button>
            </div>
            <div className="right-side-pass m-t-2">
            Nisi prejel/a e-pošte?{" "}
            <a
              onClick={handleResendConfirmation}
              style={{ cursor: "pointer" }}
            >
              {isResending ? "Pošiljanje..." : "Pošlji ponovno"}
            </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}