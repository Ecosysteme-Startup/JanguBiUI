/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'Inter var',
                    ...defaultTheme.fontFamily.sans
                ],
  			serif: [
  				'var(--font-playfair)',
  				...defaultTheme.fontFamily.serif
  			],
  		},
  		maxWidth: {
  			reading: 'var(--reading-measure)'
  		},
  		boxShadow: {
  			'soft-sm': '0 1px 2px 0 hsl(var(--shadow-color) / 0.05), 0 1px 3px -1px hsl(var(--shadow-color) / 0.04)',
  			soft: '0 2px 8px -2px hsl(var(--shadow-color) / 0.08), 0 6px 20px -6px hsl(var(--shadow-color) / 0.07)',
  			'soft-lg': '0 10px 32px -8px hsl(var(--shadow-color) / 0.12), 0 16px 56px -16px hsl(var(--shadow-color) / 0.10)'
  		},
  		transitionTimingFunction: {
  			'out-expo': 'var(--ease-out-expo)',
  			'out-soft': 'var(--ease-out-soft)'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: {
  				DEFAULT: 'hsl(var(--background))',
  				surface: 'hsl(var(--background-surface))',
  				subtle: 'hsl(var(--background-subtle))'
  			},
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			gold: 'hsl(var(--gold))',
  			success: 'hsl(var(--success, 142.1 76.2% 36.3%))',
  			warning: 'hsl(var(--warning, 38 92% 50%))',
  			info: 'hsl(var(--info, 221.2 83.2% 53.3%))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'float-c': {
  				'0%,100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-12px)' }
  			},
  			'float-l': {
  				'0%,100%': { transform: 'translateY(-8px)' },
  				'50%': { transform: 'translateY(4px)' }
  			},
  			'float-r': {
  				'0%,100%': { transform: 'translateY(4px)' },
  				'50%': { transform: 'translateY(-12px)' }
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			// Squelette du mobile : opacité 1 ↔ 0,55, 700 ms par demi-cycle.
  			skeleton: {
  				from: { opacity: '1' },
  				to: { opacity: '0.55' }
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			// Flottement des téléphones : inOut sine (même courbe que le Ken Burns mobile).
  			'float-c': 'float-c 6s cubic-bezier(0.37, 0, 0.63, 1) infinite',
  			'float-l': 'float-l 7s cubic-bezier(0.37, 0, 0.63, 1) infinite',
  			'float-r': 'float-r 5.5s cubic-bezier(0.37, 0, 0.63, 1) infinite',
  			// Remplace le pulse Tailwind (2 s, 0,5) par le rythme du squelette mobile.
  			pulse: 'skeleton 0.7s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate',
  			'fade-in': 'fade-in var(--duration-normal) var(--ease-out-soft)',
  			'fade-in-up': 'fade-in-up var(--duration-normal) var(--ease-out-soft)',
  		}
  	}
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
