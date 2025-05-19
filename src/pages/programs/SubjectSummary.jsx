import { useState } from "react";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import axios from "axios";
import { PORT } from "../../utils/constants";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SubjectSummary() {
  const [courses, setCourses] = useState([]);

  const navigate = useNavigate();

  const [curriculumFilter, setCurriculumFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [semFilter, setSemFilter] = useState("All");

  const [programs, setPrograms] = useState([]);

  const [studentCourses, setStudentCourses] = useState([]);

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

  const filteredCourses = courses
    .map((course) => {
      const matchesCurriculum =
        curriculumFilter === "All" ||
        course.curriculumId.toString() === curriculumFilter;
      const matchesYear = yearFilter === "All" || course.year === yearFilter;
      const matchesSem =
        semFilter === "All" || course.sem.toString() === semFilter;

      if (!matchesCurriculum || !matchesYear || !matchesSem) {
        return null;
      }

      // Count Passed, Failed, IP, and HOLD for this course
      const courseStudentData = studentCourses.filter(
        (sc) => sc.courseId === course.id
      );

      const passedCount = courseStudentData.filter(
        (sc) => sc.remark === "PASSED"
      ).length;
      const failedCount = courseStudentData.filter(
        (sc) => sc.remark === "FAILED"
      ).length;
      const ipCount = courseStudentData.filter(
        (sc) => sc.remark === "IP"
      ).length;

      return {
        ...course,
        passedCount,
        failedCount,
        ipCount,
      };
    })
    .filter(Boolean);

  useEffect(() => {
    fetchCourses();
    fetchStudentCourses();
    fetchPrograms();
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
