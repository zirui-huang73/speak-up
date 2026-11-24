import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './app/AppProvider'
import { Layout } from './app/Layout'
import { InstallPage, MorePage, SettingsPage, StoragePage } from './features/more/MorePages'
import { PlansPage } from './features/plans/PlansPage'
import { PlansProvider } from './features/plans/PlansProvider'
import { ProgressPage } from './features/ProgressPage'
import { TodayPage } from './features/TodayPage'

export default function App() {
  return (
    <AppProvider>
      <PlansProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TodayPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="more/settings" element={<SettingsPage />} />
              <Route path="more/storage" element={<StoragePage />} />
              <Route path="more/install" element={<InstallPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </PlansProvider>
    </AppProvider>
  )
}
