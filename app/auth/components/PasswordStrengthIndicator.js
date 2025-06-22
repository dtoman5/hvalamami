"use client";
export default function PasswordStrengthIndicator({ password }) {
  const requirements = [
    { regex: /.{8,}/, text: "Vsaj 8 znakov" },
    { regex: /[A-Z]/, text: "Vsaj ena velika črka" },
    { regex: /[a-z]/, text: "Vsaj ena mala črka" },
    { regex: /[0-9]/, text: "Vsaj ena številka" },
    { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, text: "Vsaj en poseben znak" }
  ];

  return (
    <div className="password-requirements">
      <p>Geslo mora vsebovati:</p>
      <ul>
        {requirements.map((req, i) => (
          <li key={i} className={req.regex.test(password) ? "valid" : ""}>
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
}