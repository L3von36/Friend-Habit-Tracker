import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { Friend } from '@/types';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Network } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  avatar?: string;
}

interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

interface NetworkGraphProps {
  friends: Friend[];
  onNodeClick?: (friendId: string) => void;
}

export function NetworkGraph({ friends, onNodeClick }: NetworkGraphProps) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = friends.map(f => ({
      id: f.id,
      name: f.name,
      val: Math.max((f.level || 1) * 2, 2), // Size based on relationship level
      color: f.color?.replace('bg-', '') || (isDark ? '#8b5cf6' : '#6d28d9'),
      avatar: f.avatar
    }));

    const links: GraphLink[] = [];
    const linkSet = new Set<string>();

    friends.forEach(f => {
      // Create explicit connections
      if (f.connectedFriends) {
        f.connectedFriends.forEach(connectedId => {
           // Ensure connection goes both ways or at least one visual link
           const linkId1 = `${f.id}-${connectedId}`;
           const linkId2 = `${connectedId}-${f.id}`;
           if (!linkSet.has(linkId1) && !linkSet.has(linkId2)) {
             links.push({
               source: f.id,
               target: connectedId
             });
             linkSet.add(linkId1);
             linkSet.add(linkId2);
           }
        });
      }

      // Also create connection from introducedBy
      if (f.introducedBy) {
         const linkId1 = `${f.id}-${f.introducedBy}`;
         const linkId2 = `${f.introducedBy}-${f.id}`;
         if (!linkSet.has(linkId1) && !linkSet.has(linkId2)) {
             links.push({
               source: f.id,
               target: f.introducedBy,
               value: 0.2 // Very weak visual link for mere introduction vs active friendship
             });
             linkSet.add(linkId1);
             linkSet.add(linkId2);
         }
      }
    });

    return { nodes, links };
  }, [friends, isDark]);

  // Container dimensions for auto-resize
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const imgCache = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height: height > 0 ? height : 400 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Force simulation adjustments
  const fgRef = useRef<ForceGraphMethods<any, any>>(null);
  
  useEffect(() => {
    const fg = fgRef.current;
    if (fg) {
      // Adjust forces: stronger link attraction, stronger repulsion for unlinked
      // The current type definitions in 'react-force-graph-2d' for d3Force are sometimes missing methods.
      // We cast to any to safely call strength() and distance()
      const chargeForce = fg.d3Force('charge') as any;
      if (chargeForce && chargeForce.strength) chargeForce.strength(-250);
      
      const linkForce = fg.d3Force('link') as any;
      if (linkForce && linkForce.distance) linkForce.distance(60);
    }
  }, [graphData]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onNodeClick && node.id) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  return (
    <Card className="border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden h-full flex flex-col">
       <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-md font-bold">Social Network Constellation</CardTitle>
              <CardDescription className="text-xs">Explore how your friends are connected</CardDescription>
            </div>
          </div>
       </CardHeader>
       <CardContent ref={containerRef} className="p-0 flex-1 relative bg-slate-50/20 dark:bg-slate-950/20 min-h-[400px]">
         {graphData.nodes.length > 0 ? (
            <ForceGraph2D
                ref={fgRef as any}
                graphData={graphData}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const initials = label.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                  const fontSize = 14 / globalScale;
                  const circleRadius = Math.max(8, node.val);
                  
                  // Draw Persistent Name Label Underneath
                  const labelFontSize = 12 / globalScale;
                  ctx.font = `${labelFontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569'; // slate-300 / slate-600
                  ctx.fillText(label, node.x, node.y + circleRadius + (4 / globalScale));

                  // Draw Avatar Image if available
                  if (node.avatar) {
                     let img = imgCache.current[node.id];
                     if (!img) {
                        img = new Image();
                        img.src = node.avatar;
                        imgCache.current[node.id] = img;
                     }
                     
                     // If loaded, draw circular clipped image
                     if (img.complete && img.naturalHeight !== 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                        ctx.clip();
                        ctx.drawImage(img, node.x - circleRadius, node.y - circleRadius, circleRadius * 2, circleRadius * 2);
                        
                        // Draw a subtle border around the avatar
                        ctx.lineWidth = 1.5;
                        ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
                        ctx.stroke();
                        ctx.restore();
                        return; // Node drawn successfully
                     }
                  }

                  // Avatar Fallback: Initials in colored circle
                  const colorMap: Record<string, string> = {
                      'rose-500': '#f43f5e', 'orange-500': '#f97316', 'amber-500': '#f59e0b',
                      'emerald-500': '#10b981', 'teal-500': '#14b8a6', 'cyan-500': '#06b6d4',
                      'sky-500': '#0ea5e9', 'blue-500': '#3b82f6', 'indigo-500': '#6366f1',
                      'violet-500': '#8b5cf6', 'purple-500': '#a855f7', 'fuchsia-500': '#d946ef',
                      'pink-500': '#ec4899',
                  };
                  const color = colorMap[node.color] || (isDark ? '#8b5cf6' : '#6d28d9');

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = color;
                  ctx.fill();
                  
                  // Reset text alignment for initials
                  ctx.textBaseline = 'middle';
                  ctx.font = `bold ${fontSize * 0.8}px Sans-Serif`;
                  ctx.fillStyle = '#ffffff';
                  ctx.fillText(initials, node.x, node.y);
                }}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                  const circleRadius = Math.max(8, node.val);
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                onNodeClick={handleNodeClick}
                linkColor={(link: any) => {
                  const opacity = link.value === 0.2 ? 0.05 : 0.2; // Weaker visual for "introduced by"
                  return isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
                }}
                linkWidth={(link: any) => link.value === 0.2 ? 1 : 2}
                backgroundColor="transparent"
                width={dimensions.width}
                height={dimensions.height}
                d3AlphaDecay={0.02} // Slower decay for smoother settling
                d3VelocityDecay={0.3} // More friction
            />
         ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
               Add some friends to see your constellation.
            </div>
         )}
       </CardContent>
    </Card>
  );
}
