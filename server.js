import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security and Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development/iframe compatibility
  }));
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // --- API ROUTES ---

  // Auth / RBAC Middleware simulation
  const authMiddleware = (req, res, next) => {
    // In a real app, verify JWT/Session
    req.user = { id: '1', role: 'admin', email: 'admin@deliveryhub.com' };
    next();
  };

  // Jira Integration Route
  app.get('/api/delivery/board', authMiddleware, async (req, res) => {
    try {
      // Simulation of Jira Data
      // In production, use axios to fetch from Atlassian API
      const mockJiraData = [
        {
          id: 'DH-101',
          summary: 'Implement MCP Server for Jira',
          status: 'In Progress',
          targetStart: '2026-04-01',
          targetEnd: '2026-04-10',
          dueDate: '2026-04-12',
          lastUpdate: '2026-04-08',
          assignee: 'Alice',
        },
        {
          id: 'DH-102',
          summary: 'Setup Databricks SQL Warehouse',
          status: 'To Do',
          targetStart: '2026-04-05',
          targetEnd: '2026-04-15',
          dueDate: '2026-04-20',
          lastUpdate: '2026-04-01', // Alert: > 3 days
          assignee: 'Bob',
        },
        {
          id: 'DH-103',
          summary: 'Design OKR Module',
          status: 'Backlog',
          targetStart: '2026-05-01',
          targetEnd: '2026-05-30',
          dueDate: '2026-06-01',
          lastUpdate: '2026-04-09',
          assignee: 'Charlie',
        }
      ];
      res.json(mockJiraData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Jira data' });
    }
  });

  // Agent / MCP Route
  app.post('/api/agent/chat', authMiddleware, async (req, res) => {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();
    
    let reply = "I've analyzed your request. I can help you update Jira tasks or check GitHub PRs using my MCP tools.";
    let tools_used = ['mcp_core_router'];

    if (lowerMessage.includes('jira') || lowerMessage.includes('task') || lowerMessage.includes('issue')) {
      reply = "I've scanned the Jira board. You have 2 tasks at risk of delay (DH-102 and DH-105). Would you like me to send a nudge to the assignees?";
      tools_used.push('jira_mcp_search', 'jira_issue_analyzer');
    } else if (lowerMessage.includes('github') || lowerMessage.includes('pr') || lowerMessage.includes('pull request')) {
      reply = "I found 3 open Pull Requests in the 'delivery-hub' repository. One PR (#42) is waiting for your review for over 2 days.";
      tools_used.push('github_mcp_monitor', 'pr_aging_check');
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('okr') || lowerMessage.includes('metric')) {
      reply = "Current Q2 OKR progress is at 75%. We are slightly behind on the 'Platform Stability' goal due to recent infrastructure migrations.";
      tools_used.push('databricks_mcp_query', 'goal_tracking_engine');
    } else if (lowerMessage.includes('create') || lowerMessage.includes('new')) {
      reply = "I can help you create a new Jira issue. Please provide the Summary and Priority, and I'll use the Jira MCP tool to initialize it.";
      tools_used.push('jira_mcp_create_issue');
    }

    // Simulation of Agent Logic (Mock Mode)
    res.json({ 
      reply: `[MOCK MODE] ${reply}`,
      tools_used: tools_used
    });
  });

  // Databricks / Analytics Route
  app.get('/api/analytics/trends', authMiddleware, async (req, res) => {
    res.json({
      trends: [
        { month: 'Jan', velocity: 45, goals_met: 80 },
        { month: 'Feb', velocity: 52, goals_met: 85 },
        { month: 'Mar', velocity: 48, goals_met: 75 },
      ]
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Delivery Hub running on http://localhost:${PORT}`);
  });
}

startServer();
