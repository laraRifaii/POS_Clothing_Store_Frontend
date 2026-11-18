import BackButton from '../components/backButton';
const UnauthorizedPage = () => {
  return (
    <>
    <header className="mt-4 ml-4">
      <BackButton />
    </header>
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-xl text-gray-700">
          You don't have permission to access this page
        </p>
      </div>
    </div>
    </>
  );
};

export default UnauthorizedPage;
