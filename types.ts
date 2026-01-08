
export enum PipelineStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum PipelineStepType {
  LINT = 'LINT',
  PLAN = 'PLAN',
  SECURITY = 'SECURITY',
  PROVISION = 'PROVISION',
  CONFIGURE = 'CONFIGURE'
}

export interface PipelineStep {
  id: string;
  type: PipelineStepType;
  label: string;
  status: PipelineStatus;
  output: string[];
}

export interface IaCProject {
  id: string;
  name: string;
  description: string;
  terraformCode: string;
  ansibleCode: string;
  pipelineSteps: PipelineStep[];
}

export interface AIResponse {
  terraform: string;
  ansible: string;
  explanation: string;
  projectTitle: string;
}
