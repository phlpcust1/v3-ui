"use client"

import { useState, useEffect, useMemo } from "react"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import axios from "axios"
import { PORT } from "../../utils/constants"
import { useNavigate } from "react-router-dom"

export default function SubjectSummary() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("subject")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [yearFilter, setYearFilter] = useState("All")
  const [semFilter, setSemFilter] = useState("All")
  const [programs, setPrograms] = useState([])
  const [studentCourses, setStudentCourses] = useState([])
  const [curriculums, setCurriculums] = useState([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    passRate: 0,
    failRate: 0,
  })

  const navigate = useNavigate()

  // Fetch all required data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [coursesRes, studentCoursesRes, programsRes, curriculumsRes] = await Promise.all([
        axios.get(`${PORT}/courses`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }),
        axios.get(`${PORT}/student-course`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }),
        axios.get(`${PORT}/programs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }),
        axios.get(`${PORT}/curriculums`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }),
      ])

      setCourses(coursesRes.data)
      setStudentCourses(studentCoursesRes.data)
      setPrograms(programsRes.data)
      setCurriculums(curriculumsRes.data)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate filtered courses with memoization
  const filteredCourses = useMemo(() => {
    const filtered = courses
      .map((course) => {
        const matchesCurriculum = curriculumFilter === "All" || course.curriculumId?.toString() === curriculumFilter
        const matchesYear = yearFilter === "All" || course.year === yearFilter
        const matchesSem = semFilter === "All" || course.sem?.toString() === semFilter
        const matchesSearch =
          course.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase())

        if (!matchesCurriculum || !matchesYear || !matchesSem || !matchesSearch) {
          return null
        }

        // Count Passed, Failed, IP for this course
        const courseStudentData = studentCourses.filter((sc) => sc.courseId === course.id)

        const passedCount = courseStudentData.filter((sc) => sc.remark === "PASSED").length
        const failedCount = courseStudentData.filter((sc) => sc.remark === "FAILED").length
        const ipCount = courseStudentData.filter((sc) => sc.remark === "IP").length
        const holdCount = courseStudentData.filter((sc) => sc.remark === "HOLD").length

        return {
          ...course,
          passedCount,
          failedCount,
          ipCount,
          holdCount,
          totalStudents: courseStudentData.length,
        }
      })
      .filter(Boolean)

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle string comparison
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [courses, studentCourses, curriculumFilter, yearFilter, semFilter, searchQuery, sortField, sortDirection])

  // Calculate statistics
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const totalCourses = filteredCourses.length

      // Get unique students
      const uniqueStudentIds = new Set()
      studentCourses.forEach((sc) => {
        const matchingCourse = filteredCourses.find((c) => c.id === sc.courseId)
        if (matchingCourse) {
          uniqueStudentIds.add(sc.studentId)
        }
      })

      const totalStudents = uniqueStudentIds.size

      // Calculate pass/fail rates
      const totalEnrollments = filteredCourses.reduce((sum, course) => sum + course.totalStudents, 0)

      const totalPassed = filteredCourses.reduce((sum, course) => sum + course.passedCount, 0)

      const totalFailed = filteredCourses.reduce((sum, course) => sum + course.failedCount, 0)

      const passRate = totalEnrollments > 0 ? (totalPassed / totalEnrollments) * 100 : 0
      const failRate = totalEnrollments > 0 ? (totalFailed / totalEnrollments) * 100 : 0

      setStats({
        totalCourses,
        totalStudents,
        passRate,
        failRate,
      })
    }
  }, [filteredCourses, studentCourses])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    if (filteredCourses.length === 0) return

    const headers = ["Subject", "Description", "Units", "Year", "Semester", "Passed", "Failed", "In Progress", "Hold"]
    const csvContent = [
      headers.join(","),
      ...filteredCourses.map((course) =>
        [
          `"${course.subject}"`,
          `"${course.description}"`,
          course.units,
          course.year,
          course.sem,
          course.passedCount,
          course.failedCount,
          course.ipCount,
          course.holdCount,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "course_summary.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get curriculum name
  const getCurriculumName = (id) => {
    const curriculum = curriculums.find((c) => c.id.toString() === id)
    return curriculum ? curriculum.code : "Unknown"
  }

  if (loading) {
    return (
      <div>
        <Sidebar />
        <div className="ml-60 bg-base-200">
          <Navbar />
          <div className="p-8">
            <h1 className="font-bold text-xl mb-8 pl-4">Subject Summary</h1>
            <div className="card bg-white w-full shadow-xl p-8 flex justify-center items-center min-h-[300px]">
              <div className="flex flex-col items-center">
                <span className="loading loading-spinner loading-lg text-gray-500"></span>
                <p className="mt-4 text-gray-500">Loading subject data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="ml-60 bg-base-200">
          <Navbar />
          <div className="p-8">
            <h1 className="font-bold text-xl mb-8 pl-4">Subject Summary</h1>
            <div className="card bg-white w-full shadow-xl p-8">
              <div className="alert alert-error">
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
                <button className="btn btn-sm" onClick={fetchData}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-bold text-xl pl-4">Subject Summary</h1>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-outline" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button className="btn btn-sm btn-neutral" onClick={exportToCSV} disabled={filteredCourses.length === 0}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-white shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-gray-100 p-3 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Total Subjects</h2>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-gray-100 p-3 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Total Students</h2>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Pass Rate</h2>
                    <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-red-100 p-3 mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Fail Rate</h2>
                    <p className="text-2xl font-bold">{stats.failRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Search and Filters */}
              <div className="mb-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by subject or description..."
                      className="input input-bordered w-full pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setSearchQuery("")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {showFilters && (
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum</label>
                      <select
                        className="select select-bordered w-full"
                        value={curriculumFilter}
                        onChange={(e) => setCurriculumFilter(e.target.value)}
                      >
                        <option value="All">All Curriculums</option>
                        {curriculums.map((curr) => (
                          <option key={curr.id} value={curr.id.toString()}>
                            {curr.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                      <select
                        className="select select-bordered w-full"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                      >
                        <option value="All">All Years</option>
                        <option value="FIRST">First Year</option>
                        <option value="SECOND">Second Year</option>
                        <option value="THIRD">Third Year</option>
                        <option value="FOURTH">Fourth Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <select
                        className="select select-bordered w-full"
                        value={semFilter}
                        onChange={(e) => setSemFilter(e.target.value)}
                      >
                        <option value="All">All Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Filter Summary */}
                {(curriculumFilter !== "All" || yearFilter !== "All" || semFilter !== "All") && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-blue-700">
                      Showing results for{" "}
                      {curriculumFilter !== "All" && (
                        <span className="font-medium">{getCurriculumName(curriculumFilter)}</span>
                      )}
                      {yearFilter !== "All" && (
                        <span className="font-medium">
                          {curriculumFilter !== "All" ? ", " : ""}
                          {yearFilter === "FIRST"
                            ? "First Year"
                            : yearFilter === "SECOND"
                              ? "Second Year"
                              : yearFilter === "THIRD"
                                ? "Third Year"
                                : "Fourth Year"}
                        </span>
                      )}
                      {semFilter !== "All" && (
                        <span className="font-medium">
                          {yearFilter !== "All" || curriculumFilter !== "All" ? ", " : ""}
                          Semester {semFilter}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Courses Table */}
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No subjects found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("subject")}>
                          <div className="flex items-center">
                            Subject
                            {sortField === "subject" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort("description")}>
                          <div className="flex items-center">
                            Description
                            {sortField === "description" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th className="text-center">Year</th>
                        <th className="text-center">Sem</th>
                        <th
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleSort("passedCount")}
                        >
                          <div className="flex items-center justify-center">
                            <span className="badge badge-success badge-sm mr-1"></span>
                            Passed
                            {sortField === "passedCount" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleSort("failedCount")}
                        >
                          <div className="flex items-center justify-center">
                            <span className="badge badge-error badge-sm mr-1"></span>
                            Failed
                            {sortField === "failedCount" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="cursor-pointer hover:bg-gray-100 text-center"
                          onClick={() => handleSort("ipCount")}
                        >
                          <div className="flex items-center justify-center">
                            <span className="badge badge-warning badge-sm mr-1"></span>
                            IP
                            {sortField === "ipCount" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/summary/${course.id}`)}
                        >
                          <td className="font-medium">{course.subject}</td>
                          <td>{course.description}</td>
                          <td className="text-center">
                            <span className="badge badge-outline badge-sm">
                              {course.year === "FIRST"
                                ? "1st"
                                : course.year === "SECOND"
                                  ? "2nd"
                                  : course.year === "THIRD"
                                    ? "3rd"
                                    : "4th"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-sm">{course.sem}</span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${course.passedCount > 0 ? "badge-success" : "badge-ghost"} badge-sm`}
                            >
                              {course.passedCount}
                            </span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${course.failedCount > 0 ? "badge-error" : "badge-ghost"} badge-sm`}
                            >
                              {course.failedCount}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${course.ipCount > 0 ? "badge-warning" : "badge-ghost"} badge-sm`}>
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
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <div>
                  Showing {filteredCourses.length} {filteredCourses.length === 1 ? "subject" : "subjects"}
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
