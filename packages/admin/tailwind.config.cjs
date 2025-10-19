module.exports = {
content: [
'./index.html',
'./src/**/*.{ts,tsx}',
],
theme: {
extend: {
colors: {
primary: {
50: '#eef6ff', 100: '#d9ecff', 200: '#bfe0ff', 300: '#93caff',
400: '#60aaff', 500: '#3b82f6', 600: '#2e6ad8', 700: '#2555ad',
800: '#1e448a', 900: '#193a73'
},
neutral: {
900: '#0b1020', 800: '#121a2e', 700: '#1b2742', 600: '#223052',
500: '#2a3a62', 400: '#394a79', 300: '#64748b', 200: '#94a3b8',
100: '#cbd5e1', 50: '#e2e8f0'
}
},
boxShadow: {
soft: '0 10px 30px -12px rgba(0,0,0,0.25)'
},
borderRadius: {
'2xl': '1.25rem'
}
}
},
plugins: []
}