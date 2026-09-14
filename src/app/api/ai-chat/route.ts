import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { pergunta, produto } = await req.json();

    if (!pergunta || !produto) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Puxar treinamento da IA salvo no banco (Painel Admin)
    const { data: config } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'treinamento_ia')
      .maybeSingle();

    const treinamento = config?.valor || {};
    const instrucoes = treinamento.instrucoes || 'Somos a MIMO Show. Responda sempre de forma gentil, prestativa e altamente específica sobre a dúvida exata do cliente.';
    const faq = treinamento.faq || '';
    const apiKey = (treinamento.api_key || process.env.OPENAI_API_KEY || '').trim();
    const geminiKey = (treinamento.gemini_key || process.env.GEMINI_API_KEY || '').trim();

    const q = pergunta.toLowerCase().trim();
    const nome = produto.nome || 'Produto';
    const descClean = (produto.descricao_curta || produto.descricao || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    
    const precoOriginal = Number(produto.preco || 0);
    const precoPromoVal = produto.preco_promocional ? Number(produto.preco_promocional) : null;
    const temPromo = precoPromoVal !== null && precoPromoVal > 0 && precoPromoVal < precoOriginal;
    const precoAtual = temPromo ? precoPromoVal : precoOriginal;
    const precoStr = `R$ ${precoAtual.toFixed(2).replace('.', ',')}`;
    const precoDeStr = temPromo ? `R$ ${precoOriginal.toFixed(2).replace('.', ',')}` : '';
    const estoqueNum = Number(produto.estoque || 0);
    const tamanhosArr = Array.isArray(produto.tamanhos) ? produto.tamanhos.join(', ') : '';

    const promptSystem = `${instrucoes}

Contexto das Diretrizes & FAQ da Loja:
${faq}

Dados Exatos do Produto Exibido na Tela:
- Nome: ${nome}
- Preço Atual: ${precoStr}${temPromo ? ` (Em promoção de De ${precoDeStr} por ${precoStr})` : ''}
- Estoque: ${estoqueNum > 0 ? `${estoqueNum} unidades` : 'Disponível'}
- Tamanhos: ${tamanhosArr || 'Conforme variação'}
- Descrição Completa: ${descClean || 'Produto próprio para estética pet.'}

REGRAS ESTREITAS DE RESPOSTA:
1. Responda OBRIGATORIAMENTE à pergunta EXATA do cliente ("${pergunta}"). Se a pergunta for sobre cor, responda sobre cor. Se for sobre frete, sobre frete. Se for sobre nota fiscal, sobre nota fiscal.
2. Não ignore o que o cliente perguntou e não dê respostas genéricas de vendas se ele perguntou algo técnico específico.
3. Máximo de 2 a 3 frases objetivas, educadas e claras.`;

    // 1. Tentar OpenAI se houver chave configurada
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: promptSystem },
              { role: 'user', content: pergunta }
            ],
            max_tokens: 220,
            temperature: 0.4
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) return NextResponse.json({ resposta: text });
        }
      } catch (err) {
        console.error('[AI CHAT API] Erro OpenAI:', err);
      }
    }

    // 2. Tentar Google Gemini se houver chave configurada
    if (geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptSystem },
                  { text: `Dúvida do cliente: ${pergunta}` }
                ]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return NextResponse.json({ resposta: text });
        }
      } catch (err) {
        console.error('[AI CHAT API] Erro Gemini:', err);
      }
    }

    // 3. Motor de Inteligência Local com Cobertura Completa de Perguntas
    const resposta = extrairRespostaEspecífica(pergunta, q, nome, descClean, precoStr, precoDeStr, temPromo, estoqueNum, tamanhosArr, faq);

    return NextResponse.json({ resposta });
  } catch (e: any) {
    return NextResponse.json({ resposta: 'Nosso assistente de IA está pronto para tirar suas dúvidas! Digite sua pergunta sobre o produto.' });
  }
}

