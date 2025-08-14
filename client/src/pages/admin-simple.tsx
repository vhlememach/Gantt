import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function AdminSimple() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  console.log('=== SIMPLE ADMIN TEST ===', {
    user,
    isLoading,
    isAdmin: user?.isAdmin
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Please log in to access admin panel.</div>;
  }

  if (!user.isAdmin) {
    return <div className="p-8">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        ← Back to Dashboard
      </Button>
      
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      <p className="mb-4">Welcome {user.email}!</p>
      
      <div className="bg-green-100 p-4 rounded">
        <h2 className="text-xl font-semibold text-green-800">Success!</h2>
        <p className="text-green-700">Admin page is working correctly.</p>
        <p className="text-green-700">User: {user.email} (Admin: {user.isAdmin ? 'Yes' : 'No'})</p>
      </div>
    </div>
  );
}