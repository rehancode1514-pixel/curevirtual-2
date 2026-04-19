import React from "react";
import { NavLink } from "react-router-dom";

export default function PremiumBottomNavBar() {
  const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/patient/dashboard" },
    { icon: "history_edu", label: "Records", path: "/patient/history" },
    { icon: "medication", label: "Meds", path: "/patient/meds" },
    { icon: "local_pharmacy", label: "Pharmacy", path: "/patient/select-pharmacy" },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 glass-panel rounded-t-[32px] flex justify-around items-center px-4 pt-2 pb-6 md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center p-2 transition-all duration-300 ${
              isActive ? "text-primary scale-110 font-bold" : "text-outline hover:text-primary"
            }`
          }
        >
          <span 
            className="material-symbols-outlined mb-1" 
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            {item.icon}
          </span>
          <span className="text-[10px] font-bold tracking-tight uppercase leading-none">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
