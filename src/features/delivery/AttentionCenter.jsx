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
  User, 
  ArrowUpRight, 
  MessageSquarePlus,
  ExternalLink,
  Mail,
  Calendar
} from 'lucide-react';

export default function AttentionCenter() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/delivery/board')
      .then(res => res.json())
      .then(data => {
        // Flatten all tasks and filter for those needing attention
        const flattened = data.flatMap(epic => [
          { ...epic, epicId: epic.id, epicSummary: epic.summary },
          ...(epic.children || []).map(child => ({ ...child, epicId: epic.id, epicSummary: epic.summary }))
        ]);
        
        const attentionNeeded = flattened.filter(task => {
          const now = new Date();
          const last = new Date(task.lastUpdate);
          const due = new Date(task.dueDate);
          const target = new Date(task.targetEnd);
          const diffTime = Math.abs(now - last);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays > 3 || now > due || now > target;
        });

        setTasks(attentionNeeded);
        setLoading(false);
      });
  }, []);

  const getAttentionType = (task) => {
    const now = new Date();
    const last = new Date(task.lastUpdate);
    const due = new Date(task.dueDate);
    const target = new Date(task.targetEnd);
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (now > due || now > target) return { label: 'ATRASADO', color: 'bg-red-500 text-white' };
    if (diffDays > 7) return { label: 'SEM ATUALIZAÇÃO (+7d)', color: 'bg-red-600 text-white' };
    if (diffDays > 3) return { label: 'ESTAGNADO (+3d)', color: 'bg-amber-500 text-white' };
    return { label: 'ATENÇÃO', color: 'bg-neutral-500 text-white' };
  };

  if (loading) return <div className="flex items-center justify-center h-full">Analisando gargalos...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Central de Atenção</h1>
          <p className="text-neutral-500 text-sm">Identificação proativa de bloqueios e falta de atuação.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-red-600 border-red-200 bg-red-50 font-bold">
          {tasks.length} ITENS CRÍTICOS
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-red-200 shadow-lg shadow-red-50/50">
          <CardHeader className="bg-red-50/50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg">Fila de Atuação Imediata</CardTitle>
            </div>
            <CardDescription>Tasks que exigem contato direto com o responsável para desbloqueio.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="w-[120px] text-[10px] font-bold uppercase">Prioridade/Tipo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Item / Épico</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Responsável</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Última Atuação</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Deadlines</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Ações de Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-neutral-400">
                      Nenhum item crítico identificado no momento. Bom trabalho!
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => {
                    const attention = getAttentionType(task);
                    return (
                      <TableRow key={task.id} className="bg-red-50 hover:bg-red-100 transition-colors border-l-4 border-l-red-500">
                        <TableCell>
                          <Badge className={`text-[9px] font-bold px-2 py-0.5 ${attention.color}`}>
                            {attention.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{task.id}</span>
                              <span className="font-medium text-sm text-neutral-700">{task.summary}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" /> Épico: {task.epicSummary}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-neutral-100 rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-neutral-500" />
                            </div>
                            <span className="text-xs font-semibold">{task.assignee}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-neutral-600">{task.lastUpdate}</span>
                            <span className="text-[9px] text-red-500 font-bold uppercase">
                              {Math.ceil(Math.abs(new Date() - new Date(task.lastUpdate)) / (1000 * 60 * 60 * 24))} dias sem log
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                              <Calendar className="w-3 h-3" /> Target: {task.targetEnd}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                              <Clock className="w-3 h-3" /> Due: {task.dueDate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold gap-1.5 border-neutral-200 hover:bg-neutral-100">
                              <Mail className="w-3 h-3" /> NUDGE
                            </Button>
                            <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold gap-1.5 bg-black text-white hover:bg-neutral-800">
                              <ExternalLink className="w-3 h-3" /> JIRA
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Management Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 text-white border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400">Dica de Gestão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-neutral-300">
              Itens em vermelho com mais de 7 dias sem atualização costumam indicar bloqueios técnicos ou falta de priorização. 
              Recomendamos uma conversa rápida (1:1) com o responsável para entender se há necessidade de escalonamento.
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-neutral-50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span>Enviar lembrete automático via Slack/Teams</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span>Agendar revisão de prazos para itens estagnados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Layers({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.83l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.83Z" />
      <path d="m2.6 11.37 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
      <path d="m2.6 15.87 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
    </svg>
  );
}
