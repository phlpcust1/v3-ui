import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function StudentSubjects() {
  const { id } = useParams(); // Get student ID from the URL
  const [student, setStudent] = useState(null);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isProvideGradeModalOpen, setIsProvideGradeModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentCourse, setSelectedStudentCourse] = useState(null);
  const [remark, setRemark] = useState("");

  // Filters
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("FIRST");

  const navigate = useNavigate();

  // Fetch student and their subjects
  const fetchStudentDetails = async () => {
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudent(response.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  // Fetch available courses
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

  const addCourseToStudent = async () => {
    try {
      const payload = {
        studentId: parseInt(id, 10),
        courseId: parseInt(selectedCourseId, 10),
      };

      await axios.post(`${PORT}/student-course`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      setIsAddCourseModalOpen(false);
      setSelectedCourseId("");
      fetchStudentDetails(); // Refresh student courses
    } catch (error) {
      console.error("Error adding course to student:", error);
    }
  };

  const provideGrade = async () => {
    try {
      const payload = {
        ...selectedStudentCourse,
        remark, // Updated remark
      };

      await axios.patch(
        `${PORT}/student-course/${selectedStudentCourse.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setIsProvideGradeModalOpen(false);
      setSelectedStudentCourse(null);
      setRemark("");
      fetchStudentDetails(); // Refresh student courses
    } catch (error) {
      console.error("Error providing grade:", error);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
    fetchCourses();
  }, []);

  if (!student) {
    return <div>Loading...</div>;
  }

  // Filter student courses
  const filteredStudentCourses = student.studentCourse.filter((course) => {
    const matchesSemester =
      semesterFilter === "ALL" ||
      course.course.sem.toString() === semesterFilter;
    const matchesYear =
      yearFilter === "ALL" || course.course.year.toUpperCase() === yearFilter;

    return matchesSemester && matchesYear;
  });

  return (
    <div className="">
      <Sidebar />

      <div className="ml-60 bg-base-200">
        <Navbar />

        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">
            {student.firstName} {student.lastName}'s Subjects
          </h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Tab Navigation */}
              <div className="tabs mb-4">
                <a className="tab tab-bordered tab-active">
                  Student Evaluation
                </a>
                <a className="tab tab-bordered">Academic Advising</a>
              </div>

              {/* Filter Controls */}
              <div className="flex gap-4 mb-4">
                <select
                  className="select select-bordered"
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                >
                  <option value="ALL">All Semesters</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                </select>
                <select
                  className="select select-bordered"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  <option value="ALL">All Years</option>
                  <option value="FIRST">First Year</option>
                  <option value="SECOND">Second Year</option>
                  <option value="THIRD">Third Year</option>
                  <option value="FOURTH">Fourth Year</option>
                </select>
              </div>

              {/* Student Course List */}
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Description</th>
                      <th>Units</th>
                      <th>Sem</th>
                      <th>No. of Takes</th>
                      <th>Remarks</th>
                      {/* <th>Action</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentCourses.map((studentCourse) => (
                      <tr
                        key={studentCourse.id}
                        // className="cursor-pointer hover:bg-red-100"
                        // onClick={() =>
                        //   navigate(
                        //     `/programs/course/${studentCourse.course.id}`
                        //   )
                        // }
                      >
                        <td>{studentCourse.course.subject}</td>
                        <td>{studentCourse.course.description}</td>
                        <td>{studentCourse.course.units}</td>
                        <td>{studentCourse.course.sem}</td>
                        <td>{studentCourse.noTake}</td>
                        <td>
                          {studentCourse.remark === "HOLD"
                            ? "___"
                            : studentCourse.remark}
                        </td>
                        {/* <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setSelectedStudentCourse(studentCourse);
                              setRemark(studentCourse.remark || "");
                              setIsProvideGradeModalOpen(true);
                            }}
                          >
                            Provide Grade
                          </button>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-between items-center mt-4">
                <button
                  className="btn btn-ghost"
                  onClick={() => window.history.back()}
                >
                  Close
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setIsAddCourseModalOpen(true)}
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {isAddCourseModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Course</h3>
            <div className="mt-4">
              <label className="block mb-2">Select Course</label>
              <select
                className="select select-bordered w-full"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">-- Select Course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.subject} - {course.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-success"
                onClick={addCourseToStudent}
                disabled={!selectedCourseId}
              >
                Add Course
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setIsAddCourseModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provide Grade Modal */}
      {isProvideGradeModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Provide Grade</h3>
            <div className="mt-4">
              <label className="block mb-2">Remark</label>
              <select
                className="select select-bordered w-full"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              >
                <option value="">-- Select Remark --</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="IP">IP</option>
                <option value="HOLD">HOLD</option>
              </select>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-success"
                onClick={provideGrade}
                disabled={!remark}
              >
                Save
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setIsProvideGradeModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
