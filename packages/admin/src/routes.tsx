import { lazy } from 'react'


export const routes = [
{ path: '/', element: lazy(()=>import('./pages/Dashboard')) },
{ path: '/elections', element: lazy(()=>import('./pages/Elections')) },
{ path: '/elections/:id', element: lazy(()=>import('./pages/ElectionDetail')) },
{ path: '/candidates', element: lazy(()=>import('./pages/Candidates')) },
{ path: '/voters', element: lazy(()=>import('./pages/Voters')) },
{ path: '/audits', element: lazy(()=>import('./pages/Audits')) },
{ path: '/settings', element: lazy(()=>import('./pages/Settings')) },
]