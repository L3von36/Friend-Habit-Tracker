import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight, ChevronLeft, Heart, X, Sparkles, TrendingUp, Calendar, Zap, Award, Users } from 'lucide-react';
import type { Friend, Event } from '@/types';
import { CATEGORIES } from '@/types';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { audioService } from '@/lib/audio';
import { callGroq, getGroqApiKey } from '@/lib/groq';

// Friendship Wrapped Experience
interface WrappedProps {
  friends: Friend[];
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function RelationshipWrapped({ friends, events, isOpen, onClose, userName = 'Me' }: WrappedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Compute Stats
  const stats = useMemo(() => {
    if (!events.length || !friends.length) return null;

    // 1. Total events & friends
    const totalEvents = events.length;
    const totalFriends = friends.length;

    // 2. Top Friend (most events)
    const friendCounts = events.reduce((acc, e) => {
      acc[e.friendId] = (acc[e.friendId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let topFriendId = '';
    let maxEvents = 0;
    Object.entries(friendCounts).forEach(([id, count]) => {
      if (count > maxEvents) {
        maxEvents = count;
        topFriendId = id;
      }
    });
    const topFriend = friends.find(f => f.id === topFriendId);

    // 3. Top Category
    const catCounts = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let topCategoryKey = '';
    let maxCat = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > maxCat) {
        maxCat = count;
        topCategoryKey = cat;
      }
    });
    const topCategory = CATEGORIES[topCategoryKey as keyof typeof CATEGORIES];

    // 4. Longest Streak
    let longestStreakVal = 0;
    let streakFriend: Friend | null = null;
    friends.forEach(f => {
      if (f.streak > longestStreakVal) {
        longestStreakVal = f.streak;
        streakFriend = f;
      }
    });

    // 5. Vibes (Sentiment ratio)
    const positive = events.filter(e => e.sentiment === 'positive').length;
    const vibesPercentage = Math.round((positive / totalEvents) * 100);

    return {
      totalEvents,
      totalFriends,
      topFriend,
      topFriendEvents: maxEvents,
      topCategory,
      longestStreakVal,
      streakFriend,
      vibesPercentage
    };
  }, [friends, events]);

  // Generate AI Summary on last slide
  useEffect(() => {
    const generateSummary = async () => {
      if (currentSlide === 5 && !aiSummary && stats && getGroqApiKey() && !isGeneratingAi) {
        setIsGeneratingAi(true);
        try {
          const prompt = `You are an AI generating a "Spotify Wrapped" style end-of-year summary for a user's friendships.
          Stats:
          - User's name is ${userName}
          - Total Friends tracked: ${stats.totalFriends}
          - Total Moments shared: ${stats.totalEvents}
          - Best Friend (most interactions): ${stats.topFriend?.name || 'someone'} (${stats.topFriendEvents} moments)
          - Top Activity Category: ${stats.topCategory?.label}
          - Longest Streak: ${stats.longestStreakVal} days with ${((stats.streakFriend as unknown) as Friend)?.name || 'someone'}
          - Positive Vibes: ${stats.vibesPercentage}% of all interactions were positive.

          Write a short, punchy, fun, and heartwarming 3-sentence summary celebrating their year of friendships. Speak directly to the user.`;

          const response = await callGroq([
             { role: 'system', content: 'You are an enthusiastic friendship wrapped generator.' },
             { role: 'user', content: prompt }
          ], { temperature: 0.7, max_tokens: 150 });

          if (response) {
            setAiSummary(response.trim());
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsGeneratingAi(false);
        }
      }
    };
    generateSummary();
  }, [currentSlide, stats, aiSummary, isGeneratingAi, userName]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setAiSummary(null);
    }
  }, [isOpen]);

  if (!stats) return null;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      audioService.playClick();
      setCurrentSlide(p => p + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      audioService.playClick();
      setCurrentSlide(p => p - 1);
    }
  };

