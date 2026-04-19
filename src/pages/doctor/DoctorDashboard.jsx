import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Lib/api";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    totalPrescriptions: 0,
    totalMessages: 0,
    activePatients: 0,
    urgentFlags: {
      urgentLabs: 0,
      unsignedNotes: 0,
      lateAppointments: 0,
    },
  });

  const [waitingPatients, setWaitingPatients] = useState([]);

  const doctorId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || localStorage.getItem("name") || "Doctor";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, waitingRes] = await Promise.all([
          api.get(`/doctor/stats`, { params: { doctorId } }),
          api.get(`/doctor/waiting-patients`, { params: { doctorId } }),
        ]);

        if (statsRes?.data) setStats(statsRes.data);
        if (waitingRes?.data) setWaitingPatients(waitingRes.data);
      } catch (err) {
        console.error("Error fetching Dashboard data:", err);
      }
    };
    if (doctorId) fetchData();
  }, [doctorId]);

  return (
    <DashboardLayout role="DOCTOR">
      <div className="space-y-12">
        {/* Urgent Alerts Header */}
        <section className="bg-error-container/20 border border-error/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 animate-pulse-soft">
          <div className="w-14 h-14 bg-error text-white rounded-2xl flex items-center justify-center shadow-lg shadow-error/20">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div className="flex-grow text-center md:text-left">
            <h2 className="font-headline text-xl font-extrabold text-error">Urgent Clinical Action Required</h2>
            <p className="text-on-error-container text-sm font-medium opacity-80">
              You have {stats.urgentFlags?.urgentLabs || 0} critical lab results and {stats.urgentFlags?.unsignedNotes || 0} unsigned clinical notes pending.
            </p>
          </div>
          <button 
            onClick={() => navigate("/doctor/appointments")}
            className="btn-premium bg-error text-white px-8 py-3 rounded-2xl shadow-lg shadow-error/10 hover:brightness-110"
          >
            Review Now
          </button>
        </section>

        {/* Hero & Quick Volume Analytics */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter">
              Good morning, Dr. {userName.split(" ")[0]}
            </h1>
            <p className="text-on-surface-variant text-lg font-medium opacity-80 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              Your practice is fully synchronized.
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Today's Volume</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-2xl font-black text-on-surface">+{stats.totalAppointments}</span>
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
             </div>
          </div>
        </section>

        {/* Core KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            icon="event_available" 
            label="Appointments" 
            value={stats.totalAppointments} 
            sub={`${stats.pendingAppointments} Reminders`} 
            color="primary"
          />
          <KPICard 
            icon="prescriptions" 
            label="Prescriptions" 
            value={stats.totalPrescriptions} 
            sub="Ready to sign" 
            color="secondary"
          />
          <KPICard 
            icon="mail" 
            label="Inquiries" 
            value={stats.totalMessages} 
            sub="3 Urgent" 
            color="tertiary"
          />
          <KPICard 
            icon="group" 
            label="Total Patients" 
            value={stats.activePatients} 
            sub="12 New this week" 
            color="secondary"
          />
        </section>

        {/* Waiting Room & Lobby */}
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-3">
                Virtual Waiting Room
                <span className="bg-primary-container text-primary text-xs px-3 py-1 rounded-full">{waitingPatients.length} Active</span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {waitingPatients.length > 0 ? (
                waitingPatients.map((apt) => (
                  <PatientQueueItem 
                    key={apt.id}
                    name={`${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`}
                    reason={apt.reason || "General Consultation"}
                    time={new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    waitTime="8 Mins"
                    onClick={() => navigate(`/doctor/video-consultation?appointmentId=${apt.id}`)}
                  />
                ))
              ) : (
                <div className="card-premium p-12 text-center opacity-40">
                  <span className="material-symbols-outlined text-6xl mb-4">person_search</span>
                  <p className="font-bold text-lg">No patients in lobby</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="card-premium h-full flex flex-col justify-between bg-surface-container-high border-none shadow-xl">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold text-on-surface">Telehealth Bridge</h3>
                  <p className="text-on-surface-variant font-medium text-sm leading-relaxed mt-2">
                    Start a direct video consultation or join the multi-provider nursing lobby.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/doctor/video-consultation")}
                className="btn-premium-primary w-full py-4 rounded-2xl mt-8"
              >
                Join Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function KPICard({ icon, label, value, sub, color }) {
  const colorMap = {
    primary: "text-primary bg-primary-container/10",
    secondary: "text-secondary bg-secondary-container/10",
    tertiary: "text-tertiary bg-tertiary-fixed/30"
  };

  return (
    <div className="card-premium flex flex-col justify-between hover:scale-[1.02] cursor-pointer">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">{label}</p>
        <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{value}</p>
        <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-4 opacity-60">{sub}</p>
      </div>
    </div>
  );
}

function PatientQueueItem({ name, reason, waitTime, onClick }) {
  return (
    <div className="group card-premium !p-5 flex items-center justify-between hover:bg-surface-container-low transition-all border border-transparent hover:border-primary/10">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-surface-container-highest text-primary rounded-2xl flex items-center justify-center font-black text-xl">
          {name[0]}
        </div>
        <div>
          <h4 className="font-bold text-on-surface text-lg leading-none mb-1">{name}</h4>
          <p className="text-on-surface-variant text-sm font-medium opacity-70 truncate max-w-[200px]">{reason}</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-center hidden sm:block">
          <p className="text-xs font-bold text-on-surface lowercase opacity-60 italic mb-0.5">Wait Time</p>
          <p className="font-headline font-bold text-error">{waitTime}</p>
        </div>
        <button 
          onClick={onClick}
          className="btn-premium bg-primary/10 text-primary hover:bg-primary hover:text-white px-5 py-2.5 rounded-xl text-xs"
        >
          Begin
        </button>
      </div>
    </div>
  );
}

