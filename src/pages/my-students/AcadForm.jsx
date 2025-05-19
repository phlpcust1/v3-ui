import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function AcadForm() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [existingAcadForm, setExistingAcadForm] = useState(null);
  const [coachRemarks, setCoachRemarks] = useState("");
  const [planOfAction, setPlanOfAction] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const userRole = localStorage.getItem("role");

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [planFilterYear, setPlanFilterYear] = useState("All");
  const [planFilterSem, setPlanFilterSem] = useState("All");

  const navigate = useNavigate();

  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState(null);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("All");

  const fetchCurriculums = async () => {
    try {
      const response = await axios.get(`${PORT}/curriculums`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCurriculums(response.data);
    } catch (error) {
      console.error("Error fetching curriculums:", error);
    }
  };

  const [schoolTerms, setSchoolTerms] = useState([]);
  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const terms = response.data;
      setSchoolTerms(terms);

      // Set default if none is selected yet
      if (terms.length > 0 && !selectedSchoolTermId) {
        setSelectedSchoolTermId(terms[0].id); // default to first
      }
    } catch (error) {
      console.error("Error fetching school terms:", error);
    }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const allSubjects = response.data;
      setAvailableSubjects(allSubjects);

      // Prefill Plan of Action with sem == 2 subjects for student's year and selected term
      // if (student && selectedSchoolTermId) {
      //   const filtered = allSubjects.filter(
      //     (course) => course.year === student.yearLevel && course.sem === 2
      //   );
      //   setPlanOfAction(filtered);
      // }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleOpenPlanModal = () => {
    setIsPlanModalOpen(true);
    fetchAvailableSubjects();
  };

  const handleSubmitForm = async () => {
    if (!selectedSchoolTermId) {
      alert("Please select a school term.");
      return;
    }

    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction,
        studentId: parseInt(id, 10),
        schoolTermId: selectedSchoolTermId, // ✅ include this
      };

      await axios.post(`${PORT}/acadforms`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      alert("Advising form submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting advising form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudent(response.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  const fetchAcadForm = async (studentId, schoolTermId) => {
    try {
      const response = await axios.get(
        `${PORT}/acadforms/student/${studentId}?schoolTermId=${schoolTermId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      const form = response.data;

      if (form) {
        setExistingAcadForm(form);
        setCoachRemarks(form.recommendation || "");
        setPlanOfAction(form.subjectPlan || []);
      } else {
        // No form exists for that term — start fresh
        setExistingAcadForm(null);
        setCoachRemarks("");
        setPlanOfAction([]);
      }
    } catch (error) {
      console.error("Error fetching academic form:", error);
      setExistingAcadForm(null);
      setCoachRemarks("");
      setPlanOfAction([]);
    }
  };

  const handleUpdateForm = async () => {
    if (!selectedSchoolTermId) {
      alert("Please select a school term.");
      return;
    }

    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction,
        schoolTermId: selectedSchoolTermId, // ✅ required update
      };

      await axios.patch(`${PORT}/acadforms/${existingAcadForm.id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      alert("Academic form updated successfully!");
      setIsEditing(false);
      fetchAcadForm();
    } catch (error) {
      console.error("Error updating form:", error);
      alert("An error occurred while updating the form.");
    }
  };

  useEffect(() => {
    if (student && selectedSchoolTermId) {
      fetchAcadForm(student.id, selectedSchoolTermId);
      fetchAvailableSubjects();
    }
  }, [student, selectedSchoolTermId]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchStudentData();
      await fetchSchoolTerms();
      fetchCurriculums();
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (student && selectedSchoolTermId) {
      fetchAvailableSubjects(); // only call once both are ready
    }
  }, [student, selectedSchoolTermId]);

  const handleCheckboxChange = (subject, isChecked) => {
    if (isChecked) {
      setSelectedSubjects((prev) => [...prev, subject]);
    } else {
      setSelectedSubjects((prev) => prev.filter((s) => s.id !== subject.id));
    }
  };

  const handleAddSelectedToPlan = () => {
    if (selectedSubjects.length > 0) {
      setPlanOfAction([...planOfAction, ...selectedSubjects]);
      setSelectedSubjects([]);
      setIsPlanModalOpen(false);
    } else {
      alert("Please select at least one subject.");
    }
  };

  if (isLoading || !student) return <div>Loading...</div>;

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-8">
          <div className="card bg-white p-8 rounded-t-2xl">
            <div>
              <select
                className="float-right border px-4 py-1 rounded-sm"
                value={selectedSchoolTermId || ""}
                onChange={(e) =>
                  setSelectedSchoolTermId(Number(e.target.value))
                }
              >
                <option value="">Select School Term</option>
                {schoolTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-b border-slate-400 py-4">
              <h1 className="text-center font-medium text-xl">
                Academic Advising Form
              </h1>
            </div>

            <div className="grid grid-cols-2 py-4 gap-4">
              <div>
                <div className="font-medium text-md space-y-3">
                  <div className="flex items-end gap-5">
                    <p>Student Number:</p>
                    <div className="border-b border-slate-700 w-60 px-2">
                      <p>{student.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-8">
                    <p>Student Name:</p>
                    <div className="border-b border-slate-700 w-60 px-2">
                      <p>
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto mt-5">
                  <table className="table">
                    <thead className="text-slate-900">
                      <tr>
                        <th></th>
                        <th>Subject(s) Currently Enrolled</th>
                        <th>Units Earned</th>
                        <th>Final Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.studentCourse
                        .filter((course) => {
                          return course.schoolTermId === selectedSchoolTermId;
                        })
                        .map((course, index) => (
                          <tr key={course.id}>
                            <th>{index + 1}</th>
                            <td>
                              {course.course.subject} -{" "}
                              {course.course.description}
                            </td>
                            <td>{course.course.units}</td>
                            <td>{course.remark || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="font-medium text-md space-y-3">
                <div className="flex items-end gap-5">
                  <p>Course:</p>
                  <div className="border-b border-slate-700 min-w-80 px-2">
                    <p>{student.program.name}</p>
                  </div>
                </div>
                <div className="flex items-end gap-8">
                  <p>Year Level:</p>
                  <div className="border-b border-slate-700 w-60 px-2">
                    <p>{student.yearLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-center font-medium text-xl">PLAN OF ACTIONS</h1>
          </div>
          <div className="card bg-white p-8 rounded-b-2xl mt-4">
            <div>
              {userRole !== "STUDENT" && (
                <button
                  className="btn float-right rounded-xl bg-slate-600 px-6 text-slate-100"
                  onClick={handleOpenPlanModal}
                >
                  Add Plan
                </button>
              )}
            </div>
            <div className="overflow-x-auto mt-5">
              <table className="table">
                <thead className="text-slate-900">
                  <tr>
                    <th></th>
                    <th>Subject(s) plan to enroll next semester</th>
                    <th>Regular offering</th>
                    <th>Off-Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {planOfAction.map((subject, index) => (
                    <tr key={index}>
                      <th>{index + 1}</th>
                      <td>
                        {subject.subject} - {subject.description}
                      </td>
                      <td>
                        <div className="size-5 bg-green-800"></div>
                      </td>
                      <td>
                        <div className="size-5 bg-slate-500"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <textarea
                className="textarea w-full border border-slate-400 focus:outline-none placeholder:text-slate-800 placeholder:font-medium"
                placeholder="Coach’s Remarks:"
                value={coachRemarks}
                onChange={(e) => setCoachRemarks(e.target.value)}
                disabled={userRole === "STUDENT"}
              ></textarea>
            </div>

            {userRole !== "STUDENT" && (
              <div className="w-full flex justify-center items-center mt-5">
                <button
                  className="btn rounded-xl bg-slate-600 px-6 text-slate-100"
                  onClick={
                    existingAcadForm ? handleUpdateForm : handleSubmitForm
                  }
                >
                  {existingAcadForm ? "Save Changes" : "Send AcadForm"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isPlanModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">Add Subject(s) to Plan</h3>
            <div className="flex gap-4 mb-4">
              <select
                className="select select-bordered"
                value={planFilterYear}
                onChange={(e) => setPlanFilterYear(e.target.value)}
              >
                <option value="All">All Year Levels</option>
                <option value="FIRST">First Year</option>
                <option value="SECOND">Second Year</option>
                <option value="THIRD">Third Year</option>
                <option value="FOURTH">Fourth Year</option>
              </select>
              <select
                className="select select-bordered"
                value={planFilterSem}
                onChange={(e) => setPlanFilterSem(e.target.value)}
              >
                <option value="All">All Semesters</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
              <select
                className="select select-bordered"
                value={selectedCurriculumId}
                onChange={(e) => setSelectedCurriculumId(e.target.value)}
              >
                <option value="All">All Curriculums</option>
                {curriculums.map((curr) => (
                  <option key={curr.id} value={curr.id}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto my-4">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th></th>
                    <th>Subject</th>
                    <th>Description</th>
                    <th>Units</th>
                    <th>Sem</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {availableSubjects
                    .filter((subject) => {
                      const yearMatch =
                        planFilterYear === "All" ||
                        subject.year === planFilterYear;

                      const semMatch =
                        planFilterSem === "All" ||
                        subject.sem.toString() === planFilterSem;

                      const curriculumMatch =
                        selectedCurriculumId === "All" ||
                        subject.curriculumId?.toString() ===
                          selectedCurriculumId;

                      return yearMatch && semMatch && curriculumMatch;
                    })
                    .map((subject) => (
                      <tr key={subject.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedSubjects.some(
                              (s) => s.id === subject.id
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(subject, e.target.checked)
                            }
                          />
                        </td>
                        <td>{subject.subject}</td>
                        <td>{subject.description}</td>
                        <td>{subject.units}</td>
                        <td>{subject.sem}</td>
                        <td>{subject.year}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-success"
                onClick={handleAddSelectedToPlan}
              >
                Add to Plan
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsPlanModalOpen(false);
                  setSelectedSubjects([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
