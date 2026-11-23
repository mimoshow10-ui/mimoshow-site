import { supabase } from '@/lib/supabase';
import { AnalyticsConfig } from './types';

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  gtm_id: '',
  ga4_measurement_id: '',
  clarity_project_id: '',
  ativo: true,
  debug_mode: false,
  consent_padrao: 'denied',
};

export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'analytics_config')
      .maybeSingle();

    if (error || !data?.valor) {
      return DEFAULT_ANALYTICS_CONFIG;
    }

    return {
      ...DEFAULT_ANALYTICS_CONFIG,
      ...data.valor,
    };
  } catch {
    return DEFAULT_ANALYTICS_CONFIG;
  }
}
