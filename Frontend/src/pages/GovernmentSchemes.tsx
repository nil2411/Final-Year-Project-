import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, ExternalLink, MessageCircle, Phone, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Data imports ──────────────────────────────────────────────────────────────
import soilData       from '@/data/schemes/soil_health.json';
import seedsData      from '@/data/schemes/seeds.json';
import irrigationData from '@/data/schemes/irrigation.json';
import trainingData   from '@/data/schemes/training_extension.json';
import machineryData  from '@/data/schemes/machinery_technology.json';
import creditData     from '@/data/schemes/agriculture_credit.json';
import insuranceData  from '@/data/schemes/agricultural_insurance.json';
import plantData      from '@/data/schemes/plant_protection.json';
import marketingData  from '@/data/schemes/agriculture_marketing.json';
import nationalData   from '@/data/schemes/national_schemes.json';
import newsData       from '@/data/schemes/news.json';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SchemeContact {
  office?: string;
  phone?: string;
  website?: string;
}

interface Scheme {
  scheme_name: string;
  component_name: string;
  season: string[];
  benefit: string;
  eligibility: string;
  how_to_apply: string;
  contact: SchemeContact;
  last_updated?: string;
  category: string;
  level: 'STATE' | 'NATIONAL';
  state: string;
}

interface SchemeDataFile {
  category: string;
  level?: string;
  state?: string;
  items: Omit<Scheme, 'category' | 'level' | 'state'>[];
}

// ─── Load all schemes ──────────────────────────────────────────────────────────
function withCategory(data: SchemeDataFile): Scheme[] {
  return data.items.map((item) => ({
    ...item,
    category: data.category,
    level: (data.level || 'STATE') as 'STATE' | 'NATIONAL',
    state: data.state || 'MH',
  }));
}

const ALL_SCHEMES: Scheme[] = [
  ...withCategory(soilData as SchemeDataFile),
  ...withCategory(seedsData as SchemeDataFile),
  ...withCategory(irrigationData as SchemeDataFile),
  ...withCategory(trainingData as SchemeDataFile),
  ...withCategory(machineryData as SchemeDataFile),
  ...withCategory(creditData as SchemeDataFile),
  ...withCategory(insuranceData as SchemeDataFile),
  ...withCategory(plantData as SchemeDataFile),
  ...withCategory(marketingData as SchemeDataFile),
  ...withCategory(nationalData as SchemeDataFile),
];

const NEWS_ITEMS: string[] = newsData as string[];
const SEASONS = ['All Seasons', 'Kharif', 'Rabi', 'Zaid'] as const;
const LEVELS  = ['All', 'STATE', 'NATIONAL'] as const;
const LEVEL_LABELS: Record<string, string> = {
  All: 'All Levels',
  STATE: 'State (Maharashtra)',
  NATIONAL: 'Central (National)',
};

// ─── NewsTicker ────────────────────────────────────────────────────────────────
const NewsTicker: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = [...NEWS_ITEMS, ...NEWS_ITEMS];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let animFrame: number;
    let pos = 0;
    const speed = 0.6;
    const tick = () => {
      if (!paused) {
        pos -= speed;
        const halfWidth = track.scrollWidth / 2;
        if (Math.abs(pos) >= halfWidth) pos = 0;
        track.style.transform = `translateX(${pos}px)`;
      }
      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [paused]);

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden mb-6 shadow-md"
      style={{ background: 'linear-gradient(90deg, #0a3d0a 0%, #155724 100%)', minHeight: 42 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-1.5 bg-red-600 text-white font-black text-xs tracking-widest px-3 shrink-0 h-[42px] uppercase">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
        LIVE
      </div>
      <div
        className="flex-1 overflow-hidden h-[42px]"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0px, black 30px, black calc(100% - 30px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 30px, black calc(100% - 30px), transparent 100%)',
        }}
      >
        <div ref={trackRef} className="flex items-center whitespace-nowrap h-[42px]" style={{ willChange: 'transform' }}>
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-green-100 text-sm font-medium px-10">
              <span className="opacity-75 text-xs">⚡</span>
              {item}
            </span>
          ))}
        </div>
      </div>
      <a
        href="https://pmkisan.gov.in/"
        target="_blank"
        rel="noreferrer"
        className="px-3 h-[42px] flex items-center text-green-300 hover:text-white text-xs font-bold tracking-wide shrink-0 transition-colors"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        PM-KISAN ↗
      </a>
    </div>
  );
};

// ─── SchemeDetailModal ─────────────────────────────────────────────────────────
interface SchemeModalProps {
  scheme: Scheme | null;
  onClose: () => void;
}

