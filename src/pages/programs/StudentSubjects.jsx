"use client"

import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export function StudentSubjects() {
  const { id } = useParams() // Get student ID from the URL
  const [student, setStudent] = useState(null)
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  const [isProvideGradeModalOpen, setIsProvideGradeModalOpen] = useState(false)
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedStudentCourse, setSelectedStudentCourse] = useState(null)
  const [remark, setRemark] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("Student Evaluation")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [selectedCourses, setSelectedCourses] = useState([])

  // Filters
  const [semesterFilter, setSemesterFilter] = useState("ALL")
  const [yearFilter, setYearFilter] = useState("ALL")
  const [remarkFilter, setRemarkFilter] = useState("ALL")

  const navigate = useNavigate()

  // Fetch student and their subjects
  const fetchStudentDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudent(response.data)
    } catch (error) {
      console.error("Error fetching student details:", error)
      setError("Failed to load student details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch available courses
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCourses(response.data)
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const addCourseToStudent = async () => {
    try {
      const payload = {
        studentId: Number.parseInt(id, 10),
        courseId: Number.parseInt(selectedCourseId, 10),
      }

      await axios.post(`${PORT}/student-course`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      setIsAddCourseModalOpen(false)
      setSelectedCourseId("")
      fetchStudentDetails() // Refresh student courses
    } catch (error) {
      console.error("Error adding course to student:", error)
    }
  }

  const provideGrade = async () => {
    try {
      const payload = {
        ...selectedStudentCourse,
        remark, // Updated remark
      }

      await axios.patch(`${PORT}/student-course/${selectedStudentCourse.id}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      setIsProvideGradeModalOpen(false)
      setSelectedStudentCourse(null)
      setRemark("")
      fetchStudentDetails() // Refresh student courses
    } catch (error) {
      console.error("Error providing grade:", error)
    }
  }

  useEffect(() => {
    fetchStudentDetails()
    fetchCourses()
  }, [id])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!student) return { totalUnits: 0, completedUnits: 0 }

    const totalUnits = student.studentCourse.reduce((sum, course) => sum + (course.course.units || 0), 0)

    const completedUnits = student.studentCourse.reduce(
      (sum, course) => (course.remark === "PASSED" ? sum + (course.course.units || 0) : sum),
      0,
    )

    const passedCourses = student.studentCourse.filter((course) => course.remark === "PASSED").length
    const totalCourses = student.studentCourse.length

    return {
      totalUnits,
      completedUnits,
      passedCourses,
      totalCourses,
    }
  }, [student])

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Filter and sort student courses
  const filteredStudentCourses = useMemo(() => {
    if (!student) return []

    const filtered = student.studentCourse.filter((course) => {
      const matchesSemester = semesterFilter === "ALL" || course.course.sem.toString() === semesterFilter

      const matchesYear = yearFilter === "ALL" || course.course.year.toUpperCase() === yearFilter

      const matchesRemark = remarkFilter === "ALL" || course.remark === remarkFilter

      const matchesSearch =
        searchQuery === "" ||
        course.course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSemester && matchesYear && matchesRemark && matchesSearch
    })

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue

        // Handle nested properties
        if (sortConfig.key.includes(".")) {
          const [parent, child] = sortConfig.key.split(".")
          aValue = a[parent][child]
          bValue = b[parent][child]
        } else {
          aValue = a[sortConfig.key]
          bValue = b[sortConfig.key]
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [student, semesterFilter, yearFilter, remarkFilter, searchQuery, sortConfig])

  // Handle course selection
  const toggleCourseSelection = (courseId) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId)
      } else {
        return [...prev, courseId]
      }
    })
  }

  const selectAllCourses = () => {
    if (selectedCourses.length === filteredStudentCourses.length) {
      setSelectedCourses([])
    } else {
      setSelectedCourses(filteredStudentCourses.map((course) => course.id))
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    if (filteredStudentCourses.length === 0) return

    // Build CSV header
    let csv = "Subject,Description,Units,Semester,Year,Remark\n"

    // Determine which courses to export
    const coursesToExport =
      selectedCourses.length > 0
        ? filteredStudentCourses.filter((course) => selectedCourses.includes(course.id))
        : filteredStudentCourses

    // Add each course as a row
    coursesToExport.forEach((course) => {
      csv += `"${course.course.subject}","${course.course.description}",${course.course.units},${course.course.sem},"${course.course.year}","${course.remark || "N/A"}"\n`
    })

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${student.firstName}_${student.lastName}_courses.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format year level
  const formatYearLevel = (yearLevel) => {
    switch (yearLevel) {
      case "FIRST":
        return "1st Year"
      case "SECOND":
        return "2nd Year"
      case "THIRD":
        return "3rd Year"
      case "FOURTH":
        return "4th Year"
      default:
        return yearLevel
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading student data...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="alert alert-error max-w-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
          <button className="btn btn-sm" onClick={fetchStudentDetails}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!student) {
    return <div>No student data found</div>
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          {/* Breadcrumb Navigation */}
          <div className="text-sm breadcrumbs mb-4">
            <ul>
              <li>
                <a onClick={() => navigate(-1)}>Back</a>
              </li>
              <li>Student Subjects</li>
              <li>
                {student.firstName} {student.lastName}
              </li>
            </ul>
          </div>

          {/* Student Information Card */}
          <div className="card bg-white shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-gray-600">{student.studentId}</p>
                <div className="mt-1">
                  <span className="badge badge-outline mr-2">{student.program?.name || "No Program"}</span>
                  <span className="badge">{formatYearLevel(student.yearLevel)}</span>
                </div>
              </div>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
                <div className="stat bg-base-100 shadow rounded-lg">
                  <div className="stat-title">Total Units</div>
                  <div className="stat-value text-2xl">{statistics.totalUnits}</div>
                  <div className="stat-desc">Required for graduation</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                  <div className="stat-title">Completed</div>
                  <div className="stat-value text-2xl">{statistics.completedUnits}</div>
                  <div className="stat-desc">
                    {Math.round((statistics.completedUnits / statistics.totalUnits) * 100) || 0}% of total units
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Tab Navigation */}
              <div className="tabs tabs-boxed bg-base-200 mb-6">
                <a
                  className={`tab ${activeTab === "Student Evaluation" ? "bg-gray-200 text-black" : ""}`}
                  onClick={() => setActiveTab("Student Evaluation")}
                >
                  Student Evaluation
                </a>
                <a
                  className={`tab ${activeTab === "Academic Advising" ? "bg-gray-200 text-black" : ""}`}
                  onClick={() => setActiveTab("Academic Advising")}
                >
                  Academic Advising
                </a>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="form-control">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        className="input input-bordered w-full md:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button className="btn btn-square" onClick={() => setSearchQuery("")}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
                  <select
                    className="select select-bordered"
                    value={remarkFilter}
                    onChange={(e) => setRemarkFilter(e.target.value)}
                  >
                    <option value="ALL">All Remarks</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="IP">In Progress</option>
                    <option value="HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(semesterFilter !== "ALL" || yearFilter !== "ALL" || remarkFilter !== "ALL" || searchQuery) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-500 mr-2">Active filters:</span>
                  {semesterFilter !== "ALL" && (
                    <span className="badge badge-outline">
                      Semester: {semesterFilter}
                      <button className="ml-1" onClick={() => setSemesterFilter("ALL")}>
                        ×
                      </button>
                    </span>
                  )}
                  {yearFilter !== "ALL" && (
                    <span className="badge badge-outline">
                      Year: {formatYearLevel(yearFilter)}
                      <button className="ml-1" onClick={() => setYearFilter("ALL")}>
                        ×
                      </button>
                    </span>
                  )}
                  {remarkFilter !== "ALL" && (
                    <span className="badge badge-outline">
                      Remark: {remarkFilter}
                      <button className="ml-1" onClick={() => setRemarkFilter("ALL")}>
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="badge badge-outline">
                      Search: {searchQuery}
                      <button className="ml-1" onClick={() => setSearchQuery("")}>
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    className="text-sm text-gray-500 underline"
                    onClick={() => {
                      setSemesterFilter("ALL")
                      setYearFilter("ALL")
                      setRemarkFilter("ALL")
                      setSearchQuery("")
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-600">
                    {filteredStudentCourses.length} {filteredStudentCourses.length === 1 ? "course" : "courses"} found
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={exportToCSV}
                    disabled={filteredStudentCourses.length === 0}
                  >
                    Export CSV
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={() => setIsAddCourseModalOpen(true)}>
                    Add Course
                  </button>
                </div>
              </div>

              {/* Student Course List */}
              {filteredStudentCourses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="w-10">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={
                              selectedCourses.length === filteredStudentCourses.length &&
                              filteredStudentCourses.length > 0
                            }
                            onChange={selectAllCourses}
                          />
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("course.subject")}>
                          Subject
                          {sortConfig.key === "course.subject" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("course.description")}>
                          Description
                          {sortConfig.key === "course.description" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("course.units")}>
                          Units
                          {sortConfig.key === "course.units" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("course.sem")}>
                          Sem
                          {sortConfig.key === "course.sem" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("noTake")}>
                          No. of Takes
                          {sortConfig.key === "noTake" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => requestSort("remark")}>
                          Remarks
                          {sortConfig.key === "remark" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentCourses.map((studentCourse) => (
                        <tr key={studentCourse.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedCourses.includes(studentCourse.id)}
                              onChange={() => toggleCourseSelection(studentCourse.id)}
                            />
                          </td>
                          <td>{studentCourse.course.subject}</td>
                          <td>{studentCourse.course.description}</td>
                          <td>{studentCourse.course.units}</td>
                          <td>
                            <span className="badge badge-outline">{studentCourse.course.sem}</span>
                          </td>
                          <td>{studentCourse.noTake}</td>
                          <td>
                            {studentCourse.remark === "PASSED" && (
                              <span className="badge badge-success text-white">PASSED</span>
                            )}
                            {studentCourse.remark === "FAILED" && (
                              <span className="badge badge-error text-white">FAILED</span>
                            )}
                            {studentCourse.remark === "IP" && (
                              <span className="badge badge-warning text-white">IN PROGRESS</span>
                            )}
                            {studentCourse.remark === "HOLD" && <span className="badge badge-ghost">ON HOLD</span>}
                            {!studentCourse.remark && <span className="badge badge-ghost">NOT SET</span>}
                          </td>
                          <td>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => {
                                setSelectedStudentCourse(studentCourse)
                                setRemark(studentCourse.remark || "")
                                setIsProvideGradeModalOpen(true)
                              }}
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || semesterFilter !== "ALL" || yearFilter !== "ALL" || remarkFilter !== "ALL"
                      ? "Try adjusting your filters or search query"
                      : "This student doesn't have any courses yet"}
                  </p>
                  <button className="btn btn-outline" onClick={() => setIsAddCourseModalOpen(true)}>
                    Add Course
                  </button>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-between items-center mt-6">
                <button className="btn btn-outline" onClick={() => navigate(-1)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>
                {selectedCourses.length > 0 && (
                  <div className="flex items-center">
                    <span className="mr-2">
                      {selectedCourses.length} {selectedCourses.length === 1 ? "course" : "courses"} selected
                    </span>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-sm">
                        Actions
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a onClick={exportToCSV}>Export Selected</a>
                        </li>
                        <li>
                          <a onClick={() => setSelectedCourses([])}>Clear Selection</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
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
              <label className="block mb-2 font-medium">Select Course</label>
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
              <p className="text-sm text-gray-500 mt-2">Select a course to add to {student.firstName}'s curriculum</p>
            </div>

            <div className="modal-action">
              <button className="btn btn-outline" onClick={addCourseToStudent} disabled={!selectedCourseId}>
                Add Course
              </button>
              <button className="btn" onClick={() => setIsAddCourseModalOpen(false)}>
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
            <h3 className="font-bold text-lg">Update Course Status</h3>
            <div className="mt-4">
              <p className="mb-4">
                <span className="font-medium">Course:</span> {selectedStudentCourse?.course.subject} -{" "}
                {selectedStudentCourse?.course.description}
              </p>
              <label className="block mb-2 font-medium">Status</label>
              <select
                className="select select-bordered w-full"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              >
                <option value="">-- Select Status --</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="IP">IN PROGRESS</option>
                <option value="HOLD">ON HOLD</option>
              </select>
            </div>

            <div className="modal-action">
              <button className="btn btn-outline" onClick={provideGrade} disabled={!remark}>
                Save
              </button>
              <button className="btn" onClick={() => setIsProvideGradeModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
