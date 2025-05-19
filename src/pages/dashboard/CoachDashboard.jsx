import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function CoachDashboard() {
  const [students, setStudents] = useState([]);
  const [onTrackCount, setOnTrackCount] = useState(0);
  const [notOnTrackCount, setNotOnTrackCount] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const coachId = localStorage.getItem("id"); // Get coach ID from localStorage
      const response = await axios.get(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const processedStudents = response.data.assignments.map((assignment) => {
        const hasFailed = assignment.student.studentCourse.some(
          (course) => course.remark === "FAILED"
        );

        return {
          ...assignment.student,
          isOnTrack: !hasFailed,
        };
      });

      setStudents(processedStudents);

      // Count on-track and not-on-track students
      const onTrack = processedStudents.filter(
        (student) => student.isOnTrack
      ).length;
      const notOnTrack = processedStudents.filter(
        (student) => !student.isOnTrack
      ).length;

      setOnTrackCount(onTrack);
      setNotOnTrackCount(notOnTrack);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">Dashboard</h1>

          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card bg-white shadow-xl p-4 flex items-center">
              <div className="flex-1">
                <h2 className="text-lg font-bold">No. of Students Handle</h2>
                <p className="text-2xl">{students.length}</p>
              </div>
            </div>
            <div className="card bg-white shadow-xl p-4 flex items-center">
              <div className="flex-1">
                <h2 className="text-lg font-bold">On Track Students</h2>
                <p className="text-2xl">{onTrackCount}</p>
              </div>
            </div>
            <div className="card bg-white shadow-xl p-4 flex items-center">
              <div className="flex-1">
                <h2 className="text-lg font-bold">Not On Track Students</h2>
                <p className="text-2xl">{notOnTrackCount}</p>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <h2 className="text-lg font-bold mb-4">List of Students</h2>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student No.</th>
                      <th>Year Level</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 6).map((student) => (
                      <tr key={student.id}>
                        <td>
                          {student.firstName} {student.lastName}
                        </td>
                        <td>{student.studentId}</td>
                        <td>{student.yearLevel}</td>
                        <td>
                          <span
                            className={`badge ${
                              student.isOnTrack
                                ? "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {student.isOnTrack ? "On Track" : "Not On Track"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() =>
                              window.location.assign(
                                `/my-students/${student.id}`
                              )
                            }
                          >
                            View Subjects
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => window.location.assign("/my-students")}
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
