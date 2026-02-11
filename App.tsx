
import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Loader2, Info, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import AnalogClock from './components/AnalogClock';
import { TimeZoneInfo } from './types';
import { searchTimeZone, getZoneFact } from './services/geminiService';

const App: React.FC = () => {
  const [clocks, setClocks] = useState<TimeZoneInfo[]>([
    { id: 'local', name: 'Local Time', zone: Intl.DateTimeFormat().resolvedOptions().timeZone, offset: 'Local', isLocal: true }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [fact, setFact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSeconds, setShowSeconds] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update digital clock time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('chronos_clocks');
    if (saved) {
      try {
        setClocks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load clocks");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chronos_clocks', JSON.stringify(clocks));
  }, [clocks]);

  const handleAddClock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const result = await searchTimeZone(searchQuery);
      if (result && result.zone) {
        const newClock: TimeZoneInfo = {
          id: Math.random().toString(36).substr(2, 9),
          name: result.name,
          zone: result.zone,
          offset: result.offset
        };
        
        if (clocks.find(c => c.zone === newClock.zone)) {
          setError("This timezone is already added.");
        } else {
          setClocks(prev => [...prev, newClock]);
          setSearchQuery('');
          
          const newFact = await getZoneFact(newClock.zone, newClock.name);
          setFact(newFact);
        }
      } else {
        setError("Could not find that location.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setIsSearching(false);
    }
  };

  const removeClock = (id: string) => {
    if (id === 'local') return;
    setClocks(prev => prev.filter(c => c.id !== id));
  };

  const updateClockLabel = (id: string, newLabel: string) => {
    setClocks(prev => prev.map(c => c.id === id ? { ...c, name: newLabel } : c));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 md:p-12 transition-colors duration-1000">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
        <div className="text-left">
          <h1 className="text-4xl font-light tracking-tighter text-white flex items-center gap-3">
            CHRONOS
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </h1>
          <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest font-medium">Physically Accurate Motion</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <button 
            onClick={() => setShowSeconds(!showSeconds)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
          >
            {showSeconds ? <ToggleRight className="text-red-500 w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            Seconds Hand
          </button>
          
          <form onSubmit={handleAddClock} className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add city or country..."
              className="bg-neutral-900 border border-neutral-800 rounded-full py-3 px-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all w-full md:w-80 group-hover:border-neutral-600"
            />
            <button 
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black p-2 rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
            {error && (
              <p className="absolute -bottom-6 left-4 text-[10px] text-red-400 uppercase tracking-wider">{error}</p>
            )}
          </form>
        </div>
      </header>

      {/* Main Display */}
      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 items-start justify-items-center">
        {clocks.map((clock) => (
          <div key={clock.id} className="w-full flex flex-col items-center">
            <AnalogClock 
              timezone={clock.zone} 
              label={clock.name}
              size={clock.isLocal ? 280 : 200}
              showSeconds={showSeconds}
              onRemove={clock.isLocal ? undefined : () => removeClock(clock.id)}
              onEditLabel={(newLabel) => updateClockLabel(clock.id, newLabel)}
            />
            
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="px-4 py-1.5 bg-neutral-900/50 rounded-full border border-neutral-800/50 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-neutral-500" />
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                  {clock.isLocal ? clock.zone : clock.offset}
                </span>
              </div>
              
              {/* UTC Offset for non-local added clocks */}
              {!clock.isLocal && clock.offset && (
                <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-600 font-medium">
                  {clock.offset} from UTC
                </span>
              )}

              {/* Digital Local Time Section */}
              {clock.isLocal && (
                <div className="mt-4 flex items-center gap-3 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800/50 shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="mono text-lg font-light tracking-widest text-neutral-200">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Insight Section */}
      {fact && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-4 rounded-2xl flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-2 bg-neutral-800 rounded-lg text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-300 italic">"{fact}"</p>
              <button 
                onClick={() => setFact(null)} 
                className="text-[10px] text-neutral-500 uppercase tracking-widest mt-2 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-auto pt-24 pb-12 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-600 mb-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-neutral-800"></div>
            <span className="text-[10px] uppercase tracking-[0.2em]">High Performance Animation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-neutral-800"></div>
            <span className="text-[10px] uppercase tracking-[0.2em]">Themable CSS Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-neutral-800"></div>
            <span className="text-[10px] uppercase tracking-[0.2em]">AI Location Logic</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-700 font-medium tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Chronos Labs. Modular Design.
        </p>
      </footer>
    </div>
  );
};

export default App;
