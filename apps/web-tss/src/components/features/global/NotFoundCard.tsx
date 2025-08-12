import { Link, type NotFoundRouteComponent } from '@tanstack/react-router';

export const NotFoundCard: NotFoundRouteComponent = () => {
  return (
    <div className="m-8 flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
};
