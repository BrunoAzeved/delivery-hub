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
import { AlertCircle, Clock, CheckCircle2, ArrowUpRight, MessageSquarePlus, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/delivery/board')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  const isStale = (lastUpdate) => {
    const last = new Date(lastUpdate);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'done': return 'bg-green-100 text-green-700 border-green-200';
      case 'to do': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading Board...</div>;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Active Deliveries</CardDescription>
            <CardTitle className="text-3xl font-bold">{tasks.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>12% from last week</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">At Risk (Stale)</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600">
              {tasks.filter(t => isStale(t.lastUpdate)).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Requires immediate update</span>
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

      {/* Delivery Table */}
      <Card className="border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Jira Delivery Board</CardTitle>
              <CardDescription>Real-time synchronization with Atlassian Jira</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Sync Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-bold uppercase tracking-wider">Key</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Summary</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Target Dates</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Due Date</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className={isStale(task.lastUpdate) ? 'bg-amber-50/30' : ''}>
                  <TableCell className="font-mono text-xs font-bold">{task.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{task.summary}</span>
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
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{task.targetStart}</span>
                      <span className="text-neutral-300">→</span>
                      <span>{task.targetEnd}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-neutral-700">{task.dueDate}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-black">
                        <MessageSquarePlus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-black">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
