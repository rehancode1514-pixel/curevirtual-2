import React from "react";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function HealthHistory() {
  const records = [
    { id: 1, type: "Cardiology", provider: "Dr. Sarah Jenkins", date: "Oct 12, 2025", note: "Echocardiogram results within normal limits. Continued observation recommended.", icon: "favorite" },
    { id: 2, type: "Hematology", provider: "General Hospital Labs", date: "Sep 28, 2025", note: "Routine blood work completed. Hemoglobin levels normalized.", icon: "bloodtype" },
    { id: 3, type: "Telehealth", provider: "Online Nursing Support", date: "Sep 05, 2025", note: "Initial consultation for prescription renewal. All systems clear.", icon: "videocam" },
  ];

  return (
    <DashboardLayout role="PATIENT">
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tighter">Health History</h1>
          <p className="text-on-surface-variant font-medium opacity-80 text-lg">A visual narrative of your medical journey.</p>
        </section>

        {/* Timeline Visualization */}
        <div className="relative pl-12 space-y-12 ml-6">
          {/* Vertical Trace Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-tertiary rounded-full opacity-20"></div>

          {records.map((record) => (
            <div key={record.id} className="relative group">
              {/* Timeline Horizontal Connector */}
              <div className="absolute -left-12 top-8 w-12 h-0.5 bg-outline-variant/30"></div>
              
              {/* Timeline Badge */}
              <div className="absolute -left-[60px] top-4 w-10 h-10 rounded-2xl bg-white shadow-xl border border-outline-variant/30 flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{record.icon}</span>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Date Sidecar */}
                <div className="md:w-32 flex-shrink-0 pt-6">
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest">{record.date.split(",")[1].trim()}</p>
                   <p className="text-lg font-extrabold text-on-surface leading-none">{record.date.split(",")[0]}</p>
                </div>

                {/* Content Card */}
                <div className="flex-1 card-premium !p-8 border border-transparent hover:border-primary/10 transition-all hover:bg-surface-container-low">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface">{record.type}</h3>
                        <p className="text-primary font-bold text-sm flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          {record.provider}
                        </p>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary/10 transition-all group">
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">download</span>
                      </button>
                   </div>
                   <p className="text-on-surface-variant font-medium text-sm leading-relaxed max-w-[600px] italic">
                     "{record.note}"
                   </p>
                   
                   <div className="mt-8 pt-8 border-t border-outline-variant/30 flex gap-4">
                      <div className="px-4 py-2 bg-surface-container-high rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Verified Record</div>
                      <div className="px-4 py-2 bg-secondary-container/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-secondary">HIPAA Secure</div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
