import { pushToDataLayer } from './dataLayer';
import { EcommerceItem } from './types';

function normalizarItemEcommerce(item: any, quantidade: number = 1): EcommerceItem {
  const preco = Number(item.preco_promocional || item.preco_unitario || item.preco || 0);
  return {
    item_id: String(item.id || item.codigo_barras || item.sku || 'item'),
    item_name: String(item.nome || 'Produto Pet'),
    item_brand: 'MIMO Show',
    item_category: item.categoria || item.grupo || 'Pet',
    item_variant: item.variacao || item.cor || undefined,
    price: preco,
    quantity: quantidade,
  };
}

/**
 * 1. Acesso às páginas (Page Views)
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/**
 * 2. Visualização de produto (View Item)
 */
export function trackViewItem(produto: any) {
  const item = normalizarItemEcommerce(produto, 1);
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: 'BRL',
      value: item.price,
      items: [item],
    },
  });
}

/**
 * 3. Pesquisas internas (Internal Search)
 */
export function trackSearch(searchTerm: string, resultsCount: number = 0) {
  if (!searchTerm.trim()) return;
  pushToDataLayer({
    event: 'search',
    search_term: searchTerm.trim(),
    results_count: resultsCount,
  });
}

/**
 * 4. Cliques em banners (Select Promotion)
 */
export function trackSelectPromotion(promotionName: string, slotIndex: number, destinationUrl?: string) {
  pushToDataLayer({
    event: 'select_promotion',
    ecommerce: {
      promotion_id: `banner_slot_${slotIndex + 1}`,
      promotion_name: promotionName || `Banner ${slotIndex + 1}`,
      creative_slot: `slot_${slotIndex + 1}`,
      destination: destinationUrl || '',
    },
  });
}

/**
 * 5. Cliques em categorias (Select Category / Item List)
 */
export function trackSelectCategory(categoryName: string, categorySlugOrUrl?: string) {
  pushToDataLayer({
    event: 'select_item',
    item_list_name: 'Categorias do Menu',
    category_name: categoryName,
    category_url: categorySlugOrUrl || '',
  });
}

/**
 * 6. Adição de produtos ao carrinho (Add to Cart)
 */
export function trackAddToCart(item: any, quantity: number = 1) {
  const itemNorm = normalizarItemEcommerce(item, quantity);
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BRL',
      value: itemNorm.price * quantity,
      items: [itemNorm],
    },
  });
}

/**
 * 7. Remoção de produtos do carrinho (Remove from Cart)
 */
export function trackRemoveFromCart(item: any, quantity: number = 1) {
  const itemNorm = normalizarItemEcommerce(item, quantity);
  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: {
      currency: 'BRL',
      value: itemNorm.price * quantity,
      items: [itemNorm],
    },
  });
}

/**
 * 8. Abandono de carrinho (Cart Abandonment)
 */
export function trackCartAbandonment(itens: any[], totalValue: number) {
  if (!itens || itens.length === 0) return;
  const itemsNorm = itens.map((i) => normalizarItemEcommerce(i, Number(i.quantidade || 1)));
  pushToDataLayer({
    event: 'cart_abandonment',
    ecommerce: {
      currency: 'BRL',
      value: totalValue,
      items_count: itemsNorm.length,
      items: itemsNorm,
    },
  });
}

/**
 * 9. Início do checkout (Begin Checkout)
 */
export function trackBeginCheckout(itens: any[], totalValue: number, couponCode?: string) {
  const itemsNorm = (itens || []).map((i) => normalizarItemEcommerce(i, Number(i.quantidade || 1)));
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BRL',
      value: totalValue,
      coupon: couponCode || undefined,
      items: itemsNorm,
    },
  });
}

/**
 * 10. Cálculo e Seleção de frete (Add Shipping Info)
 */
export function trackShippingCalculated(serviceName: string, shippingCost: number, cep?: string) {
  const cepPrefixo = cep ? cep.replace(/\D/g, '').slice(0, 5) : undefined;
  pushToDataLayer({
    event: 'add_shipping_info',
    ecommerce: {
      currency: 'BRL',
      value: shippingCost,
      shipping_tier: serviceName,
      destination_zip_prefix: cepPrefixo, // Não envia o CEP completo por privacidade
    },
  });
}

/**
 * 11. Aplicação de cupons (Apply Coupon)
 */
export function trackCouponApplied(couponCode: string, discountValue: number, success: boolean, errorMessage?: string) {
  pushToDataLayer({
    event: 'apply_coupon',
    coupon_code: couponCode.toUpperCase().trim(),
    discount_value: discountValue,
    status: success ? 'applied' : 'failed',
    error_message: errorMessage || undefined,
  });
}

/**
 * 12. Seleção da forma de pagamento (Add Payment Info)
 */
export function trackPaymentInfo(paymentMethod: string, totalValue: number, couponCode?: string) {
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'BRL',
      value: totalValue,
      payment_type: paymentMethod,
      coupon: couponCode || undefined,
    },
  });
}

/**
 * 13. Compra concluída (Purchase)
 */
export function trackPurchase(
  orderNumber: string,
  itens: any[],
  totalValue: number,
  shippingCost: number = 0,
  discountValue: number = 0,
  couponCode?: string
) {
  // Evitar duplicar purchase se usuário recarregar página de sucesso
  if (typeof localStorage !== 'undefined') {
    const key = `purchase_tracked_${orderNumber}`;
    if (localStorage.getItem(key)) {
      return;
    }
    localStorage.setItem(key, new Date().toISOString());
  }

  const itemsNorm = (itens || []).map((i) => normalizarItemEcommerce(i, Number(i.quantidade || 1)));

  pushToDataLayer({
    event: 'purchase',
    event_id: `purchase_${orderNumber}`,
    ecommerce: {
      transaction_id: String(orderNumber),
      affiliation: 'MIMO Show Loja Online',
      value: totalValue,
      tax: 0,
      shipping: shippingCost,
      currency: 'BRL',
      coupon: couponCode || undefined,
      discount: discountValue,
      items: itemsNorm,
    },
  });
}

/**
 * 14. Erros de navegação e pagamento (Error Event / Exception)
 */
export function trackError(errorType: 'checkout' | 'frete' | 'cupom' | 'pagamento' | 'navegacao', errorMessage: string, context?: Record<string, any>) {
  pushToDataLayer({
    event: 'error_event',
    error_type: errorType,
    error_message: errorMessage,
    error_context: context ? JSON.stringify(context) : undefined,
  });
}
