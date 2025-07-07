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
            // COLOR SYSTEM - Consistent and accessible color palette
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
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f093fb', // Accent gradient end
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#11998e', // Success color
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                error: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
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
            // TYPOGRAPHY SYSTEM - Professional font hierarchy
            // =================================================================
            fontFamily: {
                sans: [
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'Noto Sans',
                    'sans-serif',
                    'Apple Color Emoji',
                    'Segoe UI Emoji',
                    'Segoe UI Symbol',
                    'Noto Color Emoji'
                ],
                display: [
                    'Poppins',
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    'sans-serif'
                ],
                mono: [
                    'ui-monospace',
                    'SFMono-Regular',
                    'Monaco',
                    'Consolas',
                    'Liberation Mono',
                    'Courier New',
                    'monospace'
                ],
            },

            // Enhanced responsive typography with fluid scaling
            fontSize: {
                'xs': ['clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem)', {
                    lineHeight: '1.25',
                    letterSpacing: '0.025em'
                }],
                'sm': ['clamp(0.875rem, 0.8rem + 0.3vw, 0.95rem)', {
                    lineHeight: '1.375',
                    letterSpacing: '0em'
                }],
                'base': ['clamp(1rem, 0.95rem + 0.25vw, 1.1rem)', {
                    lineHeight: '1.5',
                    letterSpacing: '-0.025em'
                }],
                'lg': ['clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem)', {
                    lineHeight: '1.375',
                    letterSpacing: '-0.025em'
                }],
                'xl': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.4rem)', {
                    lineHeight: '1.25',
                    letterSpacing: '-0.025em'
                }],
                '2xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 1.75rem)', {
                    lineHeight: '1.25',
                    letterSpacing: '-0.025em'
                }],
                '3xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)', {
                    lineHeight: '1.25',
                    letterSpacing: '-0.025em'
                }],
                '4xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 2.75rem)', {
                    lineHeight: '1.125',
                    letterSpacing: '-0.025em'
                }],
                '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 3.75rem)', {
                    lineHeight: '1',
                    letterSpacing: '-0.025em'
                }],
                '6xl': ['clamp(3.75rem, 3rem + 3.75vw, 4.5rem)', {
                    lineHeight: '1',
                    letterSpacing: '-0.025em'
                }],
                '7xl': ['clamp(4.5rem, 3.5rem + 5vw, 6rem)', {
                    lineHeight: '1',
                    letterSpacing: '-0.05em'
                }],
                '8xl': ['clamp(6rem, 4rem + 10vw, 8rem)', {
                    lineHeight: '1',
                    letterSpacing: '-0.05em'
                }],
                '9xl': ['clamp(8rem, 5rem + 15vw, 10rem)', {
                    lineHeight: '1',
                    letterSpacing: '-0.05em'
                }],
            },

            // Enhanced letter spacing scale
            letterSpacing: {
                tightest: '-0.075em',
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0em',
                wide: '0.025em',
                wider: '0.05em',
                widest: '0.1em',
                'extra-wide': '0.2em',
            },

            // =================================================================
            // ANIMATION SYSTEM - Smooth and purposeful animations
            // =================================================================
            animation: {
                // Enhanced entrance animations
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'fade-out': 'fadeOut 0.2s ease-in forwards',
                'slide-in-right': 'slideInRight 0.3s ease-out forwards',
                'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
                'slide-in-up': 'slideInUp 0.3s ease-out forwards',
                'slide-in-down': 'slideInDown 0.3s ease-out forwards',
                'scale-in': 'scaleIn 0.2s ease-out forwards',
                'scale-out': 'scaleOut 0.2s ease-in forwards',

                // Interactive animations
                'bounce-gentle': 'bounceGentle 0.6s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',

                // Loading and feedback animations
                'shimmer': 'shimmer 2s linear infinite',
                'spin-slow': 'spinSlow 3s linear infinite',
                'gradient-shift': 'gradientShift 4s ease-in-out infinite',

                // Text animations
                'text-glow': 'textGlow 2s ease-in-out infinite alternate',
                'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite',
            },

            keyframes: {
                // Entrance animations
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                slideInRight: {
                    '0%': {
                        transform: 'translateX(100%)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateX(0)',
                        opacity: '1'
                    },
                },
                slideInLeft: {
                    '0%': {
                        transform: 'translateX(-100%)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateX(0)',
                        opacity: '1'
                    },
                },
                slideInUp: {
                    '0%': {
                        transform: 'translateY(100%)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    },
                },
                slideInDown: {
                    '0%': {
                        transform: 'translateY(-100%)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'translateY(0)',
                        opacity: '1'
                    },
                },
                scaleIn: {
                    '0%': {
                        transform: 'scale(0.9)',
                        opacity: '0'
                    },
                    '100%': {
                        transform: 'scale(1)',
                        opacity: '1'
                    },
                },
                scaleOut: {
                    '0%': {
                        transform: 'scale(1)',
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'scale(0.9)',
                        opacity: '0'
                    },
                },

                // Interactive animations
                bounceGentle: {
                    '0%': {
                        transform: 'scale(0.8) translateY(20px)',
                        opacity: '0'
                    },
                    '60%': {
                        transform: 'scale(1.05) translateY(-5px)',
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'scale(1) translateY(0)',
                        opacity: '1'
                    },
                },
                float: {
                    '0%, 100%': {
                        transform: 'translateY(0px) rotate(0deg)'
                    },
                    '50%': {
                        transform: 'translateY(-10px) rotate(1deg)'
                    },
                },
                pulseGlow: {
                    '0%, 100%': {
                        transform: 'scale(1)',
                        filter: 'brightness(1) drop-shadow(0 0 5px rgba(103, 126, 234, 0.3))'
                    },
                    '50%': {
                        transform: 'scale(1.02)',
                        filter: 'brightness(1.1) drop-shadow(0 0 15px rgba(103, 126, 234, 0.6))'
                    },
                },

                // Loading animations
                shimmer: {
                    '0%': {
                        transform: 'translateX(-100%)'
                    },
                    '100%': {
                        transform: 'translateX(100%)'
                    },
                },
                spinSlow: {
                    '0%': {
                        transform: 'rotate(0deg)'
                    },
                    '100%': {
                        transform: 'rotate(360deg)'
                    },
                },
                gradientShift: {
                    '0%, 100%': {
                        'background-position': '0% 50%'
                    },
                    '50%': {
                        'background-position': '100% 50%'
                    },
                },

                // Text animations
                textGlow: {
                    '0%': {
                        'text-shadow': '0 0 5px rgba(103, 126, 234, 0.3)'
                    },
                    '100%': {
                        'text-shadow': '0 0 20px rgba(103, 126, 234, 0.8), 0 0 30px rgba(103, 126, 234, 0.4)'
                    },
                },
                typing: {
                    '0%': {
                        width: '0'
                    },
                    '100%': {
                        width: '100%'
                    },
                },
                'blink-caret': {
                    '0%, 50%': {
                        'border-color': 'transparent'
                    },
                    '51%, 100%': {
                        'border-color': 'currentColor'
                    },
                },
            },

            // =================================================================
            // BACKGROUND SYSTEM - Modern gradients and effects
            // =================================================================
            backgroundImage: {
                // Gradient utilities
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',

                // Glass morphism backgrounds
                'glass-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                'glass-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',

                // Brand gradient system
                'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                'gradient-accent': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',

                // Animated gradients
                'gradient-animated': 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea)',
                'gradient-mesh': 'radial-gradient(circle at 20% 50%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #764ba2 0%, transparent 50%), radial-gradient(circle at 40% 80%, #f093fb 0%, transparent 50%)',
            },

            // =================================================================
            // SHADOW SYSTEM - Layered depth and glass effects
            // =================================================================
            boxShadow: {
                // Enhanced shadow scale
                'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

                // Glass morphism shadows
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',

                // Glow effects
                'glow-sm': '0 0 10px rgba(103, 126, 234, 0.3)',
                'glow': '0 0 20px rgba(103, 126, 234, 0.4)',
                'glow-lg': '0 0 40px rgba(103, 126, 234, 0.6)',
                'glow-xl': '0 0 60px rgba(103, 126, 234, 0.8)',

                // Interactive shadows
                'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'active': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

                // Colored shadows
                'primary': '0 10px 25px rgba(103, 126, 234, 0.3)',
                'secondary': '0 10px 25px rgba(118, 75, 162, 0.3)',
                'success': '0 10px 25px rgba(17, 153, 142, 0.3)',
                'warning': '0 10px 25px rgba(245, 158, 11, 0.3)',
                'error': '0 10px 25px rgba(239, 68, 68, 0.3)',
            },

            // =================================================================
            // BACKDROP BLUR - Enhanced glass effects
            // =================================================================
            backdropBlur: {
                'none': '0',
                'xs': '2px',
                'sm': '4px',
                'DEFAULT': '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '24px',
                '2xl': '40px',
                '3xl': '64px',
            },

            // =================================================================
            // SPACING SYSTEM - Enhanced spacing scale
            // =================================================================
            spacing: {
                '18': '4.5rem',   // 72px
                '88': '22rem',    // 352px
                '128': '32rem',   // 512px
                '144': '36rem',   // 576px
                '160': '40rem',   // 640px
                '176': '44rem',   // 704px
                '192': '48rem',   // 768px
            },

            // =================================================================
            // Z-INDEX SCALE - Consistent layering
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
                'sticky': '1020',
                'fixed': '1030',
                'modal-backdrop': '1040',
                'modal': '1050',
                'popover': '1060',
                'tooltip': '1070',
                'toast': '1080',
            },

            // =================================================================
            // BORDER RADIUS - Consistent rounding system
            // =================================================================
            borderRadius: {
                'none': '0px',
                'sm': '0.125rem',    // 2px
                'DEFAULT': '0.25rem', // 4px
                'md': '0.375rem',    // 6px
                'lg': '0.5rem',      // 8px
                'xl': '0.75rem',     // 12px
                '2xl': '1rem',       // 16px
                '3xl': '1.5rem',     // 24px
                'full': '9999px',
            },

            // =================================================================
            // CONTENT UTILITIES
            // =================================================================
            content: {
                'empty': '""',
                'space': '" "',
                'arrow-right': '"→"',
                'arrow-left': '"←"',
                'checkmark': '"✓"',
                'cross': '"✕"',
                'star': '"★"',
                'heart': '"♥"',
            },

            // =================================================================
            // TRANSITION SYSTEM - Smooth interactions
            // =================================================================
            transitionTimingFunction: {
                'ease-in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
                'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
                'ease-in-out-expo': 'cubic-bezier(1, 0, 0, 1)',
                'ease-in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
                'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },

            transitionDuration: {
                '75': '75ms',
                '100': '100ms',
                '150': '150ms',
                '200': '200ms',
                '300': '300ms',
                '500': '500ms',
                '700': '700ms',
                '1000': '1000ms',
                '2000': '2000ms',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),

        // =================================================================
        // CUSTOM PLUGIN - Enhanced utilities and components
        // =================================================================
        function({ addUtilities, addComponents, theme, addBase }) {
            // =============================================================
            // BASE STYLES - Foundation improvements
            // =============================================================
            addBase({
                // Enhanced CSS custom properties
                ':root': {
                    '--scroll-behavior': 'smooth',
                    '--focus-ring': '0 0 0 2px rgb(59 130 246 / 0.5)',
                    '--transition-base': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                },

                // Improved focus styles
                '*:focus-visible': {
                    outline: '2px solid rgb(99 102 241)',
                    outlineOffset: '2px',
                    borderRadius: theme('borderRadius.sm'),
                },

                // Smooth scrolling
                'html': {
                    scrollBehavior: 'smooth',
                },

                // Enhanced font smoothing
                'body': {
                    '-webkit-font-smoothing': 'antialiased',
                    '-moz-osx-font-smoothing': 'grayscale',
                    textRendering: 'optimizeLegibility',
                },
            });

            // =============================================================
            // TEXT GRADIENT UTILITIES - Enhanced gradient text effects
            // =============================================================
            addUtilities({
                '.text-gradient-primary': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: theme('fontFamily.display'),
                    fontWeight: theme('fontWeight.extrabold'),
                    letterSpacing: theme('letterSpacing.tight'),
                },
                '.text-gradient-secondary': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                },
                '.text-gradient-accent': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                },
                '.text-gradient-animated': {
                    background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea)',
                    backgroundSize: '300% 300%',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    animation: 'gradientShift 4s ease-in-out infinite',
                },
                '.text-gradient-blue': {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                },
                '.text-gradient-purple': {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                },
            });

            // =============================================================
            // ENHANCED COMPONENT CLASSES
            // =============================================================
            addComponents({
                // Enhanced button system
                '.btn-base': {
                    fontFamily: theme('fontFamily.sans'),
                    fontWeight: theme('fontWeight.semibold'),
                    letterSpacing: theme('letterSpacing.normal'),
                    lineHeight: theme('lineHeight.none'),
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: theme('borderRadius.lg'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:focus-visible': {
                        outline: '2px solid rgb(99 102 241)',
                        outlineOffset: '2px',
                    },
                    '&:disabled': {
                        opacity: '0.5',
                        cursor: 'not-allowed',
                        transform: 'none',
                    },
                },

                // Glass morphism components
                '.glass': {
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '.dark &': {
                        background: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                },

                // Typography components
                '.heading-display': {
                    fontFamily: theme('fontFamily.display'),
                    fontWeight: theme('fontWeight.extrabold'),
                    lineHeight: theme('lineHeight.tight'),
                    letterSpacing: theme('letterSpacing.tight'),
                },
                '.text-premium': {
                    fontFamily: theme('fontFamily.display'),
                    fontWeight: theme('fontWeight.semibold'),
                    letterSpacing: theme('letterSpacing.wide'),
                    textTransform: 'uppercase',
                    fontSize: theme('fontSize.sm'),
                },
                '.text-elegant': {
                    fontFamily: theme('fontFamily.sans'),
                    fontWeight: theme('fontWeight.light'),
                    letterSpacing: theme('letterSpacing.wide'),
                    lineHeight: theme('lineHeight.loose'),
                },

                // Form enhancements
                '.form-input-enhanced': {
                    fontFamily: theme('fontFamily.sans'),
                    fontSize: theme('fontSize.base'),
                    fontWeight: theme('fontWeight.medium'),
                    letterSpacing: theme('letterSpacing.normal'),
                    lineHeight: theme('lineHeight.normal'),
                    transition: 'all 0.2s ease',
                    '&:focus': {
                        outline: 'none',
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 4px rgba(103, 126, 234, 0.15)',
                    },
                },
                '.form-label-enhanced': {
                    fontFamily: theme('fontFamily.sans'),
                    fontSize: theme('fontSize.sm'),
                    fontWeight: theme('fontWeight.semibold'),
                    color: '#374151',
                    letterSpacing: theme('letterSpacing.normal'),
                    marginBottom: '0.5rem',
                    display: 'block',
                    '.dark &': {
                        color: '#d1d5db',
                    },
                },

                // Loading states
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
            // UTILITY CLASSES - Performance and interaction helpers
            // =============================================================
            addUtilities({
                // GPU acceleration
                '.gpu-accelerated': {
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                },

                // Text shadow utilities
                '.text-shadow-sm': {
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow': {
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow-lg': {
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                },
                '.text-shadow-xl': {
                    textShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                },
                '.text-shadow-none': {
                    textShadow: 'none',
                },

                // Enhanced interactive states
                '.hover-lift': {
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme('boxShadow.hover'),
                    },
                },
                '.hover-glow': {
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': {
                        boxShadow: theme('boxShadow.glow'),
                    },
                },

                // Responsive utilities
                '.mobile-scroll': {
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth',
                },

                // Print utilities
                '.print-hidden': {
                    '@media print': {
                        display: 'none !important',
                    },
                },
                '.print-visible': {
                    '@media print': {
                        display: 'block !important',
                    },
                },
            });
        },
    ],
}