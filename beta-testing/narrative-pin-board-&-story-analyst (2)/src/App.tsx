import React, { useState, useEffect, useRef } from 'react';
import {
  Pin,
  Plus,
  Share2,
  Download,
  Trash2,
  Edit2,
  Play,
  Users,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Calendar,
  Compass,
  Check,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  BookOpen,
  User,
  Heart,
  FileText,
  UserCheck,
  Code,
  ArrowRight,
  Send,
  Sliders,
  Sparkle,
  Image,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  Upload,
  Video
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { CorkboardItem, CorkboardThread, TimelineMilestone, ChapterSentiment, ConsistencyProfile, DialogueReview, CollabUser, CollabLog, AnalysisResponse } from './types';
import { defaultGodfatherData } from './defaultData';

export interface MappedScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  searchQuery: string;
  orientation: 'landscape' | 'portrait' | 'square';
  colors?: string;
  objects?: string[];
  stockProvider: 'pexels' | 'pixabay' | 'videvo' | 'mixkit';
  isMapped: boolean;
}

export default function App() {
  // State variables with local storage persistence to prevent data loss on accidental refreshes
  const [boardData, setBoardData] = useState<AnalysisResponse>(() => {
    const saved = localStorage.getItem('storyboard_board_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved board data:", e);
      }
    }
    return defaultGodfatherData;
  });

  const [activeTab, setActiveTab] = useState<'board' | 'timeline' | 'sentiment' | 'consistency' | 'videomapper' | 'epub'>('board');
  const [storyText, setStoryText] = useState<string>(() => {
    return localStorage.getItem('storyboard_story_text') || '';
  });

  const [mappedScenes, setMappedScenes] = useState<MappedScene[]>(() => {
    const saved = localStorage.getItem('storyboard_mapped_scenes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved mapped scenes:", e);
      }
    }
    return [
      {
        id: 'scene_1',
        sceneNumber: 1,
        title: 'The Wedding Reception',
        description: 'The narrative opens at the festive, sun-drenched wedding of Connie Corleone. Outside, people are dancing, singing, and celebrating in standard Italian tradition.',
        searchQuery: 'italian wedding outdoor dancing crowd vintage',
        orientation: 'landscape',
        colors: 'warm',
        objects: ['humans'],
        stockProvider: 'pexels',
        isMapped: true
      },
      {
        id: 'scene_2',
        sceneNumber: 2,
        title: 'The Dark Study Consultation',
        description: 'Inside the dimly lit study, Don Vito Corleone sits behind a heavy wooden desk, listening to requests for favors and vengeance while venetian blinds cast long shadows.',
        searchQuery: 'dark office desk vintage study luxury',
        orientation: 'landscape',
        colors: 'dark',
        objects: ['humans'],
        stockProvider: 'pexels',
        isMapped: true
      },
      {
        id: 'scene_3',
        sceneNumber: 3,
        title: 'The Shocking Discovery',
        description: 'Jack Woltz wakes up in his luxurious Hollywood mansion, pulling back the silk sheets to discover a gruesome warning left in his bed.',
        searchQuery: 'luxurious mansion bedroom waking up shock',
        orientation: 'landscape',
        colors: 'warm',
        objects: ['humans'],
        stockProvider: 'pixabay',
        isMapped: false
      },
      {
        id: 'scene_4',
        sceneNumber: 4,
        title: 'New York Street Shooting',
        description: 'Don Vito is buying fruit at a street vendor in 1940s New York. Two assassins step out of the shadows, discharging firearms as fruit scatters on the cold pavement.',
        searchQuery: '1940s new york street city fruit stand winter',
        orientation: 'landscape',
        colors: 'dark',
        objects: ['vehicles', 'humans'],
        stockProvider: 'pexels',
        isMapped: false
      },
      {
        id: 'scene_5',
        sceneNumber: 5,
        title: 'The Restaurant Confrontation',
        description: 'Michael Corleone meets Sollozzo and Captain McCluskey at a quiet Italian restaurant. The tension mounts as Michael excuses himself to retrieve a hidden item from the restroom.',
        searchQuery: 'retro italian restaurant candle light dinner',
        orientation: 'landscape',
        colors: 'warm',
        objects: ['humans'],
        stockProvider: 'videvo',
        isMapped: false
      }
    ];
  });

  const [selectedSceneId, setSelectedSceneId] = useState<string>(() => {
    return localStorage.getItem('storyboard_selected_scene_id') || 'scene_1';
  });

  const [sentimentSubTab, setSentimentSubTab] = useState<'sentiment' | 'dialogue'>('sentiment');

  // Persistence side effects to prevent work loss
  useEffect(() => {
    localStorage.setItem('storyboard_board_data', JSON.stringify(boardData));
  }, [boardData]);

  useEffect(() => {
    localStorage.setItem('storyboard_story_text', storyText);
  }, [storyText]);

  useEffect(() => {
    localStorage.setItem('storyboard_mapped_scenes', JSON.stringify(mappedScenes));
  }, [mappedScenes]);

  useEffect(() => {
    localStorage.setItem('storyboard_selected_scene_id', selectedSceneId);
  }, [selectedSceneId]);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [selectedTimelineCharacters, setSelectedTimelineCharacters] = useState<string[]>([]);

  // EPUB & Cover Builder States
  const [epubTitle, setEpubTitle] = useState<string>('The Great Odyssey');
  const [epubAuthor, setEpubAuthor] = useState<string>('Alex Vance');
  const [epubLanguage, setEpubLanguage] = useState<string>('en');
  const [epubPublisher, setEpubPublisher] = useState<string>('Narrative Studio');
  const [epubFileBase64, setEpubFileBase64] = useState<string>('');
  const [epubFileName, setEpubFileName] = useState<string>('');
  const [epubBackSynopsis, setEpubBackSynopsis] = useState<string>('A gripping tale of mystery, human nature, and unforgettable journeys across uncharted domains.');
  const [isCompilingEpub, setIsCompilingEpub] = useState<boolean>(false);
  const [epubResultBase64, setEpubResultBase64] = useState<string>('');
  const [epubChaptersList, setEpubChaptersList] = useState<string[]>([]);
  
  // Custom board pin styling option
  const [showCardPins, setShowCardPins] = useState<boolean>(true);
  
  // Validation States
  const [isValidatingEpub, setIsValidatingEpub] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<{
    isValid: boolean;
    reports: { status: "success" | "warning" | "error"; message: string; details?: string }[];
    epubcheckCliOutput: string;
    hasEpubcheckLibrary: boolean;
  } | null>(null);
  
  // Book Cover Customization
  const [coverStyle, setCoverStyle] = useState<'minimalist' | 'vintage' | 'bold' | 'neon' | 'classic'>('minimalist');
  const [coverColor, setCoverColor] = useState<string>('#1E3A8A'); // Primary cover background
  const [coverAccentColor, setCoverAccentColor] = useState<string>('#F59E0B'); // Accent color
  const [coverTextColor, setCoverTextColor] = useState<string>('#FFFFFF');
  const [coverIllustrationSvg, setCoverIllustrationSvg] = useState<string>('');
  const [isGeneratingCoverIllustration, setIsGeneratingCoverIllustration] = useState<boolean>(false);
  const [coverIllustrationTheme, setCoverIllustrationTheme] = useState<string>('A single golden compass on a star chart background');
  const [spineWidth, setSpineWidth] = useState<number>(30); // in mm/relative pixels
  
  // Custom board elements creation
  const [selectedItem, setSelectedItem] = useState<CorkboardItem | null>(defaultGodfatherData.items[0]);
  const [isEditingItem, setIsEditingItem] = useState<boolean>(false);
  const [editItemTitle, setEditItemTitle] = useState<string>('');
  const [editItemSubtitle, setEditItemSubtitle] = useState<string>('');
  const [editItemContent, setEditItemContent] = useState<string>('');
  const [editItemColor, setEditItemColor] = useState<string>('#1E1E1E');
  const [editItemImage, setEditItemImage] = useState<string>('');
  const [isGeneratingVector, setIsGeneratingVector] = useState<boolean>(false);
  
  // Yarn threading builder
  const [isThreading, setIsThreading] = useState<boolean>(false);
  const [threadSource, setThreadSource] = useState<string>('');
  const [threadTarget, setThreadTarget] = useState<string>('');
  const [threadLabel, setThreadLabel] = useState<string>('');
  const [threadColor, setThreadColor] = useState<string>('#EF4444');

  // Drag and drop corkboard state
  const corkboardRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Decluttering & Filtering state
  const [boardFilter, setBoardFilter] = useState<'all' | 'character' | 'note' | 'document' | 'storyboard'>('all');
  const [boardSearch, setBoardSearch] = useState<string>('');
  const [threadVisibility, setThreadVisibility] = useState<'all' | 'selected' | 'none'>('all');
  const [cardDensity, setCardDensity] = useState<'full' | 'compact'>('full');
  const [characterDisplayMode, setCharacterDisplayMode] = useState<'card' | 'pin'>('card');
  const [characterTagFilter, setCharacterTagFilter] = useState<string>('All');

  // Collaboration Sim State
  const [collabSimActive, setCollabSimActive] = useState<boolean>(false);
  const [collabUsers, setCollabUsers] = useState<CollabUser[]>([
    { id: 'u1', name: 'Sarah (Co-Author)', color: '#10B981', cursorX: 200, cursorY: 150, lastActive: 'Active' },
    { id: 'u2', name: 'Marcus (Editor)', color: '#EC4899', cursorX: 700, cursorY: 400, lastActive: 'Active' }
  ]);
  const [collabLogs, setCollabLogs] = useState<CollabLog[]>([
    { id: 'l1', user: 'Sarah (Co-Author)', action: 'Aligned Sonny Corleone closer to the top border', timestamp: '00:29' },
    { id: 'l2', user: 'Marcus (Editor)', action: 'Reviewed Chapter 3 dialogue pace indicators', timestamp: '00:28' }
  ]);
  const [newChatText, setNewChatText] = useState<string>('');

  // Auto-analysis step sequencer
  useEffect(() => {
    if (!isAnalyzing) return;
    const steps = [
      'Ingesting manuscript text...',
      'Isolating character entities and physical details...',
      'Constructing visual layout nodes & position grids...',
      'Weaving relational yarn threads and connection cords...',
      'Plotting chronological timelines & development arcs...',
      'Analyzing chapter emotional sentiments and keywords...',
      'Auditing factual continuity to flag contradictions...',
      'Reviewing speech naturalness, subtext, and pacing indicators...'
    ];

    let index = 0;
    setAnalysisStep(steps[0]);

    const interval = setInterval(() => {
      index++;
      if (index < steps.length) {
        setAnalysisStep(steps[index]);
      } else {
        clearInterval(interval);
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Simulating live collaborative cursor movements and occasional logs
  useEffect(() => {
    if (!collabSimActive) return;

    const cursorInterval = setInterval(() => {
      setCollabUsers(prev =>
        prev.map(user => {
          // Add small random walk to cursor coordinates
          const dx = (Math.random() - 0.5) * 60;
          const dy = (Math.random() - 0.5) * 60;
          return {
            ...user,
            cursorX: Math.max(50, Math.min(950, user.cursorX + dx)),
            cursorY: Math.max(50, Math.min(550, user.cursorY + dy))
          };
        })
      );
    }, 1000);

    const logInterval = setInterval(() => {
      const usersList = ['Sarah (Co-Author)', 'Marcus (Editor)'];
      const randomUser = usersList[Math.floor(Math.random() * usersList.length)];
      
      const actions = [
        'is writing a new post-it sticky note',
        'is auditing character consistency rules',
        'is reviewing dialogue naturalness recommendations',
        'is tracing a new yarn thread line',
        'is adjusting timeline milestones coordinates'
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      const newLog: CollabLog = {
        id: `l_${Date.now()}`,
        user: randomUser,
        action: randomAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCollabLogs(prev => [newLog, ...prev.slice(0, 15)]);
    }, 8000);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(logInterval);
    };
  }, [collabSimActive]);

  // Handle Drag Start
  const handleDragStart = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDraggingId(id);
    const item = boardData.items.find(it => it.id === id);
    if (item && corkboardRef.current) {
      const rect = corkboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - item.x * zoomLevel;
      const y = e.clientY - rect.top - item.y * zoomLevel;
      setDragOffset({ x, y });
      setSelectedItem(item);
    }
  };

  // Handle Mouse Drag Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !corkboardRef.current) return;
    const rect = corkboardRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left - dragOffset.x;
    const rawY = e.clientY - rect.top - dragOffset.y;
    
    // Scale back coordinate values according to zoomLevel
    const nextX = Math.round(rawX / zoomLevel);
    const nextY = Math.round(rawY / zoomLevel);

    setBoardData(prev => ({
      ...prev,
      items: prev.items.map(it => (it.id === draggingId ? { ...it, x: Math.max(0, nextX), y: Math.max(0, nextY) } : it))
    }));
  };

  // Stop Drag
  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Delete Card
  const handleDeleteItem = (id: string) => {
    setBoardData(prev => ({
      ...prev,
      items: prev.items.filter(it => it.id !== id),
      threads: prev.threads.filter(th => th.sourceId !== id && th.targetId !== id)
    }));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  // Delete Thread Yarn
  const handleDeleteThread = (threadId: string) => {
    setBoardData(prev => ({
      ...prev,
      threads: prev.threads.filter(th => th.id !== threadId)
    }));
  };

  // Run Deep EPUB Structural Validation
  const runEpubValidation = async (base64Data: string, name: string) => {
    setIsValidatingEpub(true);
    setValidationReport(null);
    try {
      const response = await fetch('/api/validate-epub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64Data, fileName: name })
      });
      const data = await response.json();
      if (data.success) {
        setValidationReport({
          isValid: data.isValid,
          reports: data.reports,
          epubcheckCliOutput: data.epubcheckCliOutput,
          hasEpubcheckLibrary: data.hasEpubcheckLibrary
        });
      } else {
        alert("Validation Error: " + (data.error || "Failed to validate."));
      }
    } catch (err: any) {
      console.error("Validation request failed:", err);
      alert("Validation failed: " + err.message);
    } finally {
      setIsValidatingEpub(false);
    }
  };

  // Helper to extract clean capitalized character initials
  const getInitials = (name: string) => {
    if (!name) return '??';
    const clean = name.replace(/^(don|mr|ms|mrs|dr|sir)\.?\s+/i, '');
    const parts = clean.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Smart Auto-Arrange Card Positions (Declutter Canvas by Semantic Sections)
  const autoArrangeBoard = () => {
    setBoardData(prev => {
      if (!prev.items || prev.items.length === 0) return prev;
      
      // Group items by type to create clear visual regions
      const characters = prev.items.filter(it => it.type === 'character');
      const storyboards = prev.items.filter(it => it.type === 'storyboard');
      const documents = prev.items.filter(it => it.type === 'document');
      const notes = prev.items.filter(it => it.type === 'note');

      const arrangedItems = prev.items.map(item => {
        if (item.type === 'character') {
          const idx = characters.findIndex(it => it.id === item.id);
          const cols = 4;
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          // Center-focused layout
          const startX = 380;
          const startY = 150;
          const spacingX = characterDisplayMode === 'pin' ? 140 : 250;
          const spacingY = characterDisplayMode === 'pin' ? 120 : 220;
          return {
            ...item,
            x: startX + c * spacingX,
            y: startY + r * spacingY
          };
        } else if (item.type === 'storyboard') {
          const idx = storyboards.findIndex(it => it.id === item.id);
          // Timeline sequence at the bottom
          const startX = 60;
          const startY = 700;
          const spacingX = 300;
          return {
            ...item,
            x: startX + idx * spacingX,
            y: startY
          };
        } else if (item.type === 'document') {
          const idx = documents.findIndex(it => it.id === item.id);
          // Archives column on the left
          const startX = 60;
          const startY = 100;
          const spacingY = 240;
          return {
            ...item,
            x: startX,
            y: startY + idx * spacingY
          };
        } else if (item.type === 'note') {
          const idx = notes.findIndex(it => it.id === item.id);
          // Sticky brainstorming pinboard column on the right
          const startX = 1320;
          const startY = 100;
          const spacingY = 180;
          return {
            ...item,
            x: startX,
            y: startY + idx * spacingY
          };
        }
        return item;
      });
      
      return {
        ...prev,
        items: arrangedItems
      };
    });
  };

  // Get unique characters in the narrative timeline
  const uniqueTimelineChars: string[] = Array.from(
    new Set((boardData?.timeline || []).map((m: TimelineMilestone) => m.character))
  ).filter(Boolean) as string[];

  // Character color helper matching corkboard pins
  const getTimelineCharacterColor = (characterName: string) => {
    const matchingCard = (boardData?.items || []).find(
      (item) =>
        item.type === 'character' &&
        item.title.toUpperCase().includes(characterName.toUpperCase())
    );
    if (matchingCard) return matchingCard.color;

    // Elegant palette fallbacks
    const colors = [
      '#10B981', // Emerald
      '#1E3A8A', // Navy Blue
      '#DC2626', // Red
      '#D97706', // Amber
      '#701A75', // Fuchsia
      '#065F46', // Teal
      '#BE185D', // Rose
      '#0D9488', // Teal-600
    ];
    let hash = 0;
    for (let i = 0; i < characterName.length; i++) {
      hash = characterName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Build sequential story timeline tracking data points
  const getCharacterGrowthData = () => {
    const currentScores: Record<string, number> = {};
    const activeStates: Record<string, string> = {};
    
    // Set initial baseline
    uniqueTimelineChars.forEach(char => {
      currentScores[char] = 0;
      activeStates[char] = 'Neutral';
    });

    return (boardData?.timeline || []).map((m, idx) => {
      currentScores[m.character] = m.sentimentScore;
      activeStates[m.character] = m.emotionalState;
      
      return {
        milestoneId: m.id,
        label: `Step ${idx + 1}`,
        stepName: `${m.chapter.split(':')[0]}`, // e.g. "Chapter 1"
        fullChapter: m.chapter,
        event: m.description,
        actingCharacter: m.character,
        sentimentScore: m.sentimentScore,
        emotionalState: m.emotionalState,
        ...currentScores,
        states: { ...activeStates }
      };
    });
  };

  // Custom tooltips detailing dramatic and emotional milestones
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-paper-border p-4 rounded-xl shadow-xl space-y-2.5 max-w-sm">
          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-brand">
            <span>{dataPoint.fullChapter}</span>
            <span>{dataPoint.label}</span>
          </div>
          <div className="text-xs font-bold text-paper-text">
            Trigger Event: {dataPoint.actingCharacter}
          </div>
          <p className="text-[11px] text-paper-muted italic leading-relaxed border-l-2 border-brand/20 pl-2 bg-paper-sidebar py-1 rounded">
            "{dataPoint.event}"
          </p>
          <div className="border-t border-paper-border/60 pt-2.5 mt-1 space-y-1.5">
            {payload.map((entry: any) => {
              const charName = entry.dataKey;
              const value = entry.value;
              const isActive = charName === dataPoint.actingCharacter;
              const curState = dataPoint.states[charName] || 'Stable';
              return (
                <div key={charName} className="flex items-center justify-between text-[10px] space-x-6">
                  <span className="flex items-center space-x-2 font-medium">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: entry.stroke }} 
                    />
                    <span className={isActive ? "text-paper-text font-bold" : "text-paper-muted"}>
                      {charName} {isActive && "⚡"}
                    </span>
                  </span>
                  <span className="font-mono text-right font-bold text-paper-text">
                    {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)} <span className="font-sans font-medium text-[9px] text-paper-muted">({curState})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Export workspace as JSON
  const exportWorkspaceJSON = () => {
    const workspace = {
      storyText,
      boardData,
      mappedScenes,
      epubTitle,
      epubAuthor,
      epubLanguage,
      epubPublisher,
      epubBackSynopsis,
      coverStyle,
      coverColor,
      coverAccentColor,
      coverTextColor,
      coverIllustrationTheme,
      showCardPins
    };
    
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-workspace-${epubTitle.toLowerCase().replace(/\s+/g, '-') || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import workspace from JSON
  const importWorkspaceJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workspace = JSON.parse(event.target?.result as string);
        if (workspace.storyText !== undefined) setStoryText(workspace.storyText);
        if (workspace.boardData !== undefined) {
          setBoardData(workspace.boardData);
          if (workspace.boardData.items && workspace.boardData.items.length > 0) {
            setSelectedItem(workspace.boardData.items[0]);
          }
        }
        if (workspace.mappedScenes !== undefined) setMappedScenes(workspace.mappedScenes);
        if (workspace.epubTitle !== undefined) setEpubTitle(workspace.epubTitle);
        if (workspace.epubAuthor !== undefined) setEpubAuthor(workspace.epubAuthor);
        if (workspace.epubLanguage !== undefined) setEpubLanguage(workspace.epubLanguage);
        if (workspace.epubPublisher !== undefined) setEpubPublisher(workspace.epubPublisher);
        if (workspace.epubBackSynopsis !== undefined) setEpubBackSynopsis(workspace.epubBackSynopsis);
        if (workspace.coverStyle !== undefined) setCoverStyle(workspace.coverStyle);
        if (workspace.coverColor !== undefined) setCoverColor(workspace.coverColor);
        if (workspace.coverAccentColor !== undefined) setCoverAccentColor(workspace.coverAccentColor);
        if (workspace.coverTextColor !== undefined) setCoverTextColor(workspace.coverTextColor);
        if (workspace.coverIllustrationTheme !== undefined) setCoverIllustrationTheme(workspace.coverIllustrationTheme);
        if (workspace.showCardPins !== undefined) setShowCardPins(workspace.showCardPins);
        
        alert("Workspace JSON imported successfully! All settings and tabs have been updated.");
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
        alert("Error: Invalid Workspace JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Generate Visual Scenes from Manuscript Story Text
  const generateScenesFromText = () => {
    if (!storyText || storyText.trim().length === 0) {
      alert("Please enter or paste your story text first in the sidebar manuscript text area!");
      return;
    }

    // Split text by double newline to find paragraph clusters
    const paragraphs = storyText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 30);

    if (paragraphs.length === 0) {
      alert("No valid narrative paragraphs detected. Please check your text draft.");
      return;
    }

    // Map each paragraph cluster into a scenic outline (up to 8 scenes)
    const newScenes: MappedScene[] = paragraphs.slice(0, 8).map((para, idx) => {
      // Heuristic visual query extraction: take first 5 nouns/adjectives
      const words = para.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3);
      const stopList = new Set(['the', 'and', 'this', 'that', 'with', 'from', 'their', 'there', 'they', 'here', 'were', 'have', 'about', 'chapter', 'vito', 'michael', 'corleone']);
      const cleanWords = words.filter(w => !stopList.has(w.toLowerCase())).slice(0, 5);
      const query = cleanWords.join(' ').toLowerCase() || 'cinematic narrative scene';

      let firstSentence = para.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 50) {
        firstSentence = firstSentence.substring(0, 47) + '...';
      }

      return {
        id: `sc_gen_${Date.now()}_${idx}`,
        sceneNumber: idx + 1,
        title: firstSentence || `Scene ${idx + 1}`,
        description: para,
        searchQuery: query,
        orientation: 'landscape',
        colors: 'all',
        objects: [],
        stockProvider: 'pexels',
        isMapped: false
      };
    });

    setMappedScenes(newScenes);
    setSelectedSceneId(newScenes[0].id);
    alert(`Success: Automatically parsed and mapped ${newScenes.length} scenes from your manuscript! Select any scene to configure search parameters.`);
  };

  // Add Card
  const handleAddItem = (type: 'character' | 'note' | 'document' | 'storyboard') => {
    const newId = `${type}_${Date.now()}`;
    const newItem: CorkboardItem = {
      id: newId,
      type,
      title: type === 'storyboard' ? 'STORYBOARD PANEL' : `NEW ${type.toUpperCase()}`,
      subtitle: type === 'character' ? 'Role Summary' : undefined,
      content: type === 'storyboard' ? 'Double-click to upload scene framing and write layout details.' : 'Click here or double-click to edit description and details.',
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 150,
      color: type === 'character' ? '#10B981' : type === 'note' ? '#FEF08A' : type === 'storyboard' ? '#BAE6FD' : '#F3F4F6',
      image_path: type === 'storyboard' ? '' : undefined,
      tags: type === 'character' ? ['Main Cast'] : type === 'storyboard' ? ['Visual framing'] : undefined,
      meta: type === 'character' ? {
        role: 'Supporting voice',
        traits: ['Enigmatic', 'Determined'],
        motivation: 'To achieve goals without getting caught in disputes',
        eyeColor: 'Hazel',
        handedness: 'Right-handed',
        backstory: 'Enters the narrative stream to resolve critical situations.'
      } : undefined
    };

    setBoardData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setSelectedItem(newItem);
    setActiveTab('board');
  };

  // Edit item details
  const triggerEditItem = (item: CorkboardItem) => {
    setSelectedItem(item);
    setEditItemTitle(item.title);
    setEditItemSubtitle(item.subtitle || '');
    setEditItemContent(item.content);
    setEditItemColor(item.color);
    setEditItemImage(item.image_path || '');
    setIsEditingItem(true);
  };

  const saveEditedItem = () => {
    if (!selectedItem) return;
    setBoardData(prev => ({
      ...prev,
      items: prev.items.map(it => it.id === selectedItem.id ? {
        ...it,
        title: editItemTitle,
        subtitle: editItemSubtitle || undefined,
        content: editItemContent,
        color: editItemColor,
        image_path: editItemImage || undefined
      } : it)
    }));
    setIsEditingItem(false);
    // Refresh selected view details
    setSelectedItem(prev => prev ? {
      ...prev,
      title: editItemTitle,
      subtitle: editItemSubtitle || undefined,
      content: editItemContent,
      color: editItemColor,
      image_path: editItemImage || undefined
    } : null);
  };

  // Call AI SVG generator
  const generateAISvgVector = async () => {
    setIsGeneratingVector(true);
    try {
      const response = await fetch('/api/generate-scene-vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneDescription: editItemContent,
          title: editItemTitle
        })
      });

      if (!response.ok) {
        throw new Error('SVG generator request failed');
      }

      const resData = await response.json();
      if (resData.svg) {
        // Convert to data URI for simple image rendering
        const encodedSvg = encodeURIComponent(resData.svg)
          .replace(/'/g, "%27")
          .replace(/"/g, "%22");
        const dataUri = `data:image/svg+xml;utf8,${encodedSvg}`;
        setEditItemImage(dataUri);
      }
    } catch (err) {
      console.error("AI Vector Generation failed", err);
    } finally {
      setIsGeneratingVector(false);
    }
  };

  // Dynamic thread weaver builder
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadSource || !threadTarget || threadSource === threadTarget) return;

    const newThread: CorkboardThread = {
      id: `th_user_${Date.now()}`,
      sourceId: threadSource,
      targetId: threadTarget,
      label: threadLabel || 'Related Arc',
      color: threadColor
    };

    setBoardData(prev => ({
      ...prev,
      threads: [...prev.threads, newThread]
    }));

    setThreadLabel('');
    setIsThreading(false);
  };

  // Ingest text analysis with Gemini server endpoint
  const runStoryAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyText })
      });

      if (!response.ok) {
        throw new Error('Analysis API error response');
      }

      const analyzed = await response.json();
      setBoardData(analyzed);
      
      // Auto-focus the first analyzed card
      if (analyzed.items?.length > 0) {
        setSelectedItem(analyzed.items[0]);
      }
      setActiveTab('board');
    } catch (err) {
      console.error("Story analysis failed, falling back to heuristic data", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Triggers desktop Python application download
  const downloadPythonApp = async () => {
    try {
      const response = await fetch('/api/download-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });

      if (!response.ok) {
        throw new Error('Python generation request failed.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'narrative_corkboard.py');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to generate local python file.');
    }
  };

  // Collaborative simulation log additions
  const addCollabMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const logEntry: CollabLog = {
      id: `l_user_${Date.now()}`,
      user: 'You (Author)',
      action: `: "${newChatText}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCollabLogs(prev => [logEntry, ...prev]);
    setNewChatText('');
  };

  return (
    <div className="min-h-screen bg-paper-bg text-paper-text flex flex-col font-sans antialiased overflow-x-hidden selection:bg-brand/30 selection:text-paper-text">
      
      {/* Top Header Row */}
      <header className="h-14 border-b border-paper-border bg-white flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display tracking-tight text-paper-text flex items-center gap-2">
              PLOTSMITH <span className="text-brand font-normal">— Storyboard Workspace</span>
              <span className="text-[9px] bg-brand/10 text-brand font-mono px-1.5 py-0.5 rounded border border-brand/20">v1.2</span>
            </h1>
            <p className="text-[10px] text-paper-muted font-medium">High-density cork-board story visualizer & narrative continuity coach</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Simulation Toggle */}
          <button
            onClick={() => setCollabSimActive(!collabSimActive)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-2 border transition-all cursor-pointer ${
              collabSimActive 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-white hover:bg-paper-sidebar border-paper-border text-paper-text'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Collab Room: {collabSimActive ? 'Live' : 'Off'}</span>
          </button>

          {/* Export Python Client App */}
          <button
            onClick={downloadPythonApp}
            className="bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-1.5 rounded-md text-xs flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Download interactive local desktop application of this storyboard written in python"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export Python App</span>
          </button>
        </div>
      </header>

      {/* Main Framework Partition */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden">
        
        {/* Left Side: Story Ingestion Panel */}
        <aside className="w-full lg:w-96 border-r border-paper-border bg-paper-sidebar p-5 flex flex-col space-y-5 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-paper-border">
          <div>
            <h2 className="text-xs font-bold uppercase text-paper-muted tracking-widest flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manuscript Ingestion</span>
            </h2>
            <p className="text-[11px] text-paper-muted mt-1 leading-relaxed">
              Upload a narrative file (txt, docx) or paste draft scenes between 100 to 5000 words.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <textarea
              className="w-full h-40 bg-white border border-paper-border rounded-lg p-3 text-xs text-paper-text font-mono focus:border-brand focus:outline-none transition-all placeholder:text-paper-muted/50"
              placeholder="Paste story chapters or paste scene drafts here..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />

            <div className="flex items-center space-x-2">
              <button
                onClick={runStoryAnalysis}
                disabled={isAnalyzing}
                className="flex-1 bg-brand hover:bg-brand-hover disabled:bg-paper-border disabled:text-paper-muted text-white text-xs font-semibold py-2.5 px-4 rounded-md flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                title="Execute semantic deep-parsing on the text draft to generate characters, timeline arcs, sentiment ratings, and consistency reviews"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Analyzing Script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Run Story Intelligence</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setBoardData(defaultGodfatherData);
                  setStoryText('');
                  if (defaultGodfatherData.items.length > 0) {
                    setSelectedItem(defaultGodfatherData.items[0]);
                  }
                }}
                className="px-3 py-2.5 bg-white hover:bg-paper-bg text-paper-text border border-paper-border rounded-md text-xs font-semibold shadow-sm cursor-pointer transition-all"
                title="Reset to The Godfather Masterpiece Demo Board"
              >
                Reset Demo
              </button>
            </div>
          </div>

          {/* Workspace Save / Load JSON */}
          <div className="bg-white border border-paper-border rounded-lg p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-paper-muted font-mono">Workspace Backup (JSON)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[10px] text-paper-muted leading-relaxed">
              Export your written text, mapped scenes, and corkboard to a portable JSON file to prevent any work loss.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={exportWorkspaceJSON}
                className="bg-paper-sidebar hover:bg-paper-border text-paper-text text-[10px] font-bold py-1.5 px-2 rounded border border-paper-border flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95"
                title="Download entire project workspace, including story text, corkboard, timeline, and mapped scenes as a JSON file"
              >
                <Download className="w-3 h-3 text-paper-muted" />
                <span>Export JSON</span>
              </button>
              
              <button
                onClick={() => document.getElementById('workspace-import-input')?.click()}
                className="bg-paper-sidebar hover:bg-paper-border text-paper-text text-[10px] font-bold py-1.5 px-2 rounded border border-paper-border flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95"
                title="Upload a previously saved storyboard-workspace.json file to restore all states"
              >
                <Upload className="w-3 h-3 text-paper-muted" />
                <span>Import JSON</span>
              </button>
              <input
                type="file"
                id="workspace-import-input"
                accept=".json"
                onChange={importWorkspaceJSON}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress / Step Feedback Tracker */}
          {isAnalyzing && (
            <div className="bg-white p-4 rounded-lg border border-paper-border shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-brand font-bold">Deep Linguistic Extraction</span>
                <span className="text-[10px] text-paper-muted font-mono animate-pulse">Running AI pipeline...</span>
              </div>
              <div className="flex items-start space-x-2">
                <RefreshCw className="w-3.5 h-3.5 text-brand animate-spin mt-0.5 shrink-0" />
                <p className="text-xs text-paper-text font-mono leading-relaxed">{analysisStep}</p>
              </div>
            </div>
          )}

          <hr className="border-paper-border" />

          {/* Quick Corkboard Customizer Elements */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-paper-muted tracking-widest">Board Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddItem('character')}
                className="bg-white border border-emerald-600/30 hover:border-emerald-600/50 hover:bg-emerald-50 text-emerald-800 text-xs py-2 rounded-md flex flex-col items-center space-y-1 transition-all cursor-pointer shadow-sm"
                title="Create a new character card on the corkboard with profile details"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold">Add Character</span>
              </button>
              <button
                onClick={() => handleAddItem('note')}
                className="bg-white border border-brand/30 hover:border-brand/50 hover:bg-paper-yellow/30 text-brand text-xs py-2 rounded-md flex flex-col items-center space-y-1 transition-all cursor-pointer shadow-sm"
                title="Create a yellow sticky post-it note for plot points, concepts, or brainstorming ideas"
              >
                <Pin className="w-4 h-4 text-brand" />
                <span className="text-[10px] font-bold">Plot Sticky</span>
              </button>
              <button
                onClick={() => handleAddItem('document')}
                className="bg-white border border-blue-600/30 hover:border-blue-600/50 hover:bg-blue-50 text-blue-800 text-xs py-2 rounded-md flex flex-col items-center space-y-1 transition-all cursor-pointer shadow-sm"
                title="Create a white document clipping for character backstories, articles, or archives"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold">New Clipping</span>
              </button>
              <button
                onClick={() => handleAddItem('storyboard')}
                className="bg-white border border-sky-600/30 hover:border-sky-600/50 hover:bg-sky-50 text-sky-800 text-xs py-2 rounded-md flex flex-col items-center space-y-1 transition-all cursor-pointer shadow-sm"
                title="Create a blue storyboard panel with an optional visual AI generated layout and framing notes"
              >
                <Image className="w-4 h-4 text-sky-600" />
                <span className="text-[10px] font-bold">Storyboard</span>
              </button>
            </div>
          </div>

          {/* Relational Yarn Weaver Tool */}
          <div className="bg-white p-4 rounded-xl border border-paper-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-brand tracking-widest flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Tie Relational Yarn</span>
              </h3>
              <button 
                onClick={() => setIsThreading(!isThreading)}
                className="text-[10px] text-paper-muted hover:text-paper-text underline cursor-pointer"
              >
                {isThreading ? 'Collapse' : 'Open'}
              </button>
            </div>

            {(isThreading || true) && (
              <form onSubmit={handleCreateThread} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-paper-muted block mb-1 font-semibold">Source Node</label>
                    <select
                      value={threadSource}
                      onChange={(e) => setThreadSource(e.target.value)}
                      className="w-full bg-white border border-paper-border rounded p-1.5 text-[11px] text-paper-text focus:border-brand focus:outline-none"
                    >
                      <option value="">Select source...</option>
                      {boardData.items.map(it => (
                        <option key={it.id} value={it.id}>{it.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-paper-muted block mb-1 font-semibold">Target Node</label>
                    <select
                      value={threadTarget}
                      onChange={(e) => setThreadTarget(e.target.value)}
                      className="w-full bg-white border border-paper-border rounded p-1.5 text-[11px] text-paper-text focus:border-brand focus:outline-none"
                    >
                      <option value="">Select target...</option>
                      {boardData.items.map(it => (
                        <option key={it.id} value={it.id}>{it.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-paper-muted block mb-1 font-semibold">Yarn Cord Label</label>
                  <input
                    type="text"
                    value={threadLabel}
                    onChange={(e) => setThreadLabel(e.target.value)}
                    placeholder="e.g., Betrayal, Love, Conflict"
                    className="w-full bg-white border border-paper-border rounded p-1.5 text-[11px] text-paper-text focus:border-brand focus:outline-none placeholder:text-paper-muted/40"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1">
                    {['#EF4444', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setThreadColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-3.5 h-3.5 rounded-full border ${threadColor === col ? 'border-paper-text scale-125 shadow-sm' : 'border-transparent'} transition-all cursor-pointer`}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-hover text-white font-bold text-[10px] py-1.5 px-3 rounded cursor-pointer shadow-sm"
                  >
                    Weave Connection
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Simulated Real-Time Collaborative Stream */}
          {collabSimActive && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Active Collab Session</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">2 Writers Synced</span>
              </div>

              {/* Shared Chat / Logs */}
              <div className="h-32 bg-white rounded-lg p-2 overflow-y-auto space-y-1.5 scrollbar-thin border border-paper-border">
                {collabLogs.map(log => (
                  <div key={log.id} className="text-[10px] leading-tight text-paper-text">
                    <span className="text-emerald-700 font-bold">{log.user}</span>
                    <span className="text-paper-text/80"> {log.action}</span>
                    <span className="text-paper-muted float-right text-[8px] font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Chat Send Form */}
              <form onSubmit={addCollabMessage} className="flex gap-1.5">
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Sync a message or note edit..."
                  className="flex-1 bg-white border border-paper-border rounded px-2 py-1 text-[11px] focus:outline-none focus:border-brand text-paper-text"
                />
                <button type="submit" className="bg-brand hover:bg-brand-hover text-white p-1 rounded cursor-pointer">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}
        </aside>

        {/* Right Area: Interactive Navigation Tabs and Workspaces */}
        <main className="flex-1 flex flex-col min-h-0 bg-paper-canvas">
          
          {/* Main Module Selection Tabs */}
          <nav className="flex border-b border-paper-border bg-white px-4 space-x-1 shrink-0 overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'board'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Organize character profiles, plot points, clippings, and scene storyboards interactively on a high-fidelity corkboard."
            >
              <Layers className="w-3.5 h-3.5 text-brand/80" />
              <span>📌 Corkboard</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Trace the chronological sequence of narrative events, tracking multiple character emotional states concurrently."
            >
              <Calendar className="w-3.5 h-3.5 text-brand/80" />
              <span>⏳ Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('sentiment')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'sentiment'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Visualize chapter emotional intensity shifts, mood fluctuations, dialogue pacing coach, and subtext metrics together."
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand/80" />
              <span>📊 Sentiment</span>
            </button>
            <button
              onClick={() => setActiveTab('consistency')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'consistency'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Verify narrative integrity, character traits, and eye color consistency rules."
            >
              <ShieldAlert className="w-3.5 h-3.5 text-brand/80" />
              <span>🛡️ Continuity</span>
            </button>
            <button
              onClick={() => setActiveTab('videomapper')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'videomapper'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Map your story chapters and scenes into stock video files, customize search queries, and filter orientations."
            >
              <Video className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>🎬 Video Mapper</span>
            </button>
            <button
              onClick={() => setActiveTab('epub')}
              className={`px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'epub'
                  ? 'border-brand text-brand bg-paper-sidebar'
                  : 'border-transparent text-paper-muted hover:text-paper-text'
              }`}
              title="Compile your finished manuscript into a standard EPUB 3.0 ebook with cover art customization and schema validation."
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-500" />
              <span>📖 EPUB Studio</span>
            </button>
          </nav>

          {/* Active Workspace Viewport */}
          <div className="flex-1 overflow-hidden relative flex">

            {/* TAB 1: VIRTUAL CORKBOARD CANVAS */}
            {activeTab === 'board' && (() => {
              const filteredItems = boardData.items.filter(item => {
                const matchesType = boardFilter === 'all' || item.type === boardFilter;
                const matchesSearch = boardSearch === '' || 
                  item.title.toLowerCase().includes(boardSearch.toLowerCase()) || 
                  (item.subtitle && item.subtitle.toLowerCase().includes(boardSearch.toLowerCase())) ||
                  item.content.toLowerCase().includes(boardSearch.toLowerCase()) ||
                  (item.tags && item.tags.some(tag => tag.toLowerCase().includes(boardSearch.toLowerCase())));
                
                // Character Faction Filter (applied to character cards only)
                const matchesFaction = item.type !== 'character' || 
                  characterTagFilter === 'All' || 
                  (item.tags && item.tags.includes(characterTagFilter));

                return matchesType && matchesSearch && matchesFaction;
              });

              const visibleThreads = boardData.threads.filter(thread => {
                const srcNode = filteredItems.find(it => it.id === thread.sourceId);
                const tgtNode = filteredItems.find(it => it.id === thread.targetId);
                if (!srcNode || !tgtNode) return false;

                if (threadVisibility === 'none') return false;
                if (threadVisibility === 'selected') {
                  return selectedItem && (thread.sourceId === selectedItem.id || thread.targetId === selectedItem.id);
                }
                return true;
              });

              return (
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0">
                  
                  {/* Visual Canvas Board */}
                  <div className="flex-1 relative overflow-hidden bg-paper-canvas p-6 flex flex-col min-w-0">
                    
                    {/* Corkboard Control & Declutter Center */}
                    <div className="bg-white border border-paper-border rounded-xl p-3 mb-4 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0 shadow-xs">
                      {/* Left Part: Live search and filter pills */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex items-center shrink-0">
                          <Search className="absolute left-2.5 w-3.5 h-3.5 text-paper-muted" />
                          <input
                            type="text"
                            placeholder="Filter board cards..."
                            value={boardSearch}
                            onChange={(e) => setBoardSearch(e.target.value)}
                            className="pl-8 pr-2.5 py-1.5 w-44 bg-paper-canvas border border-paper-border rounded-lg text-xs focus:outline-none focus:border-brand transition-all placeholder:text-paper-muted/60"
                          />
                        </div>

                        <div className="flex items-center bg-paper-canvas border border-paper-border rounded-lg p-0.5 space-x-0.5">
                          {[
                            { value: 'all', label: 'All Cards' },
                            { value: 'character', label: '👥 Characters' },
                            { value: 'note', label: '📌 Notes' },
                            { value: 'document', label: '📄 Docs' },
                            { value: 'storyboard', label: '🎬 Storyboards' }
                          ].map(tab => (
                            <button
                              key={tab.value}
                              onClick={() => setBoardFilter(tab.value as any)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                boardFilter === tab.value
                                  ? 'bg-white text-brand shadow-xs'
                                  : 'text-paper-muted hover:text-paper-text'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Part: Thread view toggles, Card density, and Smart Auto-Arrange */}
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        {/* Yarn Thread Visibility Selector */}
                        <div className="flex items-center space-x-1.5 text-xs text-paper-muted">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Yarn Links:</span>
                          <select
                            value={threadVisibility}
                            onChange={(e) => setThreadVisibility(e.target.value as any)}
                            className="bg-white border border-paper-border rounded-lg py-1 px-2 text-[11px] font-medium text-paper-text focus:outline-none focus:border-brand cursor-pointer"
                          >
                            <option value="all">Show All Connections</option>
                            <option value="selected">Selected Card Only</option>
                            <option value="none">Hide All Connections</option>
                          </select>
                        </div>

                        {/* Density Toggle */}
                        <div className="flex items-center bg-paper-canvas border border-paper-border rounded-lg p-0.5 space-x-0.5">
                          <button
                            onClick={() => setCardDensity('full')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              cardDensity === 'full'
                                ? 'bg-white text-brand shadow-xs'
                                : 'text-paper-muted hover:text-paper-text'
                            }`}
                            title="Show full content and tags"
                          >
                            Detailed
                          </button>
                          <button
                            onClick={() => setCardDensity('compact')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              cardDensity === 'compact'
                                ? 'bg-white text-brand shadow-xs'
                                : 'text-paper-muted hover:text-paper-text'
                            }`}
                            title="Show compact card layout to fit more on board"
                          >
                            Compact
                          </button>
                        </div>

                        {/* Auto Arrange Grid Button */}
                        <button
                          onClick={autoArrangeBoard}
                          className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1 transition-all shadow-xs cursor-pointer active:scale-95"
                          title="Auto-align cards into an elegant, non-overlapping grid layout"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span>Smart Auto-Arrange</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-brand"></span>
                        <h3 className="text-[10px] font-bold tracking-widest text-paper-muted uppercase">
                          {boardData.title || 'Interactive Storyboard Workspace'}
                        </h3>
                      </div>
                      {/* Zoom Levels */}
                      <div className="flex items-center bg-white border border-paper-border rounded-lg p-0.5 space-x-1 shadow-sm">
                        <button 
                          onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.1))} 
                          className="p-1 text-paper-muted hover:text-paper-text text-xs px-2 hover:bg-paper-sidebar rounded font-mono cursor-pointer"
                          title="Zoom out"
                        >
                          -
                        </button>
                        <span className="text-[10px] text-paper-muted font-mono select-none px-1 font-semibold">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button 
                          onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))} 
                          className="p-1 text-paper-muted hover:text-paper-text text-xs px-2 hover:bg-paper-sidebar rounded font-mono cursor-pointer"
                          title="Zoom in"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Advanced Declutter Sub-bar */}
                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2.5 mb-4 flex flex-wrap items-center justify-between text-xs text-rose-950 gap-2.5">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-bold uppercase text-[9px] tracking-wider text-rose-900">Cast Declutter Systems:</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Display mode toggle */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-rose-900/80 font-medium">Display Mode:</span>
                          <div className="flex items-center bg-white border border-rose-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              onClick={() => setCharacterDisplayMode('card')}
                              className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all ${
                                characterDisplayMode === 'card'
                                  ? 'bg-rose-500 text-white shadow-3xs'
                                  : 'text-rose-900 hover:text-rose-700'
                              }`}
                            >
                              Card Format
                            </button>
                            <button
                              onClick={() => setCharacterDisplayMode('pin')}
                              className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-all flex items-center gap-1 ${
                                characterDisplayMode === 'pin'
                                  ? 'bg-rose-500 text-white shadow-3xs'
                                  : 'text-rose-900 hover:text-rose-700'
                              }`}
                            >
                              <span>📍 Pushpins Mode</span>
                            </button>
                          </div>
                        </div>

                        {/* Cast Faction/Tag Filter */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-rose-900/80 font-medium">Focus Faction:</span>
                          <select
                            value={characterTagFilter}
                            onChange={(e) => setCharacterTagFilter(e.target.value)}
                            className="bg-white border border-rose-200 text-[10px] font-bold text-rose-900 rounded-lg px-2 py-0.5 focus:outline-none focus:border-rose-400 cursor-pointer shadow-2xs"
                            title="Filter character cards by faction or grouping tags"
                          >
                            <option value="All">All Factions / Characters</option>
                            {Array.from(
                              new Set(
                                boardData.items
                                  .filter(item => item.type === 'character')
                                  .flatMap(item => item.tags || [])
                              )
                            ).map(tag => (
                              <option key={tag} value={tag}>👥 {tag}</option>
                            ))}
                          </select>
                        </div>

                        {/* Card Pins Accent Toggle */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-rose-900/80 font-medium">Card Pins:</span>
                          <button
                            onClick={() => setShowCardPins(!showCardPins)}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border cursor-pointer transition-all ${
                              showCardPins
                                ? 'bg-rose-500 border-rose-500 text-white shadow-3xs hover:bg-rose-600'
                                : 'bg-white border-rose-200 text-rose-900 hover:bg-rose-50 shadow-2xs'
                            }`}
                            title="Toggle whether decorative color-coded pushpins are displayed at the top of the cards to reduce visual clutter"
                          >
                            {showCardPins ? 'Hide Pins' : 'Show Pins'}
                          </button>
                        </div>
                      </div>

                      <div className="text-[9px] text-rose-700/80 italic font-medium">
                        {characterDisplayMode === 'pin' ? '💡 Pushpins collapse large cards to free up 85% canvas space while keeping yarns!' : '💡 Switch to Pushpin Mode to visually clean up yarn intersections!'}
                      </div>
                    </div>

                    {/* Absolute positioning cork board boundary */}
                    <div className="flex-1 bg-paper-canvas border-2 border-paper-border rounded-2xl relative overflow-auto cork-scrollbar select-none shadow-inner">
                      
                      {/* Simulated Cork texture layer */}
                      <div 
                        ref={corkboardRef}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{ 
                          transform: `scale(${zoomLevel})`, 
                          transformOrigin: 'top left',
                          width: '1600px',
                          height: '1000px',
                          backgroundColor: '#F4F1EA', // Warm high-density tan page
                          backgroundImage: 'radial-gradient(#E9E2D5 15%, transparent 16%)',
                          backgroundSize: '16px 16px'
                        }}
                        className="relative border-4 border-paper-border rounded-lg shadow-inner"
                      >
                        {/* Interactive Connections (Yarn cords SVG overlays) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                          {visibleThreads.map(thread => {
                            const srcNode = filteredItems.find(it => it.id === thread.sourceId);
                            const tgtNode = filteredItems.find(it => it.id === thread.targetId);

                            if (!srcNode || !tgtNode) return null;

                            // Approximate pins location (top center of the cards or center of pushpins)
                            const isSrcPin = srcNode.type === 'character' && characterDisplayMode === 'pin';
                            const isTgtPin = tgtNode.type === 'character' && characterDisplayMode === 'pin';

                            const x1 = srcNode.x + (isSrcPin ? 16 : (cardDensity === 'compact' ? 89 : 110));
                            const y1 = srcNode.y + (isSrcPin ? 16 : 10);
                            const x2 = tgtNode.x + (isTgtPin ? 16 : (cardDensity === 'compact' ? 89 : 110));
                            const y2 = tgtNode.y + (isTgtPin ? 16 : 10);

                            // Draw slight curve/sag in yarn thread
                            const cx = (x1 + x2) / 2;
                            const cy = (y1 + y2) / 2 + 18;

                            return (
                              <g key={thread.id}>
                                {/* Droop shadow for yarn curve */}
                                <path
                                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                                  fill="none"
                                  stroke="#111111"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeOpacity="0.4"
                                  transform="translate(1, 3)"
                                />
                                {/* Colored thread strand */}
                                <path
                                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                                  fill="none"
                                  stroke={thread.color || '#EF4444'}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                                {/* Yarn link label box */}
                                <foreignObject
                                  x={cx - 60}
                                  y={cy - 12}
                                  width="120"
                                  height="24"
                                  className="overflow-visible pointer-events-auto"
                                >
                                  <div className="flex items-center justify-center">
                                    <div 
                                      style={{ borderColor: thread.color }}
                                      className="text-[8px] bg-slate-950 font-bold px-2 py-0.5 rounded-full border shadow-sm leading-none text-slate-200 text-center whitespace-nowrap flex items-center gap-1 hover:bg-slate-900 transition-all cursor-default select-none group"
                                    >
                                      <span>{thread.label}</span>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteThread(thread.id);
                                        }}
                                        className="p-0.5 hover:bg-rose-600 rounded-full cursor-pointer text-slate-400 hover:text-white transition-all ml-0.5"
                                        title="Delete yarn connection"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </foreignObject>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Interactive Cards mapped on cork-board coordinates */}
                        {filteredItems.map(item => {
                          const isSelected = selectedItem?.id === item.id;
                          let bgClass = 'bg-white border-paper-border text-paper-text';
                          let tagClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                          if (item.type === 'note') {
                            bgClass = 'bg-paper-yellow border-paper-yellow-border text-paper-text';
                            tagClass = 'bg-brand/10 text-brand border-brand/20';
                          } else if (item.type === 'document') {
                            bgClass = 'bg-white border-paper-border text-paper-text font-mono';
                            tagClass = 'bg-blue-50 text-blue-800 border-blue-200';
                          } else if (item.type === 'storyboard') {
                            bgClass = 'bg-sky-50 border-sky-200 text-sky-950';
                            tagClass = 'bg-sky-100 text-sky-800 border-sky-300';
                          }

                          if (item.type === 'character' && characterDisplayMode === 'pin') {
                            return (
                              <div
                                key={item.id}
                                style={{ 
                                    left: `${item.x}px`, 
                                    top: `${item.y}px`,
                                    position: 'absolute'
                                }}
                                onMouseDown={(e) => handleDragStart(item.id, e)}
                                onDoubleClick={() => triggerEditItem(item)}
                                className={`group flex flex-col items-center z-10 cursor-grab active:cursor-grabbing hover:scale-110 transition-all ${
                                  isSelected ? 'ring-4 ring-brand/50 scale-[1.05]' : ''
                                }`}
                                title="Drag to relocate character on corkboard. Double-click to inspect detailed attributes & traits."
                              >
                                <div 
                                  style={{ 
                                    backgroundColor: item.color || '#EF4444',
                                    borderColor: isSelected ? '#FFFFFF' : '#E2E8F0'
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-white/80 relative select-none group-hover:shadow-lg"
                                >
                                  <div className="absolute top-0.5 left-1.5 w-2.5 h-1 bg-white/40 rounded-full blur-[0.5px]"></div>
                                  <div className="absolute inset-0.5 rounded-full border border-black/10"></div>
                                  <span className="text-white text-[9px] font-extrabold tracking-tighter select-none drop-shadow-sm">
                                    {getInitials(item.title)}
                                  </span>
                                  <div className="absolute -bottom-1 w-0.5 h-1.5 bg-slate-400 rounded-full -z-10 group-hover:bg-slate-500"></div>
                                </div>
                                <div className="mt-1 px-1.5 py-0.5 bg-slate-900/90 text-white text-[8px] font-bold rounded border border-slate-700 shadow-xs max-w-[70px] truncate text-center select-none group-hover:bg-slate-950 group-hover:max-w-none">
                                  {item.title.split(' ').pop()}
                                </div>
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 bg-slate-950 text-white rounded-lg p-2.5 shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 text-[10px] space-y-1 scale-90 group-hover:scale-100">
                                  <div className="font-bold text-rose-400">{item.title}</div>
                                  {item.subtitle && <div className="text-slate-400 italic text-[9px]">{item.subtitle}</div>}
                                  <p className="text-slate-300 leading-normal line-clamp-3 font-normal mt-0.5">{item.content}</p>
                                  <div className="text-[8px] text-slate-500 font-mono mt-1 border-t border-slate-800 pt-1">Double-click to edit card</div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={item.id}
                              style={{ 
                                  left: `${item.x}px`, 
                                  top: `${item.y}px`,
                                  position: 'absolute'
                              }}
                              onMouseDown={(e) => handleDragStart(item.id, e)}
                              onDoubleClick={() => triggerEditItem(item)}
                              className={`rounded-xl border shadow-md z-10 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all ${bgClass} ${
                                isSelected ? 'ring-4 ring-brand/40 scale-[1.02]' : ''
                              } ${
                                cardDensity === 'compact' ? 'w-48 p-2 pb-2.5' : 'w-56 p-3 pb-4'
                              }`}
                            >
                              {/* Pushpin indicator visual anchor */}
                              {showCardPins && (
                                <div 
                                  style={{ left: cardDensity === 'compact' ? '89px' : '102px' }}
                                  className="absolute -top-3 drop-shadow-md flex flex-col items-center z-20 animate-fade-in"
                                  title="Represents physical pushpin securing card to corkboard"
                                >
                                  <div 
                                    style={{ 
                                      backgroundColor: item.color || '#EF4444',
                                    }}
                                    className="w-3.5 h-3.5 rounded-full border border-black/15 relative flex items-center justify-center shadow"
                                  >
                                    <div className="w-1.5 h-1 bg-white/40 rounded-full absolute top-0.5 left-0.5"></div>
                                  </div>
                                  <div className="w-0.5 h-2 bg-slate-400/80"></div>
                                </div>
                              )}

                              {/* Card Content details */}
                              <div className="flex items-center justify-between mb-1.5 pt-1">
                                <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">
                                  {item.type}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); triggerEditItem(item); }}
                                    className="p-0.5 hover:bg-paper-sidebar text-paper-muted hover:text-paper-text rounded cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                    className="p-0.5 hover:bg-rose-50 text-paper-muted hover:text-rose-600 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="text-xs font-bold font-serif leading-tight truncate">
                                {item.title}
                              </h4>
                              {item.subtitle && (
                                <p className="text-[10px] text-paper-muted font-semibold italic mt-0.5 truncate">
                                  {item.subtitle}
                                </p>
                              )}

                              <p className={`leading-relaxed mt-2 font-normal text-paper-text/90 ${
                                cardDensity === 'compact' ? 'text-[9px] line-clamp-1 mt-1' : 'text-[10px] line-clamp-4'
                              }`}>
                                {item.content}
                              </p>

                              {/* Storyboard images: Hidden completely in compact density to prevent clutter */}
                              {item.type === 'storyboard' && item.image_path && cardDensity === 'full' && (
                                <div className="mt-2.5 rounded-lg overflow-hidden border border-sky-200 bg-white aspect-video flex items-center justify-center">
                                  <img 
                                    src={item.image_path} 
                                    alt={item.title} 
                                    referrerPolicy="no-referrer"
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}

                              {/* Tags: Hidden completely in compact density to save height */}
                              {item.tags && item.tags.length > 0 && cardDensity === 'full' && (
                                <div className="flex flex-wrap gap-1 mt-3.5">
                                  {item.tags.map(tag => (
                                    <span key={tag} className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${tagClass}`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Simulated Remote Collaboration Cursors */}
                        {collabSimActive && collabUsers.map(user => (
                          <div
                            key={user.id}
                            style={{
                              left: `${user.cursorX}px`,
                              top: `${user.cursorY}px`,
                              transition: 'left 1.2s ease, top 1.2s ease',
                              position: 'absolute'
                            }}
                            className="pointer-events-none z-50 drop-shadow-md"
                          >
                            {/* Mouse cursor pointer */}
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                              <path d="M0 0V16L5 11L11 16L13 14L7 9L13 7L0 0Z" fill={user.color} />
                            </svg>
                            <span
                              style={{ backgroundColor: user.color }}
                              className="text-[8px] text-white font-bold px-1.5 py-0.5 rounded shadow absolute top-4 left-3 whitespace-nowrap"
                            >
                              {user.name}
                            </span>
                          </div>
                        ))}

                      </div>
                    </div>
                  </div>

                  {/* Right Side: Selected Card Panel bio logs */}
                  {selectedItem && (
                    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-paper-border bg-paper-sidebar p-5 flex flex-col space-y-4 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-paper-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 font-bold px-2.5 py-0.5 rounded-full">
                          {selectedItem.type.toUpperCase()} PROFILE
                        </span>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="text-xs text-paper-muted hover:text-paper-text cursor-pointer font-medium"
                        >
                          Hide Panel
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold font-serif text-paper-text">{selectedItem.title}</h3>
                        {selectedItem.subtitle && (
                          <p className="text-xs text-paper-muted font-medium italic mt-0.5">{selectedItem.subtitle}</p>
                        )}
                      </div>

                      <div className="space-y-4 pt-2">
                        <div>
                          <span className="text-[10px] text-paper-muted uppercase font-mono block font-bold">Draft Snippet</span>
                          <p className="text-xs text-paper-text leading-relaxed mt-1 font-normal bg-white p-3 rounded-lg border border-paper-border shadow-sm">
                            {selectedItem.content}
                          </p>
                        </div>

                        {/* If it has character metadata traits */}
                        {selectedItem.type === 'character' && selectedItem.meta && (
                          <>
                            <div>
                              <span className="text-[10px] text-paper-muted uppercase font-mono block font-bold">Backstory & Core Context</span>
                              <p className="text-xs text-paper-text mt-1 leading-relaxed">
                                {selectedItem.meta.backstory || 'No extended backstory defined.'}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] text-paper-muted uppercase font-mono block font-bold">Core Motivation</span>
                              <div className="bg-white px-3 py-2.5 rounded-lg border-l-2 border-brand text-xs italic text-paper-text mt-1 border border-paper-border border-l-0 shadow-sm">
                                "{selectedItem.meta.motivation}"
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-paper-muted uppercase font-mono block mb-1.5 font-bold">Distinguishing Traits</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedItem.meta.traits?.map(tr => (
                                  <span key={tr} className="text-[9px] bg-white text-paper-text px-2 py-0.5 rounded border border-paper-border shadow-sm">
                                    {tr}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="bg-white p-2 rounded border border-paper-border shadow-sm">
                                <span className="text-[8px] text-paper-muted uppercase font-mono font-bold">Physical Handedness</span>
                                <span className="text-xs text-paper-text block mt-0.5 font-medium">{selectedItem.meta.handedness || 'Right-handed'}</span>
                              </div>
                              <div className="bg-white p-2 rounded border border-paper-border shadow-sm">
                                <span className="text-[8px] text-paper-muted uppercase font-mono font-bold">Physical Eye Color</span>
                                <span className="text-xs text-paper-text block mt-0.5 font-medium">{selectedItem.meta.eyeColor || 'Brown'}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {selectedItem.type === 'storyboard' && selectedItem.image_path && (
                          <div className="rounded-xl overflow-hidden border border-paper-border bg-white shadow-xs aspect-video flex items-center justify-center">
                            <img 
                              src={selectedItem.image_path} 
                              alt={selectedItem.title} 
                              referrerPolicy="no-referrer"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}

                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                          <div>
                            <span className="text-[10px] text-paper-muted uppercase font-mono block mb-1.5 font-bold">Fitted Tags</span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedItem.tags.map(tag => (
                                <span key={tag} className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  selectedItem.type === 'note' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={() => triggerEditItem(selectedItem)}
                            className="w-full bg-white hover:bg-paper-sidebar text-paper-text font-bold text-xs py-2 rounded-lg border border-paper-border shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Card Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* TAB 2: INTERACTIVE NARRATIVE TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-paper-canvas">
                <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-sm font-bold font-display text-paper-text uppercase tracking-widest flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-brand" />
                      <span>Chronological Narrative Development Timeline</span>
                    </h2>
                    <p className="text-xs text-paper-muted mt-1 leading-relaxed">
                      Track individual character development arcs, emotional transitions, and scene events chronologically.
                    </p>
                  </div>

                  {/* Character Development Multi-line Chart Card */}
                  <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-paper-muted uppercase tracking-widest">Character Growth & Development Curves</h3>
                      <p className="text-[11px] text-paper-muted mt-0.5">
                        Interactive linear chart showing individual character growth indexes (-1.0 to 1.0) through chronological plot milestones.
                      </p>
                    </div>

                    {/* Interactive Filter Pills */}
                    {uniqueTimelineChars.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-mono text-paper-muted uppercase tracking-wider font-semibold block">
                          Toggle Character Tracks
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueTimelineChars.map(char => {
                            const isSelected = selectedTimelineCharacters.length === 0 || selectedTimelineCharacters.includes(char);
                            const color = getTimelineCharacterColor(char);
                            return (
                              <button
                                key={char}
                                onClick={() => {
                                  if (selectedTimelineCharacters.includes(char)) {
                                    setSelectedTimelineCharacters(prev => prev.filter(c => c !== char));
                                  } else {
                                    setSelectedTimelineCharacters(prev => [...prev, char]);
                                  }
                                }}
                                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center space-x-1.5 ${
                                  isSelected
                                    ? 'bg-paper-sidebar text-paper-text border-paper-border font-extrabold shadow-sm'
                                    : 'bg-white text-paper-muted border-dashed border-paper-border/70 hover:text-paper-text'
                                }`}
                              >
                                <span 
                                  className="w-2 h-2 rounded-full inline-block" 
                                  style={{ backgroundColor: isSelected ? color : '#E5E7EB' }} 
                                />
                                <span>{char}</span>
                              </button>
                            );
                          })}
                          {selectedTimelineCharacters.length > 0 && (
                            <button
                              onClick={() => setSelectedTimelineCharacters([])}
                              className="text-[10px] text-brand hover:underline font-bold px-2 py-1 cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recharts Multi-line Container */}
                    <div className="h-72 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getCharacterGrowthData()}
                          margin={{ top: 10, right: 30, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" />
                          <XAxis 
                            dataKey="stepName" 
                            stroke="#8B7E6D" 
                            fontSize={9}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#8B7E6D" 
                            fontSize={10} 
                            domain={[-1.0, 1.0]} 
                            tickCount={5}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTimelineTooltip />} />
                          <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="3 3" />
                          
                          {/* Dynamically draw lines for selected or all characters */}
                          {uniqueTimelineChars
                            .filter(char => selectedTimelineCharacters.length === 0 || selectedTimelineCharacters.includes(char))
                            .map(char => (
                              <Line
                                key={char}
                                type="monotone"
                                dataKey={char}
                                name={char}
                                stroke={getTimelineCharacterColor(char)}
                                strokeWidth={2.5}
                                activeDot={{ r: 6, strokeWidth: 1 }}
                                dot={{ strokeWidth: 2, r: 3.5 }}
                                connectNulls={true}
                              />
                            ))
                          }
                          <Legend 
                            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                            iconSize={8}
                            iconType="circle"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Vertical Timeline Path */}
                  <div className="relative border-l-2 border-paper-border ml-4 pl-8 space-y-8 py-4">
                    {boardData.timeline.map((milestone, idx) => {
                      const isPositive = milestone.developmentType === 'positive';
                      const isNegative = milestone.developmentType === 'negative';
                      let dotColor = 'bg-paper-muted ring-paper-border';
                      let badgeClass = 'bg-white text-paper-text border-paper-border';

                      if (isPositive) {
                        dotColor = 'bg-emerald-600 ring-emerald-100';
                        badgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                      } else if (isNegative) {
                        dotColor = 'bg-rose-600 ring-rose-100';
                        badgeClass = 'bg-rose-50 text-rose-800 border border-rose-200';
                      }

                      return (
                        <div key={milestone.id} className="relative group">
                          {/* Chronological Step Node Ring */}
                          <div className={`absolute -left-[41px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ${dotColor} transition-transform group-hover:scale-125 z-10 shadow-sm`}></div>

                          <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-3 hover:border-brand/40 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-brand font-bold">
                                {milestone.chapter}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-paper-text bg-paper-sidebar px-2.5 py-0.5 rounded border border-paper-border">
                                  {milestone.character}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeClass}`}>
                                  {milestone.developmentType}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-paper-text leading-relaxed">
                              {milestone.description}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-paper-muted font-mono pt-2 border-t border-paper-border/60">
                              <span>Emotional State: <strong className="text-paper-text">{milestone.emotionalState}</strong></span>
                              <span>Heuristic Value: <strong className={milestone.sentimentScore > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                {milestone.sentimentScore > 0 ? `+${milestone.sentimentScore.toFixed(2)}` : milestone.sentimentScore.toFixed(2)}
                              </strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EMOTIONAL & DIALOGUE COACH */}
            {activeTab === 'sentiment' && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-paper-canvas">
                <div className="max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-paper-border pb-4 gap-4">
                    <div>
                      <h2 className="text-sm font-bold font-display text-paper-text uppercase tracking-widest flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-brand" />
                        <span>Sentiment & Dialogue Pacing Coach</span>
                      </h2>
                      <p className="text-xs text-paper-muted mt-1 leading-relaxed">
                        Track chapter-by-chapter emotional wave models, sentiment ratings, conversational pacing, and voice naturalness in a unified engine.
                      </p>
                    </div>
                    
                    {/* Inner Sub-tab selection */}
                    <div className="bg-white border border-paper-border rounded-lg p-1 flex space-x-1 shadow-sm self-start shrink-0">
                      <button
                        onClick={() => setSentimentSubTab('sentiment')}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          sentimentSubTab === 'sentiment'
                            ? 'bg-brand text-white shadow-xs'
                            : 'text-paper-muted hover:text-paper-text'
                        }`}
                      >
                        📈 Sentiment Waveform
                      </button>
                      <button
                        onClick={() => setSentimentSubTab('dialogue')}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          sentimentSubTab === 'dialogue'
                            ? 'bg-brand text-white shadow-xs'
                            : 'text-paper-muted hover:text-paper-text'
                        }`}
                      >
                        🎙️ Dialogue Coaching
                      </button>
                    </div>
                  </div>

                  {sentimentSubTab === 'sentiment' ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Recharts Sentiment Line Chart */}
                      <div className="bg-white border border-paper-border p-5 rounded-xl shadow-sm">
                        <h3 className="text-xs font-bold text-paper-muted uppercase tracking-widest mb-4">Emotional Sentiment Waveform</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={boardData.sentiments}
                              margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E9E2D5" />
                              <XAxis 
                                dataKey="chapterName" 
                                stroke="#8B7E6D" 
                                fontSize={9}
                                tickLine={false}
                              />
                              <YAxis 
                                stroke="#8B7E6D" 
                                fontSize={10} 
                                domain={[-1.0, 1.0]} 
                                tickCount={5}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FAF8F4', borderColor: '#E9E2D5', borderRadius: '8px' }}
                                labelStyle={{ color: '#A68E74', fontWeight: 'bold', fontSize: '11px' }}
                                itemStyle={{ color: '#433F38', fontSize: '11px' }}
                              />
                              <ReferenceLine y={0} stroke="#A68E74" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
                              <Line 
                                type="monotone" 
                                dataKey="score" 
                                name="Sentiment Value"
                                stroke="#A68E74" 
                                strokeWidth={3} 
                                activeDot={{ r: 6, strokeWidth: 1 }}
                                dot={{ strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Chapter-by-chapter Detailed Breakdown cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {boardData.sentiments.map((sent) => {
                          const scoreSign = sent.score > 0 ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-rose-800 bg-rose-50 border border-rose-200';
                          return (
                            <div key={sent.id} className="bg-white border border-paper-border p-5 rounded-xl flex flex-col justify-between hover:border-brand/40 transition-all space-y-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-paper-text font-serif uppercase tracking-wide">
                                  {sent.chapterName}
                                </h4>
                                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${scoreSign}`}>
                                  {sent.score > 0 ? `+${sent.score.toFixed(2)}` : sent.score.toFixed(2)}
                                </span>
                              </div>

                              <p className="text-xs text-paper-text leading-relaxed font-normal">
                                {sent.summary}
                              </p>

                              <div className="space-y-2 pt-2 border-t border-paper-border">
                                <span className="text-[9px] text-paper-muted uppercase font-mono block font-bold">Dominant Tone</span>
                                <span className="text-xs font-semibold text-paper-text block">{sent.dominantEmotion}</span>
                                
                                {sent.keywords && sent.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {sent.keywords.map(kw => (
                                      <span key={kw} className="text-[8px] bg-paper-sidebar text-paper-muted border border-paper-border px-2 py-0.5 rounded font-medium">
                                        #{kw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {boardData.dialogue.map((rev) => {
                        return (
                          <div key={rev.id} className="bg-white border border-paper-border rounded-xl p-6 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-paper-border gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-paper-text font-serif">
                                  {rev.characterName}
                                </h3>
                                <p className="text-[10px] text-paper-muted font-semibold mt-0.5">Conversational pacing and subtext metrics</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <span className="text-base font-bold text-emerald-700">{rev.naturalnessScore}%</span>
                                  <p className="text-[8px] text-paper-muted font-mono font-bold">NATURALNESS</p>
                                </div>
                                <div className="text-center border-l border-paper-border pl-4">
                                  <span className="text-base font-bold text-brand">{rev.pacingScore}%</span>
                                  <p className="text-[8px] text-paper-muted font-mono font-bold">PACING COMPOSURE</p>
                                </div>
                              </div>
                            </div>

                            {/* General Voice Feedback */}
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-paper-muted block mb-1.5">Executive critique</span>
                              <p className="text-xs text-paper-text leading-relaxed">
                                {rev.feedback}
                              </p>
                            </div>

                            {/* Transcript Examples & Subtext */}
                            <div className="space-y-3">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-paper-muted block">Subtext and pacing breakdowns</span>
                              {rev.examples?.map((ex, i) => (
                                <div key={i} className="bg-paper-sidebar p-4 rounded-lg border border-paper-border space-y-3">
                                  <div className="flex items-start">
                                    <span className="text-xs text-brand font-bold shrink-0 font-mono select-none mr-2">“</span>
                                    <p className="text-xs text-paper-text font-mono italic leading-relaxed font-normal">
                                      {ex.quote}
                                    </p>
                                    <span className="text-xs text-brand font-bold shrink-0 font-mono select-none ml-2 leading-none">”</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-paper-border/60 text-xs">
                                    <div className="space-y-1">
                                      <span className="text-[9px] uppercase font-bold text-paper-muted tracking-wider">Dramatic Subtext</span>
                                      <p className="text-paper-text leading-relaxed font-normal">{ex.subtext}</p>
                                    </div>
                                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-paper-border/60 pt-2 sm:pt-0 sm:pl-3">
                                      <span className="text-[9px] uppercase font-bold text-brand tracking-wider">Coach Recommendation</span>
                                      <p className="text-paper-text leading-relaxed font-normal">{ex.recommendation}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB 4: CHARACTER CONSISTENCY PROFILES */}
            {activeTab === 'consistency' && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-paper-canvas">
                <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-sm font-bold font-display text-paper-text uppercase tracking-widest flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-brand" />
                      <span>Character Continuity & Consistency profiles</span>
                    </h2>
                    <p className="text-xs text-paper-muted mt-1 leading-relaxed">
                      Automated fact audit systems check eye color, physical details, background timeline events, and flag structural logic errors.
                    </p>
                  </div>

                  {boardData.consistency.map((prof) => {
                    const hasWarnings = prof.warnings && prof.warnings.length > 0;
                    const ratingColor = prof.overallScore >= 90 ? 'text-emerald-700' : 'text-amber-700';

                    return (
                      <div key={prof.id} className="bg-white border border-paper-border rounded-xl p-6 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-paper-border gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-paper-text font-serif flex items-center space-x-2">
                              <span>{prof.characterName}</span>
                              {hasWarnings && (
                                <span className="text-[9px] bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full animate-pulse flex items-center space-x-1 shadow-sm">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>{prof.warnings.length} Continuity Flags</span>
                                </span>
                              )}
                            </h3>
                            <p className="text-[10px] text-paper-muted font-semibold mt-0.5">Automated fact matrix audit</p>
                          </div>
                          <div className="text-right sm:text-right">
                            <span className={`text-lg font-bold font-mono ${ratingColor}`}>{prof.overallScore}/100</span>
                            <p className="text-[9px] text-paper-muted font-mono font-bold">CONTINUITY SCORE</p>
                          </div>
                        </div>

                        {/* Warnings List */}
                        {hasWarnings && (
                          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2 shadow-sm animate-fade-in">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-800 block">Critical Continuity warnings</span>
                            {prof.warnings.map((warn, i) => (
                              <div key={i} className="flex items-start space-x-2 text-xs text-rose-900 leading-relaxed font-medium">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <p>{warn}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Verified Logged Facts */}
                        <div className="space-y-4">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-paper-muted block">Established Factual Matrix</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {prof.facts.map((factItem, idx) => (
                              <div key={idx} className="bg-paper-bg p-3 rounded-lg border border-paper-border flex flex-col justify-between space-y-3 shadow-sm">
                                <div className="flex items-start justify-between">
                                  <p className="text-xs text-paper-text leading-relaxed font-medium">
                                    "{factItem.fact}"
                                  </p>
                                  <span className={`p-0.5 rounded-full ml-2 shrink-0 ${
                                    factItem.isConsistent ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                </div>

                                <div className="text-[9px] text-paper-muted font-mono pt-2 border-t border-paper-border/60 flex justify-between font-bold">
                                  <span>Source: {factItem.establishedIn}</span>
                                  <span className={factItem.isConsistent ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                    {factItem.isConsistent ? 'Verified Consistent' : 'Contradiction flagged'}
                                  </span>
                                </div>

                                {factItem.warningMessage && (
                                  <div className="bg-rose-50 text-rose-900 p-2.5 rounded text-[10px] border border-rose-200 mt-1 leading-relaxed font-medium">
                                    <strong>Conflict details:</strong> {factItem.warningMessage}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: VIDEO VISUAL MAPPER */}
            {activeTab === 'videomapper' && (() => {
              const currentScene = mappedScenes.find(s => s.id === selectedSceneId) || mappedScenes[0];
              const totalScenes = mappedScenes.length;
              const mappedCount = mappedScenes.filter(s => s.isMapped).length;
              const progressPercentage = totalScenes > 0 ? Math.round((mappedCount / totalScenes) * 100) : 0;

              const getCompiledQuery = (scene: MappedScene) => {
                if (!scene) return '';
                let query = scene.searchQuery.trim();
                if (scene.colors && scene.colors !== 'all') {
                  query += ` ${scene.colors}`;
                }
                if (scene.objects && scene.objects.length > 0) {
                  query += ` ${scene.objects.join(' ')}`;
                }
                return query;
              };

              const getSearchUrl = (scene: MappedScene) => {
                if (!scene) return '';
                const compiled = getCompiledQuery(scene);
                const provider = scene.stockProvider;
                const orientation = scene.orientation;

                if (provider === 'pexels') {
                  return `https://www.pexels.com/search/videos/${encodeURIComponent(compiled)}/?orientation=${orientation}`;
                } else if (provider === 'pixabay') {
                  const pxaOrientation = orientation === 'portrait' ? 'vertical' : orientation === 'landscape' ? 'horizontal' : 'all';
                  return `https://pixabay.com/videos/search/${encodeURIComponent(compiled)}/?orientation=${pxaOrientation}`;
                } else if (provider === 'videvo') {
                  return `https://www.videvo.net/stock-video-footage/${encodeURIComponent(compiled)}/`;
                } else {
                  return `https://mixkit.co/free-stock-video/${encodeURIComponent(compiled)}/`;
                }
              };

              const handleSearchSceneVideo = (scene: MappedScene) => {
                const url = getSearchUrl(scene);
                window.open(url, '_blank', 'noopener,noreferrer');
                setMappedScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isMapped: true } : s));
              };

              const updateSelectedSceneFields = (fields: Partial<MappedScene>) => {
                setMappedScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, ...fields } : s));
              };

              return (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full bg-paper-canvas">
                  
                  {/* Left Side: Scenes Chronological List & Tracker */}
                  <div className="w-full lg:w-80 border-r border-paper-border bg-white flex flex-col shrink-0 overflow-hidden">
                    
                    {/* List Header */}
                    <div className="p-4 border-b border-paper-border space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-paper-muted">Timeline Sequence</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {mappedCount}/{totalScenes} Mapped
                        </span>
                      </div>
                      
                      {/* Overall Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-paper-muted font-medium">
                          <span>Visual Map Integrity</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-paper-sidebar h-2 rounded-full overflow-hidden border border-paper-border">
                          <div 
                            className="bg-brand h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Rapid Parsing Trigger */}
                      <button
                        onClick={generateScenesFromText}
                        className="w-full bg-brand/5 hover:bg-brand/10 text-brand text-[10px] font-bold py-2 px-3 rounded border border-brand/20 flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95 mt-1"
                        title="Parse your manuscript text in the sidebar to generate custom visual stock video scene nodes automatically."
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span>Parse Manuscript Scenes</span>
                      </button>
                    </div>

                    {/* Scene Item Nodes */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                      {mappedScenes.map((scene) => {
                        const isSelected = scene.id === selectedSceneId;
                        return (
                          <div
                            key={scene.id}
                            onClick={() => setSelectedSceneId(scene.id)}
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative flex flex-col space-y-1 ${
                              isSelected
                                ? 'bg-paper-sidebar border-brand/80 shadow-xs ring-1 ring-brand/30'
                                : 'bg-white border-paper-border hover:bg-paper-bg'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[9px] font-bold font-mono text-paper-muted uppercase tracking-wider">
                                Scene {scene.sceneNumber}
                              </span>
                              
                              {/* Is Mapped indicator badge */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMappedScenes(prev => prev.map(s => s.id === scene.id ? { ...s, isMapped: !s.isMapped } : s));
                                }}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center space-x-1 cursor-pointer transition-all ${
                                  scene.isMapped
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-paper-bg border-paper-border text-paper-muted'
                                }`}
                                title="Toggle scene mapping completed state"
                              >
                                <Check className={`w-2.5 h-2.5 ${scene.isMapped ? 'text-emerald-600' : 'text-paper-muted'}`} />
                                <span>{scene.isMapped ? 'Mapped' : 'Pending'}</span>
                              </button>
                            </div>

                            <h4 className="text-xs font-bold text-paper-text font-serif truncate">
                              {scene.title}
                            </h4>
                            <p className="text-[10px] text-paper-muted truncate font-normal leading-relaxed">
                              {scene.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Scene Node Manual Trigger */}
                    <div className="p-3 border-t border-paper-border shrink-0 bg-white">
                      <button
                        onClick={() => {
                          const newNum = mappedScenes.length + 1;
                          const newScene: MappedScene = {
                            id: `sc_manual_${Date.now()}`,
                            sceneNumber: newNum,
                            title: `Scene ${newNum}: New Cinematic Chapter`,
                            description: 'Enter narration segment details here. This paragraph drives scene composition.',
                            searchQuery: 'cinematic storytelling moody environment',
                            orientation: 'landscape',
                            colors: 'all',
                            objects: [],
                            stockProvider: 'pexels',
                            isMapped: false
                          };
                          setMappedScenes(prev => [...prev, newScene]);
                          setSelectedSceneId(newScene.id);
                        }}
                        className="w-full bg-white hover:bg-paper-bg text-paper-text text-[10px] font-bold py-2 px-3 rounded border border-paper-border flex items-center justify-center space-x-1 cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-paper-muted" />
                        <span>Add New Scene Node</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Side: Visual Stock Finder Controls & Live Compiler */}
                  <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-paper-canvas">
                    {currentScene ? (
                      <div className="max-w-4xl w-full mx-auto space-y-6 animate-fade-in">
                        
                        {/* Selected Scene Header Card */}
                        <div className="bg-white border border-paper-border p-5 rounded-xl shadow-xs space-y-3.5 relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-24 h-24 bg-brand/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono text-brand uppercase tracking-widest bg-brand/5 border border-brand/20 px-2.5 py-0.5 rounded-full">
                              Active Editor: Scene {currentScene.sceneNumber}
                            </span>
                            
                            <button
                              onClick={() => {
                                if (mappedScenes.length <= 1) {
                                  alert("You must maintain at least one scene node in the map.");
                                  return;
                                }
                                if (confirm("Are you sure you want to delete this scene node from the map?")) {
                                  const index = mappedScenes.findIndex(s => s.id === currentScene.id);
                                  const updated = mappedScenes.filter(s => s.id !== currentScene.id).map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
                                  setMappedScenes(updated);
                                  setSelectedSceneId(updated[Math.max(0, index - 1)].id);
                                }
                              }}
                              className="text-paper-muted hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete this scene node from visual map"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Editable Scene Title Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Scene Title</label>
                            <input
                              type="text"
                              value={currentScene.title}
                              onChange={(e) => updateSelectedSceneFields({ title: e.target.value })}
                              className="w-full bg-paper-sidebar/30 border border-paper-border rounded-lg px-3 py-1.5 text-xs text-paper-text font-serif font-bold focus:border-brand focus:outline-none focus:bg-white transition-all"
                            />
                          </div>

                          {/* Editable Scene Narration / Text segment */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Script Narration / Segment Text</label>
                            <textarea
                              rows={3}
                              value={currentScene.description}
                              onChange={(e) => updateSelectedSceneFields({ description: e.target.value })}
                              className="w-full bg-paper-sidebar/30 border border-paper-border rounded-lg p-3 text-xs text-paper-text font-normal leading-relaxed focus:border-brand focus:outline-none focus:bg-white transition-all"
                              placeholder="Describe the narration or visual text segment to map..."
                            />
                          </div>
                        </div>

                        {/* Cinematic Search Customization Card */}
                        <div className="bg-white border border-paper-border rounded-xl p-6 shadow-sm space-y-6">
                          <div>
                            <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider border-b border-paper-border pb-2.5 flex items-center space-x-1.5">
                              <Video className="w-4 h-4 text-brand" />
                              <span>Stock Footage Query & Filtration Matrix</span>
                            </h3>
                            <p className="text-[10px] text-paper-muted mt-1 leading-relaxed">
                              Fine-tune orientation formats, colors, objects, and providers to compile the perfect free search query.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Left Col: Query + Provider */}
                            <div className="space-y-4">
                              
                              {/* Search Query Text Input */}
                              <div className="space-y-1">
                                <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Visual Search Keyword Phrases</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={currentScene.searchQuery}
                                    onChange={(e) => updateSelectedSceneFields({ searchQuery: e.target.value })}
                                    className="w-full bg-white border border-paper-border rounded-lg pl-8 pr-3 py-2 text-xs text-paper-text font-mono font-bold focus:border-brand focus:outline-none transition-all"
                                    placeholder="dog in the snow, study room, vintage car..."
                                  />
                                  <Search className="w-3.5 h-3.5 text-paper-muted absolute left-2.5 top-3" />
                                </div>
                              </div>

                              {/* Stock Provider Radio Swatches */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Stock Video Provider API Target</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { id: 'pexels', name: 'Pexels Videos', color: 'border-emerald-500 text-emerald-800 bg-emerald-50/20' },
                                    { id: 'pixabay', name: 'Pixabay Media', color: 'border-blue-500 text-blue-800 bg-blue-50/20' },
                                    { id: 'videvo', name: 'Videvo Free', color: 'border-indigo-500 text-indigo-800 bg-indigo-50/20' },
                                    { id: 'mixkit', name: 'Mixkit Stock', color: 'border-teal-500 text-teal-800 bg-teal-50/20' }
                                  ].map((prov) => {
                                    const isChosen = currentScene.stockProvider === prov.id;
                                    return (
                                      <button
                                        key={prov.id}
                                        onClick={() => updateSelectedSceneFields({ stockProvider: prov.id as any })}
                                        className={`p-2.5 rounded-lg border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
                                          isChosen
                                            ? `${prov.color} ring-1 font-extrabold`
                                            : 'border-paper-border text-paper-muted hover:text-paper-text bg-white'
                                        }`}
                                      >
                                        <span className="text-[11px]">{prov.name}</span>
                                        <span className="text-[8px] font-mono font-normal tracking-wide uppercase opacity-75">Free Stock</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>

                            {/* Right Col: Format, Tone, Objects */}
                            <div className="space-y-4">
                              
                              {/* Format / Orientation Visual Swatches */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Video Orientation Aspect-Ratio</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { id: 'landscape', label: 'Horizontal (16:9)', sub: 'Landscape' },
                                    { id: 'portrait', label: 'Vertical (9:16)', sub: 'Portrait' },
                                    { id: 'square', label: 'Square (1:1)', sub: 'Instagram' }
                                  ].map((ratio) => {
                                    const isChosen = currentScene.orientation === ratio.id;
                                    return (
                                      <button
                                        key={ratio.id}
                                        onClick={() => updateSelectedSceneFields({ orientation: ratio.id as any })}
                                        className={`p-2 rounded-lg border text-center flex flex-col justify-center items-center cursor-pointer transition-all ${
                                          isChosen
                                            ? 'bg-brand/5 border-brand text-brand font-bold'
                                            : 'bg-white border-paper-border text-paper-muted hover:text-paper-text'
                                        }`}
                                      >
                                        <span className="text-[10px] font-bold">{ratio.sub}</span>
                                        <span className="text-[8px] font-mono tracking-tighter opacity-70 mt-0.5">{ratio.label.split(' ')[1]}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Color Tone Multi Choice */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Color Palette Filter Keyword</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { id: 'all', name: 'All Colors', dot: 'bg-gray-200' },
                                    { id: 'dark', name: 'Dark / Night', dot: 'bg-black' },
                                    { id: 'warm', name: 'Warm / Golden', dot: 'bg-amber-400' },
                                    { id: 'blue', name: 'Muted Blue', dot: 'bg-blue-600' },
                                    { id: 'red', name: 'Deep Red', dot: 'bg-red-600' },
                                    { id: 'teal', name: 'Teal Cine', dot: 'bg-teal-500' },
                                    { id: 'bw', name: 'B&W Film', dot: 'bg-gray-400' }
                                  ].map((tone) => {
                                    const isChosen = (currentScene.colors || 'all') === tone.id;
                                    return (
                                      <button
                                        key={tone.id}
                                        onClick={() => updateSelectedSceneFields({ colors: tone.id })}
                                        className={`px-2 py-1 text-[9px] font-bold rounded-full border transition-all flex items-center space-x-1.5 cursor-pointer ${
                                          isChosen
                                            ? 'bg-paper-sidebar text-paper-text border-paper-border font-extrabold'
                                            : 'bg-white text-paper-muted border-paper-border/70 hover:text-paper-text'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                                        <span>{tone.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Objects Included Checklist Chips */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] text-paper-muted font-bold uppercase tracking-wider block font-mono">Visual Elements & Action Filters</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { id: 'humans', label: 'Contains Humans' },
                                    { id: 'vehicles', label: 'Contains Vehicles' },
                                    { id: 'nature', label: 'Nature Scene' },
                                    { id: 'indoors', label: 'Indoor Setup' },
                                    { id: 'slowmo', label: 'Slow Motion' }
                                  ].map((tag) => {
                                    const currentTags = currentScene.objects || [];
                                    const hasTag = currentTags.includes(tag.id);
                                    return (
                                      <button
                                        key={tag.id}
                                        onClick={() => {
                                          const nextTags = hasTag
                                            ? currentTags.filter(t => t !== tag.id)
                                            : [...currentTags, tag.id];
                                          updateSelectedSceneFields({ objects: nextTags });
                                        }}
                                        className={`px-2 py-1 text-[9px] font-bold rounded-md border transition-all cursor-pointer ${
                                          hasTag
                                            ? 'bg-brand/10 border-brand/50 text-brand font-extrabold'
                                            : 'bg-white text-paper-muted border-paper-border/70 hover:text-paper-text'
                                        }`}
                                      >
                                        <span>{hasTag ? '✓ ' : '+ '}{tag.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* Live Compiled Search Preview Box */}
                          <div className="bg-paper-sidebar/50 border border-paper-border rounded-lg p-4 space-y-2">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-paper-muted font-mono block">Compiled Stock Query String</span>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs font-mono font-bold text-paper-text italic truncate">
                                "{getCompiledQuery(currentScene)}"
                              </span>
                              <span className="text-[9px] bg-brand/10 text-brand font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0">
                                {currentScene.orientation} Aspect Ratio
                              </span>
                            </div>
                          </div>

                          {/* Core Search & Map Actions Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                            <button
                              onClick={() => handleSearchSceneVideo(currentScene)}
                              className="bg-brand hover:bg-brand-hover text-white font-bold py-3 px-5 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                              title="Compile search link, launch stock library search page in a new window/tab, and set scene mapped status."
                            >
                              <Search className="w-4 h-4 text-white" />
                              <span>🔍 Search Stock Video (Opens New Tab)</span>
                              <ExternalLink className="w-3.5 h-3.5 text-white/85" />
                            </button>

                            <button
                              onClick={() => {
                                updateSelectedSceneFields({ isMapped: !currentScene.isMapped });
                              }}
                              className={`font-bold py-3 px-5 rounded-lg text-xs flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                                currentScene.isMapped
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-white hover:bg-paper-bg border-paper-border text-paper-muted'
                              }`}
                              title="Toggle manual checked/confirmed mapping state"
                            >
                              <CheckCircle2 className={`w-4 h-4 ${currentScene.isMapped ? 'text-emerald-600' : 'text-paper-muted'}`} />
                              <span>{currentScene.isMapped ? '✓ Checked & Mapped (Click to Undo)' : 'Mark as Checked & Mapped'}</span>
                            </button>
                          </div>

                          {/* Workflow helper alert */}
                          <div className="bg-amber-50/50 border border-amber-200/50 p-3.5 rounded-lg flex items-start space-x-2 text-[11px] text-amber-900 leading-relaxed font-normal">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p>
                              <strong>Visual Mapping Workflow:</strong> Review the narration paragraph, click the search button to load free royalty-free videos in a new tab, download the ones you love, and check the mapping box to confidently build your visual story map sequence.
                            </p>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <Video className="w-12 h-12 text-paper-border" />
                        <h3 className="text-sm font-bold text-paper-text font-serif">No Scene Selected</h3>
                        <p className="text-xs text-paper-muted max-w-sm leading-relaxed font-normal">
                          Please select or generate narrative scene cards from the timeline panel on the left to start mapping story words to videos!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* TAB 6: EPUB & COVER DESIGN STUDIO */}
            {activeTab === 'epub' && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-paper-canvas">
                <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in pb-12">
                  
                  {/* Header & Concept */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-paper-border pb-4 gap-4">
                    <div>
                      <h2 className="text-base font-bold font-display text-paper-text uppercase tracking-widest flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-rose-500" />
                        <span>EPUB eBook Compiler & Book Jacket Studio</span>
                      </h2>
                      <p className="text-xs text-paper-muted mt-1 leading-relaxed">
                        Convert DOCX or RTF manuscripts into beautifully formatted .epub ebook files, complete with customized vector cover pages, back synopsis, and spines.
                      </p>
                    </div>
                    
                    {/* Status badge */}
                    <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 self-start">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-[10px] text-rose-800 font-bold uppercase font-mono">eReader Ready (EPUB 3)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Controls & Upload (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Section 1: Book Information & Metadata */}
                      <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider flex items-center space-x-2 border-b border-paper-border pb-2">
                          <Sliders className="w-4 h-4 text-rose-500" />
                          <span>Book Metadata</span>
                        </h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono">Book Title</label>
                            <input
                              type="text"
                              value={epubTitle}
                              onChange={(e) => setEpubTitle(e.target.value)}
                              placeholder="e.g., The Shadow of the Alps"
                              className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-rose-400 focus:outline-none text-paper-text font-medium"
                            />
                          </div>
                          
                          <div>
                            <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono">Author Name</label>
                            <input
                              type="text"
                              value={epubAuthor}
                              onChange={(e) => setEpubAuthor(e.target.value)}
                              placeholder="e.g., Arthur Conan Doyle"
                              className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-rose-400 focus:outline-none text-paper-text font-medium"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono">Language Code</label>
                              <select
                                value={epubLanguage}
                                onChange={(e) => setEpubLanguage(e.target.value)}
                                className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-rose-400 focus:outline-none text-paper-text font-medium"
                              >
                                <option value="en">English (en)</option>
                                <option value="fr">French (fr)</option>
                                <option value="de">German (de)</option>
                                <option value="it">Italian (it)</option>
                                <option value="es">Spanish (es)</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono">Publisher</label>
                              <input
                                type="text"
                                value={epubPublisher}
                                onChange={(e) => setEpubPublisher(e.target.value)}
                                placeholder="e.g., Story Board Press"
                                className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-rose-400 focus:outline-none text-paper-text font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Manuscript Upload */}
                      <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider flex items-center space-x-2 border-b border-paper-border pb-2">
                          <FileText className="w-4 h-4 text-rose-500" />
                          <span>Manuscript Ingestion</span>
                        </h3>
                        
                        <div className="space-y-3">
                          {/* File Uploader */}
                          <div 
                            className="border-2 border-dashed border-paper-border hover:border-rose-300 rounded-xl p-6 text-center transition-all bg-paper-sidebar cursor-pointer relative"
                            onClick={() => document.getElementById('manuscript-file-input')?.click()}
                          >
                            <input
                              type="file"
                              id="manuscript-file-input"
                              accept=".docx,.rtf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEpubFileName(file.name);
                                  // Read file as base64
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      const base64 = reader.result.split(',')[1] || '';
                                      setEpubFileBase64(base64);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            
                            <div className="flex flex-col items-center space-y-2">
                              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                                <Download className="w-5 h-5 rotate-180" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-paper-text block">Click to select or drag file here</span>
                                <span className="text-[10px] text-paper-muted block mt-0.5">Supports Microsoft Word (.docx) & Rich Text (.rtf)</span>
                              </div>
                            </div>
                          </div>

                          {epubFileName && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-paper-text truncate">{epubFileName}</p>
                                  <p className="text-[9px] text-paper-muted font-mono uppercase font-bold">READY TO COMPILE</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEpubFileName('');
                                  setEpubFileBase64('');
                                }}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded-md transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Visual Design Variables */}
                      <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider flex items-center space-x-2 border-b border-paper-border pb-2">
                          <Sliders className="w-4 h-4 text-rose-500" />
                          <span>Cover Graphics & Style Presets</span>
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] text-paper-muted font-bold block mb-1.5 uppercase font-mono">Typography Concept Style</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'minimalist', name: 'Minimalist Sans', desc: 'Modern & spacious' },
                                { id: 'vintage', name: 'Vintage Frame', desc: 'Classic centered serif' },
                                { id: 'bold', name: 'Bold Editorial', desc: 'Heavy asymmetrical' },
                                { id: 'neon', name: 'Sci-Fi Neon', desc: 'Futuristic glowing line' },
                                { id: 'classic', name: 'Classic Literary', desc: 'Symmetrical & elegant' },
                              ].map((style) => (
                                <button
                                  key={style.id}
                                  onClick={() => setCoverStyle(style.id as any)}
                                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                    coverStyle === style.id
                                      ? 'bg-rose-50 border-rose-300 shadow-xs'
                                      : 'bg-white border-paper-border hover:border-paper-muted/50'
                                  }`}
                                >
                                  <span className="text-xs font-bold text-paper-text block leading-snug">{style.name}</span>
                                  <span className="text-[9px] text-paper-muted block mt-0.5 leading-snug">{style.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color Palette Selection */}
                          <div>
                            <label className="text-[10px] text-paper-muted font-bold block mb-2 uppercase font-mono">Preset Palette Schemes</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { name: 'Deep Space', bg: '#0F172A', acc: '#E2E8F0', text: '#FFFFFF' },
                                { name: 'Royal Indigo', bg: '#1E3A8A', acc: '#F59E0B', text: '#FFFFFF' },
                                { name: 'Forest Gold', bg: '#064E3B', acc: '#FCD34D', text: '#F3F4F6' },
                                { name: 'Crimson Night', bg: '#7F1D1D', acc: '#FCA5A5', text: '#FFFFFF' },
                                { name: 'Cosmic Violet', bg: '#4C1D95', acc: '#C084FC', text: '#F9FAF1' },
                                { name: 'Sunset Terracotta', bg: '#7C2D12', acc: '#FFEDD5', text: '#FFFBEB' },
                                { name: 'Warm Parchment', bg: '#FDFBF7', acc: '#A68E74', text: '#433F38' },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() => {
                                    setCoverColor(preset.bg);
                                    setCoverAccentColor(preset.acc);
                                    setCoverTextColor(preset.text);
                                  }}
                                  className="group relative flex items-center justify-center border border-paper-border rounded-lg p-1 hover:border-paper-muted transition-all bg-white cursor-pointer"
                                  title={preset.name}
                                >
                                  <div className="flex space-x-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.bg }} />
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.acc }} />
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.text }} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Manual Color Pickers */}
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div>
                              <label className="text-[9px] text-paper-muted font-bold block mb-1 uppercase font-mono">Jacket Color</label>
                              <div className="flex items-center space-x-1 bg-paper-sidebar border border-paper-border rounded-lg p-1">
                                <input
                                  type="color"
                                  value={coverColor}
                                  onChange={(e) => setCoverColor(e.target.value)}
                                  className="w-6 h-6 border-0 p-0 rounded cursor-pointer"
                                />
                                <span className="text-[9px] font-mono uppercase font-bold text-paper-text">{coverColor.slice(1, 5)}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-paper-muted font-bold block mb-1 uppercase font-mono">Accent Color</label>
                              <div className="flex items-center space-x-1 bg-paper-sidebar border border-paper-border rounded-lg p-1">
                                <input
                                  type="color"
                                  value={coverAccentColor}
                                  onChange={(e) => setCoverAccentColor(e.target.value)}
                                  className="w-6 h-6 border-0 p-0 rounded cursor-pointer"
                                />
                                <span className="text-[9px] font-mono uppercase font-bold text-paper-text">{coverAccentColor.slice(1, 5)}</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-paper-muted font-bold block mb-1 uppercase font-mono">Text Color</label>
                              <div className="flex items-center space-x-1 bg-paper-sidebar border border-paper-border rounded-lg p-1">
                                <input
                                  type="color"
                                  value={coverTextColor}
                                  onChange={(e) => setCoverTextColor(e.target.value)}
                                  className="w-6 h-6 border-0 p-0 rounded cursor-pointer"
                                />
                                <span className="text-[9px] font-mono uppercase font-bold text-paper-text">{coverTextColor.slice(1, 5)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Spine Thickness */}
                          <div>
                            <div className="flex justify-between text-[10px] text-paper-muted font-bold uppercase font-mono mb-1">
                              <span>Spine Thickness Width</span>
                              <span>{spineWidth} mm</span>
                            </div>
                            <input
                              type="range"
                              min="15"
                              max="60"
                              value={spineWidth}
                              onChange={(e) => setSpineWidth(parseInt(e.target.value))}
                              className="w-full accent-rose-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Interactive Book Jacket Mockup Panel (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Section 1: AI Vector Illustration Generator */}
                      <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider flex items-center space-x-2 border-b border-paper-border pb-2">
                          <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span>AI Cover Centerpiece Illustration</span>
                        </h3>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={coverIllustrationTheme}
                            onChange={(e) => setCoverIllustrationTheme(e.target.value)}
                            placeholder="e.g., A minimalist vector sailboat on calm night waters..."
                            className="flex-1 bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-rose-400 focus:outline-none text-paper-text font-medium"
                          />
                          <button
                            onClick={async () => {
                              setIsGeneratingCoverIllustration(true);
                              try {
                                const response = await fetch('/api/generate-book-illustration', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: epubTitle,
                                    genre: coverIllustrationTheme,
                                    styleDescription: `Use primarily background color ${coverColor} and accent color ${coverAccentColor}. Ensure it fits the ${coverStyle} cover style.`
                                  })
                                });
                                const data = await response.json();
                                if (data.svg) {
                                  setCoverIllustrationSvg(data.svg);
                                }
                              } catch (err) {
                                console.error("Failed to generate cover centerpiece:", err);
                              } finally {
                                setIsGeneratingCoverIllustration(false);
                              }
                            }}
                            disabled={isGeneratingCoverIllustration}
                            className="bg-brand hover:opacity-90 disabled:bg-paper-border disabled:text-paper-muted text-white text-xs font-bold px-4 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                          >
                            {isGeneratingCoverIllustration ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{isGeneratingCoverIllustration ? 'Designing...' : 'Generate Art'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 2: Book Dust Jacket Canvas (Unfolded 3D Cover + Spine + Back Cover) */}
                      <div className="bg-white border border-paper-border rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-paper-border pb-2.5">
                          <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider">
                            Interactive Book Jacket Design (Flat-Unfolded view)
                          </h3>
                          <button 
                            onClick={() => {
                              const svgText = document.getElementById('rendered-front-cover-svg')?.outerHTML;
                              if (svgText) {
                                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${epubTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_jacket.svg`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            }}
                            className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Export Cover SVG</span>
                          </button>
                        </div>

                        {/* Flat Unfolded Jacket Render */}
                        <div className="relative overflow-x-auto p-4 bg-paper-canvas border border-paper-border rounded-xl flex justify-center items-stretch cork-scrollbar">
                          
                          <div className="flex select-none" style={{ height: '380px' }}>
                            
                            {/* 1. BACK COVER (Width: 250px) */}
                            <div 
                              className="w-[240px] p-5 flex flex-col justify-between border-r border-dashed border-white/20 transition-all shadow-sm rounded-l-lg relative shrink-0"
                              style={{ backgroundColor: coverColor, color: coverTextColor }}
                            >
                              {coverStyle === 'vintage' && (
                                <div className="absolute inset-2 border border-white/10 pointer-events-none" style={{ borderColor: coverAccentColor + '40' }} />
                              )}
                              {coverStyle === 'classic' && (
                                <div className="absolute inset-3 border border-white/15 pointer-events-none" style={{ borderColor: coverAccentColor + '30' }} />
                              )}

                              <div className="space-y-4 relative z-10">
                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 block">Book Synopsis</span>
                                <textarea
                                  value={epubBackSynopsis}
                                  onChange={(e) => setEpubBackSynopsis(e.target.value)}
                                  className="w-full bg-black/10 border-0 hover:bg-black/20 focus:bg-black/30 rounded-lg p-2.5 text-[10px] leading-relaxed resize-none focus:outline-none transition-all scrollbar-none font-sans"
                                  style={{ height: '180px', color: coverTextColor }}
                                  placeholder="Type book description/synopsis for the back page..."
                                />
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                                <div className="space-y-1">
                                  <span className="text-[8px] uppercase font-bold opacity-50 block">Publisher</span>
                                  <span className="text-[9px] font-bold tracking-wider">{epubPublisher}</span>
                                </div>
                                <div className="bg-white px-2 py-1.5 flex flex-col items-center gap-0.5 rounded shadow-xs">
                                  <div className="w-12 h-6 flex gap-[1px]">
                                    {[1, 3, 1, 2, 1, 4, 1, 2, 2, 1, 3, 1, 2, 1, 1].map((w, idx) => (
                                      <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }} />
                                    ))}
                                  </div>
                                  <span className="text-[6px] font-mono text-black font-semibold">978-0-321-97</span>
                                </div>
                              </div>
                            </div>

                            {/* 2. SPINE / SIDE */}
                            <div 
                              className="h-full flex flex-col justify-between items-center py-6 border-r border-dashed border-white/20 transition-all select-none shadow-sm shrink-0"
                              style={{ 
                                backgroundColor: coverColor, 
                                color: coverTextColor,
                                width: `${spineWidth * 1.3}px`
                              }}
                            >
                              <div className="text-[9px] uppercase tracking-wider font-bold opacity-60 transform rotate-90 origin-center whitespace-nowrap mt-4">
                                {epubAuthor}
                              </div>
                              
                              <div className="text-xs uppercase tracking-widest font-bold font-serif transform rotate-90 origin-center whitespace-nowrap my-auto leading-none select-none max-w-[200px] truncate" style={{ color: coverAccentColor }}>
                                {epubTitle}
                              </div>

                              <div className="text-[9px] font-bold font-mono opacity-50">
                                ✴
                              </div>
                            </div>

                            {/* 3. FRONT COVER (Width: 250px) */}
                            <div 
                              id="rendered-front-cover-svg"
                              className="w-[240px] p-5 flex flex-col justify-between transition-all shadow-md rounded-r-lg relative shrink-0 overflow-hidden"
                              style={{ backgroundColor: coverColor, color: coverTextColor }}
                            >
                              {/* Background Illustration layer */}
                              <div className="absolute inset-0 z-0 opacity-40 pointer-events-none flex items-center justify-center">
                                {coverIllustrationSvg ? (
                                  <div 
                                    className="w-full h-full"
                                    dangerouslySetInnerHTML={{ 
                                      __html: coverIllustrationSvg
                                        .replace(/<svg[^>]*>/, '<svg width="100%" height="100%" viewBox="0 0 300 450" preserveAspectRatio="xMidYMid slice">')
                                    }} 
                                  />
                                ) : (
                                  <svg width="100%" height="100%" viewBox="0 0 300 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="150" cy="225" r="100" stroke={coverAccentColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                                    <path d="M 0,400 L 150,150 L 300,400" stroke={coverAccentColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
                                  </svg>
                                )}
                              </div>

                              {coverStyle === 'vintage' && (
                                <div className="absolute inset-2 border border-white/10 pointer-events-none" style={{ borderColor: coverAccentColor + '40' }} />
                              )}
                              {coverStyle === 'classic' && (
                                <div className="absolute inset-3 border border-white/15 pointer-events-none" style={{ borderColor: coverAccentColor + '30' }} />
                              )}

                              {/* STYLIZED CONTENT LAYOUTS BASED ON COVERSTYLE PRESET */}
                              {coverStyle === 'minimalist' && (
                                <div className="flex-1 flex flex-col justify-between h-full relative z-10">
                                  <div className="space-y-1.5 pt-2">
                                    <span className="text-[8px] uppercase tracking-widest font-mono font-bold opacity-65">A Novel</span>
                                    <h1 className="text-base uppercase tracking-tight font-display font-semibold leading-tight max-h-[70px] overflow-hidden" style={{ color: coverAccentColor }}>
                                      {epubTitle}
                                    </h1>
                                  </div>
                                  
                                  <div className="pb-2">
                                    <p className="text-[9px] uppercase tracking-widest font-mono font-bold opacity-80">{epubAuthor}</p>
                                  </div>
                                </div>
                              )}

                              {coverStyle === 'vintage' && (
                                <div className="flex-1 flex flex-col justify-between h-full relative z-10 text-center items-center py-4">
                                  <div className="space-y-2">
                                    <span className="text-[8px] uppercase tracking-widest font-serif block opacity-70">◆ NOVEL ◆</span>
                                    <h1 className="text-base uppercase tracking-wider font-serif font-bold leading-snug" style={{ color: coverAccentColor }}>
                                      {epubTitle}
                                    </h1>
                                  </div>
                                  
                                  <div className="w-8 h-[1px] bg-white/20" style={{ backgroundColor: coverAccentColor + '60' }} />
                                  
                                  <div>
                                    <p className="text-xs font-serif italic tracking-wide opacity-95">{epubAuthor}</p>
                                  </div>
                                </div>
                              )}

                              {coverStyle === 'bold' && (
                                <div className="flex-1 flex flex-col justify-between h-full relative z-10 text-left pt-3">
                                  <div>
                                    <h1 className="text-lg uppercase tracking-tighter font-black font-sans leading-none break-words" style={{ color: coverAccentColor }}>
                                      {epubTitle}
                                    </h1>
                                    <p className="text-[9px] uppercase tracking-widest font-bold opacity-75 mt-2">{epubAuthor}</p>
                                  </div>
                                  
                                  <div className="pb-1">
                                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold opacity-50 block">STORYBOARD EDITION</span>
                                  </div>
                                </div>
                              )}

                              {coverStyle === 'neon' && (
                                <div className="flex-1 flex flex-col justify-between h-full relative z-10">
                                  <div className="pt-2">
                                    <h1 className="text-base font-bold font-mono tracking-wide leading-snug" style={{ color: coverAccentColor, textShadow: `0 0 10px ${coverAccentColor}50` }}>
                                      &lt;{epubTitle}&gt;
                                    </h1>
                                  </div>
                                  
                                  <div className="pb-2 border-l border-white/20 pl-3">
                                    <p className="text-[9px] font-mono tracking-widest uppercase opacity-90">{epubAuthor}</p>
                                    <span className="text-[7px] font-mono opacity-40 block mt-1">SYS.LOC: //CORKBOARD</span>
                                  </div>
                                </div>
                              )}

                              {coverStyle === 'classic' && (
                                <div className="flex-1 flex flex-col justify-between h-full relative z-10 text-center items-center py-4">
                                  <div className="space-y-1.5">
                                    <h1 className="text-sm uppercase tracking-wide font-serif font-bold leading-snug">
                                      {epubTitle}
                                    </h1>
                                    <span className="text-[8px] uppercase tracking-widest font-sans opacity-60 block">By the author of the system</span>
                                  </div>
                                  
                                  <div className="text-[12px] font-serif tracking-widest opacity-80 my-4" style={{ color: coverAccentColor }}>
                                    ❦
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs uppercase font-serif tracking-wider font-bold">{epubAuthor}</p>
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>

                        </div>

                        <div className="text-center text-paper-muted text-[10px] italic leading-relaxed pt-1">
                          Tip: Customize cover typography using presets and pick custom book colors. Add AI Vector Illustrations to overlay on the front cover.
                        </div>
                      </div>

                      {/* Section 3: Extracted Chapters / Compilation Status & Compile Trigger */}
                      <div className="bg-white border border-paper-border rounded-xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-paper-border pb-3">
                          <div>
                            <h3 className="text-xs font-bold text-paper-text uppercase tracking-wider">
                              eBook Compilation Engine
                            </h3>
                            <p className="text-[10px] text-paper-muted mt-0.5">Ready to pack and zip the XHTML, assets, and cover into valid EPUB format.</p>
                          </div>
                          
                          <button
                            onClick={async () => {
                              if (!epubFileBase64) {
                                alert("Please select or drop a DOCX or RTF manuscript file first.");
                                return;
                              }
                              
                              setIsCompilingEpub(true);
                              
                              const coverTemplate = `
                                <svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" style="background:${coverColor};font-family:sans-serif;">
                                  <rect width="300" height="450" fill="${coverColor}"/>
                                  ${coverIllustrationSvg ? coverIllustrationSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '') : ''}
                                  <rect x="0" y="0" width="300" height="450" fill="none" stroke="${coverAccentColor}" stroke-width="6" opacity="0.15"/>
                                  <g fill="${coverTextColor}">
                                    <text x="150" y="80" text-anchor="middle" font-family="${coverStyle === 'vintage' || coverStyle === 'classic' ? 'serif' : 'sans-serif'}" font-size="20" font-weight="bold" letter-spacing="1">${epubTitle}</text>
                                    <text x="150" y="400" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="500" letter-spacing="1.5" fill="${coverAccentColor}">${epubAuthor.toUpperCase()}</text>
                                  </g>
                                </svg>
                              `;

                              try {
                                const response = await fetch('/api/convert-to-epub', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    fileBase64: epubFileBase64,
                                    fileName: epubFileName,
                                    title: epubTitle,
                                    author: epubAuthor,
                                    language: epubLanguage,
                                    publisher: epubPublisher,
                                    coverSvg: coverTemplate,
                                    backSynopsis: epubBackSynopsis
                                  })
                                });
                                
                                const data = await response.json();
                                if (data.success && data.base64) {
                                  setEpubResultBase64(data.base64);
                                  setEpubChaptersList(data.chaptersList || []);
                                  
                                  const blob = new Blob([Uint8Array.from(atob(data.base64), c => c.charCodeAt(0))], { type: 'application/epub+zip' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${epubTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.epub`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                  
                                  // Trigger real-time structural validation & epubcheck compliance audit automatically!
                                  await runEpubValidation(data.base64, `${epubTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.epub`);
                                } else {
                                  alert("Failed to compile: " + (data.error || "Unknown error"));
                                }
                              } catch (err) {
                                console.error("Error during compilation:", err);
                                alert("Server compilation request failed.");
                              } finally {
                                setIsCompilingEpub(false);
                              }
                            }}
                            disabled={isCompilingEpub || !epubFileBase64}
                            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer ${
                              epubFileBase64 
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                                : 'bg-paper-border text-paper-muted opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {isCompilingEpub ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Compiling & Packaging Ebook Package...</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-4 h-4" />
                                <span>Compile & Export Premium .EPUB eBook</span>
                              </>
                            )}
                          </button>
                        </div>

                        {epubChaptersList.length > 0 && (
                          <div className="bg-paper-sidebar border border-paper-border rounded-xl p-4 space-y-3 shadow-xs">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-paper-muted block">
                              Compilation Log & Structured Chapter Matrix ({epubChaptersList.length} sections found)
                            </span>
                            <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono scrollbar-thin">
                              <p className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Completed Ingestion of {epubFileName}</span>
                              </p>
                              <p className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Created container.xml, content.opf manifest</span>
                              </p>
                              <p className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Injected Vector Cover Art & Navigation Document</span>
                              </p>
                              <div className="border-t border-paper-border/60 pt-2 mt-2 pl-2 border-l-2 border-rose-400 space-y-1">
                                {epubChaptersList.map((ch, idx) => (
                                  <div key={idx} className="text-[10px] text-paper-text/85">
                                    <span className="text-rose-500 font-bold">▶</span> OEBPS/chapter_{idx+1}.xhtml — <span className="font-sans font-semibold">{ch}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* EPUB Validation & Epubcheck Compliance Auditor Panel */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <ShieldCheck className="w-4.5 h-4.5 text-slate-700" />
                              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                epubcheck & Structural Auditor
                              </h3>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              EPUB 3.0 Standard
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 leading-normal">
                            Validate your compiled file or upload any external EPUB package to verify it against strict IDPF specifications, XML schemas, namespaces, manifest integrity, and the Python <strong>epubcheck</strong> validator.
                          </p>

                          {/* Upload external EPUB to validate */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block mb-1">
                                Audit External EPUB File
                              </label>
                              <div className="relative border border-dashed border-slate-300 rounded-lg p-3 hover:bg-slate-100/70 transition-all flex flex-col items-center justify-center text-center">
                                <input
                                  type="file"
                                  accept=".epub"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = async (event) => {
                                        const result = event.target?.result as string;
                                        if (result) {
                                          const base64Data = result.split(',')[1];
                                          await runEpubValidation(base64Data, file.name);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Upload className="w-4 h-4 text-slate-500 mb-1" />
                                <span className="text-[10px] font-bold text-slate-700">Drop or Upload External Book</span>
                                <span className="text-[8px] text-slate-400 mt-0.5">Loads file to run instant structural checks</span>
                              </div>
                            </div>

                            {/* Trigger validation on the current compiled book */}
                            <div className="flex flex-col justify-end">
                              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-600 block mb-1">
                                Current Book validation
                              </label>
                              <button
                                onClick={() => {
                                  if (!epubResultBase64) {
                                    alert("Please compile the EPUB first to validate it.");
                                    return;
                                  }
                                  runEpubValidation(epubResultBase64, `${epubTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.epub`);
                                }}
                                disabled={!epubResultBase64 || isValidatingEpub}
                                className={`py-3 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                                  epubResultBase64 
                                    ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {isValidatingEpub ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Auditing Ebook Structure...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>Run Auditor on Current Book</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Loading Status */}
                          {isValidatingEpub && (
                            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2 animate-pulse">
                              <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto" />
                              <div className="text-[11px] font-bold text-slate-700">Running Structural Verification Matrix</div>
                              <p className="text-[9px] text-slate-400">Verifying MIME metadata, directory container pointers, OPF catalog elements, and spine orders.</p>
                            </div>
                          )}

                          {/* Validation Results Report */}
                          {validationReport && !isValidatingEpub && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-3xs animate-fade-in">
                              
                              {/* Summary Badge Header */}
                              <div className={`p-3 rounded-lg flex items-center justify-between border ${
                                validationReport.isValid 
                                  ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' 
                                  : 'bg-amber-50/60 border-amber-100 text-amber-950'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  {validationReport.isValid ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                  )}
                                  <div>
                                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide">
                                      {validationReport.isValid ? 'EPUB 3 COMPLIANCE: CONFIRMED' : 'EPUB AUDITOR: ISSUES FOUND'}
                                    </h4>
                                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                      {validationReport.isValid 
                                        ? 'Ebook meets package structure guidelines and manifest reference rules.' 
                                        : 'Some manifest properties or elements need adjustments for old legacy readers.'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                                  validationReport.isValid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                  {validationReport.isValid ? 'Valid' : 'Warnings'}
                                </span>
                              </div>

                              {/* Matrix Checked Reports List */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                                  Audit Verification Log
                                </span>
                                
                                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                                  {validationReport.reports.map((rep, idx) => (
                                    <div key={idx} className={`p-2 rounded-lg border text-[10px] flex items-start space-x-2 transition-all ${
                                      rep.status === 'success' 
                                        ? 'bg-emerald-50/30 border-emerald-100/50 text-slate-700' 
                                        : rep.status === 'warning'
                                          ? 'bg-amber-50/40 border-amber-100/50 text-amber-900'
                                          : 'bg-rose-50/40 border-rose-100/50 text-rose-900'
                                    }`}>
                                      <span className="mt-0.5 shrink-0 font-bold">
                                        {rep.status === 'success' ? '🟢' : rep.status === 'warning' ? '🟡' : '🔴'}
                                      </span>
                                      <div className="space-y-0.5">
                                        <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                          <span>{rep.message}</span>
                                          <span className={`text-[8px] px-1 rounded uppercase tracking-wider ${
                                            rep.status === 'success' ? 'bg-emerald-100 text-emerald-800' : rep.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                          }`}>
                                            {rep.status}
                                          </span>
                                        </div>
                                        {rep.details && <p className="text-[9px] text-slate-500 font-medium leading-normal">{rep.details}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Terminal-style epubcheck CLI subprocess output */}
                              <div className="bg-slate-900 rounded-lg p-3 space-y-1.5 border border-slate-800">
                                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono">
                                  <span>CONSOLE: python epubcheck subprocess</span>
                                  <span className={validationReport.hasEpubcheckLibrary ? 'text-emerald-400' : 'text-slate-500'}>
                                    {validationReport.hasEpubcheckLibrary ? '● ACTIVE' : '○ DISCONNECTED'}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-300 font-mono leading-relaxed p-1.5 bg-black/40 rounded max-h-24 overflow-y-auto whitespace-pre-wrap select-text scrollbar-thin">
                                  {validationReport.epubcheckCliOutput || 'Idle.'}
                                </div>
                                <div className="text-[8px] text-slate-500 font-medium leading-tight">
                                  * Note: The python validator executes epubcheck rules inside a sandboxed subshell.
                                </div>
                              </div>

                            </div>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Quick interactive guide / footer information overlay */}
          <footer className="bg-white border-t border-paper-border px-6 py-2.5 text-xs text-paper-muted flex items-center justify-between shrink-0 select-none">
            <span className="flex items-center space-x-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-brand" />
              <span>Double-click any card to edit its draft content. Drag pushpins to set storyboard coordinates.</span>
            </span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                <span>Corkboard Size: 1600x1000px</span>
              </span>
            </div>
          </footer>

        </main>
      </div>

      {/* MODAL: Edit Card Form Overlay */}
      {isEditingItem && selectedItem && (
        <div className="fixed inset-0 bg-paper-text/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-paper-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif text-paper-text">Edit Storyboard Node</h3>
              <span className="text-[9px] uppercase font-mono bg-brand/10 text-brand px-2.5 py-0.5 rounded-full font-bold">
                {selectedItem.type}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono tracking-wider">Title / Node Identifier</label>
                <input
                  type="text"
                  value={editItemTitle}
                  onChange={(e) => setEditItemTitle(e.target.value)}
                  className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-brand focus:outline-none text-paper-text font-medium"
                />
              </div>

              {selectedItem.type === 'character' && (
                <div>
                  <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono tracking-wider">Subtitle / Role Designation</label>
                  <input
                    type="text"
                    value={editItemSubtitle}
                    onChange={(e) => setEditItemSubtitle(e.target.value)}
                    className="w-full bg-white border border-paper-border rounded-lg px-3 py-2 text-xs focus:border-brand focus:outline-none text-paper-text font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono tracking-wider">Narrative Content / Manuscript draft Snippet</label>
                <textarea
                  value={editItemContent}
                  onChange={(e) => setEditItemContent(e.target.value)}
                  className="w-full h-32 bg-white border border-paper-border rounded-lg p-3 text-xs focus:border-brand focus:outline-none font-mono text-paper-text leading-relaxed"
                />
              </div>

              {selectedItem.type === 'storyboard' && (
                <div>
                  <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono tracking-wider">Storyboard Image</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/png, image/gif, image/jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditItemImage(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-paper-muted file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-paper-muted font-medium">Or</span>
                      <button
                        type="button"
                        onClick={generateAISvgVector}
                        disabled={isGeneratingVector}
                        className="bg-brand/10 hover:bg-brand/20 disabled:bg-paper-border disabled:text-paper-muted border border-brand/20 text-brand font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        {isGeneratingVector ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Drawing Scene Vector...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Draw Scene Vector</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {editItemImage && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-paper-border bg-slate-50 flex items-center justify-center">
                        <img 
                          src={editItemImage} 
                          alt="Storyboard Scene preview" 
                          referrerPolicy="no-referrer"
                          className="object-contain w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => setEditItemImage('')}
                          className="absolute top-2 right-2 p-1 bg-white hover:bg-rose-50 text-rose-600 rounded-md border border-paper-border text-[9px] font-bold shadow-md cursor-pointer"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-[9px] text-paper-muted block mb-0.5 font-semibold">Or enter custom file path (for local Python app execution):</label>
                      <input
                        type="text"
                        value={editItemImage.startsWith('data:') ? '' : editItemImage}
                        placeholder="e.g. assets/scene1.png"
                        onChange={(e) => setEditItemImage(e.target.value)}
                        className="w-full bg-white border border-paper-border rounded px-3 py-1.5 text-xs focus:border-brand focus:outline-none text-paper-text font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedItem.type === 'character' && (
                <div>
                  <label className="text-[10px] text-paper-muted font-bold block mb-1 uppercase font-mono tracking-wider">Pin Accent Color</label>
                  <div className="flex items-center space-x-2 pt-1">
                    {['#1E1E1E', '#991B1B', '#1E3A8A', '#D97706', '#701A75', '#065F46', '#BE185D', '#0D9488'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditItemColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-full border cursor-pointer ${editItemColor === col ? 'border-brand scale-125 shadow-md' : 'border-paper-border'} transition-all`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsEditingItem(false)}
                className="px-4 py-2 bg-paper-sidebar hover:bg-paper-border text-paper-text border border-paper-border rounded-lg text-xs cursor-pointer font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedItem}
                className="px-4 py-2 bg-brand hover:opacity-90 text-white font-bold rounded-lg text-xs cursor-pointer transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
