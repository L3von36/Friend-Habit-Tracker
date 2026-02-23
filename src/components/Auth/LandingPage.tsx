import { Users, Shield, Cloud, BrainCircuit, Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleAuth } from './GoogleAuth';
import { audioService } from '@/lib/audio';

interface LandingPageProps {
  onLogin: (user: { name: string; email: string; picture: string }) => void;
  onContinueAsGuest: () => void;
}

export function LandingPage({ onLogin, onContinueAsGuest }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="max-w-4xl w-full relative z-10 space-y-12 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Friend<span className="text-violet-600">Tracker</span>.
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            The relationship intelligence platform for friends, family, coworkers, and partners. Build deeper connections through data and insights.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <FeatureCard 
            icon={<Activity className="w-6 h-6 text-violet-500" />}
            title="Life Insights"
            description="Track streaks, levels, and relationship health with rich analytics."
          />
          <FeatureCard 
            icon={<Cloud className="w-6 h-6 text-indigo-500" />}
            title="Cloud Sync"
            description="Securely backup your memories and photos to Google Drive."
          />
          <FeatureCard 
            icon={<BrainCircuit className="w-6 h-6 text-purple-500" />}
            title="AI Search"
            description="Find moments using context and meaning, not just keywords."
          />
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-slate-800/50 shadow-2xl w-full max-w-md text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ready to start?</h3>
              <p className="text-sm text-slate-500">Sign in to sync your profile across all your devices.</p>
            </div>
            
            <div className="flex flex-col gap-3">
               <GoogleAuth 
                 onSuccess={(user) => {
                   audioService.playSuccess();
                   onLogin(user);
                 }}
               />
               <div className="relative flex items-center gap-4 my-2">
                 <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                 <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Or</span>
                 <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
               </div>
               <Button 
                 variant="ghost" 
                 onClick={() => {
                   audioService.playClick();
                   onContinueAsGuest();
                 }}
                 className="w-full text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 group"
               >
                 Continue as Guest
                 <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
               </Button>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Your data is yours. We never see your personal details.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 dark:text-slate-700">
           Enterprise-Grade Relationship Management
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/40 dark:bg-slate-800/20 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
