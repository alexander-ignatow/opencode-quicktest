import { Link, Outlet, Route, Routes } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage.tsx';
import WorkPage from './pages/WorkPage.tsx';
import WorksCatalogPage from './pages/WorksCatalogPage.tsx';

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-bold text-slate-900">
            BookCast
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WorksCatalogPage />} />
        <Route path="works/:slug" element={<WorkPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