function extrairRespostaEspecífica(
  perguntaOriginal: string,
  q: string,
  nome: string,
  descClean: string,
  precoStr: string,
  precoDeStr: string,
  temPromo: boolean,
  estoqueNum: number,
  tamanhosArr: string,
  faq: string
): string {
  // ── 0. SAUDAÇÕES, AGRADECIMENTOS E APRESENTAÇÃO ──
  const saudacoes = ['oi', 'olá', 'ola', 'oie', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'opa', 'salve', 'alô', 'alo', 'ajuda', 'socorro'];
  if (saudacoes.some(s => q === s || q.startsWith(s + ' ') || q.endsWith(' ' + s))) {
    return `Olá! Sou o assistente da MIMO Show. Como posso te ajudar com o "${nome}" hoje? Pode me perguntar sobre prazo de entrega, material, quantidade ou como aplicar! 🐾`;
  }

  const agradecimentos = ['obrigado', 'obrigada', 'valeu', 'vlw', 'obg', 'valew', 'show', 'ok', 'perfeito', 'tks', 'muito obrigado', 'muito obrigada'];
  if (agradecimentos.some(a => q.includes(a))) {
    return `Por nada! Se precisar de qualquer outra informação sobre o "${nome}", estou à disposição. Boas compras! 🐾`;
  }

  if (q.includes('quem é') || q.includes('quem e') || q.includes('robô') || q.includes('robo') || q.includes('bot') || q.includes('ia')) {
    return `Sou o assistente virtual da MIMO Show, especializado em tirar dúvidas sobre o produto "${nome}"! Como posso te ajudar? ✨`;
  }

  // ── 1. FAQ CADASTRADO NO ADMIN (com filtro de Palavras de Parada & Palavra Inteira) ──
  if (faq) {
    const STOP_WORDS = new Set(['qual', 'como', 'onde', 'quando', 'quanto', 'quais', 'para', 'com', 'tem', 'nos', 'das', 'dos', 'por', 'que', 'tipo', 'serve', 'este', 'esse', 'essa']);
    const blocos = faq.split(/\n\s*\n/);
    for (const bloco of blocos) {
      const linhas = bloco.split('\n').map(l => l.trim()).filter(Boolean);
      const linhaPergunta = linhas.find(l => l.toLowerCase().startsWith('p:') || l.toLowerCase().includes('?'));
      const linhaResposta = linhas.find(l => l.toLowerCase().startsWith('r:'));

      if (linhaPergunta && linhaResposta) {
        const pTexto = linhaPergunta.replace(/^p:\s*/i, '').toLowerCase();
        const rTexto = linhaResposta.replace(/^r:\s*/i, '');
        const palavrasChave = pTexto
          .split(/[^\wáéíóúâêôãõç]+/i)
          .map(w => w.toLowerCase())
          .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        
        // Verifica se a pergunta do cliente contiver a palavra INTEIRA (usando regex \\b)
        const bateu = palavrasChave.some(p => new RegExp(`\\b${p}\\b`, 'i').test(q));
        if (bateu) {
          return rTexto;
        }
      }
    }
  }

  // ── 2. EXTRAÇÃO DE ATRIBUTOS ESPECÍFICOS DO PRODUTO ──
  const qtdMatch = (nome + ' ' + descClean).match(/(?:kit|pct|pacote|jogo)?\s*(?:c\/|com)?\s*(\d+)\s*(?:unidades|unidade|un|peças|pcs|laços|gravatas|adesivos|pares|par)?/i);
  const quantidade = qtdMatch ? qtdMatch[1] : null;

  const matMatch = (nome + ' ' + descClean).match(/(eva glitter|eva|cetim|feltro|silicone|algodão|tecido|pelúcia|couro|nylon)/i);
  const material = matMatch ? matMatch[1].toUpperCase() : null;

  const fixMatch = (nome + ' ' + descClean).match(/(adesivo|autocolante|elástico|elastico|anilha|fita de cetim|fita|presilha|tic-tac|velcro)/i);
  const fixacao = fixMatch ? fixMatch[1].toLowerCase() : null;

  const coresEncontradas = (nome + ' ' + descClean).match(/(azul|rosa|vermelho|amarelo|verde|roxo|preto|branco|dourado|prata|colorido|sortido)/gi);
  const cores = coresEncontradas ? Array.from(new Set(coresEncontradas.map(c => c.toLowerCase()))).join(', ') : null;

  const medMatch = descClean.match(/(?:medidas?|tamanho|dimensõ?e?s?|largura|comprimento|diâmetro)[:\s]+([^.!?\n]+)/i);
  const medidaDesc = medMatch ? medMatch[1].trim() : null;

  // ── 3. INTENTS DA PERGUNTA DO CLIENTE ──

  // TIPO DE PELO / PELAGEM / ADERÊNCIA / GRUDA
  if (q.includes('pelo') || q.includes('pelagem') || q.includes('pelos') || q.includes('ader') || q.includes('gruda')) {
    if (fixacao === 'adesivo' || fixacao === 'autocolante') {
      return `Sim! Os adesivos da MIMO Show grudam perfeitamente em qualquer tipo de pelo (curto, longo, liso ou crespo)! A cola especial foi desenvolvida para fixar com segurança sobre pelos limpos e secos sem machucar o animal. ✨`;
    }
    if (fixacao === 'elástico' || fixacao === 'elastico' || fixacao === 'anilha') {
      return `Sim! A anilha elástica de silicone se ajusta com facilidade a qualquer tipo de pelo no banho e tosa. 🎀`;
    }
    return `Sim! O "${nome}" é projetado para excelente fixação e acabamento em qualquer pelagem de cães e gatos. 🐾`;
  }

  // CORES / ESTAMPAS / SORTIDO
  if (q.includes('cor') || q.includes('cores') || q.includes('estampa') || q.includes('modelo') || q.includes('sortid')) {
    if (cores) {
      return `Em relação às cores do "${nome}": temos opções em ${cores}. Elas vão deixar os pets incríveis! 🎨`;
    }
    return `O "${nome}" é enviado em cores e estampas sortidas e vibrantes, exatamente como exibido nas fotos do anúncio! 🎨`;
  }

  // NOTA FISCAL / GARANTIA / ORIGINALIDADE
  if (q.includes('nota') || q.includes('nf') || q.includes('fiscal') || q.includes('garantia') || q.includes('original')) {
    return `Sim! Todos os nossos produtos acompanham Nota Fiscal, garantia contra defeitos de fabricação e suporte direto da loja. 📄✅`;
  }

  // PODE MOLHAR / LAVAR / DURAÇÃO / VALIDADE
  if (q.includes('molhar') || q.includes('água') || q.includes('agua') || q.includes('lavar') || q.includes('validade') || q.includes('dura')) {
    return `O "${nome}" é fabricado com materiais atóxicos e resistentes à umidade natural do banho e tosa. Não desbota nem estraga em contato com os pelos úmidos! 🧼💧`;
  }

  // PAGAMENTO / PIX / CARTÃO / CUPOM
  if (q.includes('pix') || q.includes('cartão') || q.includes('cartao') || q.includes('pagar') || q.includes('pagamento') || q.includes('boleto')) {
    return `Aceitamos PIX (com aprovação instantânea) e Cartão de Crédito em até 12x. Aproveite também os cupons disponíveis na tela do produto! 💳✨`;
  }

  // FRETE / ENTREGA / PRAZO / CEP / TRANSPORTADORA
  if (q.includes('frete') || q.includes('entrega') || q.includes('prazo') || q.includes('envio') || q.includes('cep') || q.includes('demora') || q.includes('chega')) {
    return `Postamos o "${nome}" nos Correios/transportadora em até 24h úteis! Digite seu CEP no campo de cálculo de frete logo acima para conferir o prazo exato para seu endereço. 🚚`;
  }

  // QUANTIDADE / UNIDADES / QUANTOS VEM NO PACOTE
  if (q.includes('quantos') || q.includes('quantidade') || q.includes('vem') || q.includes('pacote') || q.includes('kit') || q.includes('unidade')) {
    if (quantidade) {
      return `O produto "${nome}" vem em embalagem com ${quantidade} unidade(s)! 📦`;
    }
    return `O item "${nome}" refere-se à quantidade definida no anúncio. Você pode ajustar o total ao adicionar ao carrinho! 📦`;
  }

  // MATERIAL / COMPOSIÇÃO / DO QUE É FEITO / É DE EVA
  if (q.includes('material') || q.includes('feito') || q.includes('eva') || q.includes('glitter') || q.includes('qualidade') || q.includes('atóxico') || q.includes('atoxico') || q.includes('machuca') || q.includes('seguro')) {
    if (material) {
      return `O "${nome}" é fabricado em ${material}, garantindo extrema leveza, durabilidade e segurança atóxica para o animal. 🛡️`;
    }
    return `O "${nome}" utiliza matérias-primas atóxicas e leves de alta qualidade, desenvolvidas especialmente para estética pet sem agredir a pele. 🛡️`;
  }

  // FIXAÇÃO / COMO APLICAR / ADESIVO OU ELÁSTICO
  if (q.includes('como usar') || q.includes('como aplicar') || q.includes('fixar') || q.includes('prender') || q.includes('cola') || q.includes('elástico') || q.includes('elastico') || q.includes('adesivo')) {
    if (fixacao === 'adesivo' || fixacao === 'autocolante') {
      return `O "${nome}" é autocolante! Retire o papel de proteção e aplique diretamente nos pelos limpos e secos do pet. Adere super bem! ✨`;
    }
    if (fixacao === 'elástico' || fixacao === 'elastico' || fixacao === 'anilha') {
      return `O "${nome}" acompanha anilha elástica de silicone super flexível para fixação rápida no pelo do pet! 🎀`;
    }
    if (fixacao === 'fita' || fixacao === 'fita de cetim') {
      return `O "${nome}" vem acompanhado de fita macia pronta para amarração confortável no pescoço do pet! 🎀`;
    }
    return `Aplique o "${nome}" sobre a pelagem limpa e seca do pet ao finalizar o banho e tosa para um acabamento perfeito! ✨`;
  }

  // TAMANHO / MEDIDAS / PORTE
  if (q.includes('tamanho') || q.includes('medida') || q.includes('dimens') || q.includes('largura') || q.includes('comprimento') || q.includes('porte') || q.includes('pequeno') || q.includes('medio') || q.includes('médio') || q.includes('grande')) {
    if (medidaDesc) {
      return `As medidas do "${nome}" são: ${medidaDesc}. 📐`;
    }
    if (tamanhosArr) {
      return `O "${nome}" está disponível nos tamanhos: ${tamanhosArr}. 📐`;
    }
    return `O "${nome}" possui proporções perfeitas para estética de cães e gatos. Confira todos os detalhes na descrição da página! 📐`;
  }

  // PREÇO / PROMOÇÃO / DESCONTO
  if (q.includes('preço') || q.includes('preco') || q.includes('quanto custa') || q.includes('valor') || q.includes('desconto') || q.includes('promoção') || q.includes('promocao')) {
    if (temPromo) {
      return `O "${nome}" está em Super Promoção por apenas ${precoStr} (preço normal: ${precoDeStr})! 🎉`;
    }
    return `O valor do "${nome}" é de ${precoStr} com preço direto de fábrica. ✨`;
  }

  // ESTOQUE / DISPONIBILIDADE
  if (q.includes('estoque') || q.includes('disponível') || q.includes('disponivel') || q.includes('pronta entrega')) {
    if (estoqueNum > 0) {
      return `Sim! Temos ${estoqueNum} unidade(s) do "${nome}" em estoque para pronta entrega com postagem rápida! 📦`;
    }
    return `Temos o "${nome}" disponível em estoque para pronta entrega! 📦`;
  }

  // BUSCA DIRETAMENTE NAS FRASES DA DESCRIÇÃO QUE CONTÊM PALAVRAS DA PERGUNTA
  const frases = descClean.split(/[.!?\n]/).map(f => f.trim()).filter(f => f.length > 12);
  const palavrasDaPergunta = q.split(/\s+/).filter(w => w.length > 3 && !['sobre', 'como', 'qual', 'quanto', 'este', 'esse', 'produto', 'serve', 'voces', 'vocês', 'tem'].includes(w));
  
  if (palavrasDaPergunta.length > 0) {
    const fraseBateu = frases.find(frase => {
      const fLower = frase.toLowerCase();
      return palavrasDaPergunta.some(p => fLower.includes(p));
    });
    if (fraseBateu) {
      return `Sobre a sua dúvida sobre "${palavrasDaPergunta.join(' ')}": ${fraseBateu}.`;
    }
  }

  // RESPOSTA AMIGÁVEL SEM REPETIR A DESCRIÇÃO GERAL
  return `Como posso te ajudar sobre o produto "${nome}" (${precoStr})? Pode me perguntar sobre prazo de frete, quantidade do pacote, material ou modo de uso! 🐾`;
}





