
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { TaskStatus, Task, Attachment } from '../types';

export const TaskBoard: React.FC = () => {
  const { tasks, updateTaskStatus, addTask } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(new Set());
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    startDate: string;
    dueDate: string;
    attachments: Attachment[];
  }>({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    attachments: [],
  });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns = [
    { id: TaskStatus.TODO, label: 'Pendientes', color: 'bg-zinc-800' },
    { id: TaskStatus.IN_PROGRESS, label: 'En Progreso', color: 'bg-blue-900/40' },
    { id: TaskStatus.DONE, label: 'Completado', color: 'bg-green-900/40' },
  ];

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      description: newTask.description,
      status: TaskStatus.TODO,
      startDate: newTask.startDate,
      dueDate: newTask.dueDate,
      attachments: newTask.attachments,
    };

    addTask(task);
    setNewTask({ title: '', description: '', startDate: '', dueDate: '', attachments: [] });
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        url: '#', 
        type: file.type
      }));
      setNewTask(prev => ({ ...prev, attachments: [...prev.attachments, ...filesArray] }));
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Dashboard</h2>
          <p className="text-zinc-400 mt-1 text-sm">Gestiona tareas. Haz clic en el icono para contraer/expandir tarjetas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          + Nueva Tarea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {columns.map(col => (
          <div 
            key={col.id} 
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden"
          >
            <div className={`p-4 border-b border-zinc-800 ${col.color} flex items-center justify-between`}>
              <h3 className="font-bold text-sm uppercase tracking-wider">{col.label}</h3>
              <span className="bg-zinc-800/80 text-xs px-2 py-0.5 rounded-full border border-zinc-700">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              {tasks.filter(t => t.status === col.id).map(task => {
                const isCollapsed = collapsedTaskIds.has(task.id);
                return (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className={`bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-md hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing group relative ${draggedTaskId === task.id ? 'opacity-40 grayscale' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold text-zinc-100 ${isCollapsed ? 'truncate flex-1' : ''}`}>{task.title}</h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleTaskCollapse(task.id); }}
                        className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-200"
                        title={isCollapsed ? "Expandir" : "Finalizar/Contraer"}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>
                        
                        {(task.startDate || task.dueDate) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.startDate && (
                              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded border border-zinc-700 text-zinc-400">
                                Inicio: {task.startDate}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-[10px] bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30 text-indigo-300">
                                Entrega: {task.dueDate}
                              </span>
                            )}
                          </div>
                        )}

                        {task.attachments && task.attachments.length > 0 && (
                          <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {task.attachments.length} {task.attachments.length === 1 ? 'adjunto' : 'adjuntos'}
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex -space-x-1">
                            <img src="https://picsum.photos/seed/user1/40" className="w-6 h-6 rounded-full border border-zinc-900" />
                          </div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {task.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs italic">
                  Suelta tareas aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black tracking-tight mb-6 italic uppercase">Nueva Tarea Avanzada</h3>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-2">Título</label>
                <input 
                  autoFocus required type="text" value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Nombre de la tarea..."
                  className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500 outline-none text-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-2">Descripción</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Detalles..." rows={2}
                  className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-2">Fecha de Inicio</label>
                  <input 
                    type="date" value={newTask.startDate}
                    onChange={e => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-2">Fecha de Entrega</label>
                  <input 
                    type="date" value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full bg-black/20 border border-zinc-800 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-2">Adjuntar Documentos</label>
                <div className="relative group">
                  <input 
                    type="file" multiple onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full bg-black/40 border-2 border-dashed border-zinc-800 rounded-2xl py-8 flex flex-col items-center justify-center group-hover:border-indigo-500/50 transition-all">
                    <svg className="w-8 h-8 text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-xs text-zinc-500">Haz clic o arrastra archivos aquí</span>
                  </div>
                </div>
                {newTask.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {newTask.attachments.map((file, idx) => (
                      <div key={idx} className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] border border-zinc-700 flex items-center gap-2">
                        {file.name}
                        <button type="button" onClick={() => setNewTask(p => ({...p, attachments: p.attachments.filter((_, i) => i !== idx)}))}>
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-sm font-bold transition-all text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
