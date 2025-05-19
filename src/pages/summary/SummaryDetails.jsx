import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { PORT } from "../../utils/constants";

export default function SummaryDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [remarkFilter, setRemarkFilter] = useState("ALL");

  const navigate = useNavigate();

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get(`${PORT}/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course details:", error);
    }
  };

  const fetchStudentsEnrolled = async () => {
    try {
      const response = await axios.get(
        `${PORT}/student-course?courseId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
    fetchStudentsEnrolled();
  }, [id]);

  const filteredStudents = students.filter(
    (student) =>
      student.remark !== "HOLD" && // Exclude students with HOLD status
      (remarkFilter === "ALL" || student.remark === remarkFilter)
  );

  const formatYearLevel = (yearLevel) => {
    switch (yearLevel) {
      case "FIRST":
        return "1st Year";
      case "SECOND":
        return "2nd Year";
      case "THIRD":
        return "3rd Year";
      case "FOURTH":
        return "4th Year";
      default:
        return "Unknown";
    }
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">
            {course.description} - List of Enrolled Students
          </h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Filter for Student Remarks */}
              <div className="flex justify-start mb-4">
                <select
                  className="select select-bordered"
                  value={remarkFilter}
                  onChange={(e) => setRemarkFilter(e.target.value)}
                >
                  <option value="ALL">All Remarks</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="IP">In Progress (IP)</option>
                </select>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Year Level</th>
                      <th>Program</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() =>
                          navigate(`/my-students/${student.student.id}`)
                        }
                      >
                        <td>
                          {student.student.firstName} {student.student.lastName}
                        </td>
                        <td>{student.student.email}</td>
                        <td>{formatYearLevel(student.student.yearLevel)}</td>
                        <td>{student.student.program.code}</td>
                        <td>
                          {student.remark === "HOLD" ? "_" : student.remark}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
