/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // =================================================================
            // DESIGN SYSTEM COLORS - Aligned with globals.css CSS custom properties
            // =================================================================
            colors: {
                // Primary brand colors matching CSS custom properties
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6', // --color-primary
                    600: '#2563eb',
                    700: '#1d4ed8', // --color-primary-dark
                    800: '#1e40af',
                    900: '#1e3a8a',
                },

                // Secondary brand colors
                secondary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#8b5cf6', // --color-secondary
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },

                // Enhanced gray scale matching globals.css
                gray: {
                    50: '#f8fafc',   // --color-surface (light)
                    100: '#f1f5f9',
                    200: '#e2e8f0',  // --color-border (light)
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',  // --color-text-muted
                    600: '#475569',  // --color-text-secondary
                    700: '#334155',
                    800: '#1e293b',  // --color-surface (dark)
                    900: '#0f172a',  // --color-background (dark)
                },

                // Semantic colors
                success: {
                    500: '#10b981', // --color-success
                    600: '#059669',
                },
                warning: {
                    500: '#f59e0b', // --color-warning
                    600: '#d97706',
                },
                error: {
                    500: '#ef4444', // --color-error
                    600: '#dc2626',
                },
                info: {
                    500: '#06b6d4', // --color-accent
                    600: '#0891b2',
                },
            },

            // =================================================================
            // INTER FONT SYSTEM - Optimized typography
            // =================================================================
            fontFamily: {
                sans: [
                    'var(--font-family-primary)',
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'sans-serif'
                ],
                display: [
                    'var(--font-family-primary)',
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'sans-serif'
                ],
                mono: [
                    'var(--font-family-primary)',
                    'ui-monospace',
                    'monospace'
                ],
            },

            // Typography scale with optimized line heights and letter spacing
            fontSize: {
                'xs': ['0.75rem', {lineHeight: '1.2', letterSpacing: '-0.01em'}],
                'sm': ['0.875rem', {lineHeight: '1.3', letterSpacing: '-0.01em'}],
                'base': ['1rem', {lineHeight: '1.5', letterSpacing: '-0.01em'}],
                'lg': ['1.125rem', {lineHeight: '1.4', letterSpacing: '-0.01em'}],
                'xl': ['1.25rem', {lineHeight: '1.3', letterSpacing: '-0.02em'}],
                '2xl': ['1.5rem', {lineHeight: '1.2', letterSpacing: '-0.025em'}],
                '3xl': ['1.875rem', {lineHeight: '1.2', letterSpacing: '-0.03em'}],
                '4xl': ['2.25rem', {lineHeight: '1.1', letterSpacing: '-0.035em'}],
                '5xl': ['3rem', {lineHeight: '1', letterSpacing: '-0.04em'}],
            },

            // Optimized font weights for Inter
            fontWeight: {
                light: '300',    // --font-weight-light
                normal: '400',   // --font-weight-normal
                medium: '500',   // --font-weight-medium
                semibold: '600', // --font-weight-semibold
                bold: '700',     // --font-weight-bold
            },

            // =================================================================
            // SPACING SYSTEM - 8px base unit matching globals.css
            // =================================================================
            spacing: {
                '18': '4.5rem',   // 72px
                '88': '22rem',    // 352px
                '128': '32rem',   // 512px
            },

            // =================================================================
            // BORDER RADIUS - Consistent with CSS custom properties
            // =================================================================
            borderRadius: {
                'xs': 'var(--radius-xs)',    // 2px
                'sm': 'var(--radius-sm)',    // 4px
                'md': 'var(--radius-md)',    // 6px
                'lg': 'var(--radius-lg)',    // 8px
                'xl': 'var(--radius-xl)',    // 12px
                '2xl': 'var(--radius-2xl)',  // 16px
                'full': 'var(--radius-full)', // 9999px
            },

            // =================================================================
            // SHADOW SYSTEM - Matching globals.css performance-optimized shadows
            // =================================================================
            boxShadow: {
                'xs': 'var(--shadow-xs)',
                'sm': 'var(--shadow-sm)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'xl': 'var(--shadow-xl)',
                '2xl': 'var(--shadow-2xl)',
                'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
                'none': 'none',
                // Interactive shadows
                'hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
                'primary': '0 6px 16px rgba(59, 130, 246, 0.25)',
            },

            // =================================================================
            // BACKDROP BLUR - Optimized values matching globals.css
            // =================================================================
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '6px',      // Optimized default
                'lg': '8px',
                'xl': '12px',
                '2xl': '16px',
            },

            // =================================================================
            // Z-INDEX SCALE - Centralized layer management
            // =================================================================
            zIndex: {
                'auto': 'auto',
                '0': '0',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',
                'base': 'var(--z-base)',
                'dropdown': 'var(--z-dropdown)',
                'sticky': 'var(--z-sticky)',
                'sidebar': 'var(--z-sidebar)',
                'header': 'var(--z-header)',
                'overlay': 'var(--z-overlay)',
                'modal': 'var(--z-modal)',
                'toast': 'var(--z-toast)',
                'tooltip': 'var(--z-tooltip)',
                'popover': 'var(--z-popover)',
            },

            // =================================================================
            // ANIMATION SYSTEM - Performance-optimized animations
            // =================================================================
            animation: {
                'fade-in': 'fadeIn var(--duration-normal) ease-out',
                'slide-up': 'slideUp var(--duration-normal) ease-out',
                'slide-down': 'slideDown 0.2s ease-out',
                'scale-in': 'scaleIn var(--duration-fast) ease-out',
                'shimmer': 'shimmer 1.2s ease-in-out infinite',
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'skeleton-wave': 'skeletonWave 1.2s ease-in-out infinite',
                'slide-up-mobile': 'slideUpMobile var(--duration-normal) ease-out',
                'slide-in-right': 'slideInRight var(--duration-normal) ease-out',
                'modal-scale-desktop': 'modalScaleDesktop var(--duration-normal) ease-out',
                'slide-down-fade': 'slideDownFade 0.2s ease-out',
                'float': 'float 4s ease-in-out infinite',
                'rotate': 'rotate 1.5s linear infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': {opacity: '0', transform: 'translateY(8px) translateZ(0)'},
                    '100%': {opacity: '1', transform: 'translateY(0) translateZ(0)'},
                },
                slideUp: {
                    '0%': {transform: 'translateY(100%) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'translateY(0) translateZ(0)', opacity: '1'},
                },
                slideDown: {
                    '0%': {opacity: '0', transform: 'translateY(-10px) scale(0.95)'},
                    '100%': {opacity: '1', transform: 'translateY(0) scale(1)'},
                },
                scaleIn: {
                    '0%': {transform: 'scale(0.95) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'scale(1) translateZ(0)', opacity: '1'},
                },
                shimmer: {
                    '0%': {transform: 'translateX(-100%) translateZ(0)'},
                    '100%': {transform: 'translateX(100%) translateZ(0)'},
                },
                skeletonWave: {
                    '0%': {backgroundPosition: '-200% 0'},
                    '100%': {backgroundPosition: '200% 0'},
                },
                slideUpMobile: {
                    '0%': {transform: 'translateY(100%) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'translateY(0) translateZ(0)', opacity: '1'},
                },
                slideInRight: {
                    '0%': {transform: 'translateX(100%) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'translateX(0) translateZ(0)', opacity: '1'},
                },
                modalScaleDesktop: {
                    '0%': {transform: 'scale(0.95) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'scale(1) translateZ(0)', opacity: '1'},
                },
                slideDownFade: {
                    '0%': {opacity: '0', transform: 'translateY(-10px) scale(0.95)'},
                    '100%': {opacity: '1', transform: 'translateY(0) scale(1)'},
                },
                float: {
                    '0%, 100%': {transform: 'translateY(0px) translateZ(0)'},
                    '50%': {transform: 'translateY(-8px) translateZ(0)'},
                },
                rotate: {
                    '0%': {transform: 'rotate(0deg)'},
                    '100%': {transform: 'rotate(360deg)'},
                },
            },

            // =================================================================
            // TRANSITION SYSTEM - Consistent timing with globals.css
            // =================================================================
            transitionDuration: {
                '75': '75ms',
                '100': '100ms',
                '150': 'var(--duration-fast)',    // 150ms
                '200': 'var(--duration-normal)',  // 200ms
                '300': 'var(--duration-slow)',    // 300ms
                '500': 'var(--duration-slower)',  // 500ms
            },

            transitionTimingFunction: {
                'ease-out-fast': 'cubic-bezier(0, 0, 0.2, 1)',
                'ease-in-out-fast': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // =================================================================
            // BACKGROUND GRADIENTS - Matching globals.css design system
            // =================================================================
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-surface': 'var(--gradient-surface)',
                'gradient-glass': 'var(--gradient-glass)',
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'grid-pattern': 'linear-gradient(color-mix(in srgb, var(--color-primary) 3%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 3%, transparent) 1px, transparent 1px)',
            },

            // =================================================================
            // BACKGROUND SIZE - For grid patterns
            // =================================================================
            backgroundSize: {
                'grid': '24px 24px',
                'mobile-grid': '16px 16px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),

        // =================================================================
        // ENTERPRISE PLUGIN - Optimized components and utilities
        // =================================================================
        function ({addUtilities, addComponents, addBase, theme}) {
            // =============================================================
            // BASE STYLES - Foundation matching globals.css
            // =============================================================
            addBase({
                ':root': {
                    // Ensure CSS custom properties are available to Tailwind
                    '--font-family-primary': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                },

                // Enhanced focus styles
                '*:focus-visible': {
                    outline: '2px solid var(--color-primary)',
                    outlineOffset: '2px',
                    borderRadius: theme('borderRadius.sm'),
                },

                // Smooth scrolling
                'html': {
                    scrollBehavior: 'smooth',
                    fontFamily: 'var(--font-family-primary)',
                },

                // Font optimization
                'body': {
                    fontFamily: 'var(--font-family-primary)',
                    '-webkit-font-smoothing': 'antialiased',
                    '-moz-osx-font-smoothing': 'grayscale',
                    textRendering: 'optimizeLegibility',
                },
            });

            // =============================================================
            // COMPONENT CLASSES - Enterprise-grade components
            // =============================================================
            addComponents({
                // Button system
                '.btn': {
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    letterSpacing: '-0.01em',
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease, background-color var(--duration-normal) ease',
                    borderRadius: 'var(--radius-lg)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: 'translateY(0) translateZ(0)',
                    minHeight: '44px',

                    '&:focus-visible': {
                        outline: '2px solid var(--color-primary)',
                        outlineOffset: '2px',
                    },

                    '&:disabled': {
                        opacity: '0.5',
                        cursor: 'not-allowed',
                        transform: 'translateY(0) translateZ(0) !important',
                    },

                    '&:hover:not(:disabled)': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },

                    '&:active:not(:disabled)': {
                        transform: 'translateY(0) translateZ(0)',
                    },
                },

                '.btn-primary': {
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                    border: 'none',

                    '&:hover:not(:disabled)': {
                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)',
                    },
                },

                '.btn-secondary': {
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',

                    '&:hover:not(:disabled)': {
                        background: 'var(--color-border)',
                        borderColor: 'var(--color-text-muted)',
                    },
                },

                '.btn-ghost': {
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid transparent',

                    '&:hover:not(:disabled)': {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)',
                    },
                },

                '.btn-outline': {
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    border: '2px solid var(--color-primary)',

                    '&:hover:not(:disabled)': {
                        background: 'var(--color-primary)',
                        color: 'white',
                    },
                },

                // Form system
                '.form-input': {
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '1rem',
                    fontWeight: 'var(--font-weight-normal)',
                    letterSpacing: '-0.01em',
                    transition: 'transform var(--duration-fast) ease, border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    padding: 'var(--space-3) var(--space-4)',
                    minHeight: '44px',

                    '&:focus': {
                        outline: 'none',
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent)',
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },

                '.form-input-enhanced': {
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '1rem',
                    fontWeight: 'var(--font-weight-medium)',
                    letterSpacing: '-0.01em',
                    transition: 'transform var(--duration-fast) ease, border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',
                    borderRadius: 'var(--radius-xl)',
                    border: '2px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    padding: '1rem 1.25rem',
                    minHeight: '3.25rem',

                    '&:focus': {
                        outline: 'none',
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        transform: 'translateY(-1px) translateZ(0)',
                        background: 'color-mix(in srgb, var(--color-background) 98%, var(--color-primary))',
                    },

                    '&:hover:not(:focus)': {
                        borderColor: 'var(--color-text-muted)',
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },

                '.form-label': {
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-2)',
                    display: 'block',
                    transition: 'color var(--duration-normal) ease',
                },

                '.form-label-enhanced': {
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '0.9375rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-3)',
                    display: 'block',
                    transition: 'color var(--duration-normal) ease',
                    letterSpacing: '-0.01em',
                    lineHeight: '1.4',
                },

                // Card system
                '.card': {
                    background: 'var(--gradient-glass)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-6)',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',

                    '&:hover': {
                        transform: 'translateY(-2px) translateZ(0)',
                        boxShadow: 'var(--shadow-xl)',
                    },
                },

                '.card-compact': {
                    padding: 'var(--space-4)',
                },

                '.card-spacious': {
                    padding: 'var(--space-8)',
                },

                // Glass effect
                '.glass-effect': {
                    background: 'var(--gradient-glass)',
                    backdropFilter: 'blur(8px)',
                    '-webkit-backdrop-filter': 'blur(8px)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                },

                '.glass-card': {
                    padding: 'var(--space-6)',
                    borderRadius: 'var(--radius-2xl)',
                    backdropFilter: 'blur(8px)',
                    '-webkit-backdrop-filter': 'blur(8px)',
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',
                    contain: 'layout style',

                    '&:hover': {
                        boxShadow: 'var(--shadow-xl)',
                        transform: 'translateY(-2px) translateZ(0)',
                    },
                },

                // Table system
                '.table': {
                    width: '100%',
                    fontFamily: 'var(--font-family-primary)',
                    borderCollapse: 'collapse',
                },

                '.table th': {
                    background: 'var(--gradient-primary) !important',
                    color: 'white !important',
                    padding: 'var(--space-4) !important',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 'var(--font-weight-bold) !important',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-family-primary) !important',
                },

                '.table td': {
                    padding: 'var(--space-4)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'var(--font-weight-normal)',
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'color var(--duration-normal) ease',
                },

                '.table-container': {
                    background: 'var(--gradient-glass)',
                    borderRadius: 'var(--radius-2xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    width: '100%',
                    transition: 'background-color var(--duration-normal) ease',
                },

                // Status badges
                '.status-badge': {
                    fontFamily: 'var(--font-family-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 'var(--font-weight-medium)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid',
                    transform: 'translateZ(0)',
                    transition: 'transform var(--duration-fast) ease',

                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },

                '.status-applied': {
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    color: '#1d4ed8',
                    borderColor: '#93c5fd',
                },

                '.status-interview': {
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    color: '#d97706',
                    borderColor: '#fbbf24',
                },

                '.status-offer': {
                    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                    color: '#059669',
                    borderColor: '#86efac',
                },

                '.status-rejected': {
                    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                },

                // Loading skeleton
                '.skeleton': {
                    background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: 'var(--radius-lg)',
                    animation: 'shimmer 1.2s ease-in-out infinite',
                    minHeight: 'var(--space-6)',
                    transform: 'translateZ(0)',
                },

                '.mobile-skeleton': {
                    background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: 'var(--radius-lg)',
                    animation: 'skeletonWave 1.2s ease-in-out infinite',
                    minHeight: 'var(--space-6)',
                    transform: 'translateZ(0)',
                },
            });

            // =============================================================
            // UTILITY CLASSES - Performance-focused utilities
            // =============================================================
            addUtilities({
                // Text gradients
                '.text-gradient-primary': {
                    background: 'var(--gradient-primary)',
                    backgroundClip: 'text',
                    '-webkit-background-clip': 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: '-0.02em',
                },

                '.text-gradient-blue': {
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    backgroundClip: 'text',
                    '-webkit-background-clip': 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                },

                '.text-gradient-purple': {
                    background: 'linear-gradient(135deg, var(--color-secondary) 0%, #7c3aed 100%)',
                    backgroundClip: 'text',
                    '-webkit-background-clip': 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-semibold)',
                },

                // Performance utilities
                '.gpu-accelerated': {
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                },

                // Hover effects
                '.hover-lift': {
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',

                    '&:hover': {
                        transform: 'translateY(-2px) translateZ(0)',
                        boxShadow: 'var(--shadow-lg)',
                    },
                },

                '.hover-lift-sm': {
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',

                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                        boxShadow: 'var(--shadow-md)',
                    },
                },

                '.desktop-hover-lift': {
                    transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',

                    '&:hover': {
                        transform: 'translateY(-2px) translateZ(0)',
                        boxShadow: 'var(--shadow-lg)',
                    },
                },

                // Interactive states
                '.interactive': {
                    transition: 'transform var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',
                    cursor: 'pointer',

                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },

                    '&:active': {
                        transform: 'translateY(0) translateZ(0)',
                    },
                },

                '.desktop-interactive': {
                    transition: 'transform var(--duration-fast) ease',
                    transform: 'translateY(0) translateZ(0)',
                    cursor: 'pointer',

                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },

                    '&:active': {
                        transform: 'translateY(0) translateZ(0)',
                    },
                },

                '.mobile-interactive': {
                    '&:active': {
                        transform: 'translateY(1px) translateZ(0)',
                        opacity: '0.9',
                    },
                },

                // Focus utilities
                '.focus-ring': {
                    '&:focus-visible': {
                        outline: '2px solid var(--color-primary)',
                        outlineOffset: '2px',
                        borderRadius: 'var(--radius-sm)',
                    },
                },

                '.focus-ring-inset': {
                    '&:focus-visible': {
                        outline: '2px solid var(--color-primary)',
                        outlineOffset: '-2px',
                        borderRadius: 'var(--radius-sm)',
                    },
                },

                '.desktop-focus-enhanced': {
                    '&:focus-visible': {
                        outline: '3px solid var(--color-primary)',
                        outlineOffset: '3px',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'outline-color var(--duration-fast) ease, outline-offset var(--duration-fast) ease',
                    },
                },

                '.mobile-focus': {
                    '&:focus-visible': {
                        outline: '3px solid var(--color-primary)',
                        outlineOffset: '2px',
                        borderRadius: 'var(--radius-sm)',
                    },
                },

                // Scroll utilities
                '.mobile-scroll': {
                    '-webkit-overflow-scrolling': 'touch',
                    scrollBehavior: 'smooth',
                    overscrollBehavior: 'contain',
                },

                '.desktop-scroll-smooth': {
                    scrollBehavior: 'smooth',
                    '-webkit-overflow-scrolling': 'touch',
                },

                // Containment utilities
                '.contain-layout': {
                    contain: 'layout',
                },

                '.contain-style': {
                    contain: 'style',
                },

                '.contain-layout-style': {
                    contain: 'layout style',
                },

                // Text shadows
                '.text-shadow-sm': {
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },

                '.text-shadow': {
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },

                // Safe area utilities for mobile
                '.safe-top': {
                    paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
                },

                '.safe-bottom': {
                    paddingBottom: 'max(var(--space-4), env(safe-area-inset-bottom))',
                },

                '.safe-left': {
                    paddingLeft: 'max(var(--space-4), env(safe-area-inset-left))',
                },

                '.safe-right': {
                    paddingRight: 'max(var(--space-4), env(safe-area-inset-right))',
                },

                '.safe-all': {
                    paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
                    paddingBottom: 'max(var(--space-4), env(safe-area-inset-bottom))',
                    paddingLeft: 'max(var(--space-4), env(safe-area-inset-left))',
                    paddingRight: 'max(var(--space-4), env(safe-area-inset-right))',
                },

                '.mobile-safe-top': {
                    paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
                },

                '.mobile-safe-bottom': {
                    paddingBottom: 'max(var(--space-4), env(safe-area-inset-bottom))',
                },

                '.mobile-safe-left': {
                    paddingLeft: 'max(var(--space-4), env(safe-area-inset-left))',
                },

                '.mobile-safe-right': {
                    paddingRight: 'max(var(--space-4), env(safe-area-inset-right))',
                },

                '.mobile-safe-all': {
                    paddingTop: 'max(var(--space-4), env(safe-area-inset-top))',
                    paddingBottom: 'max(var(--space-4), env(safe-area-inset-bottom))',
                    paddingLeft: 'max(var(--space-4), env(safe-area-inset-left))',
                    paddingRight: 'max(var(--space-4), env(safe-area-inset-right))',
                },

                // Logo utilities
                '.logo-crisp': {
                    imageRendering: '-webkit-optimize-contrast',
                    imageRendering: '-moz-crisp-edges',
                    imageRendering: 'crisp-edges',
                    imageRendering: 'pixelated',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    maxWidth: '100%',
                    height: 'auto',
                    filter: 'none',
                },

                '.logo-retina': {
                    imageRendering: '-webkit-optimize-contrast',
                    transform: 'translateZ(0)',
                },

                // Layout utilities
                '.desktop-container': {
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 var(--space-6)',
                },

                '.mobile-container': {
                    maxWidth: '100%',
                    paddingLeft: 'var(--space-4)',
                    paddingRight: 'var(--space-4)',
                },

                '.container-desktop': {
                    maxWidth: '1400px',
                    margin: '0 auto',
                },

                '.ultra-wide-container': {
                    maxWidth: '1600px',
                    margin: '0 auto',
                },

                // Grid utilities
                '.desktop-grid-2': {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'var(--space-6)',
                },

                '.desktop-grid-3': {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-6)',
                },

                '.desktop-grid-4': {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-6)',
                },

                // Background utilities
                '.bg-grid': {
                    backgroundImage: 'var(--tw-gradient-to, linear-gradient(color-mix(in srgb, var(--color-primary) 3%, transparent) 1px, transparent 1px)), linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 3%, transparent) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                },

                // Animation utilities
                '.animate-float': {
                    animation: 'float 4s ease-in-out infinite',
                    transform: 'translateZ(0)',
                },

                // Visibility utilities
                '.mobile-only': {
                    '@media (min-width: 768px)': {
                        display: 'none',
                    },
                },

                '.desktop-only': {
                    display: 'none',
                    '@media (min-width: 768px)': {
                        display: 'block',
                    },
                },

                '.tablet-only': {
                    display: 'none',
                    '@media (min-width: 768px) and (max-width: 1023px)': {
                        display: 'block',
                    },
                },

                '.desktop-md-only': {
                    display: 'none',
                    '@media (min-width: 1024px) and (max-width: 1279px)': {
                        display: 'block',
                    },
                },

                '.desktop-lg-only': {
                    display: 'none',
                    '@media (min-width: 1280px)': {
                        display: 'block',
                    },
                },

                '.tablet-hidden': {
                    '@media (min-width: 768px) and (max-width: 1023px)': {
                        display: 'none',
                    },
                },

                '.desktop-hidden': {
                    '@media (min-width: 768px)': {
                        display: 'none',
                    },
                },

                '.desktop-md-hidden': {
                    '@media (min-width: 1024px) and (max-width: 1279px)': {
                        display: 'none',
                    },
                },

                '.desktop-lg-hidden': {
                    '@media (min-width: 1280px)': {
                        display: 'none',
                    },
                },

                '.desktop-visible': {
                    display: 'none',
                    '@media (min-width: 768px)': {
                        display: 'block',
                    },
                },

                // Reduced motion support
                '@media (prefers-reduced-motion: reduce)': {
                    '.hover-lift, .hover-lift-sm, .interactive, .desktop-hover-lift, .desktop-interactive': {
                        '&:hover': {
                            transform: 'translateY(0) translateZ(0) !important',
                        },
                    },

                    '.gpu-accelerated': {
                        willChange: 'auto',
                    },

                    '*': {
                        animationDuration: '0.01ms !important',
                        animationIterationCount: '1 !important',
                        transitionDuration: '0.01ms !important',
                        scrollBehavior: 'auto !important',
                    },
                },

                // High contrast support
                '@media (prefers-contrast: high)': {
                    '.text-gradient-primary, .text-gradient-blue, .text-gradient-purple': {
                        background: 'none',
                        color: 'var(--color-text-primary)',
                    },

                    '.btn-primary': {
                        background: 'var(--color-primary)',
                        border: '2px solid var(--color-primary-dark)',
                    },

                    '.form-input-enhanced': {
                        borderWidth: '2px',
                        borderColor: 'var(--color-text-primary)',
                    },

                    '.form-input-enhanced:focus': {
                        borderWidth: '3px',
                        boxShadow: '0 0 0 2px var(--color-primary)',
                    },

                    '.form-label-enhanced': {
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-primary)',
                    },
                },

                // Touch device optimizations
                '@media (hover: none) and (pointer: coarse)': {
                    '.btn, .interactive, button': {
                        minHeight: '44px',
                        minWidth: '44px',
                    },

                    '.hover-lift:hover, .hover-lift-sm:hover, .interactive:hover, .desktop-hover-lift:hover, .desktop-interactive:hover': {
                        transform: 'translateY(0) translateZ(0)',
                    },
                },
            });
        },
    ],
};