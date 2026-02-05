import React, { useEffect, useState } from 'react'
import { dataService } from './services/dataService'
import LiveMetrics from './components/LiveMetrics'
import AttackChart from './components/AttackChart'
import AttackTable from './components/AttackTable'
import ThreatGeography from './components/ThreatGeography'
import AttackMap from './components/AttackMap'
import MitigationList from './components/MitigationList'
import Card from './components/Card' // Added import for Card component
import { Shield, Settings, LayoutDashboard, Database, Activity, Menu, X, ShieldAlert, Globe } from 'lucide-react'
import { DATA_MODE } from './config/dataMode'

function App() {
  const [lastEvent, setLastEvent] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dataService.start();
    const unsubscribe = dataService.subscribe((event) => {
      setLastEvent(event);
    });
    return () => {
      dataService.stop();
      unsubscribe();
    }
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'database':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card glowColor="purple">
              <h2 className="text-xl font-black text-wakanda-accent mb-3 tracking-tighter">DATA ARCHIVE</h2>
              <div className="h-[500px] flex items-center justify-center border-2 border-dashed border-wakanda-purple/20 rounded-xl">
                <div className="text-center">
                  <Database className="mx-auto mb-3 text-wakanda-purple animate-pulse" size={40} />
                  <p className="text-wakanda-purple-glow font-black tracking-widest text-xs uppercase">Initializing Archive Link...</p>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'activity':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card glowColor="purple">
              <h2 className="text-xl font-black text-wakanda-accent mb-3 tracking-tighter">THREAT ANALYSIS</h2>
              <div className="h-[500px] flex items-center justify-center border-2 border-dashed border-wakanda-purple/20 rounded-xl">
                <div className="text-center">
                  <Activity className="mx-auto mb-3 text-wakanda-purple animate-float" size={40} />
                  <p className="text-wakanda-purple-glow font-black tracking-widest text-xs uppercase">Scanning Neural Patterns...</p>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'mitigation':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <MitigationList />
          </div>
        );
      case 'geography':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <ThreatGeography />
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card glowColor="purple">
              <h2 className="text-xl font-black text-wakanda-accent mb-3 tracking-tighter">SYSTEM CONFIG</h2>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between p-3 border-2 border-wakanda-purple/30 rounded-lg bg-black/40">
                  <span className="font-black text-wakanda-accent text-xs uppercase">Data Mode</span>
                  <span className={`text-[10px] px-3 py-1 rounded-md border-2 ${DATA_MODE === 'MOCK' ? 'border-wakanda-accent text-wakanda-accent shadow-vibranium-glow' : 'border-green-500 text-green-500'}`}>
                    {DATA_MODE}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-wakanda-purple/30 rounded-lg bg-black/40">
                  <span className="font-black text-wakanda-accent text-xs uppercase">Security Protocol</span>
                  <span className="text-[10px] px-3 py-1 rounded-md border-2 border-wakanda-gold text-wakanda-gold">LEVEL 5</span>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <LiveMetrics />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AttackMap />
              </div>
              <div className="flex flex-col">
                <AttackTable />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-wakanda-dark text-white relative flex overflow-hidden selection:bg-wakanda-purple selection:text-white">
      {/* Scanline Effect */}
      <div className="scanline"></div>

      {/* Sidebar Overlay (Mobile/Collapsed Table) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar HUD */}
      <nav className={`fixed lg:relative z-40 h-full bg-black/95 border-r-4 border-wakanda-purple/30 flex flex-col py-6 items-center gap-8 transition-all duration-500 ease-in-out backdrop-blur-2xl ${isSidebarOpen ? 'w-24' : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full overflow-hidden'}`}>
        <div className="flex flex-col gap-8 items-center">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'HUB' },
            { id: 'mitigation', icon: ShieldAlert, label: 'BLOCKS' },
            { id: 'geography', icon: Globe, label: 'GEO' },
            { id: 'database', icon: Database, label: 'DATA' },
            { id: 'settings', icon: Settings, label: 'CONF' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setActiveView(id); setIsSidebarOpen(false); }}
              className="group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110"
            >
              <div className={`p-3 rounded-xl border-2 transition-all duration-300 ${activeView === id ? 'bg-wakanda-purple/40 border-wakanda-accent shadow-vibranium-glow' : 'bg-wakanda-dark border-wakanda-purple/20 hover:border-wakanda-accent'}`}>
                <Icon size={22} strokeWidth={activeView === id ? 3 : 2} className={activeView === id ? 'text-wakanda-accent' : 'text-gray-500'} />
              </div>
              <span className={`text-[7px] font-black tracking-widest uppercase transition-colors ${activeView === id ? 'text-wakanda-accent' : 'text-gray-600'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2">
          <Shield className="text-wakanda-purple/40" size={20} />
          <div className="h-1 w-1 bg-wakanda-accent rounded-full animate-pulse shadow-vibranium-glow"></div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 relative overflow-y-auto bg-wakanda-dark/50 transition-all duration-500">
        <header className="flex justify-between items-end mb-8 px-1">
          <div className="flex items-center gap-4">
            {/* Burger Icon */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-wakanda-purple/20 border-2 border-wakanda-purple/40 rounded-lg text-wakanda-accent hover:bg-wakanda-purple/40 transition-all z-50 lg:relative"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-wakanda-accent via-wakanda-purple to-wakanda-blue drop-shadow-xl">
                CYBER OPS
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-[2px] w-12 bg-wakanda-purple animate-pulse rounded-full"></div>
                <p className="text-[9px] text-wakanda-accent tracking-[0.3em] uppercase font-black opacity-90">
                  STATUS: <span className="text-wakanda-gold animate-pulse">OPTIMIZED</span> | NODE_042
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-black/80 px-4 py-2 border-2 border-wakanda-purple/40 rounded-xl items-center gap-3 backdrop-blur-xl shadow-vibranium-glow">
              <span className="text-[10px] text-wakanda-accent uppercase tracking-widest font-black">VIEW</span>
              <span className="text-[9px] px-2 py-0.5 rounded border-2 border-wakanda-accent text-wakanda-accent font-black uppercase">
                {activeView}
              </span>
            </div>
            <div className="text-right text-[9px] text-wakanda-purple-glow font-black font-mono tracking-tighter opacity-60">
              HASH: {lastEvent?.id?.substring(0, 12) || 'LINKING...'}
            </div>
          </div>
        </header>

        {/* View Transition Grid */}
        <div className="max-w-[1700px] mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Frame UI Accents */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-wakanda-purple via-wakanda-accent to-wakanda-blue opacity-20 z-50"></div>
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-wakanda-blue via-wakanda-accent to-wakanda-purple opacity-20 z-50"></div>
    </div>
  )
}

export default App