  const handleExport = async () => {
    if (!slideRef.current) return;
    setIsExporting(true);
    audioService.playClick();
    toast.info("Generating shareable image...");
    
    try {
      const canvas = await html2canvas(slideRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `friend-tracker-wrapped-${new Date().getFullYear()}.png`;
      link.click();
      toast.success("Image saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate image");
    } finally {
      setIsExporting(false);
    }
  };

  const slides = [
    // Slide 0: Intro
    <div key="0" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
      <Sparkles className="w-20 h-20 text-yellow-300 animate-pulse" />
      <div>
        <h2 className="text-5xl font-black mb-4 tracking-tight drop-shadow-md">Your Year in Connection</h2>
        <p className="text-xl text-violet-100 font-medium max-w-sm mx-auto">Ready to see how your relationships grew this year?</p>
      </div>
    </div>,

    // Slide 1: Totals
    <div key="1" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
      <div className="flex gap-4">
         <Users className="w-16 h-16 text-emerald-100" />
         <Calendar className="w-16 h-16 text-emerald-100" />
      </div>
      <div>
        <p className="text-xl text-emerald-100 font-medium mb-2">This year, you tracked</p>
        <h2 className="text-7xl font-black mb-2 drop-shadow-lg">{stats.totalEvents}</h2>
        <p className="text-2xl font-bold mb-6">Moments</p>
        <p className="text-lg opacity-90">across <span className="font-bold">{stats.totalFriends}</span> amazing friends.</p>
      </div>
    </div>,

    // Slide 2: Top Friend
    <div key="2" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gradient-to-br from-pink-500 to-rose-700 text-white">
      <Heart className="w-20 h-20 text-pink-200 animate-bounce" />
      <div>
        <p className="text-xl text-pink-100 font-medium mb-4">You spent the most time with...</p>
        <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm border-4 border-white/30">
           <span className="text-5xl font-black">{stats.topFriend?.name.substring(0,2).toUpperCase()}</span>
        </div>
        <h2 className="text-5xl font-black mb-2 drop-shadow-md">{stats.topFriend?.name}</h2>
        <p className="text-xl opacity-90">Sharing <span className="font-bold">{stats.topFriendEvents}</span> incredible moments together.</p>
      </div>
    </div>,

    // Slide 3: Vibe & Category
    <div key="3" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gradient-to-br from-amber-500 to-orange-700 text-white">
      <TrendingUp className="w-20 h-20 text-amber-100" />
      <div>
        <p className="text-xl text-amber-100 font-medium mb-2">Your friendship vibe was</p>
        <h2 className="text-7xl font-black mb-4 drop-shadow-lg">{stats.vibesPercentage}%</h2>
        <p className="text-2xl font-bold mb-8">Positive energy! ☀️</p>
        <p className="text-lg opacity-90 max-w-sm mx-auto">
          Most of your time was spent focusing on <span className="font-bold bg-white/20 px-2 py-1 rounded inline-flex items-center gap-1">{stats.topCategory?.icon} {stats.topCategory?.label}</span>
        </p>
      </div>
    </div>,

    // Slide 4: Streak
    <div key="4" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-gradient-to-br from-blue-500 to-indigo-800 text-white">
      <Zap className="w-20 h-20 text-yellow-300" />
      <div>
        <p className="text-xl text-blue-100 font-medium mb-2">You kept the fire burning</p>
        <h2 className="text-7xl font-black mb-4 drop-shadow-lg">{stats.longestStreakVal} <span className="text-4xl">Days</span></h2>
        <p className="text-2xl font-bold mb-6">Longest Streak</p>
        <p className="text-lg opacity-90">Achieved with <span className="font-bold">{((stats.streakFriend as unknown) as Friend)?.name || 'someone'}</span>. Unstoppable!</p>
      </div>
    </div>,

    // Slide 5: Summary
    <div key="5" className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <Award className="w-16 h-16 text-violet-400 mx-auto mb-6" />
        <h2 className="text-4xl font-black mb-8 bg-gradient-to-r from-violet-400 to-pink-400 text-transparent bg-clip-text">Your Friendship Era</h2>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8 min-h-[160px] flex items-center justify-center shadow-2xl">
           {isGeneratingAi ? (
              <div className="flex flex-col items-center gap-3">
                 <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                 <p className="text-sm text-violet-300">AI is writing your summary...</p>
              </div>
           ) : aiSummary ? (
              <p className="text-lg font-medium leading-relaxed italic">"{aiSummary}"</p>
           ) : (
              <p className="text-lg font-medium leading-relaxed italic">"A year full of growth, shared moments, and beautiful connections. Here's to being an amazing friend."</p>
           )}
        </div>

        <div className="flex gap-4 justify-center">
            <Button onClick={handleExport} disabled={isExporting} className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold px-8">
               {isExporting ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
               Save Image
            </Button>
        </div>
      </div>
    </div>
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[400px] h-[700px] p-0 border-0 bg-transparent shadow-2xl overflow-hidden rounded-[2.5rem]">
        <DialogTitle className="sr-only">Friendship Wrapped</DialogTitle>
        
        {/* Main Content Area to Capture */}
        <div ref={slideRef} className="w-full h-full relative bg-slate-900">
           {slides[currentSlide]}
           
           {/* Watermark for export */}
           <div className="absolute bottom-4 left-0 right-0 text-center opacity-50 text-[10px] text-white font-medium tracking-widest hidden group-export:block">
              FRIEND TRACKER WRAPPED
           </div>
        </div>

        {/* Navigation Layers (not captured in export easily if we export the slideRef only) */}
        {!isExporting && (
           <>
              <div className="absolute top-6 left-0 right-0 px-6 flex items-center justify-between z-50">
                <div className="flex gap-1.5 flex-1 mr-8">
                  {slides.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                         className={`h-full bg-white transition-all duration-300 ease-out ${
                           i < currentSlide ? 'w-full' : i === currentSlide ? 'w-full origin-left animate-progress' : 'w-0'
                         }`} 
                      />
                    </div>
                  ))}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentSlide > 0 && (
                 <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-start group z-40">
                    <ChevronLeft className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                 </button>
              )}
              
              {currentSlide < slides.length - 1 && (
                 <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-end group z-40">
                    <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white transition-colors animate-pulse" />
                 </button>
              )}
              
              {/* Invisible overlays for tap-to-advance (Instagram Stories style) */}
              <div className="absolute inset-y-16 inset-x-0 flex z-30">
                 <div className="flex-1" onClick={handlePrev} />
                 <div className="flex-[2]" onClick={handleNext} />
              </div>
           </>
        )}
      </DialogContent>
    </Dialog>
  );
}
