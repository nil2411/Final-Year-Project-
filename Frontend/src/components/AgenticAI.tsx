import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Bell, Zap, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AgenticTask {
  id: string;
  type: 'scheme' | 'weather' | 'fertilizer' | 'disease' | 'notification';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  status: 'pending' | 'completed' | 'dismissed';
  actionRequired: boolean;
}

interface AgenticAIProps {
  isActive: boolean;
  onTaskComplete: (taskId: string) => void;
  onTaskDismiss: (taskId: string) => void;
}

export const AgenticAI: React.FC<AgenticAIProps> = ({
  isActive,
  onTaskComplete,
  onTaskDismiss,
}) => {
  const [tasks, setTasks] = useState<AgenticTask[]>([
    {
      id: '1',
      type: 'scheme',
      title: 'New Government Scheme Available',
      description: 'PM-KISAN योजना के तहत नई सब्सिडी उपलब्ध है। आपके लिए ₹6000 का लाभ।',
      priority: 'high',
      timestamp: new Date(Date.now() - 10 * 60000), // 10 min ago
      status: 'pending',
      actionRequired: true,
    },
    {
      id: '2',
      type: 'weather',
      title: 'Weather Alert',
      description: 'अगले 3 दिन बारिश की संभावना। फसल की सुरक्षा के लिए तैयारी करें।',
      priority: 'medium',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 min ago
      status: 'pending',
      actionRequired: true,
    },
    {
      id: '3',
      type: 'fertilizer',
      title: 'Fertilizer Recommendation Ready',
      description: 'आपकी मिट्टी टेस्ट के आधार पर NPK खाद की सिफारिश तैयार है।',
      priority: 'medium',
      timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
      status: 'pending',
      actionRequired: false,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate autonomous AI task generation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 30 seconds
        generateNewTask();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isActive]);

  const generateNewTask = () => {
    const taskTypes = ['scheme', 'weather', 'fertilizer', 'disease', 'notification'] as const;
    const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    const taskTemplates = {
      scheme: {
        title: 'New Scheme Alert',
        description: 'नई सरकारी योजना आपके लिए उपलब्ध है। तुरंत आवेदन करें।',
        priority: 'high' as const,
      },
      weather: {
        title: 'Weather Update',
        description: 'मौसम में बदलाव की संभावना। फसल की देखभाल करें।',
        priority: 'medium' as const,
      },
      fertilizer: {
        title: 'Fertilizer Alert',
        description: 'खाद डालने का सही समय आ गया है।',
        priority: 'medium' as const,
      },
      disease: {
        title: 'Disease Prevention',
        description: 'फसल में बीमारी की संभावना। निवारण उपाय करें।',
        priority: 'high' as const,
      },
      notification: {
        title: 'System Update',
        description: 'आपकी प्रोफाइल अपडेट की गई है।',
        priority: 'low' as const,
      },
    };

    const template = taskTemplates[randomType];
    const newTask: AgenticTask = {
      id: Date.now().toString(),
      type: randomType,
      ...template,
      timestamp: new Date(),
      status: 'pending',
      actionRequired: randomType === 'scheme' || randomType === 'disease',
    };

    setTasks(prev => [newTask, ...prev.slice(0, 9)]); // Keep max 10 tasks
  };

  const handleTaskAction = async (taskId: string, action: 'complete' | 'dismiss') => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: action === 'complete' ? 'completed' : 'dismissed' }
        : task
    ));

    if (action === 'complete') {
      onTaskComplete(taskId);
    } else {
      onTaskDismiss(taskId);
    }
    
    setIsProcessing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scheme': return Info;
      case 'weather': return AlertTriangle;
      case 'fertilizer': return Zap;
      case 'disease': return AlertTriangle;
      default: return Bell;
    }
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');

  if (!isActive) {
    return (
      <Card className="shadow-float">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Agent Mode Inactive</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable Agent Mode for autonomous AI assistance
          </p>
          <Button onClick={() => window.location.reload()} className="gradient-primary">
            <Brain className="h-4 w-4 mr-2" />
            Activate Agent Mode
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-glow gradient-earth">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span>Agentic AI Assistant</span>
            <Badge className="bg-success text-success-foreground animate-pulse">Active</Badge>
          </div>
          <Badge variant="outline">
            {pendingTasks.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <h4 className="text-lg font-medium mb-2">All Caught Up!</h4>
            <p className="text-sm text-muted-foreground">
              AI is monitoring your farm. New suggestions will appear here.
            </p>
          </div>
        ) : (
          pendingTasks.map((task) => {
            const IconComponent = getTypeIcon(task.type);
            return (
              <div key={task.id} className="bg-floating-bg rounded-lg p-4 shadow-float animate-bounce-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{task.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.timestamp.toLocaleTimeString('hi-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {task.description}
                </p>
                
                <div className="flex space-x-2">
                  {task.actionRequired ? (
                    <Button
                      onClick={() => handleTaskAction(task.id, 'complete')}
                      disabled={isProcessing}
                      size="sm"
                      className="gradient-primary hover:shadow-glow transition-smooth"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleTaskAction(task.id, 'complete')}
                      disabled={isProcessing}
                      size="sm"
                      variant="outline"
                      className="hover:shadow-glow transition-smooth"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleTaskAction(task.id, 'dismiss')}
                    disabled={isProcessing}
                    size="sm"
                    variant="ghost"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};