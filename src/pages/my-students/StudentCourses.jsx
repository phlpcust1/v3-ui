"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"
import {
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaUpload,
  FaGraduationCap,
  FaBook,
  FaPlus,
  FaEdit,
  FaChevronLeft,
  FaFileAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaChartBar,
} from "react-icons/fa"

export function StudentCourses() {
  const { id } = useParams() // Get student ID from the URL
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // For adding courses
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")

  // For providing grades
  const [isProvideGradeModalOpen, setIsProvideGradeModalOpen] = useState(false)
  const [selectedStudentCourse, setSelectedStudentCourse] = useState(null)
  const [remark, setRemark] = useState("")

  // For all courses in the system
  const [courses, setCourses] = useState([])

  // Filters for the Student Evaluation table
  const [semesterFilter, setSemesterFilter] = useState("ALL")
  const [yearFilter, setYearFilter] = useState("ALL")

  // Search terms
  const [evaluationSearchTerm, setEvaluationSearchTerm] = useState("")
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState("")

  // Tab state
  const [activeTab, setActiveTab] = useState("Student Evaluation")

  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState("")
  const [schoolTerms, setSchoolTerms] = useState([])

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState(null)

  const [isUploadGradesModalOpen, setIsUploadGradesModalOpen] = useState(false)
  const [gradesCsvFile, setGradesCsvFile] = useState(null)

  // New state for sorting
  const [sortField, setSortField] = useState("subject")
  const [sortDirection, setSortDirection] = useState("asc")

  // New state for student stats
  const [studentStats, setStudentStats] = useState({
    totalUnits: 0,
    passedUnits: 0,
    failedUnits: 0,
    inProgressUnits: 0,
  })

  // Fetch student
  const fetchStudentDetails = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${PORT}/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudent(response.data)
      calculateStudentStats(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching student details:", error)
      setIsLoading(false)
    }
  }

  // Calculate student statistics
  const calculateStudentStats = (studentData) => {
    if (!studentData || !studentData.studentCourse) return

    const totalUnits = studentData.studentCourse.reduce((sum, sc) => sum + (sc.course?.units || 0), 0)
    const passedUnits = studentData.studentCourse
      .filter((sc) => sc.remark === "PASSED")
      .reduce((sum, sc) => sum + (sc.course?.units || 0), 0)
    const failedUnits = studentData.studentCourse
      .filter((sc) => sc.remark === "FAILED")
      .reduce((sum, sc) => sum + (sc.course?.units || 0), 0)
    const inProgressUnits = studentData.studentCourse
      .filter((sc) => sc.remark === "IP" || sc.remark === "HOLD")
      .reduce((sum, sc) => sum + (sc.course?.units || 0), 0)

    setStudentStats({
      totalUnits,
      passedUnits,
      failedUnits,
      inProgressUnits,
    })
  }

  // Fetch all courses
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

  // Add a course to the student
  const addCourseToStudent = async () => {
    try {
      const payload = {
        studentId: Number.parseInt(id, 10),
        courseId: Number.parseInt(selectedCourseId, 10),
        schoolTermId: Number.parseInt(selectedSchoolTermId, 10),
      }

      await axios.post(`${PORT}/student-course`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      setIsAddCourseModalOpen(false)
      setSelectedCourseId("")
      fetchStudentDetails() // Refresh student data
    } catch (error) {
      console.error("Error adding course to student:", error)
    }
  }

  // Provide a grade/remark
  const provideGrade = async () => {
    if (!selectedStudentCourse) return
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

  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setSchoolTerms(response.data)
    } catch (error) {
      console.error("Error fetching school terms:", error)
    }
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Export to CSV
  const exportToCSV = (data, filename) => {
    let csvContent = ""

    // Headers
    if (activeTab === "Student Evaluation") {
      csvContent = "Subject,Description,Units,Semester,No. of Takes,Remarks\n"
    } else {
      csvContent = "Subject,Description,Units,Remarks\n"
    }

    // Data
    data.forEach((item) => {
      if (activeTab === "Student Evaluation") {
        csvContent += `${item.course.subject},${item.course.description},${item.course.units},${item.course.sem},${item.noTake || 1},${item.remark || "Not Graded"}\n`
      } else {
        const sc = student.studentCourse.find((sc) => sc.courseId === item.id)
        csvContent += `${item.subject},${item.description},${item.units},${sc ? (sc.remark === "HOLD" ? "IP" : sc.remark) : "Not Taken"}\n`
      }
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchStudentDetails()
    fetchCourses()
    fetchSchoolTerms()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2 text-gray-500">Loading student data...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">
            The student you're looking for could not be found or you don't have permission to view this data.
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------
  // STUDENT EVALUATION FILTERING
  // ---------------------------------------------------
  const filteredStudentCourses = student.studentCourse.filter((sc) => {
    const matchesSchoolTerm = selectedSchoolTermId === "" || sc.schoolTermId?.toString() === selectedSchoolTermId

    const matchesSemester = semesterFilter === "ALL" || sc.course?.sem?.toString() === semesterFilter

    const matchesYear = yearFilter === "ALL" || sc.course?.year?.toUpperCase() === yearFilter

    // Matches search on subject or description
    const lowerSearch = evaluationSearchTerm.toLowerCase()
    const matchesSearch =
      evaluationSearchTerm === "" ||
      sc.course?.subject?.toLowerCase().includes(lowerSearch) ||
      sc.course?.description?.toLowerCase().includes(lowerSearch)

    return matchesSchoolTerm && matchesSemester && matchesYear && matchesSearch
  })

  // Sort student courses
  const sortedStudentCourses = [...filteredStudentCourses].sort((a, b) => {
    let aValue, bValue

    if (sortField === "subject") {
      aValue = a.course?.subject || ""
      bValue = b.course?.subject || ""
    } else if (sortField === "description") {
      aValue = a.course?.description || ""
      bValue = b.course?.description || ""
    } else if (sortField === "units") {
      aValue = a.course?.units || 0
      bValue = b.course?.units || 0
    } else if (sortField === "sem") {
      aValue = a.course?.sem || 0
      bValue = b.course?.sem || 0
    } else if (sortField === "noTake") {
      aValue = a.noTake || 1
      bValue = b.noTake || 1
    } else if (sortField === "remark") {
      aValue = a.remark || ""
      bValue = b.remark || ""
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // ---------------------------------------------------
  // TRANSCRIPT OF RECORDS FILTERING
  // ---------------------------------------------------
  const transcriptCourses = courses.filter((course) => {
    if (course.programId !== student.programId) return false

    // Filter by subject or description
    const lowerSearch = transcriptSearchTerm.toLowerCase()
    const matchesSearch =
      transcriptSearchTerm === "" ||
      course.subject.toLowerCase().includes(lowerSearch) ||
      course.description.toLowerCase().includes(lowerSearch)

    return matchesSearch
  })

  // Sort transcript courses
  const sortedTranscriptCourses = [...transcriptCourses].sort((a, b) => {
    let aValue, bValue

    if (sortField === "subject") {
      aValue = a.subject || ""
      bValue = b.subject || ""
    } else if (sortField === "description") {
      aValue = a.description || ""
      bValue = b.description || ""
    } else if (sortField === "units") {
      aValue = a.units || 0
      bValue = b.units || 0
    } else if (sortField === "remark") {
      const aStudentCourse = student.studentCourse.find((sc) => sc.courseId === a.id)
      const bStudentCourse = student.studentCourse.find((sc) => sc.courseId === b.id)
      aValue = aStudentCourse ? aStudentCourse.remark || "" : "Not Taken"
      bValue = bStudentCourse ? bStudentCourse.remark || "" : "Not Taken"
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Get remark badge class
  const getRemarkBadgeClass = (remark) => {
    switch (remark) {
      case "PASSED":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      case "IP":
        return "bg-yellow-100 text-yellow-800"
      case "HOLD":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  // Get remark icon
  const getRemarkIcon = (remark) => {
    switch (remark) {
      case "PASSED":
        return <FaCheckCircle className="mr-1" />
      case "FAILED":
        return <FaTimesCircle className="mr-1" />
      case "IP":
      case "HOLD":
        return <FaClock className="mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Navbar />

        <div className="p-8">
          {/* Student Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {student.firstName} {student.lastName}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-4">
                  <div className="flex items-center mr-4">
                    <FaGraduationCap className="mr-1 text-gray-500" />
                    <span>{student.studentId}</span>
                  </div>
                  <div className="flex items-center">
                    <FaBook className="mr-1 text-gray-500" />
                    <span>{student.program?.name || "No Program"}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => navigate(`/academic-advising/${student.id}`)}
                >
                  <FaFileAlt className="mr-2" />
                  Academic Advising
                </button>
                <button
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => window.history.back()}
                >
                  <FaChevronLeft className="mr-2" />
                  Back
                </button>
              </div>
            </div>

            {/* Student Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Total Units</div>
                <div className="text-2xl font-bold">{studentStats.totalUnits}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Passed Units</div>
                <div className="text-2xl font-bold text-green-700">{studentStats.passedUnits}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Failed Units</div>
                <div className="text-2xl font-bold text-red-700">{studentStats.failedUnits}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-700 mb-1">In Progress</div>
                <div className="text-2xl font-bold text-yellow-700">{studentStats.inProgressUnits}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === "Student Evaluation"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("Student Evaluation")}
                >
                  Student Evaluation
                </button>
                <button
                  className={`py-4 px-6 font-medium text-sm border-b-2 ${
                    activeTab === "Transcript of Records"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("Transcript of Records")}
                >
                  Transcript of Records
                </button>
              </nav>
            </div>

            {/* STUDENT EVALUATION TAB */}
            {activeTab === "Student Evaluation" && (
              <div className="p-6">
                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search subjects..."
                        value={evaluationSearchTerm}
                        onChange={(e) => setEvaluationSearchTerm(e.target.value)}
                      />
                    </div>

                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={selectedSchoolTermId}
                      onChange={(e) => setSelectedSchoolTermId(e.target.value)}
                    >
                      <option value="">All School Terms</option>
                      {schoolTerms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                    >
                      <option value="ALL">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>

                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                      onClick={() => exportToCSV(sortedStudentCourses, "student_evaluation.csv")}
                      disabled={sortedStudentCourses.length === 0}
                    >
                      <FaDownload className="mr-2" />
                      Export
                    </button>
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center text-sm hover:bg-green-700 transition-colors"
                      onClick={() => setIsAddCourseModalOpen(true)}
                      disabled={!selectedSchoolTermId}
                    >
                      <FaPlus className="mr-2" />
                      Add Course
                    </button>
                  </div>
                </div>

                {selectedSchoolTermId === "" && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Please select a school term to add courses or upload data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student Course List */}
                {sortedStudentCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <FaBook className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
                    <p className="text-gray-500">
                      {selectedSchoolTermId
                        ? "No courses match your filters or the student isn't enrolled in any courses for this term."
                        : "Please select a school term to view enrolled courses."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("subject")}
                          >
                            <div className="flex items-center">
                              Subject
                              {sortField === "subject" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("description")}
                          >
                            <div className="flex items-center">
                              Description
                              {sortField === "description" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("units")}
                          >
                            <div className="flex items-center">
                              Units
                              {sortField === "units" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("sem")}
                          >
                            <div className="flex items-center">
                              Sem
                              {sortField === "sem" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("noTake")}
                          >
                            <div className="flex items-center">
                              No. of Takes
                              {sortField === "noTake" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("remark")}
                          >
                            <div className="flex items-center">
                              Remarks
                              {sortField === "remark" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedStudentCourses.map((sc) => (
                          <tr key={sc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sc.course?.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sc.course?.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.course?.units}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.course?.sem}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sc.noTake || 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRemarkBadgeClass(
                                  sc.remark,
                                )}`}
                              >
                                {getRemarkIcon(sc.remark)}
                                {sc.remark === "HOLD" ? "___" : sc.remark || "Not Graded"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                                onClick={() => {
                                  setSelectedStudentCourse(sc)
                                  setRemark(sc.remark || "")
                                  setIsProvideGradeModalOpen(true)
                                }}
                              >
                                <FaEdit className="mr-1" />
                                Grade
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    onClick={() => setIsUploadModalOpen(true)}
                    disabled={!selectedSchoolTermId}
                  >
                    <FaUpload className="mr-2" />
                    Upload Subjects
                  </button>
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    onClick={() => setIsUploadGradesModalOpen(true)}
                    disabled={!selectedSchoolTermId}
                  >
                    <FaUpload className="mr-2" />
                    Upload Grades
                  </button>
                </div>
              </div>
            )}

            {/* TRANSCRIPT OF RECORDS TAB */}
            {activeTab === "Transcript of Records" && (
              <div className="p-6">
                {/* Search and Export */}
                <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                  <div className="relative flex-grow max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search subjects..."
                      value={transcriptSearchTerm}
                      onChange={(e) => setTranscriptSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                    onClick={() => exportToCSV(sortedTranscriptCourses, "transcript.csv")}
                    disabled={sortedTranscriptCourses.length === 0}
                  >
                    <FaDownload className="mr-2" />
                    Export Transcript
                  </button>
                </div>

                {/* Transcript Table */}
                {sortedTranscriptCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <FaBook className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
                    <p className="text-gray-500">No courses match your search criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("subject")}
                          >
                            <div className="flex items-center">
                              Subject
                              {sortField === "subject" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("description")}
                          >
                            <div className="flex items-center">
                              Description
                              {sortField === "description" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("units")}
                          >
                            <div className="flex items-center">
                              Units
                              {sortField === "units" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort("remark")}
                          >
                            <div className="flex items-center">
                              Status
                              {sortField === "remark" && (
                                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTranscriptCourses.map((course) => {
                          // Check if the student has a record for this course
                          const studentCourse = student.studentCourse.find((sc) => sc.courseId === course.id)
                          const remark = studentCourse
                            ? studentCourse.remark === "HOLD"
                              ? "IP"
                              : studentCourse.remark
                            : "Not Taken"
                          return (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {course.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {course.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.units}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    remark === "PASSED"
                                      ? "bg-green-100 text-green-800"
                                      : remark === "FAILED"
                                        ? "bg-red-100 text-red-800"
                                        : remark === "IP"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {remark === "PASSED" ? (
                                    <FaCheckCircle className="mr-1" />
                                  ) : remark === "FAILED" ? (
                                    <FaTimesCircle className="mr-1" />
                                  ) : remark === "IP" ? (
                                    <FaClock className="mr-1" />
                                  ) : null}
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Progress Summary */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-blue-500" />
                    Program Progress
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Completion</span>
                      <span className="text-sm font-medium text-gray-700">
                        {studentStats.passedUnits} / {transcriptCourses.reduce((sum, course) => sum + course.units, 0)}{" "}
                        units
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${
                            (studentStats.passedUnits /
                              transcriptCourses.reduce((sum, course) => sum + course.units, 0)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded p-4 shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Courses Passed</div>
                      <div className="text-xl font-bold">
                        {student.studentCourse.filter((sc) => sc.remark === "PASSED").length} /{" "}
                        {transcriptCourses.length}
                      </div>
                    </div>
                    <div className="bg-white rounded p-4 shadow-sm">
                      <div className="text-sm text-gray-500 mb-1">Estimated Graduation</div>
                      <div className="text-xl font-bold">
                        {studentStats.passedUnits > 0
                          ? `${Math.ceil(
                              (transcriptCourses.reduce((sum, course) => sum + course.units, 0) -
                                studentStats.passedUnits) /
                                15,
                            )} semesters left`
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Grades Modal */}
      {isUploadGradesModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Student Grades</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()

                if (!gradesCsvFile || !selectedSchoolTermId) {
                  alert("Please select a school term and CSV file.")
                  return
                }

                const formData = new FormData()
                formData.append("file", gradesCsvFile)
                formData.append("schoolTermId", selectedSchoolTermId)
                formData.append("studentId", id) // still per student

                try {
                  await axios.post(`${PORT}/student-course/upload-grades`, formData, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                      "Content-Type": "multipart/form-data",
                    },
                  })
                  alert("Grades upload successful")
                  setIsUploadGradesModalOpen(false)
                  setGradesCsvFile(null)
                  fetchStudentDetails()
                } catch (err) {
                  console.error("Upload failed:", err)
                  alert("Upload failed")
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setGradesCsvFile(e.target.files[0])}
                />
                <p className="mt-1 text-xs text-gray-500">CSV should contain columns: subject_code, remark</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsUploadGradesModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsAddCourseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={addCourseToStudent}
                  disabled={!selectedCourseId}
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Subjects Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Student Subjects</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault()

                if (!csvFile || !selectedSchoolTermId) {
                  alert("Please select a school term and CSV file.")
                  return
                }

                const formData = new FormData()
                formData.append("file", csvFile)
                formData.append("schoolTermId", selectedSchoolTermId)
                formData.append("studentId", id) // Pass student ID

                try {
                  await axios.post(`${PORT}/student-course/upload`, formData, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                      "Content-Type": "multipart/form-data",
                    },
                  })
                  alert("Upload successful")
                  setIsUploadModalOpen(false)
                  setCsvFile(null)
                  fetchStudentDetails() // Refresh
                } catch (err) {
                  console.error("Upload failed:", err)
                  alert("Upload failed")
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
                <p className="mt-1 text-xs text-gray-500">CSV should contain columns: subject_code</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provide Grade Modal */}
      {isProvideGradeModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Provide Grade</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Providing grade for: <span className="font-medium">{selectedStudentCourse?.course?.subject}</span> -{" "}
                  {selectedStudentCourse?.course?.description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsProvideGradeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={provideGrade}
                  disabled={!remark}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
