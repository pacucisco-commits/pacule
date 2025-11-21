
import { AppStep } from './types';

export const STEPS = [
  { id: AppStep.IMPORT, name: '1. Importar Produto', description: 'Cole a URL do produto' },
  { id: AppStep.CREATIVES, name: '2. Gerar Criativos', description: 'Crie vídeos e imagens com IA' },
  { id: AppStep.SALES_PAGE, name: '3. Criar Página', description: 'Gere uma página de vendas' },
];

export const DEFAULT_MARGIN = 150; // 150% markup
