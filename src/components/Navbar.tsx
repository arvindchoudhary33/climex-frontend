import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({
    to,
    children,
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-sm font-medium ${
        location.pathname === to
          ? "bg-slate-100 text-slate-900"
          : "text-slate-500 hover:bg-slate-50"
      }`}
      onClick={() => setIsMobileMenuOpen(false)} // Close menu when link is clicked
    >
      {children}
    </Link>
  );

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <Logo />
            </Link>
            <div className="hidden md:flex ml-10 items-center space-x-4">
              <NavLink to="/dashboard">Dashboard</NavLink>
              {isSuperAdmin && <NavLink to="/users">User Management</NavLink>}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-slate-600"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-4">
            <div className="space-y-2 px-2">
              <NavLink to="/dashboard">Dashboard</NavLink>
              {isSuperAdmin && <NavLink to="/users">User Management</NavLink>}
            </div>
            <div className="border-t pt-4 px-2">
              <div className="text-sm text-slate-500 mb-2">
                Welcome, {user?.name}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
