
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  grupoId: string;
  espacioId: string;
  onClose: () => void;
}

export const AgregarMiembros: React.FC<Props> = ({ grupoId, espacioId, onClose }) => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [miembrosActuales, setMiembrosActuales] = useState<string[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargar = async () => {
      // Obtener IDs de usuarios del espacio
      const { data: miembrosEspacio } = await supabase
        .from('miembros_espacio')
        .select('usuario_id')
        .eq('espacio_id', espacioId)
        .eq('aceptado', true);
        
      // Miembros actuales del grupo
      const { data: miembrosGrupo } = await supabase
        .from('miembros_grupo')
        .select('usuario_id')
        .eq('grupo_id', grupoId);

      // Obtener datos de usuarios
      if (miembrosEspacio && miembrosEspacio.length > 0) {
        const ids = miembrosEspacio.map((m: any) => m.usuario_id);
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .in('id', ids);
        setUsuarios(usuarios || []);
      }
      
      setMiembrosActuales(miembrosGrupo?.map((m: any) => m.usuario_id) || []);
    };
    cargar();
  }, [grupoId, espacioId]);

  const agregarMiembros = async () => {
    const nuevos = seleccionados.filter(id => !miembrosActuales.includes(id));
    
    if (nuevos.length === 0) return;
    
    const { error } = await supabase.from('miembros_grupo').insert(
      nuevos.map(usuario_id => ({
        grupo_id: grupoId,
        usuario_id,
        rol: 'miembro'
      }))
    );
    
    if (!error) onClose();
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
      <div className="bg-[#0d0d0f] border border-white/10 rounded-[48px] p-12 w-full max-w-md shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-white">Añadir al canal</h2>
        
        <input 
          type="text"
          placeholder="Buscar miembros..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 mb-6 text-sm focus:ring-2 focus:ring-indigo-600 outline-none text-white placeholder:text-zinc-800"
        />

        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {usuariosFiltrados.map((user: any) => {
            const esMiembro = miembrosActuales.includes(user.id);
            const estaSeleccionado = seleccionados.includes(user.id);

            return (
              <div
                key={user.id}
                onClick={() => !esMiembro && toggleSeleccion(user.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border-2 ${
                  esMiembro 
                    ? 'bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed' 
                    : estaSeleccionado
                      ? 'bg-indigo-600 border-indigo-500'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-black uppercase">
                  {user.nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-white truncate">{user.nombre}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase truncate">{user.email}</p>
                </div>
                {esMiembro && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Miembro</span>
                )}
                {!esMiembro && estaSeleccionado && (
                  <span className="text-indigo-200">✓</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 pt-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={agregarMiembros}
            disabled={seleccionados.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50"
          >
            Añadir ({seleccionados.length})
          </button>
        </div>
      </div>
    </div>
  );
};
