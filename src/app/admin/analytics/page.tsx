import { getAnalyticsConfig } from '@/lib/analytics/config';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const config = await getAnalyticsConfig();

  return <AnalyticsDashboardClient config={config} />;
}
