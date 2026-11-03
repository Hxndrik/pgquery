import { Toaster } from 'sonner'
import AppLayout from './components/app/AppLayout'

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: 2,
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg-card)',
            color: 'var(--fg)',
            fontFamily: 'inherit',
          },
        }}
      />
      <AppLayout />
    </>
  )
}
