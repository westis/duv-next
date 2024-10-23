import DefaultLayout from "@/app/layouts/DefaultLayout";
import Hero from "@/components/features/home/Hero";
import InfoSection from "@/components/features/home/InfoSection";

// This data would come from Sanity in the future
const pageData = {
  hero: {
    title: "DUV Ultramarathon Statistics",
    subtitle:
      "Discover comprehensive statistics, results, and rankings from 100,523 ultramarathon events, featuring 8,865,545 performances by 2,115,800 runners worldwide.",
  },
  infoSection: {
    title: "About DUV Statistics",
    content: [
      "The DUV Ultramarathon Statistics database offers a comprehensive resource for tracking and exploring ultramarathon results worldwide. It provides detailed information about runners, race events, and results, enabling users to view and compare performances across distances, times, and locations.",
      "Whether you're an athlete, coach, or fan, the DUV platform helps you stay informed about the world of ultrarunning with easily accessible statistics and historical data.",
    ],
  },
};

export default function Home() {
  return (
    <DefaultLayout>
      <div className="container mx-auto py-0">
        <Hero title={pageData.hero.title} subtitle={pageData.hero.subtitle} />
        <InfoSection
          title={pageData.infoSection.title}
          content={pageData.infoSection.content}
        />
      </div>
    </DefaultLayout>
  );
}
