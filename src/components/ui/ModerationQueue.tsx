'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/store';
import { FileText, Flag, Check, X, Trash2, Ban, ExternalLink } from 'lucide-react';

export default function ModerationQueue() {
  const { reports, stories, resolveReport, dismissReport, removeNode, banUser } = useStore();

  const pendingReports = reports.filter(r => r.status === 'pending');

  const getNodeContent = (storyId: string, nodeId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return 'Conteúdo não encontrado';
    const node = story.nodes.find(n => n.id === nodeId);
    return node?.content || 'Nó removido';
  };

  const getStoryTitle = (storyId: string) => {
    return stories.find(s => s.id === storyId)?.title || 'História desconhecida';
  };

  const handleRemove = (report: typeof reports[0]) => {
    removeNode(report.storyId, report.nodeId);
  };

  if (pendingReports.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">Nenhuma denúncia pendente</p>
        <p className="text-sm">Todas as denúncias foram processadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingReports.map((report, i) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card p-5 border-red-500/20"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Flag className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{report.reason}</p>
                <p className="text-xs text-zinc-500">
                  Denunciado por {report.reportedBy} · {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
              Pendente
            </span>
          </div>

          <div className="mb-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">
              <FileText className="w-3 h-3 inline mr-1" />
              Em &ldquo;{getStoryTitle(report.storyId)}&rdquo;
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">&ldquo;{getNodeContent(report.storyId, report.nodeId)}&rdquo;</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRemove(report)}
              className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remover Conteúdo
            </button>
            <button
              onClick={() => resolveReport(report.id)}
              className="btn bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center gap-1.5 text-xs"
            >
              <Check className="w-3.5 h-3.5" /> Manter
            </button>
            <button
              onClick={() => dismissReport(report.id)}
              className="btn bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center gap-1.5 text-xs"
            >
              <X className="w-3.5 h-3.5" /> Ignorar
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
