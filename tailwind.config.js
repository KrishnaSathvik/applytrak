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
            // SIMPLIFIED COLOR SYSTEM - Consistent and accessible
            // =================================================================
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#667eea', // Main brand color
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
                    500: '#764ba2', // Secondary brand color
                    600: '#c026d3',
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                },
                // Enhanced gray scale for better contrast
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
            // GEIST FONT SYSTEM - Single font family only
            // =================================================================
            fontFamily: {
                sans: [
                    'Geist',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'sans-serif'
                ],
                // Remove display and mono families to enforce Geist only
                mono: [
                    'Geist',
                    'ui-monospace',
                    'monospace'
                ],
            },

            // Simplified responsive typography with Geist
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1.2', letterSpacing: '0em' }],
                'sm': ['0.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
                'base': ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
                'lg': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
                'xl': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
                '2xl': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
                '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
            },

            // Simplified font weights for Geist
            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
            },

            // Simplified letter spacing
            letterSpacing: {
                tight: '-0.02em',
                normal: '-0.01em',
                wide: '0em',
            },

            // =================================================================
            // MINIMAL ANIMATION SYSTEM - Essential animations only
            // =================================================================
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
            },

            // =================================================================
            // SIMPLIFIED BACKGROUND SYSTEM
            // =================================================================
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                'gradient-accent': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            },

            // =================================================================
            // SIMPLIFIED SHADOW SYSTEM
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
                // Essential interactive shadows
                'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                'primary': '0 10px 25px rgba(103, 126, 234, 0.3)',
            },

            // =================================================================
            // SIMPLIFIED BACKDROP BLUR
            // =================================================================
            backdropBlur: {
                'none': '0',
                'sm': '4px',
                'DEFAULT': '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '24px',
            },

            // =================================================================
            // SIMPLIFIED Z-INDEX SCALE
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
            // SIMPLIFIED SPACING SYSTEM
            // =================================================================
            spacing: {
                '18': '4.5rem',   // 72px
                '88': '22rem',    // 352px
                '128': '32rem',   // 512px
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),

        // =================================================================
        // SIMPLIFIED CUSTOM PLUGIN - Essential utilities only
        // =================================================================
        function({ addUtilities, addComponents, theme, addBase }) {
            // =============================================================
            // BASE STYLES - Geist font foundation
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
                },
                'body': {
                    fontFamily: 'var(--font-geist)',
                    '-webkit-font-smoothing': 'antialiased',
                    '-moz-osx-font-smoothing': 'grayscale',
                },
            });

            // =============================================================
            // GEIST TEXT UTILITIES
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
                },
                '.text-gradient-blue': {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                },
                '.text-gradient-purple': {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '600',
                },
            });

            // =============================================================
            // SIMPLIFIED COMPONENT CLASSES
            // =============================================================
            addComponents({
                // Geist button system
                '.btn-base': {
                    fontFamily: 'var(--font-geist)',
                    fontWeight: '500',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s ease',
                    borderRadius: theme('borderRadius.lg'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:focus-visible': {
                        outline: '2px solid rgb(103 126 234)',
                        outlineOffset: '2px',
                    },
                    '&:disabled': {
                        opacity: '0.5',
                        cursor: 'not-allowed',
                    },
                },

                // Geist form enhancements
                '.form-input-enhanced': {
                    fontFamily: 'var(--font-geist)',
                    fontSize: theme('fontSize.base'),
                    fontWeight: '400',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s ease',
                    '&:focus': {
                        outline: 'none',
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 4px rgba(103, 126, 234, 0.15)',
                    },
                },
                '.form-label-enhanced': {
                    fontFamily: 'var(--font-geist)',
                    fontSize: theme('fontSize.sm'),
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    display: 'block',
                    '.dark &': {
                        color: '#d1d5db',
                    },
                },

                // Minimal skeleton loader
                '.skeleton': {
                    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: theme('borderRadius.md'),
                    animation: 'shimmer 2s ease-in-out infinite',
                    '.dark &': {
                        background: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)',
                    },
                },
            });

            // =============================================================
            // ESSENTIAL UTILITY CLASSES
            // =============================================================
            addUtilities({
                // GPU acceleration
                '.gpu-accelerated': {
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                },

                // Text shadows
                '.text-shadow-sm': {
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow': {
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },

                // Hover effects
                '.hover-lift': {
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme('boxShadow.hover'),
                    },
                },

                // Mobile scroll
                '.mobile-scroll': {
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth',
                },
            });
        },
    ],
}