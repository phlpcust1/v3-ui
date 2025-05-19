"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"
import {
  FaSearch,
  FaFilter,
  FaUserPlus,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaTimes,
  FaUsers,
  FaExclamationTriangle,
  FaDownload,
  FaInfoCircle,
  FaEnvelope,
  FaBook,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa"

export function Assignment() {
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearLevel, setYearLevel] = useState("ALL")
  const [program, setProgram] = useState("ALL")
  const [selectedStudents, setSelectedStudents] = useState([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [studentsPerPage] = useState(10)
  const [sortField, setSortField] = useState("firstName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [coachAssignments, setCoachAssignments] = useState({})

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${PORT}/students`, {
        params: {
          q: searchQuery,
          filterByYearLevel: yearLevel !== "ALL" ? yearLevel : undefined,
          filterByProgram: program !== "ALL" ? program : undefined,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudents(response.data)
      setTotalPages(Math.ceil(response.data.length / studentsPerPage))
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching students:", error)
      setIsLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${PORT}/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setPrograms(response.data)
    } catch (error) {
      console.error("Error fetching programs:", error)
    }
  }

  const fetchCoaches = async () => {
    try {
      const response = await axios.get(`${PORT}/coaches`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCoaches(response.data)
    } catch (error) {
      console.error("Error fetching coaches:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${PORT}/assignments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      // Create a map of student ID to coach ID
      const assignments = {}
      response.data.forEach((assignment) => {
        assignments[assignment.studentId] = assignment.coachId
      })

      setCoachAssignments(assignments)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchPrograms(), fetchCoaches(), fetchAssignments()])
      fetchStudents()
    }
    fetchData()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [searchQuery, yearLevel, program])

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((studentId) => studentId !== id))
    } else {
      setSelectedStudents([...selectedStudents, id])
    }
  }

  const handleAssignCoach = async () => {
    const confirmAssign = window.confirm("Are you sure you want to assign these students to this coach?")
    if (!confirmAssign) return

    try {
      setIsLoading(true)
      const assignments = selectedStudents.map((studentId) => ({
        studentId: Number.parseInt(studentId),
        coachId: Number.parseInt(selectedCoach),
      }))

      await axios.post(
        `${PORT}/assignments/bulk`,
        { assignments },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )

      setIsAssignModalOpen(false)
      setSelectedStudents([])
      setSelectedCoach(null)
      await fetchAssignments()
      await fetchStudents()
      setSuccessMessage("Students successfully assigned to coach")
      setTimeout(() => setSuccessMessage(""), 5000)
      setIsLoading(false)
    } catch (error) {
      console.error("Error assigning coach:", error)
      setErrorMessage("Failed to assign coach. Please try again.")
      setTimeout(() => setErrorMessage(""), 5000)
      setIsLoading(false)
    }
  }

  const handleReassignCoach = async () => {
    const confirmReassign = window.confirm("Are you sure you want to re-assign these students to this coach?")
    if (!confirmReassign) return

    try {
      setIsLoading(true)
      const assignments = selectedStudents.map((studentId) => ({
        studentId: Number.parseInt(studentId),
        coachId: Number.parseInt(selectedCoach),
      }))

      await axios.patch(
        `${PORT}/assignments/bulk`,
        { assignments },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      )

      setIsReassignModalOpen(false)
      setSelectedStudents([])
      setSelectedCoach(null)
      await fetchAssignments()
      await fetchStudents()
      setSuccessMessage("Students successfully re-assigned to coach")
      setTimeout(() => setSuccessMessage(""), 5000)
      setIsLoading(false)
    } catch (error) {
      console.error("Error re-assigning coach:", error)
      setErrorMessage("Failed to re-assign coach. Please try again.")
      setTimeout(() => setErrorMessage(""), 5000)
      setIsLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortedStudents = () => {
    // First apply sorting
    const sorted = [...students].sort((a, b) => {
      let aValue, bValue

      if (sortField === "name") {
        aValue = `${a.firstName} ${a.lastName}`
        bValue = `${b.firstName} ${b.lastName}`
      } else if (sortField === "email") {
        aValue = a.email
        bValue = b.email
      } else if (sortField === "yearLevel") {
        aValue = a.yearLevel
        bValue = b.yearLevel
      } else if (sortField === "program") {
        aValue = a.program?.code || ""
        bValue = b.program?.code || ""
      } else {
        aValue = a[sortField]
        bValue = b[sortField]
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Then apply pagination
    const startIndex = (currentPage - 1) * studentsPerPage
    const endIndex = startIndex + studentsPerPage
    return sorted.slice(startIndex, endIndex)
  }

  const exportAssignments = () => {
    // Create CSV content
    let csvContent = "Student ID,Student Name,Email,Year Level,Program,Coach\n"

    students.forEach((student) => {
      const coachId = coachAssignments[student.id]
      const coach = coaches.find((c) => c.id === coachId)
      const coachName = coach ? `${coach.firstName} ${coach.lastName}` : "Unassigned"

      csvContent += `${student.id},${student.firstName} ${student.lastName},${student.email},${student.yearLevel},${student.program.code},${coachName}\n`
    })

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "coach_assignments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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

  const getCoachName = (studentId) => {
    const coachId = coachAssignments[studentId]
    if (!coachId) return "Unassigned"

    const coach = coaches.find((c) => c.id === coachId)
    return coach ? `${coach.firstName} ${coach.lastName}` : "Unknown"
  }

  const getAssignmentStats = () => {
    const totalStudents = students.length
    const assignedStudents = Object.keys(coachAssignments).length
    const unassignedStudents = totalStudents - assignedStudents

    return {
      totalStudents,
      assignedStudents,
      unassignedStudents,
      assignmentPercentage: totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0,
    }
  }

  const stats = getAssignmentStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Curriculum Coach Assignment</h1>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                onClick={exportAssignments}
              >
                <FaDownload className="mr-2 h-4 w-4 text-gray-500" />
                Export Assignments
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
              <FaCheckCircle className="h-5 w-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
              <FaExclamationTriangle className="h-5 w-5 mr-2" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students by name, ID, or email..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaFilter className="mr-2 h-4 w-4 text-gray-500" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </button>

                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                    onClick={() => setIsAssignModalOpen(true)}
                    disabled={selectedStudents.length === 0}
                  >
                    <FaUserPlus className="mr-2 h-4 w-4" />
                    Assign Coach
                  </button>

                  <button
                    className="px-3 py-2 bg-amber-600 text-white rounded-md flex items-center text-sm hover:bg-amber-700 transition-colors"
                    onClick={() => setIsReassignModalOpen(true)}
                    disabled={selectedStudents.length === 0}
                  >
                    <FaSync className="mr-2 h-4 w-4" />
                    Re-Assign Coach
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <select
                    className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                  >
                    <option value="ALL">All Years</option>
                    <option value="FIRST">1st Year</option>
                    <option value="SECOND">2nd Year</option>
                    <option value="THIRD">3rd Year</option>
                    <option value="FOURTH">4th Year</option>
                  </select>

                  <select
                    className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  >
                    <option value="ALL">All Programs</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Students Table */}
            {isLoading ? (
              <div className="p-8 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                >
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                    Loading...
                  </span>
                </div>
                <p className="mt-2 text-gray-500">Loading students data...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center">
                <FaUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          onChange={(e) => setSelectedStudents(e.target.checked ? students.map((s) => s.id) : [])}
                          checked={students.length > 0 && selectedStudents.length === students.length}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          <FaUser className="mr-1 h-4 w-4 text-gray-400" />
                          Student Name
                          {sortField === "name" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center">
                          <FaEnvelope className="mr-1 h-4 w-4 text-gray-400" />
                          Email
                          {sortField === "email" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("yearLevel")}
                      >
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1 h-4 w-4 text-gray-400" />
                          Year Level
                          {sortField === "yearLevel" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("program")}
                      >
                        <div className="flex items-center">
                          <FaBook className="mr-1 h-4 w-4 text-gray-400" />
                          Program
                          {sortField === "program" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSortedStudents().map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.yearLevel === "FIRST"
                                ? "bg-green-100 text-green-800"
                                : student.yearLevel === "SECOND"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : student.yearLevel === "THIRD"
                                    ? "bg-orange-100 text-orange-800"
                                    : student.yearLevel === "FOURTH"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatYearLevel(student.yearLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.program.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * studentsPerPage + 1, students.length)} to{" "}
                {Math.min(currentPage * studentsPerPage, students.length)} of {students.length} students
              </div>
              <div className="flex space-x-2">
                <button
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`inline-flex items-center px-3 py-1.5 border text-sm leading-5 font-medium rounded-md ${
                          currentPage === pageNum
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <FaChevronRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Coach Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Coach to Students</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setIsAssignModalOpen(false)}>
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Coach</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedCoach || ""}
                onChange={(e) => setSelectedCoach(e.target.value)}
              >
                <option value="">Select Coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-start">
              <FaInfoCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">
                  You are about to assign <span className="font-semibold">{selectedStudents.length}</span> student(s) to
                  the selected coach. This action will create new assignments.
                </p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Coach
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students
                    .filter((student) => selectedStudents.includes(student.id))
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatYearLevel(student.yearLevel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.program.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCoachName(student.id)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleAssignCoach}
                disabled={!selectedCoach}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Coach Modal */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reassign Coach for Students</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setIsReassignModalOpen(false)}>
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select New Coach</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedCoach || ""}
                onChange={(e) => setSelectedCoach(e.target.value)}
              >
                <option value="">Select Coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-amber-50 p-4 rounded-md mb-4 flex items-start">
              <FaExclamationTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700">
                  You are about to reassign <span className="font-semibold">{selectedStudents.length}</span> student(s)
                  to a new coach. This action will update existing assignments.
                </p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Coach
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students
                    .filter((student) => selectedStudents.includes(student.id))
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatYearLevel(student.yearLevel)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.program.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCoachName(student.id)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsReassignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                onClick={handleReassignCoach}
                disabled={!selectedCoach}
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
