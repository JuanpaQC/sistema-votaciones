import Button from "../ui/Button";

const LOGIN_BASE = import.meta.env.VITE_LOGIN_BASE ?? "http://localhost:5174";

export default function CTA() {
  // destino al que quieres volver tras iniciar sesión:
  const redirectTo = encodeURIComponent(`${window.location.origin}/dashboard`);
  const loginUrl = `${LOGIN_BASE}/login?redirect=${redirectTo}`;

  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-primary-500/20 to-white/5 p-8 md:p-10 text-center">
        <h3 className="text-2xl md:text-3xl font-semibold">¿Listo para participar?</h3>
        <p className="text-slate-200 mt-2">
          Accede con tu cuenta para validar tu identidad y realizar tu voto cuando el proceso esté disponible.
        </p>
        <a href={loginUrl} className="inline-flex mt-5">
          <Button>Ir al login</Button>
        </a>
      </div>
    </section>
  );
}
