import { create } from 'zustand'


export const useUIStore = create<{ sidebarOpen: boolean, setSidebar: (v:boolean)=>void }>((set) => ({
sidebarOpen: true,
setSidebar: (v) => set({ sidebarOpen: v })
}))