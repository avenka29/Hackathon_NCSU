import { Outlet } from 'react-router-dom';
//{ children }: { children: React.ReactNode }
const Layout = () => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        
        {/*Child is rendered here */}
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>



    </>

  )
}

export default Layout