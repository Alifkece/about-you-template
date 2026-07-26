import { notFound } from 'next/navigation';
import ExperiencePlayer from '@/components/experience/ExperiencePlayer';
import { getSiteBySlug } from '@/services/firebase/firestore';

interface SitePageProps {
  params: { slug: string };
}

// Always fetch fresh from Firestore rather than statically caching a build-time
// snapshot — new sites are generated continuously after deployment.
export const dynamic = 'force-dynamic';

export default async function SitePage({ params }: SitePageProps) {
  const data = await getSiteBySlug(params.slug);

  if (!data) {
    notFound();
  }

  // `data` is narrowed to non-null here because notFound() throws and never returns.
  return <ExperiencePlayer data={data} />;
}
