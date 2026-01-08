
import React from 'react';
import { PipelineStep, PipelineStatus, PipelineStepType } from '../types';
import { PlayIcon, CheckIcon, SettingsIcon, ShieldIcon, TerminalIcon, CloudIcon } from './Icons';

interface Props {
  steps: PipelineStep[];
}

const getIconForStep = (type: PipelineStepType) => {
  switch (type) {
    case PipelineStepType.LINT: return <SettingsIcon className="w-4 h-4" />;
    case PipelineStepType.PLAN: return <TerminalIcon className="w-4 h-4" />;
    case PipelineStepType.SECURITY: return <ShieldIcon className="w-4 h-4" />;
    case PipelineStepType.PROVISION: return <CloudIcon className="w-4 h-4" />;
    case PipelineStepType.CONFIGURE: return <SettingsIcon className="w-4 h-4" />;
    default: return <PlayIcon className="w-4 h-4" />;
  }
};

const PipelineVisualizer: React.FC<Props> = ({ steps }) => {
  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-4 py-8 px-6 bg-[#070707] border border-white/[0.05] rounded-xl">
      {steps.map((step, index) => {
        const isActive = step.status === PipelineStatus.RUNNING;
        const isCompleted = step.status === PipelineStatus.COMPLETED;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col lg:flex-row items-center gap-4 relative z-10 w-full lg:w-auto">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 
                  isCompleted ? 'bg-[#111] text-white border border-white/20' : 
                  'bg-[#111] text-[#444] border border-white/5'}
              `}>
                {isCompleted ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : getIconForStep(step.type)}
              </div>
              
              <div className="flex flex-col items-center lg:items-start">
                <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-[#444]'}`}>
                  {step.label}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? 'text-blue-500 animate-pulse' : isCompleted ? 'text-[#666]' : 'text-[#222]'}`}>
                  {step.status}
                </span>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="hidden lg:block flex-1 h-[1px] bg-white/[0.05] relative min-w-[30px]">
                <div 
                  className="absolute left-0 top-0 h-full bg-white transition-all duration-500"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PipelineVisualizer;
