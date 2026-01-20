
export type ProcessType = 
  | "Visão Geral"
  | "Administração"
  | "Adubação"
  | "Casa de vegetação"
  | "Casa de vegetação - Sobrevivência"
  | "Enchimento de Bandejas - Limpeza"
  | "Estaqueamento"
  | "Expedição"
  | "Formar Minijardim"
  | "Irrigação"
  | "Manejo Minijardim"
  | "Seleção de mudas - 1"
  | "Transporte de estacas/mudas - CV";

export interface EvaluationRecord {
  date: string;
  month: number;
  week: number;
  process: ProcessType;
  parameter: string;
  value: number;
  unit: string;
}
