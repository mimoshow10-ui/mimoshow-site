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
    const clientId = formData.get('client_id') as string;
    const clientSecret = formData.get('client_secret') as string;
    const lojaIdBanhoTosa = (formData.get('loja_id_banho_tosa') as string || '').trim();
    const lojaIdMimoShow = (formData.get('loja_id_mimo_show') as string || '').trim();

    if (!clientId || !clientSecret) {
      return { sucesso: false, erro: 'Client ID e Client Secret são obrigatórios.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'bling_credentials',
      valor: {
        client_id: clientId,
        client_secret: clientSecret,
        loja_id_banho_tosa: lojaIdBanhoTosa,
        loja_id_mimo_show: lojaIdMimoShow
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar credenciais: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Credenciais e IDs de Loja do Bling salvos com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao salvar credenciais do Bling.' };
  }
}

export async function salvarMercadoPago(formData: FormData) {
  try {
    const accessToken = (formData.get('mp_access_token') as string || '').trim();
    const publicKey = (formData.get('mp_public_key') as string || '').trim();

    if (!accessToken) {
      return { sucesso: false, erro: 'Access Token do Mercado Pago é obrigatório.' };
    }

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'mercadopago_config',
      valor: {
        access_token: accessToken,
        public_key: publicKey,
        atualizado_em: new Date().toISOString()
      }
    }, { onConflict: 'chave' });

    if (error) {
      return { sucesso: false, erro: `Erro ao salvar Mercado Pago: ${error.message}` };
    }

    revalidatePath('/admin/configuracoes');
    return { sucesso: true, mensagem: 'Credenciais do Mercado Pago salvas com sucesso!' };
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

