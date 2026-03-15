import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  Copy, 
  BookOpen, 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  User, 
  Mail, 
  ShoppingCart, 
  Tag, 
  Filter, 
  ChevronRight, 
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  LayoutDashboard,
  Smartphone,
  Globe,
  Store,
  Phone,
  Video,
  Layout,
  List as ListIcon,
  Users as UsersIcon,
  PieChart,
  BarChart3,
  TrendingDown,
  Timer,
  Activity,
  DollarSign
} from 'lucide-react';
import { fetchUsers, saveUsers, fetchData, saveData } from './api';
import { PricingAdminView } from './PricingAdminView';

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Open' | 'Urgent' | 'Awaiting customer' | 'Resolved';
export type Channel = 'Amazon' | 'Shopify' | 'B&Q' | 'Email' | 'TikTok Shop' | 'OnBuy' | 'Phone' | 'Etsy' | 'Invoice';

export interface SavedReply {
  id: string;
  title: string;
  body: string;
}

export interface KBArticle {
  id: string;
  title: string;
}

export interface Ticket {
  id: string;
  customer: string;
  channel: Channel;
  orderId: string;
  issue: string;
  priority: Priority;
  status: TicketStatus;
  owner: string;
  sla: string;
  notes: string;
  createdAt: string;
  resolvedAt?: string;
  photos: string[];
}

interface AdminViewProps {
  onClose: () => void;
  currentUser: any;
  loginTimeline: any[];
  tickets?: any[];
  onUpdateStatus?: (id: string, s: any) => void;
  onAddMessage?: (id: string, t: string, s: any, img?: string) => void;
  onAddTicket?: (t: string, d: string, img?: string, b?: string) => void;
}

const DEFAULTS = {
  tickets: [
    {
      id: 'T-1001',
      customer: 'Alex Thompson',
      channel: 'Amazon' as Channel,
      orderId: '204-9812734-1123',
      issue: 'Damaged item received - SKU 194 left post bent',
      priority: 'Urgent' as Priority,
      status: 'Open' as TicketStatus,
      owner: 'Sarah M.',
      sla: '2h remaining',
      notes: 'Customer contacted via Amazon messages. Requested replacement parts.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      photos: []
    },
    {
      id: 'T-1002',
      customer: 'Jamie Roberts',
      channel: 'Shopify' as Channel,
      orderId: '#45021',
      issue: 'Missing hex nipple for SKU 124 assembly',
      priority: 'High' as Priority,
      status: 'Awaiting customer' as TicketStatus,
      owner: 'John D.',
      sla: '4h remaining',
      notes: 'Sent message asking for packaging type to verify which kit was sent.',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      photos: []
    }
  ],
  replies: [
    { id: '1', title: 'Damaged Item Refund', body: 'We are sorry to hear your item arrived damaged. We have processed a full refund for your order. Please allow 3-5 days for it to appear in your account.' },
    { id: '2', title: 'Replacement Parts', body: 'We have dispatched the replacement parts for your SKU today. You should receive a tracking number via email shortly.' },
    { id: '3', title: 'Assembly Help', body: 'Our technicians have reviewed your query. It looks like the tee fitting needs to be rotated 90 degrees before attaching the long pipe.' }
  ],
  kb: [
    { id: '1', title: 'SOP: Handling B&Q damaged claims' },
    { id: '2', title: 'SOP: SKU 194 alignment guide' },
    { id: '3', title: 'SOP: Missing parts dispatch process' },
    { id: '4', title: 'Assembly: Wall Flange mounting guide' }
  ]
};

