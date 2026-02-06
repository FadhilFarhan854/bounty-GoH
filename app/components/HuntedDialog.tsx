"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HuntedDialogProps {
  bossName: string;
  onSuccess: (hunterName: string) => void;
  onCancel: () => void;
}

export function HuntedDialog({ bossName, onSuccess, onCancel }: HuntedDialogProps) {
  const [password, setPassword] = useState("");
  const [hunterName, setHunterName] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [step, setStep] = useState<"password" | "hunter">("password");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "goh-123") {
      setStep("hunter");
      setError("");
    } else {
      setError("The Guild Seal rejects thy claim...");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setError("");
      }, 600);
    }
  };

  const handleHunterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hunterName.trim()) {
      onSuccess(hunterName.trim());
    } else {
      setError("A hunter must be named...");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setError("");
      }, 600);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="fate-card p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sword className="w-12 h-12 text-primary mx-auto mb-4" />
          </motion.div>
          <h3 className="font-cinzel text-2xl text-parchment mb-2">
            Victory Claim
          </h3>
          <p className="text-sm text-muted-foreground italic">
            &quot;{bossName} awaits thy claim...&quot;
          </p>
        </div>

        {step === "password" ? (
          <>
            {/* Lore */}
            <div className="bg-muted/20 border border-primary/20 rounded p-4 mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                To claim victory over <span className="text-parchment font-semibold">{bossName}</span>,
                thou must prove thy membership with the <span className="text-primary font-semibold">Guild Cipher</span>.
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-cinzel text-parchment mb-2">
                  Guild Cipher
                </label>
                <motion.input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter cipher..."
                  className={`w-full px-4 py-3 bg-muted/30 border-2 rounded font-cinzel text-parchment placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors ${
                    error ? 'border-destructive' : 'border-primary/30'
                  }`}
                  animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-sm mt-2 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 btn-medieval font-cinzel">
                  <Trophy className="w-4 h-4 mr-2" />
                  Verify
                </Button>
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 font-cinzel border-primary/40"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Hunter Name Form */}
            <div className="bg-primary/10 border border-primary/20 rounded p-4 mb-6">
              <p className="text-sm text-parchment leading-relaxed text-center">
                <Sword className="w-5 h-5 inline text-primary mr-2" />
                Name the brave hunter who slayed <span className="font-semibold">{bossName}</span>
              </p>
            </div>

            <form onSubmit={handleHunterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-cinzel text-parchment mb-2">
                  Hunter&apos;s Name
                </label>
                <motion.input
                  type="text"
                  value={hunterName}
                  onChange={(e) => setHunterName(e.target.value)}
                  placeholder="Enter hunter name..."
                  className={`w-full px-4 py-3 bg-muted/30 border-2 rounded font-cinzel text-parchment placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors ${
                    error ? 'border-destructive' : 'border-primary/30'
                  }`}
                  animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-sm mt-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 btn-medieval font-cinzel">
                  <Trophy className="w-4 h-4 mr-2" />
                  Claim Victory
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("password")}
                  variant="outline"
                  className="flex-1 font-cinzel border-primary/40"
                >
                  Back
                </Button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
