import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { Providers } from './app/providers'
import { AppInitializer } from './app/AppInitializer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppInitializer>
        <App />
      </AppInitializer>
    </Providers>
  </StrictMode>,
)
