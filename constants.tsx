
import React from 'react';
import { 
  Droplets, 
  Sprout, 
  Truck, 
  Trash2, 
  LayoutGrid, 
  ArrowUpCircle, 
  Thermometer,
  ShieldCheck,
  Scissors,
  Wrench,
  Activity,
  Settings
} from 'lucide-react';
import { ProcessType } from './types';

export const PROCESS_CONFIG: Record<string, { icon: React.ReactNode; color: string; parameters: string[] }> = {
  "Visão Geral": {
    icon: <Activity className="w-5 h-5" />,
    color: "bg-aperam-orange",
    parameters: []
  },
  "Administração": {
    icon: <Settings className="w-5 h-5" />,
    color: "bg-aperam-dark",
    parameters: []
  },
  "Adubação": {
    icon: <Sprout className="w-5 h-5" />,
    color: "bg-orange-500",
    parameters: ["Adubação Minijardim", "Adubação plataformas"]
  },
  "Casa de vegetação": {
    icon: <Thermometer className="w-5 h-5" />,
    color: "bg-blue-500",
    parameters: [
      "Idade das estacas na casa (dias) (Climatização)",
      "Temperatura °C",
      "Umidade %",
      "Pontos com aspersores danificados",
      "Pedilúvio está com solução de hipoclorito",
      "Pragas e doenças",
      "Aplicação de fungicida e bactericida"
    ]
  },
  "Casa de vegetação - Sobrevivência": {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "bg-green-500",
    parameters: ["Idade da muda (dias)", "% de sobrevivência"]
  },
  "Enchimento de Bandejas - Limpeza": {
    icon: <Trash2 className="w-5 h-5" />,
    color: "bg-gray-500",
    parameters: ["Caixa de Assepsia"]
  },
  "Estaqueamento": {
    icon: <Scissors className="w-5 h-5" />,
    color: "bg-red-500",
    parameters: [
      "Estaca fora do centro",
      "Profundidade fora do padrão",
      "Plantio fora da angulação correta",
      "Estaca verde",
      "Tamanho fora do padrão",
      "Corte fora do padrão",
      "Folha aterrada"
    ]
  },
  "Expedição": {
    icon: <ArrowUpCircle className="w-5 h-5" />,
    color: "bg-orange-600",
    parameters: [
      "Altura da muda",
      "Problemas de sanidade da parte aérea",
      "Mudas com menos de 3 pares de folha",
      "Substrato sem consistência",
      "Ausência de raízes ativas",
      "Mudas não-rustificadas",
      "Mudas bifurcadas",
      "Mudas quebradas",
      "Tortuosidade < 45°",
      "Diâmetro de coleto >=2mm"
    ]
  },
  "Formar Minijardim": {
    icon: <LayoutGrid className="w-5 h-5" />,
    color: "bg-emerald-500",
    parameters: ["Qualidade das cepas", "% de sobrevivência"]
  },
  "Irrigação": {
    icon: <Droplets className="w-5 h-5" />,
    color: "bg-sky-500",
    parameters: ["Irrigação Minijardim", "Irrigação plataformas"]
  },
  "Manejo Minijardim": {
    icon: <Wrench className="w-5 h-5" />,
    color: "bg-amber-600",
    parameters: [
      "Presença de Matocompetição",
      "Presença de Doença/Pragas",
      "Tamanho das estacas despadronizadas para coleta",
      "Falha na Fertirrigação"
    ]
  },
  "Seleção de mudas - 1": {
    icon: <Sprout className="w-5 h-5" />,
    color: "bg-lime-600",
    parameters: ["Padronização de Tamanho", "Mistura de Material", "Controle de pragas e doenças"]
  },
  "Transporte de estacas/mudas - CV": {
    icon: <Truck className="w-5 h-5" />,
    color: "bg-indigo-500",
    parameters: ["% de aproveitamento"]
  }
};
