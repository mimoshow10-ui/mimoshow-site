export interface AnalyticsConfig {
  gtm_id?: string;
  ga4_measurement_id?: string;
  clarity_project_id?: string;
  ativo?: boolean;
  debug_mode?: boolean;
  consent_padrao?: 'denied' | 'granted';
  atualizado_em?: string;
}

export interface ConsentState {
  ad_storage: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  timestamp: string;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price: number;
  quantity?: number;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'view_item'
  | 'view_item_list'
  | 'select_item'
  | 'search'
  | 'select_promotion'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_abandonment'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'apply_coupon'
  | 'add_payment_info'
  | 'purchase'
  | 'error_event'
  | 'consent_update';

export interface DataLayerEventPayload {
  event: AnalyticsEventType;
  event_id?: string;
  timestamp?: string;
  ecommerce?: Record<string, any> | null;
  [key: string]: any;
}
