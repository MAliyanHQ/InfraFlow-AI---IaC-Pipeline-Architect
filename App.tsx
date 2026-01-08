
import React, { useState } from 'react';
import { 
  IaCProject, 
  PipelineStatus, 
  PipelineStepType, 
  PipelineStep 
} from './types';
import { gemini } from './services/geminiService';
import PipelineVisualizer from './components/PipelineVisualizer';
import TerminalOutput from './components/TerminalOutput';
import { PlayIcon, CloudIcon, ShieldIcon, TerminalIcon, SettingsIcon } from './components/Icons';

const INITIAL_STEPS: PipelineStep[] = [
  { id: '1', type: PipelineStepType.LINT, label: 'LINT', status: PipelineStatus.IDLE, output: [] },
  { id: '2', type: PipelineStepType.SECURITY, label: 'SCAN', status: PipelineStatus.IDLE, output: [] },
  { id: '3', type: PipelineStepType.PLAN, label: 'PLAN', status: PipelineStatus.IDLE, output: [] },
  { id: '4', type: PipelineStepType.PROVISION, label: 'APPLY', status: PipelineStatus.IDLE, output: [] },
  { id: '5', type: PipelineStepType.CONFIGURE, label: 'CONFIG', status: PipelineStatus.IDLE, output: [] },
];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Build a high-availability EKS cluster with managed Postgres, Redis cache, and CloudFront CDN.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [project, setProject] = useState<IaCProject | null>(null);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateProject = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await gemini.generateInfrastructure(prompt);
      const newProject: IaCProject = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.projectTitle,
        description: prompt,
        terraformCode: data.terraform,
        ansibleCode: data.ansible,
        pipelineSteps: INITIAL_STEPS.map(s => ({ ...s, status: PipelineStatus.IDLE, output: [] })),
      };
      setProject(newProject);
      setExplanation(data.explanation);
      setActiveLogs([]);
    } catch (err: any) {
      console.error("Generation failed", err);
      setError("Failed to synthesize assets.");
    } finally {
      setIsGenerating(false);
    }
  };

  const runPipeline = async () => {
    if (!project || isExecuting) return;
    setIsExecuting(true);
    setActiveLogs([]);
    
    const updatedSteps = project.pipelineSteps.map(s => ({ ...s, status: PipelineStatus.IDLE }));
    setProject({ ...project, pipelineSteps: updatedSteps });

    for (let i = 0; i < updatedSteps.length; i++) {
      const step = updatedSteps[i];
      
      setProject(prev => {
        if (!prev) return null;
        const next = [...prev.pipelineSteps];
        next[i] = { ...next[i], status: PipelineStatus.RUNNING };
        return { ...prev, pipelineSteps: next };
      });

      const codeContext = step.type === PipelineStepType.CONFIGURE ? project.ansibleCode : project.terraformCode;
      const logs = await gemini.simulateLog(step.type, codeContext);
      
      for (const log of logs) {
        setActiveLogs(prev => [...prev, log]);
        await new Promise(r => setTimeout(r, 40 + Math.random() * 100));
      }

      setProject(prev => {
        if (!prev) return null;
        const next = [...prev.pipelineSteps];
        next[i] = { ...next[i], status: PipelineStatus.COMPLETED };
        return { ...prev, pipelineSteps: next };
      });
      
      await new Promise(r => setTimeout(r, 300));
    }

    setIsExecuting(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#a1a1a1] selection:bg-blue-500/30 pb-20">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <nav className="h-14 border-b border-white/[0.08] bg-black/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
              <CloudIcon className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">INFRAFLOW <span className="text-[#666]">AI</span></span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex gap-4 text-xs font-medium">
            <span className="text-white">Workspace</span>
            <span className="hover:text-white transition-colors cursor-pointer">Manifests</span>
            <span className="hover:text-white transition-colors cursor-pointer">Live Metrics</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Simulation Engine Ready</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
        
        {/* Input Column */}
        <div className="xl:col-span-4 space-y-6">
          <div className="card-modern p-6 bg-[#0a0a0a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Global Architect</h2>
              <SettingsIcon className="w-3.5 h-3.5 text-[#444]" />
            </div>
            <div className="relative group">
              <textarea 
                className="w-full h-44 bg-[#111] border border-white/[0.05] rounded-lg p-4 text-sm focus:border-white/20 outline-none transition-all resize-none jetbrains-mono text-[#ccc] leading-relaxed placeholder:text-[#333]"
                placeholder="Ex: Multi-cloud redundancy using AWS and GCP with Kubernetes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-[11px] font-medium flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <button 
              onClick={generateProject}
              disabled={isGenerating || !prompt}
              className="w-full mt-6 btn-primary h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50 tracking-tighter"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  GENERATE IAC MANIFESTS
                </>
              )}
            </button>
          </div>

          {project && (
            <div className="card-modern p-6 bg-[#0a0a0a] border-l-4 border-l-white animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <ShieldIcon className="w-4 h-4 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Analysis</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{project.name}</h3>
              <p className="text-xs leading-relaxed text-[#888] font-medium">
                {explanation}
              </p>
            </div>
          )}
        </div>

        {/* Dashboard Column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Pipeline Card */}
          <div className="card-modern p-8 bg-[#0a0a0a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">CI/CD Orchestrator</h2>
                <p className="text-[#555] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Infrastructure Provisioning Workflow</p>
              </div>
              <button 
                onClick={runPipeline}
                disabled={!project || isExecuting}
                className="btn-secondary px-8 h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed uppercase font-bold tracking-widest"
              >
                <TerminalIcon className="w-4 h-4" />
                {isExecuting ? 'EXECUTING...' : 'RUN PIPELINE'}
              </button>
            </div>

            <PipelineVisualizer steps={project?.pipelineSteps || INITIAL_STEPS} />
            
            {!project && (
              <div className="mt-8 py-10 border border-white/[0.03] bg-white/[0.01] rounded-xl flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold text-[#333] uppercase tracking-[0.3em]">Simulation Waiting for Input</p>
              </div>
            )}
          </div>

          {/* Logs & Code Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logs Terminal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <TerminalIcon className="w-3.5 h-3.5 text-white/40" />
                <h2 className="text-[10px] font-bold text-white uppercase tracking-widest">Pipeline Stdout</h2>
              </div>
              <TerminalOutput logs={activeLogs} active={isExecuting} />
            </div>

            {/* Quick Stats or Small Code */}
            <div className="grid grid-cols-1 gap-6 h-full">
              <div className="card-modern p-6 bg-[#0a0a0a] flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6">Cluster Health</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Compute API', val: 'Operational', color: 'emerald' },
                      { label: 'State Storage', val: 'Synchronized', color: 'emerald' },
                      { label: 'Ansible Node', val: 'Active', color: 'blue' }
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                        <span className="text-[11px] text-[#666]">{stat.label}</span>
                        <span className={`text-[10px] font-bold text-${stat.color}-500 uppercase`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/[0.05]">
                   <div className="flex justify-between items-end">
                      <div>
                        <span className="block text-[8px] font-black text-[#444] uppercase mb-1">Total Assets</span>
                        <span className="text-xl font-bold text-white">{project ? '2' : '0'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-black text-[#444] uppercase mb-1">Risk Profile</span>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">Minimal</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Code Section - SHOWING BOTH */}
        {project && (
          <div className="xl:col-span-12 space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Source Asset Inspection</h2>
              </div>
              <div className="flex gap-4">
                <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">HCL (Terraform)</span>
                <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">YAML (Ansible)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Terraform Panel */}
              <div className="card-modern overflow-hidden bg-[#050505]">
                <div className="px-5 py-3 border-b border-white/[0.05] bg-[#0a0a0a] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                    <span className="text-[10px] font-bold text-[#ccc] tracking-widest uppercase">infrastructure.tf</span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(project.terraformCode)}
                    className="text-[9px] font-bold text-white/40 hover:text-white transition-colors uppercase"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-6 h-[400px] overflow-auto jetbrains-mono text-[11px] leading-relaxed scrollbar-thin">
                  <pre className="text-[#777]">
                    {project.terraformCode.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="w-6 text-right text-[#222] group-hover:text-[#444] transition-colors select-none">{i + 1}</span>
                        <span className={line.includes('resource') || line.includes('module') ? 'text-[#eee]' : line.includes('"') ? 'text-blue-400/80' : ''}>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Ansible Panel */}
              <div className="card-modern overflow-hidden bg-[#050505]">
                <div className="px-5 py-3 border-b border-white/[0.05] bg-[#0a0a0a] flex justify-between items-center">
                   <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                    <span className="text-[10px] font-bold text-[#ccc] tracking-widest uppercase">provision_nodes.yml</span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(project.ansibleCode)}
                    className="text-[9px] font-bold text-white/40 hover:text-white transition-colors uppercase"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-6 h-[400px] overflow-auto jetbrains-mono text-[11px] leading-relaxed scrollbar-thin">
                  <pre className="text-[#777]">
                    {project.ansibleCode.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="w-6 text-right text-[#222] group-hover:text-[#444] transition-colors select-none">{i + 1}</span>
                        <span className={line.startsWith('- name:') ? 'text-[#eee]' : line.includes('task') ? 'text-emerald-400/80' : ''}>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-[1600px] mx-auto px-8 py-12 border-t border-white/[0.05] mt-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
        <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#444]">
          InfraFlow Architect Framework v2.0
        </div>
        <div className="flex gap-12 text-[10px] font-bold text-[#666] uppercase tracking-widest">
          <span>Engine: Gemini Pro</span>
          <span>Simulation: Native-Mock</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
