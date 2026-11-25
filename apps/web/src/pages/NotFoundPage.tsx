import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-slate-600">
        The page you are looking for does not exist.{' '}
        <Link to="/" className="text-indigo-700 hover:underline">
          Back to the catalog
        </Link>
        .
      </p>
    </section>
  );
}
