import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function AcademicAdvisingForm() {
  const { id } = useParams(); // Get student ID from URL
  const [student, setStudent] = useState(null);
  const [existingAcadForm, setExistingAcadForm] = useState(null);
  const [coachRemarks, setCoachRemarks] = useState("");
  const [planOfAction, setPlanOfAction] = useState([]); // Subject plan (array of subjects)
  const [isLoading, setIsLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const userRole = localStorage.getItem("role");

  // Modal states for "Add Subject to Plan"
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // New filter states for the plan modal
  const [planFilterYear, setPlanFilterYear] = useState("All");
  const [planFilterSem, setPlanFilterSem] = useState("All");

  const navigate = useNavigate();

  // Fetch available subjects from courses API
  const fetchAvailableSubjects = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setAvailableSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  // Open modal and fetch subjects
  const handleOpenPlanModal = () => {
    setIsPlanModalOpen(true);
    fetchAvailableSubjects();
  };

  // Submit the advising form (create a new acadform)
  const handleSubmitForm = async () => {
    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction, // subject plan stored as JSON
        studentId: parseInt(id, 10), // student ID from URL params
      };

      await axios.post(`${PORT}/acadforms`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      alert("Advising form submitted successfully!");
      navigate("/dashboard"); // Navigate to the dashboard
    } catch (error) {
      console.error("Error submitting advising form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  // Fetch student data
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

  // Fetch acadform for student if it exists
  const fetchAcadForm = async () => {
    try {
      // Adjust endpoint if necessary.
      const response = await axios.get(`${PORT}/acadforms/student/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.data) {
        setExistingAcadForm(response.data);
      }
      setCoachRemarks(response.data.recommendation);
      setPlanOfAction(response.data.subjectPlan || []);
    } catch (error) {
      console.error("Error fetching academic form:", error);
    }
  };

  const handleUpdateForm = async () => {
    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction,
      };

      await axios.patch(`${PORT}/acadforms/${existingAcadForm.id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      alert("Academic form updated successfully!");
      setIsEditing(false);
      fetchAcadForm(); // Refresh the form data
    } catch (error) {
      console.error("Error updating form:", error);
      alert("An error occurred while updating the form.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchStudentData();
      await fetchAcadForm();
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSelectAllChange = (isChecked) => {
    setSelectAll(isChecked);
    if (isChecked) {
      setSelectedSubjects(availableSubjects.filter(subject => {
        return subject.year === planFilterYear && subject.sem.toString() === planFilterSem;
      }));
    } else {
      setSelectedSubjects([]);
    }
  };

  // Handler for checkbox toggle in the plan modal
  const handleCheckboxChange = (subject, isChecked) => {
    if (isChecked) {
      setSelectedSubjects((prev) => [...prev, subject]);
    } else {
      setSelectedSubjects((prev) => prev.filter((s) => s.id !== subject.id));
    }
  };

  // Handler for adding selected subjects to the plan
  const handleAddSelectedToPlan = () => {
    if (selectedSubjects.length > 0) {
      setPlanOfAction([...planOfAction, ...selectedSubjects]);
      setSelectedSubjects([]);
      setIsPlanModalOpen(false);
    } else {
      alert("Please select at least one subject.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render read-only view if acadform already exists
  if (existingAcadForm && !isEditing) {
    return (
      <div>
        <Sidebar />
        <div className="ml-60 bg-base-200">
          <Navbar />
          <div className="p-8">
            <h1 className="font-bold text-xl mb-8">Academic Advising Form</h1>
            <div className="card bg-white shadow-xl p-8">
              <h2 className="font-bold text-lg mb-4">
                {student.firstName} {student.lastName} - {student.studentId}
              </h2>
              <p className="mb-2">
                <strong>Program:</strong> {student.program.name}
              </p>
              <p className="mb-8">
                <strong>Year Level:</strong> {student.yearLevel}
              </p>

              <h3 className="font-bold text-md mb-4">
                Currently Enrolled Subjects
              </h3>
              <table className="table w-full mb-6">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Description</th>
                    <th>Units</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {student.studentCourse
                    .filter(
                      (course) =>
                        course.course.year === student.yearLevel &&
                        course.course.sem === 1
                    )
                    .map((course) => (
                      <tr key={course.id}>
                        <td>{course.course.subject}</td>
                        <td>{course.course.description}</td>
                        <td>{course.course.units}</td>
                        <td>{course.remark}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="mb-6">
                <h3 className="font-bold text-md mb-2">
                  Subject Plan to Enroll
                </h3>
                {existingAcadForm.subjectPlan?.length ? (
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Units</th>
                        <th>Semester</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingAcadForm.subjectPlan.map((subject, index) => (
                        <tr key={index}>
                          <td>{subject.subject}</td>
                          <td>{subject.units}</td>
                          <td>{subject.sem}</td>
                          <td>{subject.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No subject plan available.</p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-md mb-2">Coach's Remarks</h3>
                <p>{existingAcadForm.recommendation}</p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="btn btn-outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </button>
                {userRole !== "STUDENT" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Form
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no acadform exists, display the editable form
  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8">Academic Advising Form</h1>
          <div className="card bg-white shadow-xl p-8">
            <div>
              <h2 className="font-bold text-lg mb-4">
                {student.firstName} {student.lastName} - {student.studentId}
              </h2>
              <p className="mb-2">
                <strong>Program:</strong> {student.program.name}
              </p>
              <p className="mb-8">
                <strong>Year Level:</strong> {student.yearLevel}
              </p>
            </div>

            {/* Currently Enrolled Subjects */}
            <h3 className="font-bold text-md mb-4">
              Currently Enrolled Subjects
            </h3>
            <table className="table w-full mb-6">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Description</th>
                  <th>Units</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {student.studentCourse
                  .filter(
                    (course) =>
                      course.course.year === student.yearLevel &&
                      course.course.sem === 1
                  )
                  .map((course) => (
                    <tr key={course.id}>
                      <td>{course.course.subject}</td>
                      <td>{course.course.description}</td>
                      <td>{course.course.units}</td>
                      <td>{course.remark}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Subject Plan to Enroll */}
            <h3 className="font-bold text-md mb-4">Subject Plan to Enroll</h3>
            <table className="table w-full mb-6">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Units</th>
                  <th>Semester</th>
                  <th>Year</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {planOfAction.map((action, index) => (
                  <tr key={index}>
                    <td>{action.subject}</td>
                    <td>{action.units}</td>
                    <td>{action.sem}</td>
                    <td>{action.year}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() =>
                          setPlanOfAction(
                            planOfAction.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {userRole !== "STUDENT" && (
              <button
                className="btn btn-sm btn-outline"
                onClick={handleOpenPlanModal}
              >
                Add Plan
              </button>
            )}

            {/* Coach's Remarks */}
            <div className="mt-6">
              <label className="block mb-2 font-bold">Coach's Remarks</label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={coachRemarks}
                disabled={userRole === "STUDENT"}
                onChange={(e) => setCoachRemarks(e.target.value)}
              ></textarea>
            </div>

            {/* Submit Button */}
            {userRole !== "STUDENT" && (
              <div className="mt-6 flex justify-end">
                <button
                  className="btn btn-success"
                  onClick={
                    existingAcadForm ? handleUpdateForm : handleSubmitForm
                  }
                >
                  {existingAcadForm ? "Save Changes" : "Submit Form"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Plan Modal */}
      {isPlanModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">Add Subject(s) to Plan</h3>
            {/* Filters for Year Level and Semester */}
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
            </div>

            {/* List of Available Subjects with Checkboxes */}
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
                      return yearMatch && semMatch;
                    })
                    .map((subject) => (
                      <tr key={subject.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectAll}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
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

            {/* Modal Actions */}
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
