import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function MyStudents() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [trackFilter, setTrackFilter] = useState("ALL");
  const [schoolTerms, setSchoolTerms] = useState([]);
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState("ALL");

  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setSchoolTerms(response.data);
    } catch (error) {
      console.error("Error fetching school terms:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${PORT}/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setPrograms(response.data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const coachId = localStorage.getItem("id"); // Get coach ID from localStorage
      const response = await axios.get(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      // Process students and determine if they are on track
      const processedStudents = response.data.assignments.map((assignment) => {
        const hasFailed = assignment.student.studentCourse.some(
          (course) => course.remark === "FAILED"
        );

        return {
          ...assignment.student,
          isOnTrack: !hasFailed, // Determine track status
        };
      });

      setStudents(processedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchStudents();
    fetchSchoolTerms();
  }, []);

  // Filters for students
  const filteredStudents = students.filter((student) => {
    const matchesYear =
      yearFilter === "ALL" || student.yearLevel.toUpperCase() === yearFilter;

    const matchesProgram =
      programFilter === "ALL" ||
      (student.program && student.program.code.toUpperCase() === programFilter);

    const matchesTrack =
      trackFilter === "ALL" ||
      (trackFilter === "ON_TRACK" && student.isOnTrack) ||
      (trackFilter === "NOT_ON_TRACK" && !student.isOnTrack);

    const matchesSchoolTerm =
      selectedSchoolTerm === "ALL" ||
      student.schoolTermId?.toString() === selectedSchoolTerm;

    return (
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      matchesYear &&
      matchesProgram &&
      matchesTrack &&
      matchesSchoolTerm
    );
  });

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">My Students</h1>
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search students here..."
                    className="input input-bordered w-72"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-4">
                  <select
                    className="select select-bordered"
                    value={selectedSchoolTerm}
                    onChange={(e) => setSelectedSchoolTerm(e.target.value)}
                  >
                    <option value="ALL">All School Terms</option>
                    {schoolTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select select-bordered"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="ALL">All Years</option>
                    <option value="FIRST">1st Year</option>
                    <option value="SECOND">2nd Year</option>
                    <option value="THIRD">3rd Year</option>
                    <option value="FOURTH">4th Year</option>
                  </select>

                  <select
                    className="select select-bordered"
                    value={trackFilter}
                    onChange={(e) => setTrackFilter(e.target.value)}
                  >
                    <option value="ALL">All Tracks</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="NOT_ON_TRACK">Not On Track</option>
                  </select>
                </div>
              </div>
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
                    {filteredStudents.map((student) => (
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
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() =>
                              window.location.assign(
                                `/academic-advising/${student.id}`
                              )
                            }
                          >
                            View Academic Form
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm">1 of 1</p>
                <div className="flex space-x-2">
                  <button className="btn btn-outline">&lt;</button>
                  <button className="btn btn-outline">&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
