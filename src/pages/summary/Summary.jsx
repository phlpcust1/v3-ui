import { useState } from "react";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import axios from "axios";
import { PORT } from "../../utils/constants";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Summary() {
  const [courses, setCourses] = useState([]);

  const navigate = useNavigate();

  const [curriculumFilter, setCurriculumFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [semFilter, setSemFilter] = useState("All");

  const [programs, setPrograms] = useState([]);

  const [studentCourses, setStudentCourses] = useState([]);

  const [schoolTerms, setSchoolTerms] = useState([]);
  const [schoolTermFilter, setSchoolTermFilter] = useState("All");

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

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchStudentCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/student-course`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudentCourses(response.data);
    } catch (error) {
      console.error("Error fetching student-course data:", error);
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

  const selectedTermId =
    schoolTermFilter === "All" ? null : Number(schoolTermFilter);

  const filteredStudentCourses = studentCourses.filter((sc) => {
    const course = courses.find((c) => c.id === sc.courseId);
    if (!course) return false;

    const matchesTerm =
      selectedTermId === null || sc.schoolTermId === selectedTermId;
    const matchesYear = yearFilter === "All" || course.year === yearFilter;
    const matchesSem =
      semFilter === "All" || course.sem.toString() === semFilter;

    return matchesTerm && matchesYear && matchesSem;
  });

  // Group by courseId and aggregate
  const summaryMap = new Map();

  filteredStudentCourses.forEach((sc) => {
    const course = courses.find((c) => c.id === sc.courseId);
    if (!course) return;

    if (!summaryMap.has(course.id)) {
      summaryMap.set(course.id, {
        ...course,
        passedCount: 0,
        failedCount: 0,
        ipCount: 0,
      });
    }

    const entry = summaryMap.get(course.id);
    if (sc.remark === "PASSED") entry.passedCount++;
    else if (sc.remark === "FAILED") entry.failedCount++;
    else if (sc.remark === "IP") entry.ipCount++;
  });

  const filteredCourses = Array.from(summaryMap.values());

  useEffect(() => {
    fetchCourses();
    fetchStudentCourses();
    fetchPrograms();
    fetchSchoolTerms();
  }, []);

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">Summary</h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 mb-4">
                    <select
                      className="select select-bordered"
                      value={schoolTermFilter}
                      onChange={(e) => setSchoolTermFilter(e.target.value)}
                    >
                      <option value="All">All Terms</option>
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
                      <option value="All">All Years</option>
                      <option value="FIRST">First Year</option>
                      <option value="SECOND">Second Year</option>
                      <option value="THIRD">Third Year</option>
                      <option value="FOURTH">Fourth Year</option>
                    </select>
                    <select
                      className="select select-bordered"
                      value={semFilter}
                      onChange={(e) => setSemFilter(e.target.value)}
                    >
                      <option value="All">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr
                          key={course.id}
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => navigate(`/summary/${course.id}`)}
                        >
                          <td>{course.subject}</td>
                          <td>{course.description}</td>
                          <td>{course.passedCount}</td>
                          <td>{course.failedCount}</td>
                          <td>{course.ipCount}</td>
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
    </div>
  );
}
