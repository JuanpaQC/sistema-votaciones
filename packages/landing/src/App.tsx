import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import CandidateGrid from './components/sections/CandidateGrid'
import Features from './components/sections/Features'
import CTA from './components/sections/CTA'
import FAQ from './components/sections/FAQ'

export default function App() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        <CandidateGrid />
        <Features />
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
