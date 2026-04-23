// FILE: src/pages/PendingApproval.jsx
// Shown to DOCTOR/PHARMACY users after OTP verification while awaiting admin review
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiLogOut, FiCheckCircle, FiMail } from "react-icons/fi";
import { useSocket } from "../context/useSocket";

export default function PendingApproval() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "User";
  const role = localStorage.getItem("role") || "DOCTOR";
  const email = localStorage.getItem("email") || "";

  // Listen for real-time approval status changes
  useEffect(() => {
    if (!socket) return;
    const handler = ({ status, rejectionReason }) => {
      if (status === "APPROVED") {
        navigate("/login?approved=1");
      } else if (status === "REJECTED") {
        navigate(`/registration-rejected?reason=${encodeURIComponent(rejectionReason || "")}`);
      }
    };
    socket.on("approval_status_changed", handler);
    return () => socket.off("approval_status_changed", handler);
  }, [socket, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const roleLabel = role === "DOCTOR" ? "Doctor" : "Pharmacy";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* Atmospheric glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Glassmorphic Card */}
        <div className="rounded-3xl border border-white/10 p-8 md:p-12 text-center"
          style={{ background: "rgba(30,41,59,0.7)", backdropFilter: "blur(24px)" }}>

          {/* Animated Clock Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", border: "2px solid rgba(99,179,237,0.3)" }}>
                <FiClock className="text-4xl text-blue-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-xs font-black text-black">!</span>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/images/logo/Asset3.png" alt="Logo" className="w-8 h-8" onError={(e) => { e.target.style.display = "none"; }} />
            <span className="text-lg font-black tracking-tighter text-white uppercase">
              CURE<span className="text-emerald-400">VIRTUAL</span>
            </span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight mb-3">Account Under Review</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Our admin team is reviewing your credentials. You will receive an email once approved.
            This usually takes <strong className="text-white">24–48 hours</strong>.
          </p>

          {/* Submitted Info Summary */}
          <div className="rounded-2xl p-5 mb-8 text-left space-y-3"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4">Submission Summary</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                <FiCheckCircle className="text-emerald-400 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Full Name</p>
                <p className="text-sm font-bold text-white">{userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                <FiCheckCircle className="text-violet-400 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Role</p>
                <p className="text-sm font-bold text-white">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.2)" }}>
                <FiCheckCircle className="text-blue-400 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">License Document</p>
                <p className="text-sm font-bold text-emerald-400">✓ Uploaded</p>
              </div>
            </div>
            {email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(251,191,36,0.15)" }}>
                  <FiMail className="text-amber-400 text-sm" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Notification Email</p>
                  <p className="text-sm font-bold text-white">{email}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs mb-8 leading-relaxed">
            We'll notify you at <strong className="text-slate-300">{email || "your email"}</strong> once your account is reviewed.
            Do not log in with another account in the meantime.
          </p>

          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
