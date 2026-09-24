const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/actions.ts', 'utf-8');

code = code.replace(
  'const payloadBling = {',
  `
    // Procurar IDs de produtos faltantes no Bling pelo SKU
    for (const item of (pedido.itens || [])) {
      if (item.sku && !prodsMap.get(item.sku) && !item.bling_id) {
        try {
          const resProd = await fetch(\`https://api.bling.com.br/Api/v3/produtos?codigo=\${item.sku}\`, {
            headers: { 'Authorization': \`Bearer \${token}\` }
          });
          const dataProd = await resProd.json();
          if (dataProd?.data?.length > 0) {
            prodsMap.set(item.sku, dataProd.data[0].id);
          }
        } catch(e) {}
      }
    }
    
    let descontoCalc = (pedido.subtotal || 0) + (pedido.valor_frete || 0) - (pedido.total || 0);
    if (descontoCalc < 0) descontoCalc = 0;

    const payloadBling = {`
);

code = code.replace(
  "parcelas: [{ dataVencimento: new Date(pedido.criado_em || Date.now()).toISOString().split('T')[0], valor: pedido.total || pedido.subtotal || 0 }],",
  "desconto: { valor: Number(descontoCalc.toFixed(2)) },"
);

fs.writeFileSync('src/app/admin/pedidos/actions.ts', code);
