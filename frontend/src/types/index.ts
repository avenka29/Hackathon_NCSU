export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department?: string;
}

export interface PhishingSimulation {
  id: string;
  type: 'email' | 'phone';
  title: string;
  description: string;
  targetEmployees: string[];
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'active' | 'completed';
  
  emailContent?: {
    subject: string;
    body: string;
    senderEmail: string;
    senderName: string;
  };
  
  phoneContent?: {
    script: string;
    voiceId?: string;
  };
}

export interface SimulationResult {
  id: string;
  simulationId: string;
  employeeId: string;
  completedAt: Date;
  transcript?: string;
  
  analysis: {
    mistakesMade: string[];
    personalInfoRevealed: string[];
    guidelinesViolated: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    score: number;
  };
  
  clickedLinks?: boolean;
  downloadedAttachments?: boolean;
  providedCredentials?: boolean;
  revealedCompanyData?: boolean;
}

export interface EmployeeStats {
  employeeId: string;
  totalSimulations: number;
  passedSimulations: number;
  averageScore: number;
  commonMistakes: string[];
  improvementTrend: 'improving' | 'stable' | 'declining';
}