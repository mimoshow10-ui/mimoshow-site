/**
 * Extrai a quantidade numérica de um produto com base no nome do produto
 * (ex: "10 und", "Kit com 50", "200 Adesivos", "Quantidade: 20", etc.)
 * Se não encontrar quantidade no texto, utiliza o preço como critério secundário.
 */
export function extrairQuantidade(nome: string, preco?: number): number {
  if (!nome) return 100000 + (Number(preco) || 0);
  const clean = nome.trim();

  // 1. Quantidade explícita: "Quantidade: 20", "Qtd: 50"
  const mQtd = clean.match(/(?:quantidade|qtd|quant)\s*[:=]\s*(\d+)/i);
  if (mQtd) return parseInt(mQtd[1], 10);

  // 2. Kit com/de X: "Kit com 50", "Kit 10", "Kit50", "Kit de 100"
  const mKitCom = clean.match(/\bkit\s*(?:com|de|contendo)?\s*(\d+)\b/i);
  if (mKitCom) return parseInt(mKitCom[1], 10);

  // 3. Número seguido de unidade ou item pet:
  const mUnid = clean.match(/\b(\d+)\s*(?:und|unid|unidades?|un\b|pcs|pc|peças?|pecas?|pares|par|itens|adesivos?|gravatas?|gravatinhas?|lacos?|laços?|gargantilhas?|bandanas?|cartelas?)/i);
  if (mUnid) return parseInt(mUnid[1], 10);

  // 4. Começa com número no início do título:
  const mStart = clean.match(/^(\d+)\s+[a-zA-ZÀ-ÿ]/);
  if (mStart) return parseInt(mStart[1], 10);

  // 5. "com X" no meio da frase: "Pacote com 50"
  const mCom = clean.match(/\bcom\s+(\d+)\b/i);
  if (mCom) return parseInt(mCom[1], 10);

  // 6. Fallback ordenado por preço
  return 100000 + (Number(preco) || 0);
}

/**
 * Calcula o preço por unidade quando houver quantidade real no kit (ex: Kit com 50 por R$ 25,00 = R$ 0,50/un).
 */
export function calcularPrecoUnitario(
  nome: string,
  precoTotal: number
): { quantidade: number; precoUnitario: number; textoFormatado: string } | null {
  if (!nome || !precoTotal || precoTotal <= 0) return null;

  const qtd = extrairQuantidade(nome);
  // Se a quantidade for <= 1 ou for o fallback gigante (> 10000), não é kit com múltiplas unidades
  if (qtd <= 1 || qtd >= 10000) return null;

  const precoUnitario = precoTotal / qtd;
  const textoFormatado = `R$ ${precoUnitario.toFixed(2).replace('.', ',')}`;

  return {
    quantidade: qtd,
    precoUnitario,
    textoFormatado,
  };
}

/**
 * Ordena uma lista de produtos em ordem crescente de quantidade e preço.
 */
export function ordenarProdutosPorQuantidade<T extends { nome?: string; preco?: any; preco_promocional?: any }>(
  produtos: T[]
): T[] {
  return [...produtos].sort((a, b) => {
    const precoA = Number(a.preco_promocional || a.preco || 0);
    const precoB = Number(b.preco_promocional || b.preco || 0);
    const qA = extrairQuantidade(a.nome || '', precoA);
    const qB = extrairQuantidade(b.nome || '', precoB);

    if (qA !== qB) return qA - qB;
    if (precoA !== precoB) return precoA - precoB;
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });
}
