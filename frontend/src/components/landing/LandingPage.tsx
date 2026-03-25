import { Nav } from './Nav'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { WhySection } from './WhySection'
import { Features } from './Features'
import { CTA } from './CTA'
import { Footer } from './Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <WhySection />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
