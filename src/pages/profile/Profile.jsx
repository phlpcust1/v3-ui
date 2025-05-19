// File: Profile.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    department: "",
    program: "",
    contactNumber: "",
    email: "",
    address: "",
  });

  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token); // Decode the JWT
        console.log("Decoded JWT:", decoded);
        setRole(decoded.role); // Adjust `role` to the correct field in your JWT
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${PORT}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-60 bg-base-200">
        <Navbar />

        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">My Profile</h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Profile Information */}
              <section className="mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <img src="/logo.png" alt="" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {profile.firstName} {profile.lastName}
                    </h2>
                    <p>{profile.role}</p>
                  </div>
                </div>
              </section>

              {/* Personal Information */}
              <section className="mb-8">
                <h3 className="font-semibold text-lg mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={profile.firstName || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={profile.lastName || ""}
                      disabled
                    />
                  </div>
                  <div>
                    {role === "STUDENT" || role === "COACH" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Program
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded"
                          value={profile.program.name || ""}
                          disabled
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded"
                          value={profile.department.name || ""}
                          disabled
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={profile.contactNumber || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full p-2 border rounded"
                      value={profile.email || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      className="w-full p-2 border rounded"
                      value="-- hidden --"
                      disabled
                    />
                    <a
                      href="#"
                      className="text-sm text-red-500 mt-2 inline-block"
                    >
                      Change password?
                    </a>
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section>
                <h3 className="font-semibold text-lg mb-4">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={profile.address || ""}
                      disabled
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end mt-6">
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
