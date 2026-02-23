import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { Friend } from '@/types';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const colorMap: Record<string, string> = {
  'rose-500': '#f43f5e', 'orange-500': '#f97316', 'amber-500': '#f59e0b',
  'emerald-500': '#10b981', 'teal-500': '#14b8a6', 'cyan-500': '#06b6d4',
  'sky-500': '#0ea5e9', 'blue-500': '#3b82f6', 'indigo-500': '#6366f1',
  'violet-500': '#8b5cf6', 'purple-500': '#a855f7', 'fuchsia-500': '#d946ef',
  'pink-500': '#ec4899',
};

export function NetworkGraph({ friends, onNodeClick }: NetworkGraphProps) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [pulse, setPulse] = useState(1);

  // Gentle pulse animation for nodes
  useEffect(() => {
    let animationFrame: number;
    const animate = (time: number) => {
      setPulse(1 + Math.sin(time / 500) * 0.05);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

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
  const fgRef = useRef<ForceGraphMethods>(null);
  
  useEffect(() => {
    const fg = fgRef.current;
    if (fg) {
      const chargeForce = fg.d3Force('charge') as any;
      if (chargeForce && chargeForce.strength) chargeForce.strength(-250);
      
      const linkForce = fg.d3Force('link') as any;
      if (linkForce && linkForce.distance) linkForce.distance(60);
    }
  }, [graphData]);

  const handleFitView = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onNodeClick && node.id) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      graphData.links.forEach((link: any) => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }
      });
    }

    setHoverNode(node || null);
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  }, [graphData]);

  const handleLinkHover = useCallback((link: any) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  }, []);

  return (
    <Card className="border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden h-full flex flex-col">
       <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-md font-bold">Social Network Constellation</CardTitle>
              <CardDescription className="text-xs">Explore how your connections are linked</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFitView}
            className="ml-auto text-xs h-8 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            Center & Fit
          </Button>
       </CardHeader>
       <CardContent ref={containerRef} className="p-0 flex-1 relative bg-black min-h-[400px]">
         {/* Cinematic Starfield Background */}
         <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
         <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:60px_60px]" />
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />
         <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
         {graphData.nodes.length > 0 ? (
             <ForceGraph2D
                ref={fgRef as any}
                graphData={graphData}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.name;
                  const initials = label.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                  const fontSize = 14 / globalScale;
                  const isHighlighted = highlightNodes.has(node);
                  const isHovered = hoverNode === node;
                  const circleRadius = Math.max(8, node.val) * (isHovered ? 1.2 : pulse);
                  
                  // Draw Glow/Bloom Effect
                  const baseColor = colorMap[node.color] || (isDark ? '#818cf8' : '#4f46e5');
                  
                  ctx.save();
                  if (isHighlighted || isHovered) {
                    ctx.shadowBlur = 15 / globalScale;
                    ctx.shadowColor = baseColor;
                  } else {
                    ctx.globalAlpha = highlightNodes.size > 0 ? 0.2 : 1;
                    ctx.shadowBlur = 5 / globalScale;
                    ctx.shadowColor = baseColor;
                  }

                  // Draw Persistent Name Label Underneath
                  const labelFontSize = 12 / globalScale;
                  ctx.font = `${isHovered ? 'bold' : 'normal'} ${labelFontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = '#f8fafc'; // Always light on dark background
                  ctx.fillText(label, node.x, node.y + circleRadius + (6 / globalScale));

                  // Draw Avatar/Circle
                  if (node.avatar) {
                     let img = imgCache.current[node.id];
                     if (!img) {
                        img = new Image();
                        img.src = node.avatar;
                        imgCache.current[node.id] = img;
                     }
                     
                     if (img.complete && img.naturalHeight !== 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                        ctx.clip();
                        ctx.drawImage(img, node.x - circleRadius, node.y - circleRadius, circleRadius * 2, circleRadius * 2);
                        
                        ctx.lineWidth = (isHovered ? 3 : 1.5) / globalScale;
                        ctx.strokeStyle = isHovered ? '#ffffff' : baseColor;
                        ctx.stroke();
                        ctx.restore();
                        ctx.restore();
                        return;
                     }
                  }

                  // Avatar Fallback
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = baseColor;
                  ctx.fill();
                  
                  if (isHovered) {
                    ctx.lineWidth = 3 / globalScale;
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();
                  }

                  ctx.textBaseline = 'middle';
                  ctx.font = `bold ${fontSize * 0.8}px Sans-Serif`;
                  ctx.fillStyle = '#ffffff';
                  ctx.fillText(initials, node.x, node.y);
                  ctx.restore();
                }}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                  const circleRadius = Math.max(8, node.val);
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, circleRadius, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                onLinkHover={handleLinkHover}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={d => (highlightLinks.has(d) ? 0.01 : 0.003)}
                linkDirectionalParticleWidth={d => (highlightLinks.has(d) ? 4 : 2)}
                linkDirectionalParticleColor={() => isDark ? '#a5b4fc' : '#6366f1'}
                linkColor={(link: any) => {
                  if (highlightLinks.size > 0 && !highlightLinks.has(link)) {
                    return isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
                  }
                  const opacity = link.value === 0.2 ? 0.1 : 0.3;
                  return isDark ? `rgba(165,180,252,${opacity})` : `rgba(79,70,229,${opacity})`;
                }}
                linkWidth={(link: any) => highlightLinks.has(link) ? 3 : (link.value === 0.2 ? 1 : 2)}
                backgroundColor="transparent"
                width={dimensions.width}
                height={dimensions.height}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
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
