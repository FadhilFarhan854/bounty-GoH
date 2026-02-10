"use client";
import { motion } from "framer-motion";
import { Swords, Users, UserMinus, AlertTriangle } from "lucide-react";

export function BonusBounty() {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="scroll-card p-8 aged-frame">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Swords className="w-6 h-6 text-primary" />
          <h3 className="font-cinzel text-2xl md:text-3xl text-parchment tracking-wider text-center">
            Bonus Bounty
          </h3>
          <Swords className="w-6 h-6 text-primary" />
        </div>

        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p className="text-center italic text-lg">
            &quot;Aturan kuno yang tertulis dalam Kitab Para Pemburu...&quot;
          </p>
          
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-6" />

          <p className="text-center text-sm text-parchment mb-4">
            <span className="text-primary font-semibold">Dewan Guild</span> telah menetapkan aturan bonus untuk para pemburu yang berani menghadapi bounty:
          </p>

          {/* General Rule */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h4 className="font-cinzel text-lg text-parchment">Syarat Umum</h4>
            </div>
            <p className="text-sm">
              Semua bonus bounty hanya berlaku untuk boss dengan difficulty <span className="text-primary font-bold">Ultimate</span>.
            </p>
            <p className="text-sm">
             
            </p>
            <p className="text-xs italic mt-2 text-muted-foreground">
               Bounty akan dibagikan setiap <span className="text-primary font-bold">Malam minggu</span> di <span className="text-primary font-bold">Guild Bar</span>.
            </p>
          </div>

          {/* Solo Bonus */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Swords className="w-5 h-5 text-primary" />
              <h4 className="font-cinzel text-lg text-parchment">Berburu Sendirian (Solo)</h4>
            </div>
            <p className="text-sm">
              Pemburu yang berani menghadapi beast sendirian akan menerima 
              <span className="text-primary font-bold"> bonus 15%</span> dari total hadiah bounty.
            </p>
            <div className="mt-3 text-xs">
              <p className="text-yellow-500 font-semibold">⚔️ Syarat Solo:</p>
              <p className="ml-2 mt-1">Maksimal <span className="text-primary font-bold">1x per orang</span></p>
            </div>
            <p className="text-xs italic mt-2 text-muted-foreground">
              &quot;Keberanian sejati terlihat saat engkau berdiri sendiri menghadapi kegelapan...&quot;
            </p>
          </div>

          {/* Party with Guild Bonus */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h4 className="font-cinzel text-lg text-parchment">Party dengan Sesama Guild</h4>
            </div>
            <p className="text-sm">
              Setiap anggota guild yang ikut dalam party akan menambahkan 
              <span className="text-primary font-bold"> bonus 5%</span> dari total hadiah bounty.
            </p>
            <p className="text-xs italic mt-2 text-muted-foreground">
              &quot;Persatuan adalah kekuatan. Semakin banyak saudara, semakin besar berkahnya...&quot;
            </p>
          </div>

          {/* Outside Guild Rule */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <UserMinus className="w-5 h-5 text-destructive" />
              <h4 className="font-cinzel text-lg text-parchment">Party dengan Orang Luar Guild</h4>
            </div>
            <p className="text-sm">
              Setiap pemburu hanya diperbolehkan <span className="text-destructive font-bold">maksimal 2x per minggu</span> untuk 
              berburu bounty bersama orang di luar guild.
            </p>
            <p className="text-xs italic mt-2 text-muted-foreground">
              &quot;Loyalitas kepada guild adalah segalanya. Bantuan dari luar harus dibatasi...&quot;
            </p>
          </div>

          {/* Warning Note */}
          <div className="bg-muted/30 border border-muted-foreground/30 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-cinzel text-sm text-parchment mb-1">Catatan Penting</h4>
                <p className="text-xs text-muted-foreground">
                  Jika seorang pemburu melakukan 3x atau lebih battle boss dengan orang di luar guild dalam satu minggu, 
                  <span className="text-yellow-500 font-semibold"> hanya 2 battle yang akan dihitung</span> untuk perhitungan bounty. 
                  Selebihnya tidak akan mendapat reward.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-6" />

          <div className="bg-muted/20 border border-primary/20 rounded p-4">
            <p className="text-center text-sm text-parchment">
              <span className="text-primary">📜</span> Aturan ini berlaku untuk setiap pemburu dan direset setiap minggu. <span className="text-primary">📜</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
