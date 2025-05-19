import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function MySubjects() {
  const [studentData, setStudentData] = useState(null);
  const [allCourses, setAllCourses] = useState([]); // For transcript
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("My Subjects"); // "My Subjects" or "Transcript of Records"
  const navigate = useNavigate();

  const [schoolTerms, setSchoolTerms] = useState([]);
  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState("All");

  // New filters for Transcript of Records tab
  const [transcriptYearFilter, setTranscriptYearFilter] = useState("All");
  const [transcriptSemFilter, setTranscriptSemFilter] = useState("All");

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

  const fetchStudentData = async () => {
    try {
      const studentId = localStorage.getItem("id"); // Retrieve student ID from localStorage
      const response = await axios.get(`${PORT}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all courses for transcript
  const fetchAllCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setAllCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchStudentData();
    fetchAllCourses();
    fetchSchoolTerms();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!studentData) {
    return <div>Error: Unable to fetch student data</div>;
  }

  // For "My Subjects" tab: display only subjects that match the student's current year level and are 1st semester.
  const mySubjects = studentData.studentCourse.filter((course) => {
    console.log("course.schoolTermId:", course.schoolTermId); // ✅ Debug

    const matchesTerm =
      selectedSchoolTermId === "All" ||
      course.schoolTermId?.toString() === selectedSchoolTermId;

    return matchesTerm;
  });

  // For "Transcript of Records": first, get courses that belong to the student's program.
  let transcriptCourses = allCourses.filter(
    (course) => course.programId === studentData.program.id
  );

  // Apply additional filters if set.
  if (transcriptYearFilter !== "All") {
    transcriptCourses = transcriptCourses.filter(
      (course) => course.year === transcriptYearFilter
    );
  }
  if (transcriptSemFilter !== "All") {
    transcriptCourses = transcriptCourses.filter(
      (course) => course.sem.toString() === transcriptSemFilter
    );
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8">My Subjects</h1>
          <div className="card bg-white shadow-xl p-8">
            <div>
              <h2 className="font-bold text-lg mb-4">
                {studentData.firstName} {studentData.lastName} -{" "}
                {studentData.studentId}
              </h2>
              <p className="mb-2">
                <strong>Program:</strong> {studentData.program.name}
              </p>
              <p className="mb-8">
                <strong>Year Level:</strong> {studentData.yearLevel}
              </p>
            </div>

            {/* Tabs */}
            <div className="tabs mb-4">
              <button
                className={`tab tab-bordered ${
                  activeTab === "My Subjects" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("My Subjects")}
              >
                My Subjects
              </button>
              <button
                className={`tab tab-bordered ${
                  activeTab === "Transcript of Records" ? "tab-active" : ""
                }`}
                onClick={() => setActiveTab("Transcript of Records")}
              >
                Transcript of Records
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "My Subjects" && (
              <>
                <div className="mb-4">
                  <select
                    className="select select-bordered"
                    value={selectedSchoolTermId}
                    onChange={(e) => setSelectedSchoolTermId(e.target.value)}
                  >
                    <option value="All">All School Terms</option>
                    {schoolTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Subjects Table for My Subjects */}
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Units</th>
                        <th>No of Take</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubjects.map((course) => (
                        <tr key={course.id}>
                          <td>{course.course.subject}</td>
                          <td>{course.course.description}</td>
                          <td>{course.course.units}</td>
                          <td>{course.noTake}</td>
                          <td>
                            {course.remark === "HOLD" ? "_" : course.remark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "Transcript of Records" && (
              <>
                {/* Filters for Transcript */}
                <div className="flex gap-4 mb-4">
                  <select
                    className="select select-bordered"
                    value={transcriptYearFilter}
                    onChange={(e) => setTranscriptYearFilter(e.target.value)}
                  >
                    <option value="All">All Year Levels</option>
                    <option value="FIRST">First Year</option>
                    <option value="SECOND">Second Year</option>
                    <option value="THIRD">Third Year</option>
                    <option value="FOURTH">Fourth Year</option>
                  </select>
                  <select
                    className="select select-bordered"
                    value={transcriptSemFilter}
                    onChange={(e) => setTranscriptSemFilter(e.target.value)}
                  >
                    <option value="All">All Semesters</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>

                {/* Transcript Table */}
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Units</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transcriptCourses.map((course) => {
                        // Check if student has taken this course
                        const studentRecord = studentData.studentCourse.find(
                          (sc) => sc.courseId === course.id
                        );
                        return (
                          <tr key={course.id}>
                            <td>{course.subject}</td>
                            <td>{course.description}</td>
                            <td>{course.units}</td>
                            <td>
                              {studentRecord
                                ? studentRecord.remark === "HOLD"
                                  ? "_"
                                  : studentRecord.remark
                                : "Not Taken"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end">
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/academic-advising/${studentData.id}`)}
              >
                View AcadForm
              </button>
              <button className="btn btn-ghost ml-4">Close</button>
              <button className="btn btn-outline ml-4">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
