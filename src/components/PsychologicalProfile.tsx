import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, ShieldAlert, Fingerprint, Activity, Lock } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import type { Friend, Event, Memory } from '@/types';
import { generatePsychologicalProfile } from '@/lib/profiling';

interface PsychologicalProfileProps {
  friend: Friend;
  events: Event[];
  memories: Memory[];
}

export function PsychologicalProfile({ friend, events, memories }: PsychologicalProfileProps) {
  const profile = useMemo(() => 
    generatePsychologicalProfile(friend, events, memories), 
    [friend, events, memories]
  );

  const traitsData = [
    { subject: 'Openness', A: profile.traits.openness, fullMark: 100 },
    { subject: 'Conscientiousness', A: profile.traits.conscientiousness, fullMark: 100 },
    { subject: 'Extraversion', A: profile.traits.extraversion, fullMark: 100 },
    { subject: 'Agreeableness', A: profile.traits.agreeableness, fullMark: 100 },
    { subject: 'Neuroticism', A: profile.traits.neuroticism, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Fingerprint className="w-6 h-6 text-violet-500" />
           <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Behavioral Dossier</h2>
        </div>
        <Badge variant={profile.confidence > 70 ? 'default' : 'secondary'} className="bg-slate-700 hover:bg-slate-600">
           CONFIDENCE: {profile.confidence}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Archetype & Communication Card */}
        <Card className="border-l-4 border-l-violet-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-slate-500" />
              Core Identity
            </CardTitle>
            <CardDescription>Primary behavioral patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Archetype</p>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{profile.archetype}</p>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Communication Style</p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${profile.communicationStyle === 'Direct' ? 'bg-blue-100 text-blue-700' : 
                    profile.communicationStyle === 'Aggressive' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'}`}>
                  {profile.communicationStyle}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Dominant Core Values</p>
              <div className="flex flex-wrap gap-2">
                {profile.coreValues.map(value => (
                  <Badge key={value} variant="outline" className="border-slate-400 text-slate-600">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Big 5 Radar Chart */}
        <Card className="shadow-md">
          <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <Activity className="w-5 h-5 text-slate-500" />
               Big 5 Traits
             </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={traitsData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Subject"
                  dataKey="A"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors & Red Section */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5" />
            Vulnerabilities & Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Risk Factors</p>
                 <ul className="space-y-1">
                   {profile.riskFactors.map((risk, i) => (
                     <li key={i} className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                       {risk}
                     </li>
                   ))}
                 </ul>
              </div>
              <div>
                 <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Stress Triggers</p>
                 <ul className="space-y-1">
                   {profile.stressTriggers.map((trigger, i) => (
                     <li key={i} className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                       {trigger}
                     </li>
                   ))}
                 </ul>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
        <Lock className="w-3 h-3" />
        <span>CONFIDENTIAL ANALYSIS • EYE EYES ONLY • GENERATED LOCALLY</span>
      </div>
    </div>
  );
}
