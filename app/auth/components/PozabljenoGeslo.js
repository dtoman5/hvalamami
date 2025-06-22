const handlePosljiZahtevo = async (data) => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/posodobi-geslo`,
    });

    if (error) throw error;

    toast.success("Povezava poslana na e-pošto");
    setEmailSent(true);
  } catch (error) {
    toast.error(error.message || "Napaka pri pošiljanju");
  } finally {
    setLoading(false);
  }
};