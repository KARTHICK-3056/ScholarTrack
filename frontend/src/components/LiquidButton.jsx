import React from 'react';
import { motion } from 'framer-motion';

/**
 * Universal Liquid Glass Button
 * Implements physical liquid glass optics:
 * - Multi-layered inset specular reflections
 * - Blurred refractive inner edge (:before)
 * - 45-degree diagonal liquid highlight (:after)
 * - Specular overlay ring (.circle-overlay)
 * - Tactile icon orb (.liquid-btn-icon)
 * - Apple Daylight (Light) and Obsidian Crystal (Dark) tuning
 */
export default function LiquidButton({
  children,
  icon,
  iconPosition = "right",
  size = "md", // "lg" | "md" | "sm" | "xs" | "icon" | "icon-sm"
  variant = "default", // "default" | "primary" | "active" | "amber" | "rose" | "emerald" | "ghost"
  showOrb = false,
  orbClassName = "",
  className = "",
  as: CustomTag,
  onClick,
  disabled = false,
  title,
  href,
  target,
  rel,
  type = "button",
  style = {},
  id,
  whileHover,
  whileTap,
  ...props
}) {
  const isLink = !!href || CustomTag === 'a';
  const BaseComponent = isLink ? motion.a : motion.button;

  // Decide if the icon should be wrapped in a liquid orb
  const renderOrb = showOrb || (icon && size === "lg");

  // Determine size classes
  const sizeClasses = {
    lg: "liquid-btn-lg",
    md: "liquid-btn-md",
    sm: "liquid-btn-sm",
    xs: "liquid-btn-xs",
    icon: "liquid-btn-icon-sq",
    "icon-sm": "liquid-btn-icon-sq-sm",
  }[size] || "liquid-btn-md";

  // Determine variant classes
  const variantClasses = {
    default: "",
    primary: "liquid-btn-primary",
    active: "liquid-btn-active",
    amber: "liquid-btn-amber",
    rose: "liquid-btn-rose",
    emerald: "liquid-btn-emerald",
    ghost: "liquid-btn-ghost",
  }[variant] || "";

  // Spring physics for natural tactile glass response
  const defaultHover = size.startsWith("icon") 
    ? { scale: 1.06 } 
    : size === "sm" || size === "xs"
    ? { scale: 1.025 } // Keep vertical baseline locked for tabs and pills
    : { scale: 1.025, y: -2 };
  const defaultTap = { scale: 0.96 };

  const buttonProps = {
    id,
    title,
    onClick,
    disabled,
    style,
    whileHover: disabled ? undefined : (whileHover || defaultHover),
    whileTap: disabled ? undefined : (whileTap || defaultTap),
    transition: { type: "spring", stiffness: 480, damping: 26 },
    className: `liquidglass liquidglass-btn glassBtn liquid-glass-btn ${sizeClasses} ${variantClasses} ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`,
    ...(isLink ? { href, target, rel } : { type }),
    ...props
  };

  return (
    <BaseComponent {...buttonProps}>
      {/* 1. Leading Icon */}
      {icon && iconPosition === "left" && (
        renderOrb ? (
          <span className={`liquid-btn-orb ${orbClassName}`}>
            {icon}
          </span>
        ) : (
          <span className="liquid-btn-icon-raw text-current flex-shrink-0">
            {icon}
          </span>
        )
      )}

      {/* 2. Text / Content */}
      {children && (
        <span className="liquid-text">
          {children}
        </span>
      )}

      {/* 3. Trailing Icon */}
      {icon && iconPosition === "right" && (
        renderOrb ? (
          <span className={`liquid-btn-orb ${orbClassName}`}>
            {icon}
          </span>
        ) : (
          <span className="liquid-btn-icon-raw text-current flex-shrink-0">
            {icon}
          </span>
        )
      )}

      {/* 4. Specular Circle Ring Overlay */}
      <span className="circle-overlay" />
    </BaseComponent>
  );
}
