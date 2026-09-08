import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WipeTransitionProps {
  active: boolean;
}

// Painel cheio que varre a tela da esquerda para a direita, usado ao
// clicar em "Início" para cobrir a troca de tela (dimensão -> seleção).
export const WipeTransition: React.FC<WipeTransitionProps> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] bg-[#007770] pointer-events-none"
      />
    )}
  </AnimatePresence>
);
