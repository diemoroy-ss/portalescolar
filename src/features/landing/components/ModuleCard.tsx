import React from 'react';
import { motion } from 'motion/react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, icon, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 20px 40px -15px rgba(34, 197, 94, 0.3)" 
      }}
      className="relative p-6 rounded-3xl bg-surface-card border border-surface-border overflow-hidden group transition-all duration-300"
    >
      {/* Gradiente decorativo al hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Brillo en el fondo */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/35 transition-colors duration-500" />

      <div className="flex flex-col h-full relative z-10">
        <div className="p-3 w-fit rounded-2xl bg-surface-1 text-primary-400 group-hover:text-primary-300 group-hover:bg-primary-950/50 transition-colors duration-300 mb-5">
          {icon}
        </div>
        <h3 className="font-heading font-bold text-xl text-neutral-100 mb-2 group-hover:text-primary-300 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-neutral-400 text-sm leading-relaxed flex-grow">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
