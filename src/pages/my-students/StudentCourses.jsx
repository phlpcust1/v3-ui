import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function StudentCourses() {
  const { id } = useParams(); // Get student ID from the URL
  const [student, setStudent] = useState(null);

  // For adding courses
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // For providing grades
  const [isProvideGradeModalOpen, setIsProvideGradeModalOpen] = useState(false);
  const [selectedStudentCourse, setSelectedStudentCourse] = useState(null);
  const [remark, setRemark] = useState("");

  // For all courses in the system
  const [courses, setCourses] = useState([]);

  // Filters for the Student Evaluation table
  const [semesterFilter, setSemesterFilter] = useState("1");
  const [yearFilter, setYearFilter] = useState("FIRST");

  // **New**: Search terms
  const [evaluationSearchTerm, setEvaluationSearchTerm] = useState("");
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState("Student Evaluation");

  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState("");
  const [schoolTerms, setSchoolTerms] = useState([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  const [isUploadGradesModalOpen, setIsUploadGradesModalOpen] = useState(false);
  const [gradesCsvFile, setGradesCsvFile] = useState(null);

  // Fetch student
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

  // Fetch all courses
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

  // Add a course to the student
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
      fetchStudentDetails(); // Refresh student data
    } catch (error) {
      console.error("Error adding course to student:", error);
    }
  };

  // Provide a grade/remark
  const provideGrade = async () => {
    if (!selectedStudentCourse) return;
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

  useEffect(() => {
    fetchStudentDetails();
    fetchCourses();
    fetchSchoolTerms();
  }, []);

  if (!student) {
    return <div>Loading...</div>;
  }

  // ---------------------------------------------------
  // STUDENT EVALUATION FILTERING
  // ---------------------------------------------------
  const filteredStudentCourses = student.studentCourse.filter((sc) => {
    const matchesSchoolTerm =
      selectedSchoolTermId === "" ||
      sc.schoolTermId.toString() === selectedSchoolTermId;

    const matchesSemester =
      semesterFilter === "ALL" || sc.course.sem.toString() === semesterFilter;

    const matchesYear =
      yearFilter === "ALL" || sc.course.year.toUpperCase() === yearFilter;

    // **New**: Matches search on subject or description
    const lowerSearch = evaluationSearchTerm.toLowerCase();
    const matchesSearch =
      evaluationSearchTerm === "" ||
      sc.course.subject.toLowerCase().includes(lowerSearch) ||
      sc.course.description.toLowerCase().includes(lowerSearch);

    return matchesSchoolTerm;
  });

  // ---------------------------------------------------
  // TRANSCRIPT OF RECORDS FILTERING
  // ---------------------------------------------------
  // Example assumption: course.programId === student.programId
  // If you use curriculumId, adapt accordingly.
  const transcriptCourses = courses.filter((course) => {
    if (course.programId !== student.programId) return false;

    // **New**: Filter by subject or description
    const lowerSearch = transcriptSearchTerm.toLowerCase();
    const matchesSearch =
      transcriptSearchTerm === "" ||
      course.subject.toLowerCase().includes(lowerSearch) ||
      course.description.toLowerCase().includes(lowerSearch);

    return matchesSearch;
  });

  // We'll map over these transcriptCourses and see if the student
  // has a record for each (to show remarks, no. of takes, etc.).
  // If not, we can show "Not Taken" or another placeholder.
  // ---------------------------------------------------

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
              {/* Tabs */}
              <div className="tabs mb-4">
                <a
                  className={`tab tab-bordered ${
                    activeTab === "Student Evaluation" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("Student Evaluation")}
                >
                  Student Evaluation
                </a>
                <a
                  className={`tab tab-bordered ${
                    activeTab === "Transcript of Records" ? "tab-active" : ""
                  }`}
                  onClick={() => setActiveTab("Transcript of Records")}
                >
                  Transcript of Records
                </a>
              </div>

              {/* STUDENT EVALUATION TAB */}
              {activeTab === "Student Evaluation" && (
                <>
                  {/* Filter Controls */}
                  <div className="flex gap-4 mb-4">
                    {/* Search by subject/description */}
                    {/* <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Search subject or description..."
                      value={evaluationSearchTerm}
                      onChange={(e) => setEvaluationSearchTerm(e.target.value)}
                    /> */}

                    <div>
                      <select
                        className="select select-bordered w-full mb-4"
                        value={selectedSchoolTermId}
                        onChange={(e) =>
                          setSelectedSchoolTermId(e.target.value)
                        }
                        required
                      >
                        <option value="">-- Select School Term --</option>
                        {schoolTerms.map((term) => (
                          <option key={term.id} value={term.id}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudentCourses.map((sc) => (
                          <tr key={sc.id}>
                            <td>{sc.course.subject}</td>
                            <td>{sc.course.description}</td>
                            <td>{sc.course.units}</td>
                            <td>{sc.course.sem}</td>
                            <td>{sc.noTake}</td>
                            <td>{sc.remark === "HOLD" ? "___" : sc.remark}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                  setSelectedStudentCourse(sc);
                                  setRemark(sc.remark || "");
                                  setIsProvideGradeModalOpen(true);
                                }}
                              >
                                Provide Grade
                              </button>
                            </td>
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
                      onClick={() => setIsUploadModalOpen(true)}
                      disabled={!selectedSchoolTermId}
                    >
                      Upload Subjects
                    </button>

                    <button
                      className="btn btn-outline"
                      onClick={() => setIsUploadGradesModalOpen(true)}
                      disabled={!selectedSchoolTermId}
                    >
                      Upload Grades
                    </button>
                  </div>
                </>
              )}

              {/* TRANSCRIPT OF RECORDS TAB */}
              {activeTab === "Transcript of Records" && (
                <>
                  {/* Search by subject/description for Transcript */}
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Search subject or description..."
                      value={transcriptSearchTerm}
                      onChange={(e) => setTranscriptSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Description</th>
                          <th>Units</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transcriptCourses.map((course) => {
                          // Check if the student has a record for this course
                          const studentCourse = student.studentCourse.find(
                            (sc) => sc.courseId === course.id
                          );
                          return (
                            <tr key={course.id}>
                              <td>{course.subject}</td>
                              <td>{course.description}</td>
                              <td>{course.units}</td>
                              <td>
                                {studentCourse
                                  ? studentCourse.remark === "HOLD"
                                    ? "IP"
                                    : studentCourse.remark
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
            </div>
          </div>
        </div>
      </div>

      {isUploadGradesModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Student Grades</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (!gradesCsvFile || !selectedSchoolTermId) {
                  alert("Please select a school term and CSV file.");
                  return;
                }

                const formData = new FormData();
                formData.append("file", gradesCsvFile);
                formData.append("schoolTermId", selectedSchoolTermId);
                formData.append("studentId", id); // still per student

                try {
                  await axios.post(
                    `${PORT}/student-course/upload-grades`,
                    formData,
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "access_token"
                        )}`,
                        "Content-Type": "multipart/form-data",
                      },
                    }
                  );
                  alert("Grades upload successful");
                  setIsUploadGradesModalOpen(false);
                  setGradesCsvFile(null);
                  fetchStudentDetails();
                } catch (err) {
                  console.error("Upload failed:", err);
                  alert("Upload failed");
                }
              }}
              className="grid gap-4 mt-4"
            >
              <div>
                <label className="block mb-2">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setGradesCsvFile(e.target.files[0])}
                />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-success">
                  Upload
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsUploadGradesModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {isUploadModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Student Subjects</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (!csvFile || !selectedSchoolTermId) {
                  alert("Please select a school term and CSV file.");
                  return;
                }

                const formData = new FormData();
                formData.append("file", csvFile);
                formData.append("schoolTermId", selectedSchoolTermId);
                formData.append("studentId", id); // Pass student ID

                try {
                  await axios.post(`${PORT}/student-course/upload`, formData, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem(
                        "access_token"
                      )}`,
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  alert("Upload successful");
                  setIsUploadModalOpen(false);
                  setCsvFile(null);
                  fetchStudentDetails(); // Refresh
                } catch (err) {
                  console.error("Upload failed:", err);
                  alert("Upload failed");
                }
              }}
              className="grid gap-4 mt-4"
            >
              <div>
                <label className="block mb-2">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-success">
                  Upload
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
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
