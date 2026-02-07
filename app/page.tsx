"use client";
import { useState, useEffect } from "react";
import { Footer } from "./components/Footer";
import { BossRandomizer } from "./components/BossRandomizer";
import { GuildHeader } from "./components/GuildHeader";
import { BountyLore } from "./components/BountyLore";
import { BonusBounty } from "./components/BonusBounty";
import { ActiveBountiesCarousel } from "./components/ActiveBountiesCarousel";
import { IntroScreen } from "./components/IntroScreen";
import { Boss } from "./types/boss";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeBounties, setActiveBounties] = useState<Boss[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  // Load saved bounties on mount
  useEffect(() => {
    const loadBounties = async () => {
      try {
        console.log('Loading bounties from server...');
        const response = await fetch('/api/bounties', {
          cache: 'no-store' // Prevent caching
        });
        const data = await response.json();
        console.log('Loaded bounties:', data);
        
        if (data && data.length > 0) {
          setActiveBounties(data);
          console.log('Active bounties set:', data.length, 'bosses');
        } else {
          console.log('No saved bounties found');
        }
      } catch (error) {
        console.error('Failed to load bounties:', error);
      }
    };
    
    loadBounties();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleBountiesSelected = (bosses: Boss[]) => {
    setActiveBounties(bosses);
  };

  const handleBossHunted = async (bossId: string, huntedBy: string, huntedAt: string) => {
    try {
      console.log(`Marking boss ${bossId} as hunted by ${huntedBy}`);
      
      // Update via API
      const response = await fetch('/api/bounties', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bossId,
          hunted: true,
          huntedBy,
          huntedAt
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Boss marked as hunted successfully');
        
        // Update local state
        setActiveBounties(prev => 
          prev.map(boss => 
            boss.id === bossId 
              ? { ...boss, hunted: true, huntedBy, huntedAt }
              : boss
          )
        );
      } else {
        console.error('Failed to mark boss as hunted:', result.error);
      }
    } catch (error) {
      console.error('Error marking boss as hunted:', error);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Intro Screen */}
      <AnimatePresence>
        {showIntro && (
          <IntroScreen 
            onComplete={handleIntroComplete}
           
          />
        )}
      </AnimatePresence>

      {/* Background Music */}
     
      
      {/* Background layers */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url("../assets/parchment-bg.jpg")` }}
      />
      
      {/* Radial gradient - bright golden center fading to dark edges */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 45% 25%) 0%, hsl(30 25% 15%) 35%, hsl(25 20% 10%) 60%, hsl(20 15% 6%) 100%)'
        }}
      />

      {/* Enhanced vignette overlay for darker edges */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(0,0,0,0.9)]" />

      {/* Subtle golden glow in center */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at center, hsl(38 60% 30% / 0.3) 0%, transparent 50%)'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <GuildHeader />

        <main className="flex-1 py-8">
          {/* Bounty Lore Section */}
          <BountyLore />

          {/* Boss Randomizer */}
          <div className="flex items-center justify-center">
            <BossRandomizer 
              onBountiesSelected={handleBountiesSelected} 
              activeBounties={activeBounties}
            />
          </div>

          {/* Active Bounties Carousel */}
          {activeBounties.length > 0 && (
            <ActiveBountiesCarousel 
              bosses={activeBounties} 
              onBossHunted={handleBossHunted}
            />
          )}

          {/* Bonus Bounty Section */}
          <BonusBounty />
        </main>

        <Footer />
      </div>
    </div>
  );
}
