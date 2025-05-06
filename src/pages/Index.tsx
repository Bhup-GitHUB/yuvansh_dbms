
import LoginForm from '@/components/LoginForm';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Attendance Management System
          </h1>
          <p className="text-gray-600">
            Login to access your attendance portal
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Index;
