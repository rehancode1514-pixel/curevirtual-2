import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../Lib/api';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const role = 'PHARMACY';
  const userId = localStorage.getItem('userId');
  const userName =
    localStorage.getItem('userName') ||
    localStorage.getItem('name') ||
    'Pharmacy';

  const [counts, setCounts] = useState({
    incoming: 0,
    ack: 0,
    ready: 0,
    dispensed: 0,
    totalPrescriptions: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/pharmacy/prescriptions', {
          params: { userId },
        });
        const list = res.data?.data || res.data || [];

        const ack = list.filter(
          (x) => x.dispatchStatus === 'ACKNOWLEDGED'
        ).length;
        const ready = list.filter((x) => x.dispatchStatus === 'READY').length;
        const dispensed = list.filter(
          (x) => x.dispatchStatus === 'DISPENSED'
        ).length;
        const incoming = list.filter((x) =>
          ['NONE', 'SENT'].includes(String(x.dispatchStatus))
        ).length;

        setCounts({ incoming, ack, ready, dispensed, totalPrescriptions: list.length });
      } catch (e) {
        console.error('Failed to load pharmacy prescriptions:', e);
      }
    })();
  }, [userId]);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-12">
        {/* Marketplace Fulfillment Header */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tighter uppercase italic">
              Fulfillment <span className="text-primary not-italic">Hub</span>
            </h1>
            <p className="text-on-surface-variant text-lg font-medium opacity-80 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>warehouse</span>
              {userName} Dispensary • Active Node
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Global Throughput</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-2xl font-black text-on-surface">100.0%</span>
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
             </div>
          </div>
        </section>

        {/* Fulfillment Pipeline Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FulfillmentCard 
            icon="inbox_customize" 
            label="Inbound Queue" 
            value={counts.incoming} 
            color="secondary"
            onClick={() => navigate('/pharmacy/prescriptions?status=INCOMING')}
          />
          <FulfillmentCard 
            icon="checklist_rtl" 
            label="Verified Orders" 
            value={counts.ack} 
            color="primary"
            onClick={() => navigate('/pharmacy/prescriptions?status=ACKNOWLEDGED')}
          />
          <FulfillmentCard 
            icon="conveyor_belt" 
            label="Ready for Dispatch" 
            value={counts.ready} 
            color="tertiary"
            onClick={() => navigate('/pharmacy/prescriptions?status=READY')}
          />
          <FulfillmentCard 
            icon="local_shipping" 
            label="Shipped/Dispensed" 
            value={counts.dispensed} 
            color="primary"
            onClick={() => navigate('/pharmacy/prescriptions?status=DISPENSED')}
          />
        </section>

        {/* Operational Grid */}
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="card-premium !p-8 border-l-[12px] border-primary flex flex-col justify-between shadow-2xl">
              <div>
                <h3 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  Operational Logistics Audit
                </h3>
                <p className="text-on-surface-variant font-medium text-sm mt-2 opacity-70">Internal performance synchronization across all nodes.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-10 mt-10 pb-4">
                <LogisticsMetric label="Current Load" value={`${counts.incoming + counts.ack} Active`} subText="Queue units" />
                <LogisticsMetric label="Success Rate" value="100.0%" subText="Fulfillment accuracy" />
                <LogisticsMetric label="Total Lifetime" value={counts.totalPrescriptions} subText="Processed scripts" />
                <LogisticsMetric label="Average TAT" value="12.4m" subText="Turnaround time" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="card-premium !bg-secondary text-white !p-8 flex flex-col justify-between border-none shadow-xl shadow-secondary/20 hover:scale-[1.02] cursor-pointer transition-all">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-bold">Protocol Guard</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed mt-2 italic">
                    "All dispensaries must maintain verified electronic chains of custody."
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/pharmacy/prescriptions")}
                className="w-full py-4 bg-white text-secondary rounded-2xl font-black uppercase text-xs tracking-widest mt-8 shadow-lg shadow-black/10"
              >
                Review Protocols
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FulfillmentCard({ icon, label, value, color, onClick }) {
  const colorMap = {
    primary: "text-primary bg-primary-container/10 border-primary/20",
    secondary: "text-secondary bg-secondary-container/10 border-secondary/20",
    tertiary: "text-tertiary bg-tertiary-fixed/30 border-tertiary/20"
  };

  return (
    <div 
      onClick={onClick}
      className={`card-premium flex flex-col justify-between hover:scale-[1.02] cursor-pointer border-2 ${colorMap[color]}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold opacity-60 tracking-widest uppercase mb-1">{label}</p>
        <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function LogisticsMetric({ label, value, subText }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-black text-outline uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-on-surface">{value}</p>
      <p className="text-[10px] font-bold text-on-surface-variant opacity-50 uppercase">{subText}</p>
    </div>
  );
}

