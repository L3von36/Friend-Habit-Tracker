// src/components/Social/MasterWeave.tsx
import React, { useMemo, useState } from 'react';
import type { Friend } from '@/types';
import { LoomLogo } from '../Common/LoomLogo';
import { Card } from '@/components/ui/card';
import { Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MasterWeaveProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

export const MasterWeave: React.FC<MasterWeaveProps> = ({ friends, onSelectFriend }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);

  const filteredFriends = useMemo(() => {
    return friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [friends, searchQuery]);

  // Manual coordinate calculation for rock-solid scaling
  const viewNodes = useMemo(() => {
    const userNode: any = {
      id: 'root-user',
      name: 'YOU',
      x: 400,
      y: 300,
      level: 20,
      color: 'bg-indigo-600',
      isRoot: true,
      connectedFriends: []
    };

    const friendNodes = filteredFriends.map((f, i) => {
      const angle = (i / filteredFriends.length) * Math.PI * 2;
      const radius = 220; 
      return {
        ...f,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        isRoot: false
      } as any;
    });

    const allNodes = [userNode, ...friendNodes];
    return allNodes.map(node => ({
      ...node,
      vx: 400 + (node.x - 400) * zoom,
      vy: 300 + (node.y - 300) * zoom
    }));
  }, [filteredFriends, zoom]);

  const colorMap: Record<string, string> = {
    'bg-rose-500': '#f43f5e',
    'bg-orange-500': '#f97316',
    'bg-amber-500': '#f59e0b',
    'bg-emerald-500': '#10b981',
    'bg-teal-500': '#14b8a6',
    'bg-cyan-500': '#06b6d4',
    'bg-sky-500': '#0ea5e9',
    'bg-blue-500': '#3b82f6',
    'bg-indigo-500': '#6366f1',
    'bg-indigo-600': '#4f46e5',
    'bg-violet-500': '#8b5cf6',
    'bg-purple-500': '#a855f7',
    'bg-fuchsia-500': '#d946ef',
    'bg-pink-500': '#ec4899',
  };

  const connections = useMemo(() => {
    const lines: any[] = [];
    viewNodes.filter((n: any) => !n.isRoot).forEach((node: any) => {
      lines.push({
        id: `root-${node.id}`,
        x1: 400 + (400 - 400) * zoom, // Center
        y1: 300 + (300 - 300) * zoom,
        x2: node.vx, y2: node.vy,
        strength: 6 * zoom
      });

      if (node.connectedFriends) {
        node.connectedFriends.forEach((targetId: string) => {
          const target = viewNodes.find((n: any) => n.id === targetId);
          if (target) {
            lines.push({
              id: `${node.id}-${target.id}`,
              x1: node.vx, y1: node.vy,
              x2: target.vx, y2: target.vy,
              strength: 3 * zoom
            });
          }
        });
      }
    });
    return lines;
  }, [viewNodes, zoom]);

  return (
    <Card className="w-full h-[600px] bg-slate-100 dark:bg-slate-950 border-0 overflow-hidden relative flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative z-20 shadow-md">
        <div className="flex items-center gap-3">
          <LoomLogo className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">The Master Weave</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search connections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1)} className="text-[10px] font-bold px-2 min-w-[40px] text-center hover:text-indigo-600">{(zoom * 100).toFixed(0)}%</button>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden bg-white dark:bg-slate-950">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background grid - scaled manually */}
          <defs>
            <pattern id="grid" width={40 * zoom} height={40 * zoom} patternUnits="userSpaceOnUse">
              <path d={`M ${40*zoom} 0 L 0 0 0 ${40*zoom}`} fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-200 dark:text-slate-800" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Connection Lines (Threads) */}
          {connections.map(line => (
            <line 
              key={line.id}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="#6366f1"
              strokeWidth={Math.max(line.strength, 1)}
              strokeOpacity="0.4"
              strokeDasharray={line.id.startsWith('root') ? "6 4" : ""}
              strokeLinecap="round"
            />
          ))}

          {/* Nodes (Friends) */}
          {viewNodes.map((node: any) => (
            <g 
              key={node.id} 
              className="group cursor-pointer"
              onClick={() => !node.isRoot && onSelectFriend(node)}
            >
              {/* Visual Anchor Aura */}
              <circle 
                cx={node.vx} cy={node.vy} 
                r={(node.isRoot ? 50 : 40) * Math.sqrt(zoom)} 
                fill={node.color ? (colorMap[node.color] || '#6366f1') : '#6366f1'}
                fillOpacity="0.1"
                className={node.isRoot ? "animate-pulse" : ""}
              />
              
              {/* Main Node */}
              <circle 
                cx={node.vx} cy={node.vy} 
                r={(node.isRoot ? 35 : 28) * Math.sqrt(zoom)} 
                fill={node.color ? (colorMap[node.color] || '#6366f1') : '#6366f1'}
                stroke="white"
                strokeWidth={5 * Math.sqrt(zoom)}
                className="transition-transform duration-300 group-hover:scale-110"
                style={{ transformOrigin: `${node.vx}px ${node.vy}px` }}
              />

              {/* Name Label */}
              <text 
                x={node.vx} y={node.vy + (node.isRoot ? 70 : 60) * Math.sqrt(zoom)} 
                textAnchor="middle" 
                className="fill-slate-900 dark:fill-white uppercase tracking-tighter"
                style={{ 
                  fontSize: `${16 * Math.sqrt(zoom)}px`, 
                  fontWeight: '900',
                  paintOrder: 'stroke', 
                  stroke: 'white', 
                  strokeWidth: 4 * Math.sqrt(zoom), 
                  strokeLinejoin: 'round' 
                }}
              >
                {node.name}
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-xl shadow-xl text-[10px] border border-slate-100 dark:border-slate-800 max-w-[180px]">
          <p className="font-bold text-indigo-600 mb-1 uppercase tracking-widest">Weaver's Compass</p>
          <p className="text-slate-500 leading-relaxed">Nodes represent your friends. Threads show connections. Circle size reflects relationship depth.</p>
        </div>
      </div>
    </Card>
  );
};
