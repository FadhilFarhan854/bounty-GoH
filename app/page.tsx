import Image from "next/image";
import { Footer } from "./components/Footer";
import { BossRandomizer } from "./components/BossRandomizer";
import { GuildHeader } from "./components/GuildHeader";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url("../assets/parchment-bg.jpg")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />

      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />

      {/* Subtle ambient particles/dust effect via radial gradient */}
      <div className="fixed inset-0 pointer-events-none bg-radial-gold opacity-30" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <GuildHeader />

        <main className="flex-1 flex items-center justify-center py-8">
          <BossRandomizer />
        </main>

        <Footer />
      </div>
    </div>
  );
}
