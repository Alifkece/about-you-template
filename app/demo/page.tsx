import ExperiencePlayer from '@/components/experience/ExperiencePlayer';
import { defaultSiteData } from '@/lib/defaultSiteData';

/**
 * Milestone 1 comparison page. Renders the ported experience against the
 * exact same 11 assets (cover + 10 photos + audio) as the current live site,
 * so it can be compared directly, side by side, before anything Firebase- or
 * dashboard-related is introduced.
 */
export default function DemoPage() {
  return <ExperiencePlayer data={defaultSiteData} />;
}
