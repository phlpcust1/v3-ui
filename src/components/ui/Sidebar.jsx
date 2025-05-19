import {
  FaBell,
  FaCircleUser,
  FaDoorOpen,
  FaFile,
  FaFileInvoice,
  FaGraduationCap,
  FaUserGroup,
} from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useEffect } from "react";

export function Sidebar() {
  const allItems = {
    STUDENT: [
      { name: "Profile", icon: FaCircleUser, path: "/profile" },
      { name: "My Subjects", icon: FaFile, path: "/my-subjects" },
      {
        name: "Curriculum Coach",
        icon: FaUserGroup,
        path: "/curriculum-coach",
      },
      // { name: "Notifications", icon: FaBell, path: "/notifications" },
      {
        name: "Logout",
        icon: FaDoorOpen,
        path: "/logout",
        onClick: () => {
          localStorage.removeItem("access_token");
          navigate("/login");
        },
      },
    ],
    COACH: [
      { name: "Profile", icon: FaCircleUser, path: "/profile" },
      { name: "Dashboard", icon: FaFileInvoice, path: "/dashboard" },
      { name: "List of Students", icon: FaGraduationCap, path: "/my-students" },
      { name: "Summary", icon: FaFile, path: "/summary" },
      {
        name: "Logout",
        icon: FaDoorOpen,
        path: "/logout",
        onClick: () => {
          localStorage.removeItem("access_token");
          navigate("/login");
        },
      },
    ],

    DEAN: [
      { name: "Profile", icon: FaCircleUser, path: "/profile" },
      { name: "Students", icon: FaGraduationCap, path: "/students" },
      { name: "Coaches", icon: FaUserGroup, path: "/coaches" },
      { name: "Manage Coaching", icon: FaUserGroup, path: "/manage-coaching" },
      { name: "Curriculum", icon: FaFile, path: "/curriculum" },
      { name: "Programs", icon: FaFileInvoice, path: "/programs" },
      { name: "Summary", icon: FaFile, path: "/summary" },
      // { name: "Notifications", icon: FaBell, path: "/notifications" },
      {
        name: "Logout",
        icon: FaDoorOpen,
        path: "/logout",
        onClick: () => {
          localStorage.removeItem("access_token");
          navigate("/login");
        },
      },
    ],
    HEAD: [
      { name: "Profile", icon: FaCircleUser, path: "/profile" },
      // { name: "Curriculum", icon: FaFile, path: "/curriculum" },
      { name: "Programs", icon: FaFileInvoice, path: "/programs" },
      { name: "Summary", icon: FaFile, path: "/summary" },
      // { name: "Notifications", icon: FaBell, path: "/notifications" },
      {
        name: "Logout",
        icon: FaDoorOpen,
        path: "/logout",
        onClick: () => {
          localStorage.removeItem("access_token");
          navigate("/login");
        },
      },
    ],
  };

  // Get items for the current role

  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const items = allItems[userRole] || [];

  // Decode the role from JWT
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role); // Replace 'role' with the correct field in your JWT payload
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  return (
    <aside className="fixed h-screen w-60 bg-white py-4 border-r-2">
      <div className="h-full flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center">
          <img src="/logo.png" alt="" className="w-24 h-24" />
          <h6 className="font-bold">Curriculum Advising</h6>
          <p className="text-sm">Management System</p>
        </div>
        <ul className="p-2 text-base-content space-y-2">
          {items.map((item) => (
            <li
              key={item.name}
              className={`flex font-semibold items-center gap-3 p-2 ${
                location.pathname.startsWith(item.path)
                  ? "bg-red-500 text-white"
                  : "hover:bg-base-200 text-gray-600"
              }  hover:cursor-pointer rounded-md`}
              onClick={item.onClick ? item.onClick : () => navigate(item.path)}
            >
              <item.icon className="w-6 h-6 " />
              <p className="text-sm">{item.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
