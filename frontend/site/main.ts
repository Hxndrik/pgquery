import './site.css'

// Copy buttons: <button data-copy="text">.
document.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy]')
  if (!button) return
  const label = button.textContent
  try {
    await navigator.clipboard.writeText(button.dataset.copy ?? '')
    button.textContent = 'Copied'
  } catch {
    button.textContent = 'Select it'
  }
  setTimeout(() => (button.textContent = label), 1600)
})
