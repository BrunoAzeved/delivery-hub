import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  MessageSquarePlus, 
  User, 
  ChevronDown, 
  ChevronRight,
  Layers,
  Tags,
  Search,
  Filter,
  X,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { userSettings } from '../../config/userSettings';
import { Input } from '@/components/ui/input';
import { summarizeTask, refineComment } from '../../services/geminiService';

export default function Dashboard() {
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEpics, setExpandedEpics] = useState({});
  const [groupingMode, setGroupingMode] = useState('EPICS'); // EPICS, TAGS, ASSIGNEE
  const [filters, setFilters] = useState({
    assignee: 'all',
    tag: 'all',
    status: 'all',
    search: ''
  });

  // AI States
  const [aiSummary, setAiSummary] = useState({ open: false, content: '', loading: false, task: null });
  const [aiComment, setAiComment] = useState({ open: false, original: '', refined: '', loading: false, task: null, confirmed: false });

  useEffect(() => {
    fetch('/api/delivery/board')
      .then(res => res.json())
      .then(data => {
        setEpics(data);
        setLoading(false);
        // Expand all epics by default
        const initialExpanded = {};
        data.forEach(epic => {
          initialExpanded[epic.id] = true;
        });
        setExpandedEpics(initialExpanded);
      });
  }, []);

  const toggleEpic = (id) => {
    setExpandedEpics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTaskStatus = (task) => {
    const now = new Date();
    const last = new Date(task.lastUpdate);
    const due = new Date(task.dueDate);
    const target = new Date(task.targetEnd);
    
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'normal';

    if (diffDays > 7 || now > due || now > target) {
      status = 'critical';
    } else if (diffDays > 3) {
      status = 'warning';
    }

    // Bubble up status from children if this is an Epic
    if (task.type === 'Epic' && task.children?.length > 0) {
      const childStatuses = task.children.map(child => getTaskStatus(child));
      if (childStatuses.includes('critical')) return 'critical';
      if (childStatuses.includes('warning') && status !== 'critical') return 'warning';
    }

    return status;
  };

  const getRowColor = (task) => {
    const status = getTaskStatus(task);
    if (status === 'critical') return 'bg-red-100 hover:bg-red-200 transition-colors border-l-4 border-l-red-600';
    if (status === 'warning') return 'bg-amber-100 hover:bg-amber-200 transition-colors border-l-4 border-l-amber-600';
    return 'hover:bg-neutral-50 transition-colors border-l-4 border-l-transparent';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'done': return 'bg-green-100 text-green-700 border-green-200';
      case 'to do': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      case 'backlog': return 'bg-neutral-50 text-neutral-500 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading Board...</div>;

  // Flatten tasks for summary calculations
  const allTasks = epics.flatMap(e => [e, ...(e.children || [])]);
  
  // Recalculate statuses considering bubbling for summary cards
  const taskStatuses = allTasks.map(t => ({ task: t, status: getTaskStatus(t) }));
  const criticalTasks = taskStatuses.filter(ts => ts.status === 'critical');
  const warningTasks = taskStatuses.filter(ts => ts.status === 'warning');

  // Grouping Logic
  const getGroups = () => {
    // Apply Filters first
    const filteredEpics = epics.map(epic => {
      const filteredChildren = (epic.children || []).filter(child => {
        const matchAssignee = filters.assignee === 'all' || child.assignee === filters.assignee;
        const matchStatus = filters.status === 'all' || child.status.toLowerCase() === filters.status.toLowerCase();
        const matchTag = filters.tag === 'all' || child.tags?.includes(filters.tag);
        const matchSearch = filters.search === '' || 
          child.summary.toLowerCase().includes(filters.search.toLowerCase()) ||
          child.id.toLowerCase().includes(filters.search.toLowerCase());
        
        return matchAssignee && matchStatus && matchTag && matchSearch;
      });

      const epicMatchAssignee = filters.assignee === 'all' || epic.assignee === filters.assignee;
      const epicMatchStatus = filters.status === 'all' || epic.status.toLowerCase() === filters.status.toLowerCase();
      const epicMatchTag = filters.tag === 'all' || (epic.tags && epic.tags.includes(filters.tag));
      const epicMatchSearch = filters.search === '' || 
        epic.summary.toLowerCase().includes(filters.search.toLowerCase()) ||
        epic.id.toLowerCase().includes(filters.search.toLowerCase());

      const epicMatches = epicMatchAssignee && epicMatchStatus && epicMatchTag && epicMatchSearch;

      if (epicMatches || filteredChildren.length > 0) {
        return { ...epic, children: filteredChildren };
      }
      return null;
    }).filter(Boolean);

    if (groupingMode === 'EPICS') {
      return [{ id: 'ALL', label: 'GERAL', epics: filteredEpics, isDefault: true }];
    }

    if (groupingMode === 'TAGS') {
      const groups = userSettings.groupings.map(g => ({
        id: g.id,
        label: g.label,
        color: g.color,
        tags: g.tags,
        epics: []
      }));
      const otherGroup = { id: 'OTHER', label: 'OUTROS', color: 'bg-neutral-100 text-neutral-600 border-neutral-200', epics: [] };
      
      const allGroups = [...groups, otherGroup];
      
      allGroups.forEach(group => {
        filteredEpics.forEach(epic => {
          const relevantChildren = epic.children?.filter(child => {
            if (group.id === 'OTHER') {
              return !child.tags?.some(tag => userSettings.groupings.some(g => g.tags.includes(tag)));
            }
            return child.tags?.some(tag => group.tags?.includes(tag));
          }) || [];

          if (relevantChildren.length > 0) {
            group.epics.push({ ...epic, children: relevantChildren });
          }
        });
      });
      return allGroups.filter(g => g.epics.length > 0);
    }

    if (groupingMode === 'ASSIGNEE') {
      const assignees = Array.from(new Set(allTasks.map(t => t.assignee))).sort();
      return assignees.map(name => {
        const relevantEpics = [];
        filteredEpics.forEach(epic => {
          const relevantChildren = epic.children?.filter(child => child.assignee === name) || [];
          if (epic.assignee === name || relevantChildren.length > 0) {
            relevantEpics.push({ ...epic, children: relevantChildren });
          }
        });
        return { 
          id: name, 
          label: name, 
          color: 'bg-blue-50 text-blue-700 border-blue-200', 
          epics: relevantEpics,
          isUser: true 
        };
      }).filter(g => g.epics.length > 0);
    }

    return [];
  };

  const handleCheckStatus = async (task) => {
    setAiSummary({ open: true, content: '', loading: true, task });
    const summary = await summarizeTask(task);
    setAiSummary(prev => ({ ...prev, content: summary, loading: false }));
  };

  const handleRefineComment = async () => {
    setAiComment(prev => ({ ...prev, loading: true, refined: '' }));
    const refined = await refineComment(aiComment.original);
    setAiComment(prev => ({ ...prev, refined, loading: false }));
  };

  const handlePostComment = (task) => {
    // Simulated MCP call
    console.log(`Publishing to Jira via MCP: ${aiComment.refined} on task ${task.id}`);
    setAiComment({ open: false, original: '', refined: '', loading: false, task: null, confirmed: false });
    alert(`Comentário publicado no Jira (${task.id}) via MCP!`);
  };

  const renderTaskRow = (task, isChild = false) => (
    <TableRow key={task.id} className={`${getRowColor(task)} ${isChild ? 'bg-neutral-50/30' : ''}`}>
      <TableCell className="font-mono text-[10px] font-bold">
        <div className="flex items-center gap-2">
          {isChild && <div className="w-4 border-b border-neutral-300 ml-2" />}
          {task.id}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isChild ? 'text-xs' : 'text-sm'}`}>{task.summary}</span>
            {task.type === 'Epic' && <Badge variant="secondary" className="text-[9px] h-4 px-1">EPIC</Badge>}
          </div>
          <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1">
            <User className="w-2.5 h-2.5" /> {task.assignee}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getStatusColor(task.status)}`}>
          {task.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-[10px] text-neutral-600">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>{task.targetStart}</span>
          <span className="text-neutral-300">→</span>
          <span>{task.targetEnd}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-[10px] font-semibold text-neutral-700">{task.dueDate}</span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={(e) => { e.stopPropagation(); handleCheckStatus(task); }}
            title="Verificar Status com IA"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-neutral-400 hover:text-black"
            onClick={(e) => { e.stopPropagation(); setAiComment({ ...aiComment, open: true, task }); }}
            title="Adicionar Comentário"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-black">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Active Items</CardDescription>
            <CardTitle className="text-3xl font-bold">{allTasks.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>12% from last week</span>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-neutral-200 shadow-sm ${criticalTasks.length > 0 ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Critical (Overdue/Stale)</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-600">
              {criticalTasks.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>Immediate action required</span>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-neutral-200 shadow-sm ${warningTasks.length > 0 ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Warning (Stagnant)</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600">
              {warningTasks.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <Clock className="w-3 h-3" />
              <span>Needs update soon</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Target Completion</CardDescription>
            <CardTitle className="text-3xl font-bold">84%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>On track for Q2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search by ID or Summary..." 
                className="pl-10 h-9 text-sm"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select 
                className="h-9 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={filters.assignee}
                onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              >
                <option value="all">All Assignees</option>
                {Array.from(new Set(allTasks.map(t => t.assignee))).sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select 
                className="h-9 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="in progress">In Progress</option>
                <option value="to do">To Do</option>
                <option value="backlog">Backlog</option>
                <option value="done">Done</option>
              </select>

              <select 
                className="h-9 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={filters.tag}
                onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
              >
                <option value="all">All Labels</option>
                {Array.from(new Set(allTasks.flatMap(t => t.tags || []))).sort().map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              {(filters.assignee !== 'all' || filters.status !== 'all' || filters.tag !== 'all' || filters.search !== '') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-2 text-neutral-500 hover:text-black"
                  onClick={() => setFilters({ assignee: 'all', status: 'all', tag: 'all', search: '' })}
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Table */}
      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Jira Delivery Board</CardTitle>
              <CardDescription>Hierarchical view of Epics and Stories</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                <Button 
                  variant={groupingMode === 'EPICS' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 text-[10px] font-bold gap-1.5"
                  onClick={() => setGroupingMode('EPICS')}
                >
                  <Layers className="w-3 h-3" /> ÉPICOS
                </Button>
                <Button 
                  variant={groupingMode === 'TAGS' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 text-[10px] font-bold gap-1.5"
                  onClick={() => setGroupingMode('TAGS')}
                >
                  <Tags className="w-3 h-3" /> TAGS
                </Button>
                <Button 
                  variant={groupingMode === 'ASSIGNEE' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-7 text-[10px] font-bold gap-1.5"
                  onClick={() => setGroupingMode('ASSIGNEE')}
                >
                  <User className="w-3 h-3" /> RESPONSÁVEL
                </Button>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-bold h-9">
                Sync Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow>
                <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider">Key</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Summary</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Target Dates</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Due Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getGroups().map((group) => (
                <React.Fragment key={group.id}>
                  {!group.isDefault && (
                    <TableRow className="bg-neutral-100/50 border-y border-neutral-200">
                      <TableCell colSpan={6} className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {group.isUser ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-neutral-500" />
                              </div>
                              <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">{group.label}</span>
                            </div>
                          ) : (
                            <Badge className={`text-[10px] font-bold ${group.color}`}>{group.label}</Badge>
                          )}
                          <span className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase">
                            {group.epics.length} ÉPICOS
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {group.epics.map((epic) => (
                    <React.Fragment key={`${group.id}-${epic.id}`}>
                      <TableRow 
                        className={`${getRowColor(epic)} cursor-pointer border-l-4 border-l-black`}
                        onClick={() => toggleEpic(`${group.id}-${epic.id}`)}
                      >
                        <TableCell className="font-mono text-[10px] font-bold">
                          <div className="flex items-center gap-2">
                            {expandedEpics[`${group.id}-${epic.id}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {epic.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{epic.summary}</span>
                              <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-black text-white">EPIC</Badge>
                            </div>
                            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1">
                              <User className="w-2.5 h-2.5" /> {epic.assignee}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase ${getStatusColor(epic.status)}`}>
                            {epic.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            <span>{epic.targetStart}</span>
                            <span className="text-neutral-300">→</span>
                            <span>{epic.targetEnd}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-semibold text-neutral-700">{epic.dueDate}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); handleCheckStatus(epic); }}
                              title="Verificar Status com IA"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-neutral-400 hover:text-black"
                              onClick={(e) => { e.stopPropagation(); setAiComment({ ...aiComment, open: true, task: epic }); }}
                              title="Adicionar Comentário"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-black">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <AnimatePresence>
                        {expandedEpics[`${group.id}-${epic.id}`] && epic.children?.map(child => renderTaskRow(child, true))}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Summary Modal */}
      <AnimatePresence>
        {aiSummary.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-blue-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-neutral-900">Resumo de Status (IA)</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAiSummary({ ...aiSummary, open: false })} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{aiSummary.task?.id}</Badge>
                  <span className="font-semibold text-sm">{aiSummary.task?.summary}</span>
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                  {aiSummary.loading ? (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-medium">Analisando descrição e comentários...</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-neutral-700 italic">
                      "{aiSummary.content}"
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
                <Button onClick={() => setAiSummary({ ...aiSummary, open: false })} className="bg-black text-white hover:bg-neutral-800">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Comment Modal */}
      <AnimatePresence>
        {aiComment.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-neutral-900" />
                  <h3 className="font-bold text-neutral-900">Adicionar Comentário</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAiComment({ ...aiComment, open: false })} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Seu rascunho</label>
                  <textarea 
                    className="w-full h-24 p-3 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                    placeholder="Escreva o que aconteceu..."
                    value={aiComment.original}
                    onChange={(e) => setAiComment({ ...aiComment, original: e.target.value })}
                  />
                </div>

                {aiComment.refined && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold uppercase text-blue-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Sugestão da IA
                    </label>
                    <div className="w-full p-3 text-sm bg-blue-50 border border-blue-100 rounded-lg text-blue-900 italic">
                      {aiComment.refined}
                    </div>
                  </motion.div>
                )}

                {aiComment.loading && (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-medium py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Refinando sua mensagem...
                  </div>
                )}
              </div>
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefineComment}
                  disabled={!aiComment.original || aiComment.loading}
                  className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Sparkles className="w-4 h-4" /> Refinar com IA
                </Button>
                <Button 
                  onClick={() => handlePostComment(aiComment.task)}
                  disabled={!aiComment.refined || aiComment.loading}
                  className="flex-1 gap-2 bg-black text-white hover:bg-neutral-800"
                >
                  <Send className="w-4 h-4" /> Publicar no Jira
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Future Roadmap Preview */}
      <div className="p-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/30">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Module Preview: Strategic Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 grayscale pointer-events-none">
          <div className="h-24 bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold">OKR: Increase Platform Stability</p>
              <div className="w-48 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-black"></div>
              </div>
            </div>
            <Badge>75%</Badge>
          </div>
          <div className="h-24 bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold">KPI: Average Deployment Time</p>
              <p className="text-2xl font-bold">14.2 min</p>
            </div>
            <div className="text-xs text-red-500 font-bold">↑ 2.1m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
