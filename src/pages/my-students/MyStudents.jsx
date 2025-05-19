"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"
import {
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaBook,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa"

export function MyStudents() {
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("ALL")
  const [programFilter, setProgramFilter] = useState("ALL")
  const [trackFilter, setTrackFilter] = useState("ALL")
  const [schoolTerms, setSchoolTerms] = useState([])
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [studentsPerPage] = useState(10)
  const [sortField, setSortField] = useState("firstName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [selectAll, setSelectAll] = useState(false)

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

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const coachId = localStorage.getItem("id") // Get coach ID from localStorage
      const response = await axios.get(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      // Process students and determine if they are on track
      const processedStudents = response.data.assignments.map((assignment) => {
        const hasFailed = assignment.student.studentCourse.some((course) => course.remark === "FAILED")

        return {
          ...assignment.student,
          isOnTrack: !hasFailed, // Determine track status
        }
      })

      setStudents(processedStudents)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching students:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
    fetchStudents()
    fetchSchoolTerms()
  }, [])

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle individual student selection
  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Export selected students to CSV
  const exportToCSV = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to export")
      return
    }

    const studentsToExport = filteredStudents.filter((student) => selectedStudents.includes(student.id))

    const headers = ["Student Name", "Student No.", "Year Level", "Status"]
    const csvContent = [
      headers.join(","),
      ...studentsToExport.map((student) =>
        [
          `${student.firstName} ${student.lastName}`,
          student.studentId,
          student.yearLevel,
          student.isOnTrack ? "On Track" : "Not On Track",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "students.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filters for students
  const filteredStudents = students.filter((student) => {
    const matchesYear = yearFilter === "ALL" || student.yearLevel.toUpperCase() === yearFilter

    const matchesProgram =
      programFilter === "ALL" || (student.program && student.program.code.toUpperCase() === programFilter)

    const matchesTrack =
      trackFilter === "ALL" ||
      (trackFilter === "ON_TRACK" && student.isOnTrack) ||
      (trackFilter === "NOT_ON_TRACK" && !student.isOnTrack)

    const matchesSchoolTerm = selectedSchoolTerm === "ALL" || student.schoolTermId?.toString() === selectedSchoolTerm

    const matchesSearch =
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch && matchesYear && matchesProgram && matchesTrack && matchesSchoolTerm
  })

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue, bValue

    if (sortField === "name") {
      aValue = `${a.firstName} ${a.lastName}`
      bValue = `${b.firstName} ${b.lastName}`
    } else if (sortField === "studentId") {
      aValue = a.studentId
      bValue = b.studentId
    } else if (sortField === "yearLevel") {
      aValue = a.yearLevel
      bValue = b.yearLevel
    } else if (sortField === "status") {
      aValue = a.isOnTrack ? 1 : 0
      bValue = b.isOnTrack ? 1 : 0
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

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const currentStudents = sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const getYearLevelDisplay = (yearLevel) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Students</h1>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                onClick={exportToCSV}
                disabled={selectedStudents.length === 0}
              >
                <FaDownload className="mr-2" />
                Export Selected
              </button>
              <button
                className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="mr-2 text-gray-500" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students here..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {showFilters && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={selectedSchoolTerm}
                      onChange={(e) => setSelectedSchoolTerm(e.target.value)}
                    >
                      <option value="ALL">All School Terms</option>
                      {schoolTerms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    >
                      <option value="ALL">All Years</option>
                      <option value="FIRST">1st Year</option>
                      <option value="SECOND">2nd Year</option>
                      <option value="THIRD">3rd Year</option>
                      <option value="FOURTH">4th Year</option>
                    </select>
                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={trackFilter}
                      onChange={(e) => setTrackFilter(e.target.value)}
                    >
                      <option value="ALL">All Tracks</option>
                      <option value="ON_TRACK">On Track</option>
                      <option value="NOT_ON_TRACK">Not On Track</option>
                    </select>
                  </div>
                )}
              </div>
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
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No students found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selectAll}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Student Name
                          {sortField === "name" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("studentId")}
                      >
                        <div className="flex items-center">
                          Student No.
                          {sortField === "studentId" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("yearLevel")}
                      >
                        <div className="flex items-center">
                          Year Level
                          {sortField === "yearLevel" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          {sortField === "status" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                        colSpan="2"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentStudents.map((student) => (
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
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{student.studentId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getYearLevelDisplay(student.yearLevel)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.isOnTrack ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.isOnTrack ? (
                              <>
                                <FaCheckCircle className="mr-1" />
                                On Track
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="mr-1" />
                                Not On Track
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => window.location.assign(`/my-students/${student.id}`)}
                          >
                            <FaBook className="mr-1.5 h-3 w-3 text-gray-500" />
                            View Subjects
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => window.location.assign(`/academic-advising/${student.id}`)}
                          >
                            <FaFileAlt className="mr-1.5 h-3 w-3 text-gray-500" />
                            View Academic Form
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of{" "}
                {filteredStudents.length} students
              </div>
              <div className="flex space-x-2">
                <button
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => paginate(currentPage - 1)}
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
                        onClick={() => paginate(pageNum)}
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
                  onClick={() => paginate(currentPage + 1)}
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
    </div>
  )
}
