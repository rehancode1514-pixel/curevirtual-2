// FILE: src/pages/admin/RegistrationRequests.jsx
// Admin panel for reviewing Doctor & Pharmacy registration requests
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { FiUser, FiCheck, FiX, FiEye, FiRefreshCw, FiDownload } from "react-icons/fi";
import { useSocket } from "../../context/useSocket";
import api from "../../Lib/api";

const STATUS_COLORS = {
  PENDING:  { bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)",  text: "#fbbf24" },
  APPROVED: { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)",  text: "#10b981" },
  REJECTED: { bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.4)",   text: "#ef4444" },
};

const ROLE_COLORS = {
  DOCTOR:   { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#60a5fa" },
  PHARMACY: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#a78bfa" },
};

function Badge({ label, colors }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: "rgba(30,41,59,0.6)", backdropFilter: "blur(12px)", borderColor: `${accent}40` }}>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: accent }}>{label}</p>
      <p className="text-3xl font-black text-white">{value ?? "—"}</p>
    </div>
  );
}

export default function RegistrationRequests() {
  const { socket } = useSocket();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", role: "", page: 1 });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(null);      // detail modal
  const [rejecting, setRejecting] = useState(false);   // rejection textarea visible
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      const { data } = await api.get("/registration-requests", { params });
      setRequests(data.data);
      setMeta(data.meta);
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/registration-requests/stats");
      setStats(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchRequests(); fetchStats(); }, [fetchRequests, fetchStats]);

  // ── Real-time: new request toast ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = ({ role, name }) => {
      toast.info(`📋 New ${role} registration: ${name}`, { autoClose: 6000 });
      fetchRequests();
      fetchStats();
    };
    socket.emit("join_admin_room", { userId: localStorage.getItem("userId") });
    socket.on("new_registration_request", handler);
    return () => socket.off("new_registration_request", handler);
  }, [socket, fetchRequests, fetchStats]);

  // ── Open detail ───────────────────────────────────────────────────────────
  const openDetail = async (req) => {
    try {
      const { data } = await api.get(`/registration-requests/${req.id}`);
      setSelected(data);
      setRejecting(false);
      setRejectionReason("");
    } catch { toast.error("Failed to load request details."); }
  };

  // ── Submit review ─────────────────────────────────────────────────────────
  const submitReview = async (action) => {
    if (action === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/registration-requests/${selected.id}/review`, {
        action,
        rejectionReason: action === "REJECTED" ? rejectionReason.trim() : undefined,
      });
      toast.success(`Request ${action.toLowerCase()} successfully.`);
      setSelected(null);
      fetchRequests();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const submittedData = selected?.submittedData || {};
  const isPdf = selected?.licenseImageUrl?.includes(".pdf") ||
    selected?.licenseFilePath?.endsWith(".pdf");

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            Registration <span className="text-blue-400">Requests</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Doctor & Pharmacy credential verification
          </p>
        </div>
        <button onClick={() => { fetchRequests(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 transition-all">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Review" value={stats.pending} accent="#fbbf24" />
        <StatCard label="Approved Today" value={stats.approvedToday} accent="#10b981" />
        <StatCard label="Total Rejected" value={stats.totalRejected} accent="#ef4444" />
        <StatCard label="Doctors / Pharmacies" value={stats.totalDoctors !== undefined ? `${stats.totalDoctors} / ${stats.totalPharmacies}` : "—"} accent="#a78bfa" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[["", "All Status"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilters(f => ({ ...f, status: val, page: 1 }))}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filters.status === val ? "text-white" : "text-slate-400 border border-white/10 hover:border-white/20"}`}
            style={filters.status === val ? { background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" } : {}}>
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {[["", "All Roles"], ["DOCTOR", "Doctors"], ["PHARMACY", "Pharmacies"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilters(f => ({ ...f, role: val, page: 1 }))}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filters.role === val ? "text-white" : "text-slate-400 border border-white/10 hover:border-white/20"}`}
              style={filters.role === val ? { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)" } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(30,41,59,0.5)", backdropFilter: "blur(12px)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest text-xs">No requests found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Name", "Role", "Submitted", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-xs">{req.user?.firstName} {req.user?.lastName}</p>
                    <p className="text-[10px] text-slate-500">{req.user?.email}</p>
                  </td>
                  <td className="px-6 py-4"><Badge label={req.role} colors={ROLE_COLORS[req.role] || ROLE_COLORS.DOCTOR} /></td>
                  <td className="px-6 py-4 text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><Badge label={req.status} colors={STATUS_COLORS[req.status] || STATUS_COLORS.PENDING} /></td>
                  <td className="px-6 py-4">
                    <button onClick={() => openDetail(req)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 transition-all">
                      <FiEye /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-4 py-2 rounded-xl text-xs font-black text-slate-400 border border-white/10 disabled:opacity-40">← Prev</button>
          <span className="text-xs text-slate-500 font-bold">Page {filters.page} of {meta.totalPages}</span>
          <button disabled={filters.page >= meta.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-4 py-2 rounded-xl text-xs font-black text-slate-400 border border-white/10 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 overflow-y-auto max-h-[90vh]"
            style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(24px)" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  {selected.user?.firstName} {selected.user?.lastName}
                </h2>
                <p className="text-xs text-slate-500">{selected.user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={selected.role} colors={ROLE_COLORS[selected.role] || ROLE_COLORS.DOCTOR} />
                <Badge label={selected.status} colors={STATUS_COLORS[selected.status] || STATUS_COLORS.PENDING} />
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
              </div>
            </div>

            {/* Submitted Data */}
            <div className="p-6 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Submitted Information</p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(submittedData).filter(([k]) => !["password","confirmPassword"].includes(k)).map(([key, val]) => val && (
                  <div key={key}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{key}</p>
                    <p className="text-xs font-bold text-slate-200">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* License Viewer */}
            <div className="p-6 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">License Document</p>
              {selected.licenseImageUrl ? (
                isPdf ? (
                  <div className="rounded-2xl p-4 border border-violet-400/20 text-center" style={{ background: "rgba(139,92,246,0.08)" }}>
                    <p className="text-sm font-bold text-violet-400 mb-3">PDF Document</p>
                    <a href={selected.licenseImageUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                      style={{ background: "linear-gradient(135deg,#8b5cf6,#3b82f6)" }}>
                      <FiDownload /> View / Download PDF
                    </a>
                  </div>
                ) : (
                  <img src={selected.licenseImageUrl} alt="License document" className="w-full rounded-2xl border border-white/10 object-contain max-h-64" />
                )
              ) : (
                <p className="text-xs text-slate-500">No document available</p>
              )}
            </div>

            {/* Actions (only for PENDING) */}
            {selected.status === "PENDING" && (
              <div className="p-6">
                {!rejecting ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => submitReview("APPROVED")} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white disabled:opacity-60 transition-all"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                      {actionLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheck /> Approve</>}
                    </button>
                    <button onClick={() => setRejecting(true)} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                      <FiX /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Rejection Reason *</label>
                    <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3}
                      placeholder="Explain why the application is being rejected..."
                      className="w-full rounded-xl p-4 text-xs font-bold outline-none resize-none"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f1f5f9" }} />
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setRejecting(false); setRejectionReason(""); }}
                        className="py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 border border-white/10">
                        Cancel
                      </button>
                      <button onClick={() => submitReview("REJECTED")} disabled={actionLoading || !rejectionReason.trim()}
                        className="py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                        {actionLoading ? "..." : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
