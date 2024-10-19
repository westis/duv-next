import { Hero } from "@/components/layout/Hero";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <section className="container py-6">
        <h2 className="text-2xl font-bold mb-4">
          Welcome to DUV Ultramarathon Statistics
        </h2>
        <p className="mb-4">
          The DUV Ultramarathon Statistics database offers a comprehensive
          resource for tracking and exploring ultramarathon results worldwide.
          It provides detailed information about runners, race events, and
          results, enabling users to view and compare performances across
          distances, times, and locations.
        </p>
        <p>
          Whether you&apos;re an athlete, coach, or fan, the DUV platform helps
          you stay informed about the world of ultrarunning with easily
          accessible statistics and historical data.
        </p>
      </section>
    </div>
  );
}
