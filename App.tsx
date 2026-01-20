import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell,
  Legend
} from 'recharts';
import { 
  Menu,
  X,
  TrendingUp,
  RefreshCw,
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Upload,
  Link as LinkIcon,
  Database,
  Info
} from 'lucide-react';
import { ProcessType, EvaluationRecord } from './types';
import { PROCESS_CONFIG } from './constants';

const COMPLIANCE_THRESHOLD = 90;

const App: React.FC = () => {
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [selectedProcess, setSelectedProcess] = useState<ProcessType>("Visão Geral");
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("Todos");
  const [selectedWeek, setSelectedWeek] = useState<string>("Todas");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Persistência do ID da Planilha
  const [sheetId, setSheetId] = useState<string>(() => localStorage.getItem('aperam_sheet_id') || '');

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 45;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setIsSplashActive(false), 600);
      }
      setLoadProgress(progress);
    }, 120);

    if (sheetId) {
      syncWithGoogleSheets(sheetId);
    } else {
      generateMockData();
    }
  }, []);

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const processWorkbook = (wb: any) => {
    const allNewRecords: EvaluationRecord[] = [];
    wb.SheetNames.forEach((sheetName: string) => {
      const procMatch = (Object.keys(PROCESS_CONFIG) as ProcessType[]).find(p => 
        sheetName.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(sheetName.toLowerCase())
      );
      if (procMatch && procMatch !== "Visão Geral" && procMatch !== "Administração") {
        // @ts-ignore
        const ws = wb.Sheets[sheetName];
        // @ts-ignore
        const data = XLSX.utils.sheet_to_json(ws);
        data.forEach((row: any) => {
          const rowDate = row['Data'] || row['DATA'] || new Date().toISOString();
          const dateObj = typeof rowDate === 'number' ? new Date((rowDate - (25567 + 1)) * 86400 * 1000) : new Date(rowDate);
          PROCESS_CONFIG[procMatch].parameters.forEach(param => {
            if (row[param] !== undefined) {
              allNewRecords.push({
                date: dateObj.toISOString().split('T')[0],
                month: dateObj.getMonth() + 1,
                week: getWeekNumber(dateObj),
                process: procMatch,
                parameter: param,
                value: parseFloat(row[param]),
                unit: param.includes("%") ? "%" : "pts"
              });
            }
          });
        });
      }
    });
    if (allNewRecords.length > 0) setRecords(allNewRecords);
  };

  const syncWithGoogleSheets = async (targetId: string) => {
    if (!targetId) return;
    setIsSyncing(true);
    try {
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${targetId}/export?format=xlsx`)}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        // @ts-ignore
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        processWorkbook(wb);
        setIsSyncing(false);
      };
      reader.readAsBinaryString(blob);
    } catch (error) {
      console.error("Erro na sincronização:", error);
      setIsSyncing(false);
    }
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      // @ts-ignore
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      processWorkbook(wb);
      setIsSyncing(false);
      setSelectedProcess("Visão Geral");
    };
    reader.readAsBinaryString(file);
  };

  const generateMockData = () => {
    const mockData: EvaluationRecord[] = [];
    const processes = Object.keys(PROCESS_CONFIG).filter(p => p !== "Visão Geral" && p !== "Administração") as ProcessType[];
    processes.forEach(proc => {
      PROCESS_CONFIG[proc].parameters.forEach(param => {
        for (let i = 0; i < 20; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockData.push({
            date: date.toISOString().split('T')[0],
            month: date.getMonth() + 1,
            week: getWeekNumber(date),
            process: proc,
            parameter: param,
            value: Math.floor(Math.random() * 25) + 75,
            unit: param.includes("%") ? "%" : "pts"
          });
        }
      });
    });
    setRecords(mockData);
  };

  const saveSheetId = () => {
    localStorage.setItem('aperam_sheet_id', sheetId);
    syncWithGoogleSheets(sheetId);
  };

  const filteredRecords = records.filter(r => {
    const matchMonth = selectedMonth === "Todos" || r.month === parseInt(selectedMonth);
    const matchWeek = selectedWeek === "Todas" || r.week === parseInt(selectedWeek);
    return matchMonth && matchWeek;
  });

  const getAverageForProcess = (proc: ProcessType) => {
    const data = filteredRecords.filter(r => r.process === proc);
    if (data.length === 0) return 0;
    return parseFloat((data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(1));
  };

  const getAverageForParam = (param: string) => {
    const data = filteredRecords.filter(r => r.parameter === param && r.process === selectedProcess);
    if (data.length === 0) return 0;
    return parseFloat((data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(1));
  };

  const globalAverage = (() => {
    const processes = Object.keys(PROCESS_CONFIG).filter(p => p !== "Visão Geral" && p !== "Administração") as ProcessType[];
    const avgs = processes.map(p => getAverageForProcess(p)).filter(v => v > 0);
    if (avgs.length === 0) return 0;
    return parseFloat((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1));
  })();

  const getStatusColor = (v: number) => v >= COMPLIANCE_THRESHOLD ? 'text-aperam-green' : 'text-aperam-red';
  const getStatusBg = (v: number) => v >= COMPLIANCE_THRESHOLD ? 'bg-aperam-green' : 'bg-aperam-red';

  if (isSplashActive) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[1000] p-10 overflow-hidden">
        <div className="relative mb-16 flex flex-col items-center animate-float">
          <img 
            src="https://www.aperam.com/wp-content/uploads/2021/04/aperam-logo-retina.png" 
            alt="Aperam Logo" 
            className="w-80 h-auto brightness-110 drop-shadow-[0_0_40px_rgba(239,130,70,0.15)]"
          />
        </div>
        <div className="w-full max-w-xs bg-white/5 h-1.5 rounded-full overflow-hidden mb-6 border border-white/5">
           <div 
             className="h-full bg-gradient-to-r from-aperam-orange to-aperam-orange/50 transition-all duration-300 ease-out" 
             style={{ width: `${loadProgress}%` }} 
           />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">
          Carregando Ecossistema Aperam
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden text-slate-900 font-sans">
      {/* Sidebar - Black Premium */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-aperam-black text-white transition-all duration-500 ease-in-out flex flex-col shadow-heavy z-50`}>
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-aperam-orange rounded-xl flex items-center justify-center font-extrabold text-xl shadow-lg ring-4 ring-aperam-orange/10">A</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tighter uppercase leading-none">APERAM</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-aperam-orange uppercase opacity-90">Bioenergia</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95">
            {isSidebarOpen ? <X size={20} className="text-slate-400" /> : <Menu size={20} className="text-aperam-orange" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide py-6">
          {(Object.keys(PROCESS_CONFIG) as ProcessType[]).map((proc) => {
            const isActive = selectedProcess === proc;
            const isSpecial = proc === "Visão Geral" || proc === "Administração";
            return (
              <button
                key={proc}
                onClick={() => setSelectedProcess(proc)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                  ? 'bg-aperam-orange text-white shadow-xl shadow-aperam-orange/20 translate-x-1' 
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-white' : isSpecial ? (proc === "Visão Geral" ? 'text-aperam-purple1' : 'text-slate-500') : 'text-aperam-orange'} group-hover:scale-110 transition-transform`}>
                  {PROCESS_CONFIG[proc].icon}
                </div>
                {isSidebarOpen && <span className="text-[11px] font-extrabold text-left truncate flex-1 uppercase tracking-tight leading-tight">{proc}</span>}
                {isSidebarOpen && isActive && <ChevronRight size={14} className="opacity-60" />}
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-aperam-orange' : 'text-slate-500'} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pronto para Uso</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Superior Header */}
        <header className="bg-white px-10 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-soft z-40 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className={`p-3.5 ${selectedProcess === "Visão Geral" ? 'bg-aperam-dark' : selectedProcess === "Administração" ? 'bg-slate-800' : 'bg-aperam-black'} rounded-2xl text-aperam-orange shadow-lg`}>
              {PROCESS_CONFIG[selectedProcess].icon}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tighter text-slate-900 uppercase leading-none">{selectedProcess}</h1>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1.5">Viveiro Aperam • Gestão Inteligente</p>
            </div>
          </div>

          {/* Time Filters */}
          {selectedProcess !== "Administração" && (
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
               <div className="flex items-center gap-2 px-3 group">
                  <Calendar size={14} className="text-slate-400 group-hover:text-aperam-orange transition-colors" />
                  <select 
                    className="bg-transparent text-[10px] font-extrabold uppercase text-slate-600 outline-none cursor-pointer py-2 pr-4"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                     <option value="Todos">Mês: Todos</option>
                     {Array.from({length: 12}).map((_, i) => (
                       <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'}).toUpperCase()}</option>
                     ))}
                  </select>
               </div>
               <div className="w-px h-6 bg-slate-200" />
               <div className="flex items-center gap-2 px-3 group">
                  <Layers size={14} className="text-slate-400 group-hover:text-aperam-orange transition-colors" />
                  <select 
                    className="bg-transparent text-[10px] font-extrabold uppercase text-slate-600 outline-none cursor-pointer py-2 pr-4"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                  >
                     <option value="Todas">Semana: Todas</option>
                     {Array.from(new Set(records.map(r => r.week))).sort((a,b) => a-b).map(w => (
                       <option key={w} value={w}>SEMANA {w}</option>
                     ))}
                  </select>
               </div>
            </div>
          )}
        </header>

        {/* Dash Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#F8FAFC]">
          
          {selectedProcess === "Administração" ? (
            /* ABA ADMINISTRADOR */
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <section className="bg-white p-12 rounded-[50px] shadow-soft border border-slate-100 space-y-10">
                  <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
                     <div className="w-20 h-20 bg-aperam-black rounded-[28px] flex items-center justify-center text-aperam-orange shadow-xl">
                        <Database size={36} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-extrabold tracking-tighter text-slate-900 uppercase">Configuração de Dados</h2>
                        <p className="text-slate-400 text-sm font-medium">Gerencie a conexão com o Google Sheets ou faça upload local.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {/* Google Sheets Sync */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-slate-900">
                           <LinkIcon size={20} className="text-aperam-orange" />
                           <h3 className="font-extrabold uppercase text-sm tracking-tight">Sincronização Cloud</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                           Insira o ID da sua planilha Google (ID que fica na URL entre /d/ e /edit). 
                           Certifique-se que ela esteja compartilhada como <strong>"Qualquer pessoa com o link"</strong>.
                        </p>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              placeholder="ID da Planilha..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-aperam-orange/20 outline-none transition-all"
                              value={sheetId}
                              onChange={(e) => setSheetId(e.target.value)}
                           />
                           <button 
                              onClick={saveSheetId}
                              className="bg-aperam-black text-white px-6 rounded-2xl font-bold text-xs uppercase hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                           >
                              Salvar
                           </button>
                        </div>
                     </div>

                     {/* Local Upload */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-slate-900">
                           <Upload size={20} className="text-aperam-orange" />
                           <h3 className="font-extrabold uppercase text-sm tracking-tight">Upload Manual</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                           Prefere não usar o Google Sheets? Suba o arquivo .xlsx diretamente do seu computador para processar as 11 abas agora.
                        </p>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[30px] bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-aperam-orange/50 transition-all group">
                           <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-slate-300 group-hover:text-aperam-orange transition-colors" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecionar Planilha .xlsx</p>
                           </div>
                           <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleLocalUpload} />
                        </label>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[35px] border border-slate-100 flex items-start gap-5">
                     <div className="p-3 bg-white rounded-2xl text-aperam-purple1 shadow-sm"><Info size={24} /></div>
                     <div className="space-y-2">
                        <h4 className="font-extrabold text-slate-900 uppercase text-xs">Instruções de Formatação</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                           O sistema procura por abas que contenham os nomes dos processos (ex: "Adubação"). 
                           Cada aba deve ter uma coluna <strong>"Data"</strong> e colunas com os nomes dos parâmetros técnicos definidos no viveiro. 
                           O formato esperado é numérico (0 a 100).
                        </p>
                     </div>
                  </div>
               </section>
            </div>
          ) : selectedProcess === "Visão Geral" ? (
            /* VISÃO GERAL */
            <div className="space-y-10 animate-in fade-in duration-1000">
               <section className="bg-aperam-black text-white p-14 rounded-[50px] shadow-heavy relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <TrendingUp size={600} strokeWidth={1} />
                  </div>
                  
                  <div className="relative z-10 space-y-6 lg:text-left text-center">
                     <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 rounded-full border border-white/10 text-aperam-orange font-bold text-[10px] uppercase tracking-[0.3em]">
                        <Award size={18} /> Performance Bioenergia
                     </div>
                     <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter uppercase leading-[0.85]">Status Global <br/><span className="text-white/30">Viveiro</span></h2>
                     <p className="text-slate-500 max-w-md text-sm leading-relaxed font-medium">Métricas consolidadas de conformidade para as avaliações do viveiro florestal.</p>
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-6">
                     <div className="bg-white/[0.02] border border-white/10 p-12 rounded-[55px] flex flex-col items-center backdrop-blur-xl shadow-2xl transition-transform duration-500 hover:scale-105">
                        <div className={`text-[120px] font-extrabold tracking-tighter leading-none ${getStatusColor(globalAverage)} drop-shadow-sm`}>
                           {globalAverage}%
                        </div>
                        <div className="text-[10px] font-bold uppercase text-slate-500 mt-4 tracking-[0.5em]">Consolidação Geral</div>
                     </div>
                     <div className={`flex items-center gap-3 px-8 py-3 rounded-full font-extrabold uppercase text-[11px] tracking-widest shadow-xl border ${globalAverage >= COMPLIANCE_THRESHOLD ? 'bg-aperam-green/20 text-aperam-green border-aperam-green/20' : 'bg-aperam-red/20 text-aperam-red border-aperam-red/20'}`}>
                        {globalAverage >= COMPLIANCE_THRESHOLD ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {globalAverage >= COMPLIANCE_THRESHOLD ? 'CONFORME' : 'NÃO CONFORME'}
                     </div>
                  </div>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {Object.keys(PROCESS_CONFIG).filter(p => p !== "Visão Geral" && p !== "Administração").map((proc) => {
                    const avg = getAverageForProcess(proc as ProcessType);
                    const isCompliant = avg >= COMPLIANCE_THRESHOLD;
                    return (
                      <div 
                        key={proc} 
                        onClick={() => setSelectedProcess(proc as ProcessType)}
                        className="bg-white p-9 rounded-[45px] border border-slate-100 shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                      >
                         <div className="flex justify-between items-start mb-8">
                            <div className="p-3.5 bg-slate-50 rounded-2xl text-aperam-black group-hover:bg-aperam-black group-hover:text-aperam-orange transition-all duration-300">
                               {PROCESS_CONFIG[proc].icon}
                            </div>
                            <div className={`text-4xl font-extrabold tracking-tighter ${getStatusColor(avg)}`}>{avg}%</div>
                         </div>
                         <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5 group-hover:text-slate-900 transition-colors line-clamp-1">{proc}</h4>
                         <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <div className={`h-full rounded-full transition-all duration-1000 ${getStatusBg(avg)}`} style={{ width: `${avg}%` }} />
                         </div>
                         <div className={`mt-5 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest ${getStatusColor(avg)}`}>
                            <span>{isCompliant ? 'CONFORME' : 'NÃO CONFORME'}</span>
                            {isCompliant ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                         </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : (
            /* DETALHE POR PROCESSO */
            <div className="space-y-10 animate-in fade-in duration-700">
               <section className="bg-white p-12 rounded-[55px] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-12 group">
                  <div className="flex items-center gap-10">
                     <div className="w-28 h-28 bg-aperam-black rounded-[40px] flex items-center justify-center text-aperam-orange shadow-2xl transition-transform group-hover:rotate-3 duration-500">
                        {React.cloneElement(PROCESS_CONFIG[selectedProcess].icon as React.ReactElement<any>, { size: 52 })}
                     </div>
                     <div>
                        <h2 className="text-4xl font-extrabold tracking-tighter uppercase leading-none mb-4 text-slate-900">{selectedProcess}</h2>
                        <div className="flex items-center gap-4">
                           <div className={`px-6 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-white shadow-xl ${getStatusBg(getAverageForProcess(selectedProcess))}`}>
                              {getAverageForProcess(selectedProcess)}% • {getAverageForProcess(selectedProcess) >= COMPLIANCE_THRESHOLD ? 'CONFORME' : 'NÃO CONFORME'}
                           </div>
                           <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.25em]">{filteredRecords.filter(r => r.process === selectedProcess).length} AMOSTRAGENS</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-10 bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-inner">
                     <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">META VIVEIRO</div>
                        <div className="text-3xl font-extrabold text-aperam-green">90.0%</div>
                     </div>
                     <div className="w-px h-16 bg-slate-200" />
                     <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">DÉFICIT TÉCNICO</div>
                        <div className={`text-3xl font-extrabold ${getAverageForProcess(selectedProcess) >= COMPLIANCE_THRESHOLD ? 'text-aperam-green' : 'text-aperam-red'}`}>
                           {/* Fix: Explicitly casting operands to Number to resolve arithmetic type errors on line 313 (likely mismatch between literal type and functional return) */}
                           {(Number(COMPLIANCE_THRESHOLD) - Number(getAverageForProcess(selectedProcess))).toFixed(1)}%
                        </div>
                     </div>
                  </div>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {PROCESS_CONFIG[selectedProcess].parameters.map(param => {
                    const avg = getAverageForParam(param);
                    return (
                      <div key={param} className="bg-white p-9 rounded-[45px] border border-slate-100 shadow-soft hover:shadow-2xl transition-all group overflow-hidden relative">
                         <div className={`absolute top-0 left-0 w-full h-1.5 ${getStatusBg(avg)} opacity-10 group-hover:opacity-100 transition-opacity`}></div>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-5 leading-snug group-hover:text-slate-900 transition-colors">{param}</p>
                         <div className="flex items-baseline gap-2 mb-6">
                            <span className={`text-5xl font-extrabold tracking-tighter ${getStatusColor(avg)}`}>{avg}</span>
                            <span className="text-slate-400 text-sm font-bold">%</span>
                         </div>
                         <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <div className={`h-full rounded-full transition-all duration-1000 ${getStatusBg(avg)}`} style={{ width: `${avg}%` }} />
                         </div>
                      </div>
                    );
                  })}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-soft relative overflow-hidden group">
                    <h3 className="font-extrabold text-slate-900 mb-14 flex items-center gap-4 uppercase tracking-tight text-lg">
                      <div className="w-2.5 h-10 bg-aperam-orange rounded-full shadow-lg" /> Linha de Tendência
                    </h3>
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredRecords.filter(r => r.process === selectedProcess).reduce((acc: any[], curr) => {
                          const existing = acc.find(a => a.date === curr.date);
                          if (existing) existing[curr.parameter] = curr.value;
                          else acc.push({ date: curr.date, [curr.parameter]: curr.value });
                          return acc;
                        }, []).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v => v.split('-').reverse().slice(0,2).join('/')} />
                          <YAxis stroke="#94A3B8" fontSize={9} axisLine={false} tickLine={false} domain={[0, 105]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }} 
                            labelStyle={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', marginBottom: '10px', color: '#0f172a' }}
                          />
                          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '45px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase'}} />
                          {PROCESS_CONFIG[selectedProcess].parameters.map((p, i) => (
                            <Line 
                                key={p} 
                                type="monotone" 
                                dataKey={p} 
                                stroke={['#ef8246', '#0f172a', '#761d62', '#c179a4', '#943b80'][i % 5]} 
                                strokeWidth={5} 
                                dot={{r: 5, fill: '#fff', strokeWidth: 3}} 
                                activeDot={{r: 9, strokeWidth: 0}} 
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-soft relative overflow-hidden group">
                    <h3 className="font-extrabold text-slate-900 mb-14 flex items-center gap-4 uppercase tracking-tight text-lg">
                      <div className="w-2.5 h-10 bg-aperam-black rounded-full shadow-lg" /> Desempenho por Parâmetro
                    </h3>
                    <div className="h-[380px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={PROCESS_CONFIG[selectedProcess].parameters.map(p => ({ name: p, value: getAverageForParam(p) }))} margin={{ left: 20 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={140} fontSize={9} axisLine={false} tickLine={false} tick={{fontWeight: '700', fill: '#64748b'}} />
                          <Tooltip cursor={{fill: '#f8fafc', radius: 20}} />
                          <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={20}>
                            {PROCESS_CONFIG[selectedProcess].parameters.map((_, i) => {
                               const avgValue = getAverageForParam(PROCESS_CONFIG[selectedProcess].parameters[i]);
                               return <Cell key={i} fill={avgValue >= COMPLIANCE_THRESHOLD ? '#10b981' : '#ef4444'} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;