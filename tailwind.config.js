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
            // OPTIMIZED COLOR SYSTEM - Consistent with globals.css performance
            // =================================================================
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#667eea', // Main brand color matching globals.css
                    600: '#5a67d8',
                    700: '#4c51bf',
                    800: '#434190',
                    900: '#3c366b',
                },
                secondary: {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9',
                    500: '#764ba2', // Secondary brand color matching globals.css
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                },
                // Enhanced gray scale matching globals.css design
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                    950: '#030712',
                }
            },

            // =================================================================
            // GEIST FONT SYSTEM - Single font family matching globals.css
            // =================================================================
            fontFamily: {
                sans: [
                    'var(--font-geist)',
                    'Geist',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'sans-serif'
                ],
                // 🔧 OPTIMIZED: Enforce Geist only, remove competing font families
                mono: [
                    'var(--font-geist)',
                    'Geist',
                    'ui-monospace',
                    'monospace'
                ],
            },

            // 🔧 OPTIMIZED: Simplified responsive typography with Geist matching globals.css
            fontSize: {
                'xs': ['0.75rem', {lineHeight: '1.2', letterSpacing: '-0.01em'}],
                'sm': ['0.875rem', {lineHeight: '1.3', letterSpacing: '-0.01em'}],
                'base': ['1rem', {lineHeight: '1.5', letterSpacing: '-0.01em'}],
                'lg': ['1.125rem', {lineHeight: '1.4', letterSpacing: '-0.01em'}],
                'xl': ['1.25rem', {lineHeight: '1.3', letterSpacing: '-0.02em'}],
                '2xl': ['1.5rem', {lineHeight: '1.2', letterSpacing: '-0.02em'}],
                '3xl': ['1.875rem', {lineHeight: '1.2', letterSpacing: '-0.02em'}],
                '4xl': ['2.25rem', {lineHeight: '1.1', letterSpacing: '-0.02em'}],
                '5xl': ['3rem', {lineHeight: '1', letterSpacing: '-0.02em'}],
            },

            // 🔧 OPTIMIZED: Simplified font weights for Geist matching globals.css
            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                // Remove bold to enforce consistent Geist weights
            },

            // 🔧 OPTIMIZED: Simplified letter spacing matching globals.css
            letterSpacing: {
                tight: '-0.02em',
                normal: '-0.01em',
                wide: '0em',
            },

            // =================================================================
            // MINIMAL ANIMATION SYSTEM - Essential animations only matching globals.css performance
            // =================================================================
            animation: {
                // 🔧 OPTIMIZED: Faster animations matching globals.css timing
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.2s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out',
                // 🔧 OPTIMIZED: Reduced shimmer speed for better performance
                'shimmer': 'shimmer 1.5s linear infinite',
                // 🔧 OPTIMIZED: Remove heavy animations that conflict with globals.css
            },

            keyframes: {
                // 🔧 OPTIMIZED: Consistent transform properties matching globals.css
                fadeIn: {
                    '0%': {opacity: '0', transform: 'translateY(10px) translateZ(0)'},
                    '100%': {opacity: '1', transform: 'translateY(0) translateZ(0)'},
                },
                slideUp: {
                    '0%': {transform: 'translateY(100%) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'translateY(0) translateZ(0)', opacity: '1'},
                },
                scaleIn: {
                    '0%': {transform: 'scale(0.95) translateZ(0)', opacity: '0'},
                    '100%': {transform: 'scale(1) translateZ(0)', opacity: '1'},
                },
                shimmer: {
                    '0%': {transform: 'translateX(-100%) translateZ(0)'},
                    '100%': {transform: 'translateX(100%) translateZ(0)'},
                },
            },

            // =================================================================
            // OPTIMIZED BACKGROUND SYSTEM - Matching globals.css gradients
            // =================================================================
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                'gradient-accent': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                // 🔧 OPTIMIZED: Remove complex gradients that cause performance issues
            },

            // =================================================================
            // OPTIMIZED SHADOW SYSTEM - Matching globals.css performance
            // =================================================================
            boxShadow: {
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
                'none': 'none',
                // Essential interactive shadows matching globals.css
                'hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
                'primary': '0 6px 16px rgba(103, 126, 234, 0.4)',
            },

            // =================================================================
            // OPTIMIZED BACKDROP BLUR - Matching globals.css reduced values
            // =================================================================
            backdropBlur: {
                'none': '0',
                'sm': '4px',
                'DEFAULT': '6px', // 🔧 OPTIMIZED: Reduced from 8px matching globals.css
                'md': '8px',       // 🔧 OPTIMIZED: Reduced from 12px
                'lg': '12px',      // 🔧 OPTIMIZED: Reduced from 16px
                'xl': '16px',      // 🔧 OPTIMIZED: Reduced from 24px
            },

            // =================================================================
            // SIMPLIFIED Z-INDEX SCALE - Matching globals.css
            // =================================================================
            zIndex: {
                'auto': 'auto',
                '0': '0',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',
                'dropdown': '1000',
                'modal': '1050',
                'toast': '1080',
            },

            // =================================================================
            // OPTIMIZED SPACING SYSTEM
            // =================================================================
            spacing: {
                '18': '4.5rem',   // 72px
                '88': '22rem',    // 352px
                '128': '32rem',   // 512px
            },

            // =================================================================
            // OPTIMIZED TRANSITION SYSTEM - Matching globals.css timing
            // =================================================================
            transitionDuration: {
                '75': '75ms',
                '100': '100ms',
                '150': '150ms',    // 🔧 OPTIMIZED: Primary fast transition
                '200': '200ms',    // 🔧 OPTIMIZED: Primary medium transition
                '300': '300ms',
                '500': '500ms',
                '700': '700ms',
                '1000': '1000ms',
            },

            transitionTimingFunction: {
                'ease-out-fast': 'cubic-bezier(0, 0, 0.2, 1)',
                'ease-in-out-fast': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),

        // =================================================================
        // OPTIMIZED CUSTOM PLUGIN - Essential utilities only matching globals.css
        // =================================================================
        function ({addUtilities, addComponents, theme, addBase}) {
            // =============================================================
            // BASE STYLES - Geist font foundation matching globals.css
            // =============================================================
            addBase({
                ':root': {
                    '--font-geist': 'Geist, ui-sans-serif, system-ui, sans-serif',
                },
                '*:focus-visible': {
                    outline: '2px solid rgb(103 126 234)',
                    outlineOffset: '2px',
                    borderRadius: theme('borderRadius.sm'),
                },
                'html': {
                    scrollBehavior: 'smooth',
                    fontFamily: 'var(--font-geist)',
                },
                'body': {
                    fontFamily: 'var(--font-geist)',
                    '-webkit-font-smoothing': 'antialiased',
                    '-moz-osx-font-smoothing': 'grayscale',
                },
            });

            // =============================================================
            // OPTIMIZED GEIST TEXT UTILITIES - Performance focused
            // =============================================================
            addUtilities({
                '.text-gradient-primary': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
                '.text-gradient-secondary': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
                '.text-gradient-blue': {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
                '.text-gradient-purple': {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
                '.text-gradient-green': {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
                '.text-gradient-orange': {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                    letterSpacing: '-0.02em',
                },
            });

            // =============================================================
            // OPTIMIZED COMPONENT CLASSES - Matching globals.css performance
            // =============================================================
            addComponents({
                // 🔧 OPTIMIZED: Geist button system matching globals.css
                '.btn-base': {
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '500',
                    letterSpacing: '-0.01em',
                    // 🔧 OPTIMIZED: Faster transitions matching globals.css
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease',
                    borderRadius: theme('borderRadius.lg'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    // 🔧 OPTIMIZED: Consistent transform base matching globals.css
                    transform: 'translateY(0) translateZ(0)',
                    '&:focus-visible': {
                        outline: '2px solid rgb(103 126 234)',
                        outlineOffset: '2px',
                    },
                    '&:disabled': {
                        opacity: '0.5',
                        cursor: 'not-allowed',
                    },
                    '&:hover': {
                        // 🔧 OPTIMIZED: Consistent transform matching globals.css
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },

                // 🔧 OPTIMIZED: Geist form enhancements matching globals.css
                '.form-input-enhanced': {
                    fontFamily: 'var(--font-geist)',
                    fontSize: theme('fontSize.base'),
                    fontWeight: '400',
                    letterSpacing: '-0.01em',
                    // 🔧 OPTIMIZED: Faster transitions matching globals.css
                    transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    // 🔧 OPTIMIZED: Consistent transform base
                    transform: 'translateY(0) translateZ(0)',
                    '&:focus': {
                        outline: 'none',
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 4px rgba(103, 126, 234, 0.15)',
                        // 🔧 OPTIMIZED: Consistent transform matching globals.css
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },
                '.form-label-enhanced': {
                    fontFamily: 'var(--font-geist)',
                    fontSize: theme('fontSize.sm'),
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    display: 'block',
                    // 🔧 OPTIMIZED: Simple transition
                    transition: 'color 0.2s ease',
                    '.dark &': {
                        color: '#d1d5db',
                    },
                },

                // 🔧 OPTIMIZED: Minimal skeleton loader matching globals.css
                '.skeleton': {
                    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: theme('borderRadius.md'),
                    // 🔧 OPTIMIZED: Faster animation matching globals.css
                    animation: 'shimmer 1.5s ease-in-out infinite',
                    // 🔧 OPTIMIZED: Controlled transform
                    transform: 'translateZ(0)',
                    '.dark &': {
                        background: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)',
                    },
                },

                // 🔧 OPTIMIZED: Glass effect matching globals.css
                '.glass-card': {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: theme('borderRadius.xl'),
                    // 🔧 OPTIMIZED: Faster transitions matching globals.css
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    // 🔧 OPTIMIZED: Consistent transform base
                    transform: 'translateY(0) translateZ(0)',
                    '&:hover': {
                        transform: 'translateY(-2px) translateZ(0)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    },
                    '.dark &': {
                        background: 'rgba(17, 24, 39, 0.9)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                },
            });

            // =============================================================
            // OPTIMIZED UTILITY CLASSES - Performance focused
            // =============================================================
            addUtilities({
                // 🔧 OPTIMIZED: Controlled GPU acceleration matching globals.css
                '.gpu-accelerated': {
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                },

                // 🔧 OPTIMIZED: Text shadows matching globals.css
                '.text-shadow-sm': {
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow': {
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },

                // 🔧 OPTIMIZED: Hover effects matching globals.css performance
                '.hover-lift': {
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    transform: 'translateY(0) translateZ(0)',
                    '&:hover': {
                        transform: 'translateY(-2px) translateZ(0)',
                        boxShadow: theme('boxShadow.hover'),
                    },
                },

                '.hover-lift-sm': {
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    transform: 'translateY(0) translateZ(0)',
                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                        boxShadow: theme('boxShadow.md'),
                    },
                },

                // 🔧 OPTIMIZED: Mobile scroll matching globals.css
                '.mobile-scroll': {
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth',
                },

                // 🔧 OPTIMIZED: Performance containment
                '.contain-layout': {
                    contain: 'layout',
                },
                '.contain-style': {
                    contain: 'style',
                },
                '.contain-layout-style': {
                    contain: 'layout style',
                },

                // 🔧 OPTIMIZED: Focus utilities
                '.focus-ring': {
                    '&:focus-visible': {
                        outline: '2px solid rgb(103 126 234)',
                        outlineOffset: '2px',
                        borderRadius: theme('borderRadius.sm'),
                    },
                },

                '.focus-ring-inset': {
                    '&:focus-visible': {
                        outline: '2px solid rgb(103 126 234)',
                        outlineOffset: '-2px',
                        borderRadius: theme('borderRadius.sm'),
                    },
                },

                // 🔧 OPTIMIZED: Interactive states
                '.interactive': {
                    transition: 'transform 0.15s ease',
                    transform: 'translateY(0) translateZ(0)',
                    cursor: 'pointer',
                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                    '&:active': {
                        transform: 'translateY(0) translateZ(0)',
                    },
                },

                // 🔧 OPTIMIZED: Status indicators with Geist font
                '.status-badge': {
                    fontFamily: 'var(--font-geist)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid',
                    // 🔧 OPTIMIZED: Faster transitions
                    transition: 'transform 0.15s ease, background-color 0.15s ease',
                    transform: 'translateZ(0)',
                    '&:hover': {
                        transform: 'translateY(-1px) translateZ(0)',
                    },
                },

                // 🔧 OPTIMIZED: Reduced motion support
                '@media (prefers-reduced-motion: reduce)': {
                    '.hover-lift, .hover-lift-sm, .interactive': {
                        '&:hover': {
                            transform: 'translateY(0) translateZ(0) !important',
                        },
                    },
                    '.gpu-accelerated': {
                        willChange: 'auto',
                    },
                },
            });
        },
    ],
}