export const AdminView: React.FC<AdminViewProps> = ({ 
  onClose,
  currentUser,
  loginTimeline,
  tickets: externalTickets,
  onUpdateStatus,
  onAddMessage,
  onAddTicket: externalOnAddTicket
}) => {
  const [adminTab, setAdminTab] = useState<'support' | 'users' | 'timeline' | 'pricing'>('support');
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('cs_tickets');
    if (saved) return JSON.parse(saved);
    return externalTickets && externalTickets.length > 0 ? (externalTickets as Ticket[]) : DEFAULTS.tickets;
  });

  const [savedReplies, setSavedReplies] = useState<SavedReply[]>(() => {
    const saved = localStorage.getItem('cs_replies');
    return saved ? JSON.parse(saved) : DEFAULTS.replies;
  });

  const [kbArticles, setKbArticles] = useState<KBArticle[]>(() => {
    const saved = localStorage.getItem('cs_kb');
    return saved ? JSON.parse(saved) : DEFAULTS.kb;
  });

  const [allUsers, setAllUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('rack_users');
    return saved ? JSON.parse(saved) : [];
  });

  const lastSyncTicketsRef = useRef<string>('');
  const lastSyncRepliesRef = useRef<string>('');
  const lastSyncKbRef = useRef<string>('');

  useEffect(() => {
    // Initial fetch
    fetchUsers().then(users => {
      if (users && users.length > 0) setAllUsers(users);
    });
    fetchData('cs_tickets').then(data => {
      if (data) {
        setTickets(data);
        lastSyncTicketsRef.current = JSON.stringify(data);
      } else {
        lastSyncTicketsRef.current = '[]';
      }
    });
    fetchData('cs_replies').then(data => {
      if (data) {
        setSavedReplies(data);
        lastSyncRepliesRef.current = JSON.stringify(data);
      } else {
        lastSyncRepliesRef.current = '[]';
      }
    });
    fetchData('cs_kb').then(data => {
      if (data) {
        setKbArticles(data);
        lastSyncKbRef.current = JSON.stringify(data);
      } else {
        lastSyncKbRef.current = '[]';
      }
    });

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchUsers().then(users => {
        if (users && users.length > 0) setAllUsers(users);
      }).catch(err => console.error("Error polling users:", err));

      fetchData('cs_tickets').then(data => {
        if (data && JSON.stringify(data) !== lastSyncTicketsRef.current) {
          setTickets(data);
          lastSyncTicketsRef.current = JSON.stringify(data);
        }
      }).catch(err => console.error(err));

      fetchData('cs_replies').then(data => {
        if (data && JSON.stringify(data) !== lastSyncRepliesRef.current) {
          setSavedReplies(data);
          lastSyncRepliesRef.current = JSON.stringify(data);
        }
      }).catch(err => console.error(err));

      fetchData('cs_kb').then(data => {
        if (data && JSON.stringify(data) !== lastSyncKbRef.current) {
          setKbArticles(data);
          lastSyncKbRef.current = JSON.stringify(data);
        }
      }).catch(err => console.error(err));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleApproval = async (email: string) => {
    const updated = allUsers.map(u => 
      u.email === email ? { ...u, isApproved: !u.isApproved } : u
    );
    setAllUsers(updated);
    await saveUsers(updated);
  };

  const handleDeleteUser = async (email: string) => {
    if (email === 'retrotownuk@gmail.com') return;
    if (confirm(`Are you sure you want to remove ${email} from the staff records?`)) {
      const updated = allUsers.filter(u => u.email !== email);
      setAllUsers(updated);
      await saveUsers(updated);
    }
  };

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list' | 'board'>('board');
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    channel: 'Email',
    priority: 'Medium',
    status: 'Open',
    owner: 'Unassigned',
    sla: '24h',
    photos: []
  });

  useEffect(() => {
    const dataStr = JSON.stringify(tickets);
    if (dataStr !== lastSyncTicketsRef.current && lastSyncTicketsRef.current !== '') {
      localStorage.setItem('cs_tickets', dataStr);
      saveData('cs_tickets', tickets).then(() => {
        lastSyncTicketsRef.current = dataStr;
      });
    }
  }, [tickets]);

  useEffect(() => {
    const dataStr = JSON.stringify(savedReplies);
    if (dataStr !== lastSyncRepliesRef.current && lastSyncRepliesRef.current !== '') {
      localStorage.setItem('cs_replies', dataStr);
      saveData('cs_replies', savedReplies).then(() => {
        lastSyncRepliesRef.current = dataStr;
      });
    }
  }, [savedReplies]);

  useEffect(() => {
    const dataStr = JSON.stringify(kbArticles);
    if (dataStr !== lastSyncKbRef.current && lastSyncKbRef.current !== '') {
      localStorage.setItem('cs_kb', dataStr);
      saveData('cs_kb', kbArticles).then(() => {
        lastSyncKbRef.current = dataStr;
      });
    }
  }, [kbArticles]);

  const stats = useMemo(() => {
    return {
      open: tickets.filter(t => t.status === 'Open').length,
      urgent: tickets.filter(t => t.status === 'Urgent' || t.priority === 'Urgent').length,
      awaiting: tickets.filter(t => t.status === 'Awaiting customer').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesFilter = filterStatus === 'All' || t.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (t.id || '').toLowerCase().includes(q) || 
        (t.customer || '').toLowerCase().includes(q) || 
        (t.orderId || '').toLowerCase().includes(q) || 
        (t.issue || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [tickets, filterStatus, searchQuery]);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  const handleUpdateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const newTicket = { ...t, ...updates };
        if (updates.status === 'Resolved' && !newTicket.resolvedAt) {
          newTicket.resolvedAt = new Date().toISOString();
        } else if (updates.status && updates.status !== 'Resolved') {
          newTicket.resolvedAt = undefined;
        }
        return newTicket;
      }
      return t;
    }));
    if (onUpdateStatus) {
      if (updates.status) onUpdateStatus(id, updates.status);
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTicketId(id);
    e.dataTransfer.setData('ticketId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('ticketId') || draggedTicketId;
    if (id) {
      handleUpdateTicket(id, { 
        status: newStatus,
        notes: tickets.find(t => t.id === id)?.notes + `\n[SYSTEM] Status changed to ${newStatus} via Board on ${new Date().toLocaleString()}`
      });
    }
    setDraggedTicketId(null);
  };
  const handleDeleteTicket = (id: string) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      setTickets(prev => prev.filter(t => t.id !== id));
      if (activeTicketId === id) setActiveTicketId(null);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `T-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket: Ticket = {
      ...newTicket as any,
      id,
      customer: newTicket.customer || 'Guest',
      issue: newTicket.issue || '',
      orderId: newTicket.orderId || '',
      notes: newTicket.notes || '',
      createdAt: new Date().toISOString(),
      photos: newTicket.photos || []
    };
    setTickets([ticket, ...tickets]);
    setNewTicket({
      channel: 'Email',
      priority: 'Medium',
      status: 'Open',
      owner: 'Unassigned',
      sla: '24h',
      photos: []
    });
    setIsCreateModalOpen(false);
    alert('Ticket created successfully');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {
    const files = e.target.files;
    if (files) {
      const urls: string[] = [];
      Array.from(files).forEach(file => {
        urls.push(URL.createObjectURL(file));
      });
      if (isNew) {
        setNewTicket(prev => ({ ...prev, photos: [...(prev.photos || []), ...urls] }));
      } else if (activeTicketId) {
        handleUpdateTicket(activeTicketId, { photos: [...(activeTicket?.photos || []), ...urls] });
      }
    }
  };

  const removePhoto = (url: string, isNew: boolean) => {
    if (isNew) {
      setNewTicket(prev => ({ ...prev, photos: prev.photos?.filter(p => p !== url) }));
    } else if (activeTicketId) {
      handleUpdateTicket(activeTicketId, { photos: activeTicket?.photos.filter(p => p !== url) });
    }
  };

  const PriorityBadge = ({ p }: { p: Priority }) => {
    const styles = {
      Urgent: 'bg-red-100 text-red-700 border-red-200',
      High: 'bg-orange-100 text-orange-700 border-orange-200',
      Medium: 'bg-blue-100 text-blue-700 border-blue-200',
      Low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[p]}`}>{p}</span>;
  };

  const ChannelIcon = ({ c }: { c: Channel }) => {
    switch (c) {
      case 'Amazon': return <Store className="w-3.5 h-3.5 text-orange-500" />;
      case 'Shopify': return <Globe className="w-3.5 h-3.5 text-green-600" />;
      case 'B&Q': return <Smartphone className="w-3.5 h-3.5 text-orange-600" />;
      case 'Email': return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'Phone': return <Phone className="w-3.5 h-3.5 text-gray-600" />;
      default: return <Tag className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#f3f4f6] text-[#374151] font-sans selection:bg-blue-100 overflow-y-auto w-full relative">
      
      {onClose && (
        <div className="absolute top-20 right-8 z-[60]">
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto p-2 lg:p-4 pb-12 flex flex-col gap-3 min-h-min">
        
        {/* View Toggle & Header */}
        <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-3xl border border-white shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              {adminTab === 'support' ? <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" /> : 
               adminTab === 'users' ? <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-white" /> : 
               adminTab === 'pricing' ? <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" /> : 
               <History className="w-5 h-5 md:w-6 md:h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">
                {adminTab === 'support' ? 'Support Console' : 
                 adminTab === 'users' ? 'Staff Management' : 
                 adminTab === 'pricing' ? 'Global Pricing' : 
                 'Security Timeline'}
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
                {adminTab === 'support' ? 'Industrial Logistics Management' : 
                 adminTab === 'users' ? 'Access Control & Permissions' : 
                 adminTab === 'pricing' ? 'Material Cost Configuration' : 
                 'Real-time Access & Activity Logs'}
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setAdminTab('support')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'support' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Support
            </button>
            {currentUser?.email === 'retrotownuk@gmail.com' && (
              <>
                <button 
                  onClick={() => setAdminTab('users')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Staff
                </button>
                <button 
                  onClick={() => setAdminTab('timeline')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <History className="w-4 h-4" />
                  Timeline
                </button>
                <button 
                  onClick={() => setAdminTab('pricing')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'pricing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </button>
              </>
            )}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'dashboard' && adminTab === 'support' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              disabled={adminTab !== 'support'}
            >
              <PieChart className="w-4 h-4" />
              Dash
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' && adminTab === 'support' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              disabled={adminTab !== 'support'}
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'board' && adminTab === 'support' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              disabled={adminTab !== 'support'}
            >
              <Layout className="w-4 h-4" />
              Board
            </button>
          </div>
        </div>
        
        {adminTab === 'support' && (
          <>
        {/* Top Summary Section */}
        {viewMode !== 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <p className="text-blue-100/80 text-xs font-black uppercase tracking-widest mb-1.5 backdrop-blur-sm">Open Tickets</p>
                <p className="text-4xl font-black">{stats.open}</p>
              </div>
              <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl relative z-10 border border-white/20">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-3xl shadow-xl shadow-red-500/20 text-white flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <p className="text-red-100/80 text-xs font-black uppercase tracking-widest mb-1.5 backdrop-blur-sm">Urgent Claims</p>
                <p className="text-4xl font-black">{stats.urgent}</p>
              </div>
              <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl relative z-10 border border-white/20">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 rounded-3xl shadow-xl shadow-orange-500/20 text-white flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <p className="text-orange-100/80 text-xs font-black uppercase tracking-widest mb-1.5 backdrop-blur-sm">Awaiting Cust.</p>
                <p className="text-4xl font-black">{stats.awaiting}</p>
              </div>
              <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl relative z-10 border border-white/20">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/20 text-white flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <p className="text-emerald-100/80 text-xs font-black uppercase tracking-widest mb-1.5 backdrop-blur-sm">Resolved</p>
                <p className="text-4xl font-black">{stats.resolved}</p>
              </div>
              <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl relative z-10 border border-white/20">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-start animate-in fade-in duration-500">
          
          {/* Left Column: Actions & Filters */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-white">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-[24px] font-black hover:bg-black transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 mb-6"
              >
                <Plus className="w-5 h-5" />
                NEW TICKET
              </button>
              
              <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-t pt-6">
                <Filter className="w-4 h-4 text-gray-400" />
                Refine Search
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ID, Name, Order..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-100 rounded-full text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          {/* Middle Column: Live Tickets List */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-white flex gap-1 overflow-x-auto">
              {['All', 'Open', 'Urgent', 'Awaiting customer', 'Resolved'].map((s) => (
                  <button 
                  key={s} 
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterStatus === s ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-4 pr-2">
              {filteredTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => {
                    if (window.getSelection()?.toString().length) return;
                    setActiveTicketId(activeTicketId === ticket.id ? null : ticket.id);
                  }}
                  className={`group px-4 py-3 md:p-4 rounded-xl transition-all cursor-pointer border-l-4 ${activeTicketId === ticket.id ? 'bg-blue-50/50 border-l-blue-500 shadow-md ring-1 ring-blue-100/50' : 'bg-white border-l-transparent hover:border-l-gray-300 border-y border-r border-gray-100 hover:bg-gray-50 hover:shadow-sm'}`}
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                    {/* Left: Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{ticket.id}</span>
                        <PriorityBadge p={ticket.priority} />
                        <div className="w-px h-3 bg-gray-200"></div>
                        <h4 className="font-bold text-sm text-gray-800 truncate">{ticket.customer}</h4>
                      </div>
                      <p className={`text-xs text-gray-500 leading-relaxed select-text ${activeTicketId === ticket.id ? 'whitespace-pre-wrap break-words' : 'line-clamp-1'}`}>
                        {ticket.issue}
                      </p>
                    </div>

                    {/* Right: Meta & Badges */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 gap-2 border-t border-gray-100 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.orderId && (
                          <div className="flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            <ShoppingCart className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] font-bold text-indigo-600 tracking-wider">{ticket.orderId}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 opacity-70">
                          <ChannelIcon c={ticket.channel} />
                        </div>
                        {ticket.photos?.length > 0 && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <ImageIcon className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTickets.length === 0 && (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching issues</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ticket Workspace */}
          <div className={`xl:col-span-5 space-y-6 lg:sticky lg:top-[70px] ${activeTicket ? 'order-first xl:order-none' : 'order-last xl:order-none'}`}>
            {activeTicket ? (
              <>
                <div className="bg-white rounded-3xl shadow-lg border border-white overflow-hidden flex flex-col max-h-[90dvh]">
                  {/* Workspace Header */}
                  <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h2 className="text-[22px] font-black text-gray-800 leading-none mb-2 uppercase tracking-tight">{activeTicket.customer}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-100" title="Time Created">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{new Date(activeTicket.createdAt).toLocaleString()}</span>
                        </div>
                        {activeTicket.resolvedAt && (
                          <>
                            <div className="w-4 h-px bg-gray-300" />
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100" title="Time Resolved">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-700">{new Date(activeTicket.resolvedAt).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {activeTicket.status !== 'Resolved' && (
                        <button 
                          onClick={() => {
                            handleUpdateTicket(activeTicket.id, { 
                              status: 'Resolved', 
                              notes: activeTicket.notes + '\n\n[SYSTEM] Case signed off and closed on ' + new Date().toLocaleString()
                            });
                            alert('Case signed off and closed.');
                          }}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl text-xs font-black uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Sign Off
                        </button>
                      )}
                      <button onClick={() => handleDeleteTicket(activeTicket.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50/30">
                    {/* Editable Fields Grid */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Order Reference</label>
                          <div className="flex items-center gap-2 group bg-gray-50 px-3 py-2 rounded-xl border border-transparent focus-within:bg-white focus-within:border-blue-100 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                            <ShoppingCart className="w-4 h-4 text-blue-400" />
                            <input 
                              value={activeTicket.orderId} 
                              onChange={e => handleUpdateTicket(activeTicket.id, {orderId: e.target.value})}
                              className="w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 outline-none text-gray-800"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Ticket Owner</label>
                          <div className="bg-gray-50 px-3 py-2 rounded-xl border border-transparent hover:bg-gray-100 transition-colors">
                            <select 
                              value={activeTicket.owner}
                              onChange={e => handleUpdateTicket(activeTicket.id, {owner: e.target.value})}
                              className="w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer text-gray-800 appearance-none"
                            >
                              <option>Unassigned</option><option>Sarah M.</option><option>John D.</option><option>Alice K.</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Channel Source</label>
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-transparent hover:bg-gray-100 transition-colors">
                             <ChannelIcon c={activeTicket.channel} />
                             <select 
                              value={activeTicket.channel}
                              onChange={e => handleUpdateTicket(activeTicket.id, {channel: e.target.value as any})}
                              className="w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer text-gray-800 appearance-none"
                             >
                               <option>Amazon</option><option>Shopify</option><option>B&Q</option><option>Email</option><option>Phone</option>
                             </select>
                          </div>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 block">Response SLA</label>
                          <div className="flex items-center h-[36px]">
                            <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100/50 shadow-sm">{activeTicket.sla}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Issue & Internal Notes */}
                    <div className="space-y-6">
                      <div className="bg-white p-1 rounded-3xl border border-gray-100 shadow-sm focus-within:ring-4 ring-blue-50 transition-all">
                        <div className="bg-gray-50/80 p-5 rounded-[28px]">
                          <textarea 
                            value={activeTicket.issue}
                            onChange={e => handleUpdateTicket(activeTicket.id, {issue: e.target.value})}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none resize-y min-h-[80px] text-sm text-gray-700 leading-relaxed font-medium select-text"
                            placeholder="Customer issue description..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                          <History className="w-3.5 h-3.5" />
                          Internal Log / Activity
                        </label>
                        <textarea 
                           className="w-full p-6 bg-[#fffdf0] border border-yellow-200/50 rounded-[32px] text-sm text-gray-800 leading-relaxed outline-none focus:ring-4 focus:ring-yellow-100/50 min-h-[150px] resize-none shadow-sm"
                           value={activeTicket.notes}
                           onChange={e => handleUpdateTicket(activeTicket.id, {notes: e.target.value})}
                           placeholder="Team discussions, status logs, courier tracking updates..."
                        />
                      </div>
                    </div>

                    {/* Photos/Evidence Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Photos / Evidence</label>
                        <label className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-600 hover:text-white transition-all uppercase">
                           Add media
                           <input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, false)} className="hidden" />
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {activeTicket.photos?.map((url, i) => (
                          <div key={i} className="group relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 cursor-zoom-in hover:shadow-lg transition-all">
                            <img 
                              src={url} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                              alt="evidence" 
                              onClick={() => { setPreviewUrl(url); setIsPreviewOpen(true); }}
                            />
                            <button onClick={() => removePhoto(url, false)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!activeTicket.photos || activeTicket.photos.length === 0) && (
                          <div className="col-span-3 py-10 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center grayscale opacity-30">
                             <ImageIcon className="w-10 h-10 mb-2" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">No damage or courier proof found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply Builder */}
                    <div className="bg-slate-800 rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-700 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                      <div className="relative z-10">
                        <h3 className="text-sm font-black mb-4 flex items-center justify-between uppercase tracking-widest text-slate-100/80">
                          Reply Builder
                          <div className="flex gap-2">
                             <button onClick={() => { setDraftReply(activeTicket.notes); setDraftReply('') }} className="p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full transition-colors text-slate-300">
                                <History className="w-4 h-4" />
                             </button>
                          </div>
                        </h3>
                        <textarea 
                          className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-[20px] p-5 text-sm text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 custom-scrollbar-slate"
                          placeholder="Draft your customer response here..."
                          value={draftReply}
                          onChange={e => setDraftReply(e.target.value)}
                        />
                        <div className="flex gap-3">
                           <button 
                            onClick={() => handleUpdateTicket(activeTicket.id, {notes: activeTicket.notes + '\n\nDrafted Reply: ' + draftReply})} 
                            className="flex-1 py-3.5 bg-slate-700 hover:bg-indigo-600 text-white rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                             Log to Notes
                           </button>
                           <button 
                            onClick={() => { navigator.clipboard.writeText(draftReply); alert('Reply copied to clipboard'); }}
                            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[16px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                             <Copy className="w-4 h-4" />
                             Copy Text
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="p-6 bg-white border-t flex justify-between items-center gap-6">
                    <select 
                      value={activeTicket.status}
                      onChange={e => handleUpdateTicket(activeTicket.id, {status: e.target.value as any})}
                      className={`px-6 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs border-none outline-none focus:ring-0 cursor-pointer shadow-sm transition-all ${
                        activeTicket.status === 'Open' ? 'bg-blue-50 text-blue-600' :
                        activeTicket.status === 'Urgent' ? 'bg-red-50 text-red-600' :
                        activeTicket.status === 'Awaiting customer' ? 'bg-orange-50 text-orange-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <option>Open</option>
                      <option>Urgent</option>
                      <option>Awaiting customer</option>
                      <option>Resolved</option>
                    </select>
                    <button className="flex-1 py-4 bg-black text-white rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                       <Send className="w-4 h-4" />
                       Send Reply
                    </button>
                  </div>
                </div>
              </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-200 rounded-[48px] p-20 text-center grayscale opacity-50">
                   <div className="bg-gray-100 p-8 rounded-full mb-8">
                     <LayoutDashboard className="w-20 h-20 text-gray-300" />
                   </div>
                   <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-4">Workspace Passive</h2>
                   <p className="max-w-xs text-sm text-gray-400 font-medium leading-relaxed">Select a live ticket from the middle queue to begin processing the case.</p>
                </div>
            )}

            {/* Bottom Workspace: Saved Replies & Knowledge Base */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-white">
                <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Saved Macros
                </h3>
                <div className="space-y-3">
                  {savedReplies.map(reply => (
                    <button 
                      key={reply.id} 
                      onClick={() => setDraftReply(reply.body)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 text-left rounded-2xl border border-gray-100 transition-all group"
                    >
                       <p className="text-xs font-black text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{reply.title}</p>
                    </button>
                  ))}
                </div>
                <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-100 hover:text-blue-500 transition-all">+ Add New Macro</button>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-white">
                <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  SOP Library
                </h3>
                <div className="space-y-3">
                  {kbArticles.map(article => (
                    <div key={article.id} className="w-full p-4 bg-gray-50 text-left rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors group">
                       <p className="text-xs font-bold text-gray-600 group-hover:text-emerald-700 truncate">{article.title}</p>
                       <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-emerald-100 hover:text-emerald-500 transition-all">+ Submit SOP</button>
              </div>
            </div>
          </div>

        </div>
        ) : viewMode === 'board' ? (
          /* Kanban Board View */
          <div className="flex xl:grid xl:grid-cols-4 gap-4 flex-1 animate-in slide-in-from-bottom-4 duration-500 overflow-x-auto snap-x snap-mandatory pt-2 pb-6 custom-scrollbar">
            {(['Open', 'Urgent', 'Awaiting customer', 'Resolved'] as TicketStatus[]).map(status => (
              <div 
                key={status} 
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                className={`snap-center shrink-0 w-[85vw] md:w-[45vw] xl:w-auto flex flex-col min-h-[500px] h-full bg-gray-100/50 rounded-[20px] border-2 border-dashed transition-all ${draggedTicketId ? 'border-blue-300 bg-blue-50/30' : 'border-transparent'}`}
              >
                <div className="p-3 pb-2 flex items-center justify-between border-b mx-2 mb-1 border-gray-200/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      status === 'Urgent' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      status === 'Open' ? 'bg-blue-500' :
                      status === 'Awaiting customer' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`} />
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none">{status}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-white rounded-full text-[10px] font-black text-gray-500 shadow-sm leading-none">
                    {tickets.filter(t => t.status === status).length}
                  </span>
                </div>

                <div className="p-2 flex flex-col gap-2 flex-1">
                  {tickets.filter(t => t.status === status).map(ticket => (
                    <div 
                      key={ticket.id}
                      draggable={activeTicketId !== ticket.id}
                      onDragStart={(e) => onDragStart(e, ticket.id)}
                      onClick={() => {
                        if (window.getSelection()?.toString().length) return;
                        setActiveTicketId(activeTicketId === ticket.id ? null : ticket.id);
                      }}
                      className={`bg-white p-3 rounded-xl shadow-sm border hover:border-blue-200 hover:shadow-md transition-all group ${activeTicketId !== ticket.id ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : ''} ${activeTicketId === ticket.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-100'}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{ticket.id}</span>
                        <PriorityBadge p={ticket.priority} />
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest group-hover:text-blue-600 transition-colors leading-none truncate">{ticket.customer}</span>
                      </div>
                      
                      {ticket.orderId && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 bg-indigo-50 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-2.5 h-2.5 text-indigo-400" />
                          </div>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Order: {ticket.orderId}</span>
                        </div>
                      )}

                      <p className={`text-[11px] text-gray-500 leading-snug mb-2 font-medium select-text ${activeTicketId === ticket.id ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>{ticket.issue}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <ChannelIcon c={ticket.channel} />
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{ticket.channel}</span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-400">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest leading-none">{ticket.sla}</span>
                        </div>
                      </div>
                      
                      {activeTicketId === ticket.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewMode('list'); }}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
                          >
                            Open Workspace
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[28px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-white transition-all group"
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Entry</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dashboard View */
          <div className="flex-1 px-2 lg:px-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Details */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-indigo-500" />
                    Support Efficiency
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mb-6">Average time to close tickets</p>
                </div>
                
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-black text-indigo-600 leading-none">4.2</span>
                  <span className="text-lg font-bold text-gray-400 pb-1">Hours</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl">
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-700">12% faster than last month</span>
                </div>
              </div>

              {/* Volume Distribution */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    Channel Distribution
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mb-6">Where requests are coming from</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'Website Form', pct: 45, val: tickets.filter(t => t.channel === 'Email').length + 8 },
                    { label: 'Etsy', pct: 30, val: tickets.filter(t => t.channel === 'Etsy').length + 5 },
                    { label: 'Amazon', pct: 15, val: tickets.filter(t => t.channel === 'Amazon').length + 2 },
                  ].map(chan => (
                    <div key={chan.label}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-gray-600">{chan.label}</span>
                        <span className="text-gray-900">{chan.val} Tickets</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${chan.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Ticket Activity */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Recent Activity Timeline
                </h3>
                <p className="text-xs font-bold text-gray-400 mb-6">Real-time status updates</p>
                
                <div className="space-y-6">
                   {tickets.slice().reverse().slice(0, 5).map((ticket, idx) => (
                      <div key={'act-'+ticket.id} className="flex gap-4 relative">
                        {idx !== 4 && <div className="absolute top-8 bottom-[-24px] left-5 w-0.5 bg-gray-100" />}
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border-4 border-white z-10 shadow-sm">
                          <CheckCircle2 className={`w-4 h-4 ${ticket.status === 'Resolved' ? 'text-emerald-500' : 'text-blue-500'}`} />
                        </div>
                        <div className="pt-2">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-black text-sm text-gray-800">{ticket.customer}</span>
                             <span className="text-[10px] font-black uppercase text-gray-400">Order {ticket.orderId}</span>
                           </div>
                           <p className="text-xs font-medium text-gray-500 line-clamp-1">{ticket.issue}</p>
                           <p className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1.5">
                             <Clock className="w-3 h-3" />
                             {new Date(ticket.createdAt).toLocaleString()} 
                             {ticket.resolvedAt && <><span className="mx-1">&rarr;</span> Resolved {new Date(ticket.resolvedAt).toLocaleString()}</>}
                           </p>
                        </div>
                      </div>
                   ))}
                </div>
            </div>
          </div>
        )}
        </>
      )}

        {adminTab === 'users' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter border-b pb-4">Staff Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="pb-3 pl-4">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Approval Status</th>
                    <th className="pb-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {allUsers.map((user, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 pl-4 font-bold text-gray-800">{user.name}</td>
                      <td className="py-4 text-gray-500">{user.email}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.email !== 'retrotownuk@gmail.com' && (
                            <>
                              <button 
                                onClick={() => handleToggleApproval(user.email)} 
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.isApproved ? 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                              >
                                {user.isApproved ? 'Revoke' : 'Approve'}
                              </button>
                              <button onClick={() => handleDeleteUser(user.email)} className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No staff records found</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'pricing' && (
          <PricingAdminView />
        )}

        {adminTab === 'timeline' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Security & Access Timeline</h2>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Activity</span>
                </div>
             </div>
             
             <div className="pl-6 space-y-6">
                {loginTimeline.map((event, i) => (
                  <div key={event.id || i} className="relative flex items-start gap-4 before:absolute before:inset-0 before:ml-[-1.5rem] before:w-[2px] before:bg-gray-100 last:before:hidden">
                     <div className="absolute left-[-1.5rem] w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_0_4px_white] translate-x-[-5px] translate-y-1" />
                     <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full group hover:border-blue-200 transition-all">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-sm text-gray-800">{event.name}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                       </div>
                       <p className="text-xs font-medium text-gray-500">
                         Access granted for <span className="font-bold text-gray-700">{event.email}</span> via secure login.
                       </p>
                     </div>
                  </div>
                ))}
                {loginTimeline.length === 0 && (
                   <div className="py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No activity recorded</div>
                )}
             </div>
          </div>
        )}

      </div>

      {/* New Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">New Support Entry</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manual ticket generation</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-100 transition-all border border-gray-100">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label>
                  <input 
                    type="text" 
                    value={newTicket.customer || ''} 
                    onChange={e => setNewTicket({...newTicket, customer: e.target.value})}
                    placeholder="e.g. David Smith" 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Order ID</label>
                  <input 
                    type="text" 
                    value={newTicket.orderId || ''} 
                    onChange={e => setNewTicket({...newTicket, orderId: e.target.value})}
                    placeholder="#12345" 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Channel Source</label>
                  <select 
                    value={newTicket.channel} 
                    onChange={e => setNewTicket({...newTicket, channel: e.target.value as any})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option>Amazon</option><option>Shopify</option><option>B&Q</option><option>Email</option><option>Phone</option><option>Etsy</option><option>Invoice</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                  <select 
                    value={newTicket.priority} 
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Overview</label>
                <textarea 
                  value={newTicket.issue || ''} 
                  onChange={e => setNewTicket({...newTicket, issue: e.target.value})}
                  placeholder="What is the problem the customer is facing?" 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all h-32 resize-none" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidence Photos</label>
                <div className="grid grid-cols-4 gap-4">
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer flex flex-col items-center justify-center group">
                    <Plus className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    <input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, true)} className="hidden" />
                  </label>
                  {newTicket.photos?.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => removePhoto(url, true)} className="absolute top-1 right-1 bg-red-500 text-white rounded-lg p-1 shadow-sm hover:bg-red-600">
                        <X className="w-3 h-3"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                  Generate Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-20 bg-black/90 backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-300">
           <button onClick={() => setIsPreviewOpen(false)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
             <X className="w-8 h-8" />
           </button>
           <img src={previewUrl} className="max-w-full max-h-full rounded-2xl shadow-2xl border-4 border-white/10" alt="Full Preview" />
        </div>
      )}

      {/* Global Utility Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        
        .custom-scrollbar-white::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-white::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-white::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 20px; }
        .custom-scrollbar-white::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
        
        select { background-image: none !important; }
      `}} />
    </div>
  );
};

export default AdminView;
