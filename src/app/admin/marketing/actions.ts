'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function salvarTopBar(formData: FormData) {
  try {
    const texto1 = (formData.get('texto1') as string) || '';
    const texto2 = (formData.get('texto2') as string) || '';
    const texto = texto1; // retrocompatibilidade
    const visibilidade = formData.get('visibilidade') as string;
    const cor = formData.get('cor') as string || 'bg-primary';

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'marketing_topbar', valor: { texto, texto1, texto2, visibilidade, cor } },
      { onConflict: 'chave' }
    );

    if (error) return { sucesso: false, erro: 'Erro ao salvar Top Bar: ' + error.message };

    revalidatePath('/', 'layout');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Top Bar atualizado com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar alteração do Top Bar.' };
  }
}

export async function salvarBanners(formData: FormData) {
  try {
    const itemsFiltrados: Array<{ url: string; link_url: string }> = [];

    const bannersJsonStr = formData.get('banners_json') as string;
    if (bannersJsonStr) {
      try {
        const itemsExistentes = JSON.parse(bannersJsonStr);
        if (Array.isArray(itemsExistentes)) {
          itemsFiltrados.push(...itemsExistentes.map(item => ({
            url: typeof item === 'string' ? item : item.url,
            link_url: typeof item === 'string' ? '' : (item.link_url || '')
          })));
        }
      } catch (e) {}
    }

    for (let i = 0; i < 10; i++) {
      const file = formData.get(`banner_file_${i}`) as File;
      const linkUrl = (formData.get(`banner_file_link_${i}`) as string) || '';

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `banner_${Date.now()}_${i}.${ext}`;
        
        const { data } = await supabase.storage
          .from('produtos-fotos')
          .upload(`banners/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true
          });

        if (data) {
          const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`banners/${fileName}`);
          itemsFiltrados.push({
            url: pubData.publicUrl,
            link_url: linkUrl
          });
        }
      }
    }

    const urlsList = itemsFiltrados.map(b => b.url);

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'marketing_banners', valor: { items: itemsFiltrados, urls: urlsList } },
      { onConflict: 'chave' }
    );

    if (error) return { sucesso: false, erro: 'Erro ao salvar Banners: ' + error.message };

    revalidatePath('/');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Carrossel de banners e ordens salvos com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar banners.' };
  }
}

export async function salvarPopup(formData: FormData) {
  try {
    const ativo = formData.get('ativo') === 'on';
    const imagem_url_input = formData.get('imagem_url') as string;
    const link_destino = formData.get('link_destino') as string;
    const titulo = formData.get('titulo') as string;
    const subtitulo = formData.get('subtitulo') as string;
    const gatilho = formData.get('gatilho') as string || 'tempo';
    const tempo_exibicao_segundos = parseInt(formData.get('tempo_exibicao_segundos') as string || '3');
    const onde_exibir = formData.get('onde_exibir') as string || 'home';
    const frequencia = formData.get('frequencia') as string || 'uma_vez_por_sessao';

    let imagem_url = imagem_url_input;

    const popupFile = formData.get('popup_file') as File;
    if (popupFile && popupFile.size > 0) {
      const buffer = await popupFile.arrayBuffer();
      const ext = popupFile.name.split('.').pop() || 'jpg';
      const fileName = `popup_${Date.now()}.${ext}`;

      const { data } = await supabase.storage
        .from('produtos-fotos')
        .upload(`popups/${fileName}`, buffer, {
          contentType: popupFile.type,
          upsert: true
        });

      if (data) {
        const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`popups/${fileName}`);
        imagem_url = pubData.publicUrl;
      }
    }

    const payload = {
      ativo,
      imagem_url: imagem_url || '',
      link_destino: link_destino || '',
      titulo: titulo || '',
      subtitulo: subtitulo || '',
      gatilho,
      tempo_exibicao_segundos,
      onde_exibir,
      frequencia,
    };

    const { error } = await supabase.from('configuracoes').upsert(
      { chave: 'marketing_popup', valor: payload },
      { onConflict: 'chave' }
    );

    if (error) return { sucesso: false, erro: 'Erro ao salvar Pop-up: ' + error.message };

    revalidatePath('/', 'layout');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Pop-up Promocional salvo com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar Pop-up.' };
  }
}

export async function salvarEmailMarketingConfig(formData: FormData) {
  try {
    const ativo = formData.get('ativo') === 'on';
    const desconto_valor = parseFloat(formData.get('desconto_valor') as string || '10');
    const desconto_tipo = (formData.get('desconto_tipo') as string) || 'percentual';
    const validade_dias = parseInt(formData.get('validade_dias') as string || '15');
    const assunto = (formData.get('assunto') as string) || '';
    const mensagem = (formData.get('mensagem') as string) || '';
    let banner_url = (formData.get('banner_url_atual') as string) || '';

    const bannerFile = formData.get('banner_file') as File;
    if (bannerFile && bannerFile.size > 0) {
      const buffer = await bannerFile.arrayBuffer();
      const ext = bannerFile.name.split('.').pop() || 'jpg';
      const fileName = `email_banner_${Date.now()}.${ext}`;

      const { data } = await supabase.storage
        .from('produtos-fotos')
        .upload(`email-marketing/${fileName}`, buffer, {
          contentType: bannerFile.type,
          upsert: true
        });

      if (data) {
        const { data: pubData } = supabase.storage.from('produtos-fotos').getPublicUrl(`email-marketing/${fileName}`);
        banner_url = pubData.publicUrl;
      }
    }

    const payload = {
      ativo,
      desconto_valor,
      desconto_tipo,
      validade_dias,
      banner_url,
      assunto,
      mensagem
    };

    const { error } = await supabase.from('configuracoes').upsert({
      chave: 'email_pos_venda_config',
      valor: payload
    }, { onConflict: 'chave' });

    if (error) return { sucesso: false, erro: 'Erro ao salvar E-mail Marketing: ' + error.message };

    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Configurações de E-mail & Cupom salvas com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar E-mail Marketing.' };
  }
}

export async function dispararEmailTeste(formData: FormData) {
  try {
    const cliente_nome = (formData.get('cliente_nome') as string) || 'Cliente Teste';
    const cliente_email = (formData.get('cliente_email') as string) || '';
    const rawPedido = (formData.get('pedido_numero') as string) || '10842';
    const numeroPedidoFormatted = rawPedido.startsWith('#') ? rawPedido : `#${rawPedido}`;
    const numeroPedidoClean = numeroPedidoFormatted.replace('#', '');

    const { data: cfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'email_pos_venda_config').single();
    const config = cfg?.valor || { desconto_valor: 10, desconto_tipo: 'percentual', validade_dias: 15 };

    const diasValidade = Number(config.validade_dias || 15);
    const dataEnvio = new Date();
    const dataValidade = new Date(Date.now() + diasValidade * 86400 * 1000);

    const codigoCupom = `OBRIGADO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const descontoTexto = config.desconto_tipo === 'percentual' ? `${config.desconto_valor}% OFF` : `R$ ${config.desconto_valor} OFF`;

    const { data: cuponsCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'cupons_db').single();
    let listaCupons = cuponsCfg?.valor || [];

    const novoCupom = {
      id: `cupom-${Date.now()}`,
      nome_interno: `Cupom Pós-Venda (${cliente_nome})`,
      codigo: codigoCupom,
      tipo_desconto: config.desconto_tipo,
      valor_desconto: config.desconto_valor,
      data_inicio: dataEnvio.toISOString(),
      data_fim: dataValidade.toISOString(),
      ativo: true,
      usos_realizados: 0,
      limite_usos_total: 1,
      permitir_produtos_promocionais: true,
      exclusivo_email: true,
      origem: 'email_marketing',
      tipo_elegibilidade: 'todos',
      criado_em: dataEnvio.toISOString()
    };

    listaCupons.unshift(novoCupom);
    await supabase.from('configuracoes').upsert({ chave: 'cupons_db', valor: listaCupons }, { onConflict: 'chave' });

    if (!cliente_email) {
      return { sucesso: false, erro: 'Informe o e-mail do cliente para enviar o cupom de teste.' };
    }

    // ── DISPARAR O E-MAIL REALMENTE VIA RESEND ──
    const { data: resendDb } = await supabase.from('configuracoes').select('valor').eq('chave', 'resend_config').maybeSingle();
    const resendApiKey = resendDb?.valor?.api_key || process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return {
        sucesso: false,
        erro: 'Chave de E-mail Resend não cadastrada. Acesse Admin -> Configurações para cadastrar a API Key do Resend.'
      };
    }

    let emailEnviadoReal = false;
    let erroResend = '';

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Mimo Show Pet <onboarding@resend.dev>',
          to: [cliente_email],
          subject: config.assunto || 'Obrigado por sua compra na Mimo Show Pet! Ganhe desconto na próxima compra 🐾',
          html: `
            <div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; color: #1e293b;">
              <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 24px; font-weight: 900; color: #0B2545; margin: 0;">🐾 Mimo Show Pet</h1>
                  <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Agradecimento Pós-Venda Especial</p>
                </div>

                <div style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
                  <p style="font-weight: 700; font-size: 16px;">Olá, ${cliente_nome}!</p>
                  <p>${config.mensagem || 'Ficamos muito felizes em atender você e seu pet! Como forma de agradecimento, preparamos um presente exclusivo para seu próximo pedido.'}</p>
                </div>

                <!-- BLOCO DO NÚMERO DO PEDIDO & RASTREAMENTO -->
                <div style="background-color: #f1f5f9; border-radius: 18px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #cbd5e1;">
                  <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                    📦 NÚMERO DO SEU PEDIDO
                  </span>
                  <span style="font-size: 24px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 1px;">
                    ${numeroPedidoFormatted}
                  </span>
                  <p style="font-size: 12px; color: #475569; margin: 8px 0 14px 0;">
                    Você pode acompanhar o andamento da sua compra a qualquer momento em nosso site.
                  </p>
                  <a href="https://banhoetosapet.com.br/rastreamento?pedido=${numeroPedidoClean}" style="background-color: #0b2545; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 12px; display: inline-block;">
                    🔍 Rastrear / Acompanhar Pedido ${numeroPedidoFormatted}
                  </a>
                </div>

                <!-- BLOCO DO CUPOM -->
                <div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 20px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 12px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                    SEU CUPOM DE DESCONTO EXCLUSIVO (${descontoTexto})
                  </span>
                  <span style="font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 4px; color: #ea580c; display: block; margin: 10px 0;">
                    ${codigoCupom}
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: #7c2d12;">
                    ⏰ Válido por ${diasValidade} dias no site oficial.
                  </span>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="https://banhoetosapet.com.br" style="background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(249,115,22,0.3);">
                    Aproveitar Cupom Agora &rarr;
                  </a>
                </div>

                <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; text-align: center;">
                  <p style="font-size: 11px; color: #94a3b8; margin: 16px 0 0 0;">
                    Mimo Show Pet Shop • E-mail automático enviado em ${dataEnvio.toLocaleDateString('pt-BR')}.
                  </p>
                </div>

              </div>
            </div>
          `
        })
      });

      const resData = await emailRes.json();
      if (emailRes.ok) {
        emailEnviadoReal = true;
      } else {
        erroResend = resData.message || JSON.stringify(resData);
      }
    } catch (e: any) {
      erroResend = e.message || 'Erro ao conectar no servidor de e-mails Resend.';
    }

    if (!emailEnviadoReal) {
      return {
        sucesso: false,
        erro: `O cupom ${codigoCupom} foi gerado, mas o e-mail não pôde ser entregue pelo Resend: ${erroResend}`
      };
    }

    const { data: logCfg } = await supabase.from('configuracoes').select('valor').eq('chave', 'emails_enviados_log').single();
    let logLista = logCfg?.valor || [];

    const novoLog = {
      id: `log-${Date.now()}`,
      cliente_nome,
      cliente_email,
      pedido_id: numeroPedidoFormatted,
      cupom_codigo: codigoCupom,
      desconto_texto: descontoTexto,
      data_envio: dataEnvio.toISOString(),
      validade_ate: dataValidade.toISOString(),
      status: 'ENVIADO'
    };

    logLista.unshift(novoLog);
    await supabase.from('configuracoes').upsert({ chave: 'emails_enviados_log', valor: logLista }, { onConflict: 'chave' });

    revalidatePath('/admin/marketing');
    revalidatePath('/admin/cupons');
    return { sucesso: true, mensagem: `E-mail de agradecimento enviado com sucesso para ${cliente_email}! Pedido ${numeroPedidoFormatted} e Cupom ${codigoCupom} entregues.` };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao disparar e-mail de teste.' };
  }
}

export async function salvarEncontreRapido(formData: FormData) {
  try {
    const segmentosJsonStr = formData.get('segmentos_json') as string;
    let items: Array<{
      id: string;
      nome: string;
      subtitulo: string;
      link_url: string;
      imagem_url: string;
      tag?: string;
      ativo: boolean;
    }> = [];

    if (segmentosJsonStr) {
      try {
        items = JSON.parse(segmentosJsonStr);
      } catch (e) {}
    }

    // Processar uploads de fotos para cada segmento
    for (let i = 0; i < items.length; i++) {
      const file = formData.get(`foto_file_${i}`) as File;
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `segmento_${Date.now()}_${i}.${ext}`;

        const { data, error } = await supabase.storage
          .from('produtos-fotos')
          .upload(`encontre-rapido/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (data) {
          const { data: pubData } = supabase.storage
            .from('produtos-fotos')
            .getPublicUrl(`encontre-rapido/${fileName}`);
          items[i].imagem_url = pubData.publicUrl;
        }
      }
    }

    const { error } = await supabase.from('configuracoes').upsert(
      {
        chave: 'encontre_rapido_segmentos',
        valor: items,
      },
      { onConflict: 'chave' }
    );

    if (error) {
      return { sucesso: false, erro: 'Erro ao salvar Encontre Rápido: ' + error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/marketing');
    return { sucesso: true, mensagem: 'Segmentos do Encontre Rápido atualizados com sucesso!' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Erro ao processar segmentos do Encontre Rápido.' };
  }
}

