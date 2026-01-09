
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Nuevo estado para registro completo
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const { setSession, authFeedback, setAuthFeedback } = useStore();

  const handleGuestLogin = () => {
    const mockSession = {
      user: {
        id: 'guest-' + Math.random().toString(36).substr(2, 9),
        email: 'invitado@cowork.app',
        user_metadata: { full_name: 'Invitado' }
      }
    };
    setSession(mockSession);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setAuthFeedback(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`Error de Google: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthFeedback(null);

    try {
      if (isRegister) {
        // REGISTRO con Metadatos Autocompletados
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName || email.split('@')[0] },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
        } else {
          setAuthFeedback({ 
            type: 'success', 
            message: '🚀 ¡Usuario creado con éxito! Ya puedes iniciar sesión.' 
          });
          setIsRegister(false);
        }
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
      }
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (err.message === 'Email not confirmed') {
        setError('Email no confirmado. Revisa tu bandeja de entrada o contacta al administrador.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#09090b] p-4 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md my-auto glass-card rounded-[48px] p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center font-black text-5xl text-white italic shadow-2xl shadow-indigo-500/40 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">C</div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase text-white mb-2">Cowork</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Virtual Collaboration Hub</p>
        </div>

        {authFeedback && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-in slide-in-from-top-2 flex items-start gap-3 text-green-400">
            <div className="shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center font-bold text-xs">✓</div>
            <p className="text-[11px] font-bold leading-tight flex-1">{authFeedback.message}</p>
            <button onClick={() => setAuthFeedback(null)} className="opacity-50 hover:opacity-100 text-lg">×</button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-in slide-in-from-top-2">
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">!</div>
              <div className="flex-1">
                <p className="text-red-400 text-[11px] font-bold leading-tight">{error}</p>
                <button onClick={() => setShowHelp(!showHelp)} className="mt-2 text-[10px] text-red-500 underline font-black uppercase tracking-widest hover:text-red-300">
                  {showHelp ? 'Ocultar Ayuda' : '¿Problemas para entrar?'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="mb-8 p-6 bg-zinc-950 border border-indigo-500/30 rounded-3xl text-[10px] text-zinc-400 space-y-4 animate-in fade-in duration-300">
            <p className="text-indigo-400 font-black uppercase tracking-[0.2em]">⚠️ Guía de Registro:</p>
            <p>Para usar una cuenta de correo real, debes usar el modo <strong>"Crea una aquí"</strong> en la parte inferior.</p>
            <div className="space-y-2">
              <p className="font-bold text-white italic">Requisitos:</p>
              <ul className="list-disc pl-4 space-y-1 opacity-80">
                <li>Correo electrónico válido.</li>
                <li>Contraseña de al menos 6 caracteres.</li>
                <li>Confirmar el email si el sistema lo solicita.</li>
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegister && (
            <div className="relative group animate-in slide-in-from-top-2 duration-300">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                 <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input 
                type="text" 
                name="name"
                placeholder="Nombre Completo" 
                required={isRegister}
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                autoComplete="name"
                className="w-full bg-black/40 border border-white/5 rounded-[20px] pl-14 pr-5 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-zinc-700 text-white" 
              />
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
               <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input 
              type="email" 
              name="email"
              placeholder="Correo electrónico" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              autoComplete="email"
              className="w-full bg-black/40 border border-white/5 rounded-[20px] pl-14 pr-5 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-zinc-700 text-white" 
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
               <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input 
              type="password" 
              name="password"
              placeholder="Contraseña" 
              required 
              minLength={6} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full bg-black/40 border border-white/5 rounded-[20px] pl-14 pr-5 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-zinc-700 text-white" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isRegister ? 'Crear Cuenta' : 'Entrar'}
          </button>
        </form>

        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">O entrar con</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white px-4 py-4 rounded-[20px] font-black text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.312 2.688-6.832 2.688-5.4 0-9.672-4.392-9.672-9.792s4.272-9.792 9.672-9.792c3.144 0 5.384 1.248 7.128 2.896l2.304-2.304C18.592 1.304 15.856 0 12.48 0 5.864 0 0 5.304 0 12s5.864 12 12.48 12c3.752 0 6.84-1.24 9.144-3.6 2.304-2.304 3.112-5.504 3.112-8.08 0-.792-.072-1.544-.216-2.24l-12.04.08z" /></svg>
            Google
          </button>
          <button onClick={handleGuestLogin} className="flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white px-4 py-4 rounded-[20px] font-black text-[9px] uppercase tracking-widest transition-all active:scale-[0.98]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Invitado
          </button>
        </div>

        <p className="mt-10 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          {isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo por aquí?'} 
          <button onClick={() => setIsRegister(!isRegister)} className="ml-2 text-indigo-500 font-black hover:text-indigo-400 transition-colors underline decoration-2 underline-offset-4">
            {isRegister ? 'Inicia Sesión' : 'Crea una aquí'}
          </button>
        </p>
      </div>
    </div>
  );
};
