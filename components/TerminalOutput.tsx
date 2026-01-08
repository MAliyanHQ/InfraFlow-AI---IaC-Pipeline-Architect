
import React, { useEffect, useRef } from 'react';

interface Props {
  logs: string[];
  active: boolean;
}

const TerminalOutput: React.FC<Props> = ({ logs, active }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-[#111] px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
          </div>
          <span className="text-[9px] text-[#444] font-black uppercase tracking-[0.2em] jetbrains-mono">root@infraflow-core: /workspace</span>
        </div>
      </div>
      <div 
        ref={terminalRef}
        className="p-5 jetbrains-mono text-[11px] overflow-y-auto flex-1 leading-relaxed scrollbar-thin selection:bg-white selection:text-black"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-[#222] font-black uppercase tracking-[0.4em] text-[10px]">Ready for sequence</div>
          </div>
        ) : (
          logs.map((log, i) => {
            const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
            const isSuccess = log.toLowerCase().includes('success') || log.toLowerCase().includes('complete') || log.toLowerCase().includes('created');
            const isProgress = log.includes('[PROGRESS]');

            return (
              <div key={i} className="mb-1 flex gap-4 group">
                <span className="text-[#333] font-bold select-none w-6 text-right">{i + 1}</span>
                <div className="flex-1">
                  <span className={
                    isError ? 'text-red-500' :
                    isSuccess ? 'text-emerald-400' :
                    isProgress ? 'text-blue-400' :
                    'text-[#888]'
                  }>
                    {log}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {active && (
          <div className="flex gap-4 mt-2">
             <span className="text-[#333] font-bold select-none w-6 text-right">{logs.length + 1}</span>
             <div className="w-1.5 h-3.5 bg-white animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
