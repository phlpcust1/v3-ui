"use client"

import { useState, useEffect } from "react"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import axios from "axios"
import { PORT } from "../../utils/constants"
import { useNavigate } from "react-router-dom"
import {
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaInfoCircle,
  FaBook,
  FaGraduationCap,
  FaChevronRight,
} from "react-icons/fa"

export default function Summary() {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [yearFilter, setYearFilter] = useState("All")
  const [semFilter, setSemFilter] = useState("All")
  const [sortField, setSortField] = useState("subject")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showFilters, setShowFilters] = useState(false)

  const [programs, setPrograms] = useState([])
  const [studentCourses, setStudentCourses] = useState([])
  const [schoolTerms, setSchoolTerms] = useState([])
  const [schoolTermFilter, setSchoolTermFilter] = useState("All")
  const [summaryStats, setSummaryStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    passRate: 0,
    failRate: 0,
  })

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

  const fetchStudentCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/student-course`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudentCourses(response.data)
    } catch (error) {
      console.error("Error fetching student-course data:", error)
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

  const exportToCSV = () => {
    const headers = ["Subject", "Description", "Passed", "Failed", "IP"]
    const csvContent = [
      headers.join(","),
      ...filteredCourses.map((course) =>
        [course.subject, course.description, course.passedCount, course.failedCount, course.ipCount].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "course_summary.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const selectedTermId = schoolTermFilter === "All" ? null : Number(schoolTermFilter)

  const getFilteredStudentCourses = () => {
    return studentCourses.filter((sc) => {
      const course = courses.find((c) => c.id === sc.courseId)
      if (!course) return false

      const matchesTerm = selectedTermId === null || sc.schoolTermId === selectedTermId
      const matchesYear = yearFilter === "All" || course.year === yearFilter
      const matchesSem = semFilter === "All" || course.sem.toString() === semFilter

      return matchesTerm && matchesYear && matchesSem
    })
  }

  // Group by courseId and aggregate
  const getSummaryMap = () => {
    const filteredStudentCourses = getFilteredStudentCourses()
    const summaryMap = new Map()

    filteredStudentCourses.forEach((sc) => {
      const course = courses.find((c) => c.id === sc.courseId)
      if (!course) return

      if (!summaryMap.has(course.id)) {
        summaryMap.set(course.id, {
          ...course,
          passedCount: 0,
          failedCount: 0,
          ipCount: 0,
        })
      }

      const entry = summaryMap.get(course.id)
      if (sc.remark === "PASSED") entry.passedCount++
      else if (sc.remark === "FAILED") entry.failedCount++
      else if (sc.remark === "IP") entry.ipCount++
    })

    return summaryMap
  }

  const getFilteredCourses = () => {
    const summaryMap = getSummaryMap()
    let result = Array.from(summaryMap.values())

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (course) =>
          course.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue

      if (sortField === "subject") {
        aValue = a.subject
        bValue = b.subject
      } else if (sortField === "description") {
        aValue = a.description
        bValue = b.description
      } else if (sortField === "passed") {
        aValue = a.passedCount
        bValue = b.passedCount
      } else if (sortField === "failed") {
        aValue = a.failedCount
        bValue = b.failedCount
      } else if (sortField === "ip") {
        aValue = a.ipCount
        bValue = b.ipCount
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return result
  }

  const filteredCourses = getFilteredCourses()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      await Promise.all([fetchCourses(), fetchStudentCourses(), fetchPrograms(), fetchSchoolTerms()])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Calculate summary statistics
    const filteredStudentCourses = getFilteredStudentCourses()
    const totalStudents = new Set(filteredStudentCourses.map((sc) => sc.studentId)).size
    const totalPassed = filteredStudentCourses.filter((sc) => sc.remark === "PASSED").length
    const totalFailed = filteredStudentCourses.filter((sc) => sc.remark === "FAILED").length
    const totalCourses = filteredCourses.length

    const passRate = filteredStudentCourses.length > 0 ? (totalPassed / filteredStudentCourses.length) * 100 : 0
    const failRate = filteredStudentCourses.length > 0 ? (totalFailed / filteredStudentCourses.length) * 100 : 0

    setSummaryStats({
      totalCourses,
      totalStudents,
      passRate,
      failRate,
    })
  }, [studentCourses, courses, yearFilter, semFilter, schoolTermFilter])

  const getTermName = (termId) => {
    const term = schoolTerms.find((t) => t.id === termId)
    return term ? term.name : "Unknown Term"
  }

  const getYearName = (year) => {
    switch (year) {
      case "FIRST":
        return "First Year"
      case "SECOND":
        return "Second Year"
      case "THIRD":
        return "Third Year"
      case "FOURTH":
        return "Fourth Year"
      default:
        return year
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Course Summary</h1>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                onClick={exportToCSV}
              >
                <FaDownload className="mr-2" />
                Export to CSV
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

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaBook className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Courses</h2>
                <p className="text-3xl font-bold">{summaryStats.totalCourses}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <FaGraduationCap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Students</h2>
                <p className="text-3xl font-bold">{summaryStats.totalStudents}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Pass Rate</h2>
                <p className="text-3xl font-bold">{summaryStats.passRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <FaTimesCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Fail Rate</h2>
                <p className="text-3xl font-bold">{summaryStats.failRate.toFixed(1)}%</p>
              </div>
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
                    placeholder="Search by subject or description..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {showFilters && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={schoolTermFilter}
                      onChange={(e) => setSchoolTermFilter(e.target.value)}
                    >
                      <option value="All">All Terms</option>
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
                      <option value="All">All Years</option>
                      <option value="FIRST">First Year</option>
                      <option value="SECOND">Second Year</option>
                      <option value="THIRD">Third Year</option>
                      <option value="FOURTH">Fourth Year</option>
                    </select>
                    <select
                      className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={semFilter}
                      onChange={(e) => setSemFilter(e.target.value)}
                    >
                      <option value="All">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Summary */}
            {(yearFilter !== "All" || semFilter !== "All" || schoolTermFilter !== "All") && (
              <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center">
                <FaInfoCircle className="text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  Showing results for{" "}
                  {schoolTermFilter !== "All" && (
                    <span className="font-medium">{getTermName(Number(schoolTermFilter))}</span>
                  )}
                  {yearFilter !== "All" && (
                    <span className="font-medium">
                      {schoolTermFilter !== "All" ? ", " : ""}
                      {getYearName(yearFilter)}
                    </span>
                  )}
                  {semFilter !== "All" && (
                    <span className="font-medium">
                      {yearFilter !== "All" || schoolTermFilter !== "All" ? ", " : ""}
                      Semester {semFilter}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Courses Table */}
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
                <p className="mt-2 text-gray-500">Loading course data...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No courses found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer text-center"
                        onClick={() => handleSort("passed")}
                      >
                        <div className="flex items-center justify-center">
                          <FaCheckCircle className="text-green-500 mr-1" />
                          Passed
                          {sortField === "passed" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer text-center"
                        onClick={() => handleSort("failed")}
                      >
                        <div className="flex items-center justify-center">
                          <FaTimesCircle className="text-red-500 mr-1" />
                          Failed
                          {sortField === "failed" && (
                            <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer text-center"
                        onClick={() => handleSort("ip")}
                      >
                        <div className="flex items-center justify-center">
                          <FaClock className="text-yellow-500 mr-1" />
                          IP
                          {sortField === "ip" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCourses.map((course) => (
                      <tr
                        key={course.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/summary/${course.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{course.subject}</td>
                        <td className="px-6 py-4">{course.description}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                            {course.passedCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-1 text-sm font-medium rounded-full ${
                              course.failedCount > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {course.failedCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-1 text-sm font-medium rounded-full ${
                              course.ipCount > 0 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {course.ipCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
              </div>
              <button
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
                <FaChevronRight className="ml-1.5 h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
