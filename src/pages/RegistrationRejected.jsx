// FILE: src/pages/RegistrationRejected.jsx
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiXCircle, FiLogOut, FiRefreshCw } from "react-icons/fi";

export default function RegistrationRejected() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason") || "";
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] opacity-15"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-3xl border border-white/10 p-8 md:p-12 text-center"
          style={{ background: "rgba(30,41,59,0.7)", backdropFilter: "blur(24px)" }}>
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
              <FiXCircle className="text-4xl text-red-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-lg font-black tracking-tighter text-white uppercase">
              CURE<span className="text-emerald-400">VIRTUAL</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">Application Not Approved</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Hello <strong className="text-white">{userName}</strong>, after reviewing your registration we were unable to approve your account at this time.
          </p>
          {reason && (
            <div className="rounded-2xl p-5 mb-6 text-left"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2">Reason:</p>
              <p className="text-sm text-slate-200 leading-relaxed">{reason}</p>
            </div>
          )}
          <p className="text-slate-500 text-xs mb-8">You may re-apply with updated or corrected documentation.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/register")}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
              style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff" }}>
              <FiRefreshCw /> Re-apply
            </button>
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