const SchemeDetailModal: React.FC<SchemeModalProps> = ({ scheme, onClose }) => (
  <Dialog open={!!scheme} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      {scheme && (
        <>
          <DialogHeader>
            <DialogTitle className="text-xl text-green-800 dark:text-green-400 pr-6">
              {scheme.scheme_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              style={{
                background: scheme.level === 'NATIONAL' ? '#e3f2fd' : '#fbe9e7',
                color: scheme.level === 'NATIONAL' ? '#1565c0' : '#d84315',
                border: 'none',
              }}
            >
              {scheme.level === 'NATIONAL' ? '🇮🇳 National Scheme' : '📍 State Scheme'}
            </Badge>
            <Badge variant="outline">{scheme.category}</Badge>
            {scheme.season?.map((s) => (
              <Badge key={s} className="bg-green-50 text-green-800 border-green-200">{s}</Badge>
            ))}
          </div>
          <div className="space-y-4 text-sm">
            {scheme.component_name && (
              <div>
                <p className="font-semibold text-foreground mb-1">Component</p>
                <p className="text-muted-foreground">{scheme.component_name}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground mb-1">Benefit</p>
              <p className="text-muted-foreground">{scheme.benefit}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Eligibility</p>
              <p className="text-muted-foreground">{scheme.eligibility}</p>
            </div>
            {scheme.how_to_apply && (
              <div>
                <p className="font-semibold text-foreground mb-1">How to Apply</p>
                <p className="text-muted-foreground">{scheme.how_to_apply}</p>
              </div>
            )}
            {scheme.contact && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="font-semibold text-foreground mb-2">Contact</p>
                {scheme.contact.office && <p className="text-muted-foreground">{scheme.contact.office}</p>}
                {scheme.contact.phone && (
                  <p className="flex items-center gap-1.5 text-muted-foreground mt-1">
                    <Phone className="h-3.5 w-3.5" /> {scheme.contact.phone}
                  </p>
                )}
                {scheme.contact.website && (
                  <a
                    href={scheme.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline mt-1"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-xs">{scheme.contact.website}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </div>
            )}
            {scheme.last_updated && (
              <p className="text-xs text-muted-foreground">Last updated: {scheme.last_updated}</p>
            )}
          </div>
          <div className="mt-6">
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const GovernmentSchemes: React.FC = () => {
  const { t } = useLanguage();
  const [query, setQuery]                     = useState('');
  const [season, setSeason]                   = useState<string>('All Seasons');
  const [level, setLevel]                     = useState<string>('All');
  const [category, setCategory]               = useState<string>('All');
  const [selectedScheme, setSelectedScheme]   = useState<Scheme | null>(null);
  const [displaySchemes, setDisplaySchemes]   = useState<Scheme[]>([]);
  const [isUpdating, setIsUpdating]           = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_SCHEMES.map((s) => s.category))).sort();
    return ['All', ...cats];
  }, []);

  const filteredSchemes = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_SCHEMES.filter((scheme) => {
      const levelMatch    = level === 'All' || scheme.level === level;
      const seasonMatch   = season === 'All Seasons' || (scheme.season && (scheme.season.includes(season) || scheme.season.includes('All Year')));
      const categoryMatch = category === 'All' || scheme.category === category;
      const searchMatch   = !q || scheme.scheme_name?.toLowerCase().includes(q) || scheme.component_name?.toLowerCase().includes(q) || scheme.benefit?.toLowerCase().includes(q);
      return levelMatch && seasonMatch && categoryMatch && searchMatch;
    });
  }, [query, season, level, category]);

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setDisplaySchemes(filteredSchemes);
      setIsUpdating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filteredSchemes]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t('pages.schemes.title') || 'Government Agriculture Schemes'}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('pages.schemes.subtitle') || 'Browse official government schemes for Maharashtra farmers — check eligibility, benefits and apply online.'}
        </p>
      </div>

      {/* Live News Ticker */}
      <NewsTicker />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schemes, benefits..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger>
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={season} onValueChange={setSeason}>
          <SelectTrigger>
            <SelectValue placeholder="All Seasons" />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing <strong>{filteredSchemes.length}</strong> scheme{filteredSchemes.length !== 1 ? 's' : ''}
        {isUpdating && <span className="ml-2 text-green-700">(Updating...)</span>}
      </p>

      {/* Scheme Grid */}
      {displaySchemes.length === 0 && !isUpdating ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No schemes found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: isUpdating ? 0.6 : 1, transition: 'opacity 0.2s' }}
        >
          {displaySchemes.map((scheme, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-green-800 dark:text-green-400 leading-snug">
                  {scheme.scheme_name}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge
                    style={{
                      background: scheme.level === 'NATIONAL' ? '#e3f2fd' : '#fbe9e7',
                      color: scheme.level === 'NATIONAL' ? '#1565c0' : '#d84315',
                      border: 'none',
                    }}
                    className="text-xs"
                  >
                    {scheme.level === 'NATIONAL' ? '🇮🇳 National' : '📍 State'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{scheme.category}</Badge>
                  {scheme.season?.includes('All Year') ? (
                    <Badge className="text-xs bg-green-50 text-green-800 border-green-200">All Year</Badge>
                  ) : scheme.season?.map((s) => (
                    <Badge key={s} className="text-xs bg-green-50 text-green-800 border-green-200">{s}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 flex-1 flex flex-col">
                {scheme.component_name && (
                  <p className="text-xs text-muted-foreground font-medium">{scheme.component_name}</p>
                )}
                <p className="text-sm text-muted-foreground flex-1">
                  {scheme.benefit.length > 100 ? scheme.benefit.slice(0, 100) + '…' : scheme.benefit}
                </p>
                <Button
                  className="w-full mt-3 bg-green-800 hover:bg-green-900 text-white"
                  onClick={() => setSelectedScheme(scheme)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help section */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-0 mt-8">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground text-lg">
                {t('common.needHelp') || 'Need Help?'}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {t('common.helpDescription') || 'Ask our AI assistant to help you find the right scheme for your needs.'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pl-16">
          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
            onClick={() => window.dispatchEvent(new Event('openChat'))}
          >
            {t('common.askAIAssistant') || 'Ask AI Assistant'}
          </Button>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <SchemeDetailModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />
    </div>
  );
};

export default GovernmentSchemes;
