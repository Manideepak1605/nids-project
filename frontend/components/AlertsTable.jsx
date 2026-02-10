"use client";
import { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';
import { ShieldAlert, Info, AlertTriangle } from 'lucide-react';

export default function AlertsTable() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Initial events
    setAlerts(dataService.getRecentEvents().filter(e => e.attack_type !== 'Normal').slice(0, 5));

    const unsubscribe = dataService.subscribe((event) => {
      if (event.attack_type !== 'Normal') {
        setAlerts(prev => [event, ...prev].slice(0, 5));
      }
    });
    return () => unsubscribe();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'high': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      case 'medium': return 'text-violet-400 border-violet-500/50 bg-violet-500/10';
      default: return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
      <h3 className="text-white font-semibold mb-4">
        Attack Surface Overview
      </h3>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="py-10 text-center opacity-30 text-[10px] uppercase font-black tracking-widest">
            No Recent Alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${getSeverityColor(alert.severity)} transition-all animate-in slide-in-from-right duration-500`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight">{alert.attack_type}</span>
                <span className="text-[9px] opacity-70 font-mono">{alert.source_ip} → {alert.destination_ip}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest">{alert.severity}</span>
                {alert.severity === 'Critical' ? <ShieldAlert size={14} className="animate-pulse" /> : <AlertTriangle size={14} />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
