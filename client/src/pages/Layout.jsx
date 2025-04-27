import React from "react";
import Header from "./Header";  
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div>
            <Header />
            <main className="py-16"> 
                <Outlet /> 
            </main>
        </div>
    );
};

export default Layout;
