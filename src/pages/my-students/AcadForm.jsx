"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export function AcadForm() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [existingAcadForm, setExistingAcadForm] = useState(null)
  const [coachRemarks, setCoachRemarks] = useState("")
  const [planOfAction, setPlanOfAction] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const userRole = localStorage.getItem("role")

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [planFilterYear, setPlanFilterYear] = useState("All")
  const [planFilterSem, setPlanFilterSem] = useState("All")
  const [selectAllChecked, setSelectAllChecked] = useState(false)

  const navigate = useNavigate()

  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState(null)
  const [curriculums, setCurriculums] = useState([])
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("All")

  const fetchCurriculums = async () => {
    try {
      const response = await axios.get(`${PORT}/curriculums`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCurriculums(response.data)
    } catch (error) {
      console.error("Error fetching curriculums:", error)
    }
  }

  const [schoolTerms, setSchoolTerms] = useState([])
  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      const terms = response.data
      setSchoolTerms(terms)

      // Set default if none is selected yet
      if (terms.length > 0 && !selectedSchoolTermId) {
        setSelectedSchoolTermId(terms[0].id) // default to first
      }
    } catch (error) {
      console.error("Error fetching school terms:", error)
    }
  }

  const fetchAvailableSubjects = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      const allSubjects = response.data
      setAvailableSubjects(allSubjects)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const handleOpenPlanModal = () => {
    setIsPlanModalOpen(true)
    fetchAvailableSubjects()
    setSelectAllChecked(false)
  }

  const handleSubmitForm = async () => {
    if (!selectedSchoolTermId) {
      alert("Please select a school term.")
      return
    }

    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction,
        studentId: Number.parseInt(id, 10),
        schoolTermId: selectedSchoolTermId,
      }

      await axios.post(`${PORT}/acadforms`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      alert("Advising form submitted successfully!")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error submitting advising form:", error)
      alert("An error occurred while submitting the form. Please try again.")
    }
  }

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudent(response.data)
    } catch (error) {
      console.error("Error fetching student data:", error)
    }
  }

  const fetchAcadForm = async (studentId, schoolTermId) => {
    try {
      const response = await axios.get(`${PORT}/acadforms/student/${studentId}?schoolTermId=${schoolTermId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      const form = response.data

      if (form) {
        setExistingAcadForm(form)
        setCoachRemarks(form.recommendation || "")
        setPlanOfAction(form.subjectPlan || [])
      } else {
        // No form exists for that term — start fresh
        setExistingAcadForm(null)
        setCoachRemarks("")
        setPlanOfAction([])
      }
    } catch (error) {
      console.error("Error fetching academic form:", error)
      setExistingAcadForm(null)
      setCoachRemarks("")
      setPlanOfAction([])
    }
  }

  const handleUpdateForm = async () => {
    if (!selectedSchoolTermId) {
      alert("Please select a school term.")
      return
    }

    try {
      const payload = {
        recommendation: coachRemarks,
        subjectPlan: planOfAction,
        schoolTermId: selectedSchoolTermId,
      }

      await axios.patch(`${PORT}/acadforms/${existingAcadForm.id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      alert("Academic form updated successfully!")
      setIsEditing(false)
      fetchAcadForm()
    } catch (error) {
      console.error("Error updating form:", error)
      alert("An error occurred while updating the form.")
    }
  }

  useEffect(() => {
    if (student && selectedSchoolTermId) {
      fetchAcadForm(student.id, selectedSchoolTermId)
      fetchAvailableSubjects()
    }
  }, [student, selectedSchoolTermId])

  useEffect(() => {
    const fetchData = async () => {
      await fetchStudentData()
      await fetchSchoolTerms()
      fetchCurriculums()
      setIsLoading(false)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (student && selectedSchoolTermId) {
      fetchAvailableSubjects()
    }
  }, [student, selectedSchoolTermId])

  // Get filtered subjects based on current filters
  const getFilteredSubjects = () => {
    return availableSubjects.filter((subject) => {
      const yearMatch = planFilterYear === "All" || subject.year === planFilterYear
      const semMatch = planFilterSem === "All" || subject.sem.toString() === planFilterSem
      const curriculumMatch =
        selectedCurriculumId === "All" || subject.curriculumId?.toString() === selectedCurriculumId

      return yearMatch && semMatch && curriculumMatch
    })
  }

  // Check if all filtered subjects are selected
  useEffect(() => {
    const filteredSubjects = getFilteredSubjects()
    if (filteredSubjects.length === 0) {
      setSelectAllChecked(false)
      return
    }

    const allSelected = filteredSubjects.every((subject) => selectedSubjects.some((s) => s.id === subject.id))
    setSelectAllChecked(allSelected)
  }, [selectedSubjects, planFilterYear, planFilterSem, selectedCurriculumId, availableSubjects])

  const handleCheckboxChange = (subject, isChecked) => {
    if (isChecked) {
      setSelectedSubjects((prev) => [...prev, subject])
    } else {
      setSelectedSubjects((prev) => prev.filter((s) => s.id !== subject.id))
    }
  }

  const handleAddSelectedToPlan = () => {
    if (selectedSubjects.length > 0) {
      setPlanOfAction([...planOfAction, ...selectedSubjects])
      setSelectedSubjects([])
      setIsPlanModalOpen(false)
    } else {
      alert("Please select at least one subject.")
    }
  }

  const handleSelectAllChange = (isChecked) => {
    // Only get subjects that match the current filters
    const filteredSubjects = getFilteredSubjects()

    if (isChecked) {
      // Select all filtered subjects
      setSelectedSubjects([...filteredSubjects])
    } else {
      // Deselect all filtered subjects
      setSelectedSubjects([])
    }

    setSelectAllChecked(isChecked)
  }

  const handleYearFilterChange = (e) => {
    setPlanFilterYear(e.target.value)
    setSelectedSubjects([])
    setSelectAllChecked(false)
  }

  const handleSemFilterChange = (e) => {
    setPlanFilterSem(e.target.value)
    setSelectedSubjects([])
    setSelectAllChecked(false)
  }

  const handleCurriculumFilterChange = (e) => {
    setSelectedCurriculumId(e.target.value)
    setSelectedSubjects([])
    setSelectAllChecked(false)
  }

  if (isLoading || !student) return <div>Loading...</div>

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-8">
          <div className="card bg-white p-6 rounded-lg shadow-sm">
            {/* Term Selector */}
            <div className="flex justify-between items-center mb-4">
              <select
                className="select select-bordered w-64"
                value={selectedSchoolTermId || ""}
                onChange={(e) => setSelectedSchoolTermId(Number(e.target.value))}
              >
                <option value="">Select School Term</option>
                {schoolTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Form Title */}
            <div className="border-b border-gray-300 pb-4 mb-6">
              <h1 className="text-center font-medium text-xl">Academic Advising Form</h1>
            </div>

            {/* Student Information */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <div className="space-y-4">
                  <div className="flex items-baseline">
                    <p className="w-32 font-medium">Student Number:</p>
                    <div className="border-b border-gray-400 flex-1 px-2 py-1">
                      <p>{student.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline">
                    <p className="w-32 font-medium">Student Name:</p>
                    <div className="border-b border-gray-400 flex-1 px-2 py-1">
                      <p>
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-4">
                  <div className="flex items-baseline">
                    <p className="w-32 font-medium">Course:</p>
                    <div className="border-b border-gray-400 flex-1 px-2 py-1">
                      <p>{student.program.name}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline">
                    <p className="w-32 font-medium">Year Level:</p>
                    <div className="border-b border-gray-400 flex-1 px-2 py-1">
                      <p>{student.yearLevel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Currently Enrolled Subjects */}
            <div className="mb-8">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th>Subject(s) Currently Enrolled</th>
                    <th className="w-32 text-center">Units Earned</th>
                    <th className="w-32 text-center">Final Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {student.studentCourse
                    .filter((course) => {
                      return course.schoolTermId === selectedSchoolTermId
                    })
                    .map((course, index) => (
                      <tr key={course.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          {course.course.subject} - {course.course.description}
                        </td>
                        <td className="text-center">{course.course.units}</td>
                        <td className="text-center">{course.remark || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Plan of Actions Section */}
            <div className="bg-gray-100 py-3 px-4 mb-4">
              <h2 className="text-center font-medium text-lg">PLAN OF ACTIONS</h2>
            </div>

            {/* Add Plan Button */}
            <div className="mb-4">
              {userRole !== "STUDENT" && (
                <button className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white" onClick={handleOpenPlanModal}>
                  Add Plan
                </button>
              )}
            </div>

            {/* Plan of Actions Table */}
            <div className="mb-6">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th>Subject(s) plan to enroll next semester</th>
                    <th className="w-32 text-center">Regular offering</th>
                    <th className="w-32 text-center">Off-Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {planOfAction.map((subject, index) => (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        {subject.subject} - {subject.description}
                      </td>
                      <td className="text-center">
                        <div className="size-5 bg-green-800 mx-auto rounded-sm"></div>
                      </td>
                      <td className="text-center">
                        <div className="size-5 bg-slate-500 mx-auto rounded-sm"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Coach's Remarks */}
            <div className="mb-6">
              <textarea
                className="textarea w-full border border-gray-300 h-24 focus:outline-none focus:border-slate-500"
                placeholder="Coach's Remarks:"
                value={coachRemarks}
                onChange={(e) => setCoachRemarks(e.target.value)}
                disabled={userRole === "STUDENT"}
              ></textarea>
            </div>

            {/* Submit Button */}
            {userRole !== "STUDENT" && (
              <div className="flex justify-start">
                <button
                  className="btn bg-slate-600 hover:bg-slate-700 text-white"
                  onClick={existingAcadForm ? handleUpdateForm : handleSubmitForm}
                >
                  {existingAcadForm ? "Save Changes" : "Send AcadForm"}
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

            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <select className="select select-bordered" value={planFilterYear} onChange={handleYearFilterChange}>
                <option value="All">All Year Levels</option>
                <option value="FIRST">First Year</option>
                <option value="SECOND">Second Year</option>
                <option value="THIRD">Third Year</option>
                <option value="FOURTH">Fourth Year</option>
              </select>
              <select className="select select-bordered" value={planFilterSem} onChange={handleSemFilterChange}>
                <option value="All">All Semesters</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
              <select
                className="select select-bordered"
                value={selectedCurriculumId}
                onChange={handleCurriculumFilterChange}
              >
                <option value="All">All Curriculums</option>
                {curriculums.map((curr) => (
                  <option key={curr.id} value={curr.id}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Subjects Table */}
            <div className="overflow-x-auto my-4 border rounded-lg">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectAllChecked}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                      />
                    </th>
                    <th>Subject</th>
                    <th>Description</th>
                    <th className="w-20 text-center">Units</th>
                    <th className="w-20 text-center">Sem</th>
                    <th className="w-20 text-center">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredSubjects().map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedSubjects.some((s) => s.id === subject.id)}
                          onChange={(e) => handleCheckboxChange(subject, e.target.checked)}
                        />
                      </td>
                      <td>{subject.subject}</td>
                      <td>{subject.description}</td>
                      <td className="text-center">{subject.units}</td>
                      <td className="text-center">{subject.sem}</td>
                      <td className="text-center">{subject.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Count */}
            <div className="text-sm text-gray-600 mb-4">{selectedSubjects.length} subject(s) selected</div>

            {/* Modal Actions */}
            <div className="modal-action">
              <button
                className="btn btn-success"
                onClick={handleAddSelectedToPlan}
                disabled={selectedSubjects.length === 0}
              >
                Add to Plan
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsPlanModalOpen(false)
                  setSelectedSubjects([])
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
