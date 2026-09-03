import Footer from "@/modules/home/layout/Footer";
import Header from "@/modules/home/layout/Header";
import { Outlet } from "react-router-dom";
const UserLayout = () => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="content pt-20 lg:pt-24 min-h-screen flex flex-col">
        {/* <Sidebar /> */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
      <Footer/>
    </div>
  );
};

export default UserLayout;
