import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicLayout } from './layouts/PublicLayout'
import { WorkspaceLayout } from './layouts/WorkspaceLayout'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentDetailPage } from './pages/DocumentDetailPage'
import { EditDocumentPage } from './pages/EditDocumentPage'
import { ExplorePage } from './pages/ExplorePage'
import { LandingPage } from './pages/LandingPage'
import { MyDocumentsPage } from './pages/MyDocumentsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SettingsPage } from './pages/SettingsPage'
import { UploadPage } from './pages/UploadPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
        </Route>

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate replace to="/app/dashboard" />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="documents" element={<MyDocumentsPage />} />
          <Route path="documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="documents/:documentId/edit" element={<EditDocumentPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
