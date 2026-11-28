'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function salvarSenhaAdmin(formData: FormData) {
  try {
    const novaSenha = (formData.get('nova_senha_admin') as string || '').trim();
    const confirmarSenha = (formData.get('confirmar_senha_admin') as string || '').trim();

    if (!novaSenha) {
      return { sucesso: false, erro: 'Nova senha não pode ser vazia.' };
    }

    if (novaSenha.length < 6) {
      return { sucesso: false, erro: 'A senha secreta deve ter no mínimo 6 caracteres.' };
    }

    if (novaSenha !== confirmarSenha) {
      return { sucesso: false, erro: 'A nova senha e a confirmação de senha não coincidem.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'admin_config',
      valor: {
        senha: novaSenha,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar nova senha: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Senha Secreta do Sistema atualizada com sucesso! A nova senha já está em vigor.' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar nova senha.' };
  }
}

export async function salvarResendConfig(formData: FormData) {
  try {
    const apiKey = (formData.get('resend_api_key') as string || '').trim();

    if (!apiKey) {
      return { sucesso: false, erro: 'A chave API do Resend é obrigatória (ex: re_123456789).' };
    }

    if (!apiKey.startsWith('re_')) {
      return { sucesso: false, erro: 'A chave do Resend deve começar com "re_". Verifique no painel do resend.com.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'resend_config',
      valor: {
        api_key: apiKey,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar chave do Resend: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Chave API do Resend salva com sucesso! Os disparos de e-mail agora estão ativos.' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar chave do Resend.' };
  }
}

export async function salvarCredenciais(formData: FormData) {
  try {
    const rawClientId = (formData.get('client_id') as string || '').trim();
    const lojaIdBanhoTosa = (formData.get('loja_id_banho_tosa') as string || '').trim();
    const lojaIdMimoShow = (formData.get('loja_id_mimo_show') as string || '').trim();

    const envClientId = process.env.BLING_CLIENT_ID?.trim();
    const clientIdFinal = rawClientId || envClientId;

    if (!clientIdFinal) {
      return { sucesso: false, erro: 'O Client ID do Bling é obrigatório (informe no formulário ou na Vercel como BLING_CLIENT_ID).' };
    }

    if (clientIdFinal.length !== 40) {
      return { 
        sucesso: false, 
        erro: `O Client ID do Bling deve ter exatamente 40 caracteres hexadecimais (o valor inserido possui ${clientIdFinal.length} caracteres).` 
      };
    }

    // Salvar sem client_secret no banco — o Client Secret fica 100% blindado na Vercel (BLING_CLIENT_SECRET)
    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'bling_credentials',
      valor: {
        client_id: clientIdFinal,
        loja_id_banho_tosa: lojaIdBanhoTosa,
        loja_id_mimo_show: lojaIdMimoShow,
        gerenciado_via_vercel: true,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar configurações: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Configurações salvas com sucesso! O Client Secret agora é gerenciado com segurança na Vercel.' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar credenciais do Bling.' };
  }
}

export async function testarConexaoBling() {
  try {
    const { obterTokenBlingValido, renovarTokenBling, obterTokensBling, obterCredenciaisBling } = await import('@/lib/bling/blingService');

    const creds = await obterCredenciaisBling();
    if (!creds?.client_id || !creds?.client_secret) {
      return {
        sucesso: false,
        status: 'sem_credenciais',
        mensagem: 'Client ID ou Client Secret não cadastrados. Preencha e salve suas credenciais primeiro.'
      };
    }

    const tokens = await obterTokensBling();
    if (!tokens?.access_token && !tokens?.refresh_token) {
      return {
        sucesso: false,
        status: 'desconectado',
        mensagem: 'Nenhum token encontrado. Clique no botão "🔐 Reconectar / Autorizar Bling" para autenticar sua conta.'
      };
    }

    const tokenValido = await obterTokenBlingValido();
    if (!tokenValido) {
      return {
        sucesso: false,
        status: 'erro_token',
        mensagem: 'Não foi possível validar nem renovar o token do Bling. O token de autorização pode ter expirado ou as credenciais foram alteradas. Por favor, clique em "🔐 Reconectar / Autorizar Bling".'
      };
    }

    // Testar chamada real na API v3 do Bling
    const testRes = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas?limite=1', {
      headers: {
        'Authorization': `Bearer ${tokenValido}`,
        'Accept': 'application/json'
      }
    });

    if (testRes.ok) {
      return {
        sucesso: true,
        status: 'conectado',
        mensagem: 'Conexão ativa e validada! O Bling ERP respondeu com sucesso (HTTP 200 OK).'
      };
    }

    if (testRes.status === 401) {
      // Tentar renovação forçada
      const renova = await renovarTokenBling();
      if (renova.sucesso && renova.access_token) {
        return {
          sucesso: true,
          status: 'conectado',
          mensagem: 'Token expirado foi renovado com sucesso! A conexão com o Bling está ativa e restabelecida.'
        };
      }
      return {
        sucesso: false,
        status: 'token_invalido',
        mensagem: `O Bling rejeitou o token (HTTP 401) e a renovação falhou: ${renova.erro}. É necessário reconectar a autorização.`
      };
    }

    const errData = await testRes.json().catch(() => ({}));
    return {
      sucesso: false,
      status: 'erro_api',
      mensagem: `Bling retornou HTTP ${testRes.status}: ${errData?.error?.message || errData?.error?.description || 'Erro na requisição.'}`
    };
  } catch (err: any) {
    return {
      sucesso: false,
      status: 'erro_fatal',
      mensagem: `Exceção ao testar conexão: ${err.message || 'Erro inesperado.'}`
    };
  }
}

export async function salvarMercadoPago(formData: FormData) {
  try {
    const rawAccessToken = (formData.get('mp_access_token') as string || '').trim();
    const publicKey = (formData.get('mp_public_key') as string || '').trim();

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'mercadopago_config',
      valor: {
        ...(rawAccessToken ? { access_token: rawAccessToken } : {}),
        public_key: publicKey,
        gerenciado_via_vercel: !rawAccessToken,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar Mercado Pago: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { 
      sucesso: true, 
      mensagem: rawAccessToken 
        ? 'Credenciais salvas com sucesso!' 
        : 'Configurações salvas! O Access Token do Mercado Pago está 100% blindado na Vercel.' 
    };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar Mercado Pago.' };
  }
}

export async function salvarFreteConfig(formData: FormData) {
  try {
    const cep_origem = (formData.get('cep_origem') as string || '').trim();
    const token_frete = (formData.get('token_frete') as string || '').trim();
    const usar_correios = formData.get('usar_correios') === 'on';
    const usar_transportadoras = formData.get('usar_transportadoras') === 'on';
    const usar_retirada = formData.get('usar_retirada') === 'on';

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'frete_config',
      valor: {
        cep_origem,
        token_frete,
        usar_correios,
        usar_transportadoras,
        usar_retirada,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar frete: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Configurações de Logística e Frete salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar frete.' };
  }
}

export async function salvarAnalyticsConfig(formData: FormData) {
  try {
    let rawGtm = (formData.get('gtm_id') as string || '').trim();
    let rawGa4 = (formData.get('ga4_measurement_id') as string || '').trim();
    let rawClarity = (formData.get('clarity_project_id') as string || '').trim();

    // Auto-extração inteligente caso o usuário cole a tag <script> inteira ou URL
    const gtmMatch = rawGtm.match(/GTM-[A-Z0-9]+/i) || rawGa4.match(/GTM-[A-Z0-9]+/i);
    const ga4Match = rawGa4.match(/G-[A-Z0-9]+/i) || rawGtm.match(/G-[A-Z0-9]+/i);
    const clarityMatch = rawClarity.match(/clarity\.ms\/tag\/([a-z0-9]+)/i) || rawClarity.match(/^[a-z0-9]{8,12}$/i);

    const gtm_id = gtmMatch ? gtmMatch[0].toUpperCase() : (rawGtm.startsWith('<') ? '' : rawGtm);
    const ga4_measurement_id = ga4Match ? ga4Match[0].toUpperCase() : (rawGa4.startsWith('<') ? '' : rawGa4);
    const clarity_project_id = clarityMatch ? (clarityMatch[1] || clarityMatch[0]).toLowerCase() : (rawClarity.startsWith('<') ? '' : rawClarity);

    const ativo = formData.get('ativo') === 'on';
    const debug_mode = formData.get('debug_mode') === 'on';

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'analytics_config',
      valor: {
        gtm_id,
        ga4_measurement_id,
        clarity_project_id,
        ativo,
        debug_mode,
        consent_padrao: 'denied',
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar configurações de Analytics: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    revalidatePath('/admin/analytics');
    revalidatePath('/');
    return { sucesso: true, mensagem: 'Configurações de Analytics salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar configurações de Analytics.' };
  }
}

