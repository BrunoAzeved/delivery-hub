import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './features/delivery/Dashboard';
import ChatAgent from './features/chat/ChatAgent';
import AttentionCenter from './features/delivery/AttentionCenter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function AppContent() {
  const [activeTab, setActiveTab] = useState('delivery');

  const renderContent = () => {
    switch (activeTab) {
      case 'delivery':
        return <Dashboard />;
      case 'attention':
        return <AttentionCenter />;
      case 'chat':
        return <ChatAgent />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle>Databricks Analytics</CardTitle>
                <CardDescription>Historical performance and delivery trends</CardDescription>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center border-t border-neutral-100 bg-neutral-50/30">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto animate-pulse"></div>
                  <p className="text-sm font-medium text-neutral-500">Connecting to Databricks SQL Warehouse...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
        return (
          <div className="max-w-2xl space-y-6">
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage your MCP connections and API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-neutral-100 rounded-lg bg-neutral-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold mb-1">Gemini AI (Agent Core)</h4>
                    <p className="text-xs text-neutral-500">
                      Status: {hasApiKey ? <span className="text-green-600 font-bold">ACTIVE</span> : <span className="text-amber-600 font-bold">MOCK MODE</span>}
                    </p>
                  </div>
                  {!hasApiKey && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Missing Secret</Badge>}
                </div>
                <div className="p-4 border border-neutral-100 rounded-lg bg-neutral-50">
                  <h4 className="text-sm font-bold mb-1">Jira Cloud</h4>
                  <p className="text-xs text-neutral-500">Status: <span className="text-amber-600 font-bold">MOCK MODE (Local Test)</span></p>
                </div>
                <div className="p-4 border border-neutral-100 rounded-lg bg-neutral-50">
                  <h4 className="text-sm font-bold mb-1">GitHub Enterprise</h4>
                  <p className="text-xs text-neutral-500">Status: <span className="text-amber-600 font-bold">MOCK MODE (Local Test)</span></p>
                </div>
                <div className="p-4 border border-neutral-100 rounded-lg bg-neutral-50">
                  <h4 className="text-sm font-bold mb-1">Databricks</h4>
                  <p className="text-xs text-neutral-500">Status: <span className="text-amber-600 font-bold">MOCK MODE (Local Test)</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
