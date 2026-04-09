import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Loader2, TrendingUp, Target, Zap } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/trends')
      .then(res => res.json())
      .then(data => {
        setData(data.trends);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500 font-medium">Consolidando dados do Databricks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Média de Velocidade</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> 48.3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-neutral-500">Pontos por sprint (Últimos 3 meses)</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Atingimento de OKR</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" /> 80%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-neutral-500">Média consolidada da diretoria</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Tendência de Entrega</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" /> +15.2%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-neutral-500">Crescimento vs trimestre anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Velocidade de Entrega (Velocity)</CardTitle>
            <CardDescription className="text-xs">Histórico mensal de pontos entregues</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="velocity" 
                  stroke="#000" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#000' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Atingimento de Metas (%)</CardTitle>
            <CardDescription className="text-xs">Percentual de OKRs concluídos por mês</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="goals_met" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
