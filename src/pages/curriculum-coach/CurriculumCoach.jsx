import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function CurriculumCoach() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Decode the token to get the student ID
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = jwtDecode(token);
      const studentId = decoded.sub; // 'sub' contains the user ID in the token

      // Fetch student data
      fetchStudentData(studentId);
    }
  }, []);

  const fetchStudentData = async (id) => {
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!studentData) {
    return <div>No data available</div>;
  }

  const coach = studentData.assignment?.coach;

  return (
    <div className="">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-60 bg-base-200">
        <Navbar />

        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">My Coach</h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Coach Info */}
              {coach ? (
                <div className="text-center">
                  <img
                    src="/logo.png"
                    alt="Coach Avatar"
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold">{`${coach.firstName} ${coach.lastName}`}</h2>
                  <p className="text-sm text-gray-600">{coach.role}</p>
                  <p className="text-sm text-gray-600">
                    <i className="fa fa-envelope mr-2"></i>
                    {coach.email}
                  </p>

                  <div className="mt-6">
                    <h3 className="text-md font-bold bg-gray-200 p-2 rounded-t">
                      Coach Details
                    </h3>
                    <div className="bg-gray-100 p-4 rounded-b">
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-sm font-bold">First Name</p>
                          <p className="text-sm">{coach.firstName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Last Name</p>
                          <p className="text-sm">{coach.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Course ID</p>
                          <p className="text-sm">{coach.coachId}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Department</p>
                          <p className="text-sm">
                            {studentData.program?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Email</p>
                          <p className="text-sm">{coach.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Address</p>
                          <p className="text-sm">{coach.address || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    No assigned coach found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
