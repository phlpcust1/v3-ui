"use client"

import { useNavigate, useParams } from "react-router-dom"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { PORT } from "../../utils/constants"

export default function SummaryDetails() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remarkFilter, setRemarkFilter] = useState("ALL")
  const [yearFilter, setYearFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [selectedStudents, setSelectedStudents] = useState([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const navigate = useNavigate()

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${PORT}/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCourse(response.data)
    } catch (error) {
      console.error("Error fetching course details:", error)
      setError("Failed to load course details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsEnrolled = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${PORT}/student-course?courseId=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudents(response.data)
    } catch (error) {
      console.error("Error fetching enrolled students:", error)
      setError("Failed to load student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourseDetails()
    fetchStudentsEnrolled()
  }, [id])

  const handleSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
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
        return "Unknown"
    }
  }

  const getYearLevelBadgeClass = (yearLevel) => {
    switch (yearLevel) {
      case "FIRST":
        return "badge bg-green-100 text-green-800 border-green-200"
      case "SECOND":
        return "badge bg-blue-100 text-blue-800 border-blue-200"
      case "THIRD":
        return "badge bg-purple-100 text-purple-800 border-purple-200"
      case "FOURTH":
        return "badge bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "badge"
    }
  }

  const getRemarkBadgeClass = (remark) => {
    switch (remark) {
      case "PASSED":
        return "badge bg-green-100 text-green-800 border-green-200"
      case "FAILED":
        return "badge bg-red-100 text-red-800 border-red-200"
      case "IP":
        return "badge bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "badge"
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Filter by remark
      const matchesRemark = remarkFilter === "ALL" || student.remark === remarkFilter

      // Filter by year level
      const matchesYear = yearFilter === "ALL" || student.student.yearLevel === yearFilter

      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        `${student.student.firstName} ${student.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.studentId.toLowerCase().includes(searchQuery.toLowerCase())

      return student.remark !== "HOLD" && matchesRemark && matchesYear && matchesSearch
    })
  }, [students, remarkFilter, yearFilter, searchQuery])

  // Sort the filtered students
  const sortedStudents = useMemo(() => {
    const sortableStudents = [...filteredStudents]
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        let aValue, bValue

        // Handle nested properties
        if (sortConfig.key === "name") {
          aValue = `${a.student.firstName} ${a.student.lastName}`
          bValue = `${b.student.firstName} ${b.student.lastName}`
        } else if (sortConfig.key === "email") {
          aValue = a.student.email
          bValue = b.student.email
        } else if (sortConfig.key === "yearLevel") {
          aValue = a.student.yearLevel
          bValue = b.student.yearLevel
        } else if (sortConfig.key === "program") {
          aValue = a.student.program.code
          bValue = b.student.program.code
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
    return sortableStudents
  }, [filteredStudents, sortConfig])

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalStudents = students.filter((s) => s.remark !== "HOLD").length
    const passedStudents = students.filter((s) => s.remark === "PASSED").length
    const failedStudents = students.filter((s) => s.remark === "FAILED").length
    const ipStudents = students.filter((s) => s.remark === "IP").length

    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0
    const failRate = totalStudents > 0 ? (failedStudents / totalStudents) * 100 : 0

    return {
      totalStudents,
      passedStudents,
      failedStudents,
      ipStudents,
      passRate: passRate.toFixed(1),
      failRate: failRate.toFixed(1),
    }
  }, [students])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(sortedStudents.map((student) => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleSelectStudent = (e, studentId) => {
    e.stopPropagation()
    if (e.target.checked) {
      setSelectedStudents([...selectedStudents, studentId])
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    }
  }

  const exportToCSV = () => {
    // Filter students based on selection
    const studentsToExport =
      selectedStudents.length > 0 ? students.filter((student) => selectedStudents.includes(student.id)) : sortedStudents

    // Create CSV content
    let csv = "Student Name,Student ID,Email,Year Level,Program,Remark\n"

    studentsToExport.forEach((student) => {
      const row = [
        `"${student.student.firstName} ${student.student.lastName}"`,
        `"${student.student.studentId}"`,
        `"${student.student.email}"`,
        `"${formatYearLevel(student.student.yearLevel)}"`,
        `"${student.student.program.code}"`,
        `"${student.remark}"`,
      ]
      csv += row.join(",") + "\n"
    })

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${course.subject}_students.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Loading course details...</p>
        </div>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="alert alert-error max-w-md">
          <div>
            <span>{error}</span>
          </div>
          <div>
            <button
              className="btn btn-sm"
              onClick={() => {
                fetchCourseDetails()
                fetchStudentsEnrolled()
              }}
            >
              Retry
            </button>
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
          {/* Breadcrumb Navigation */}
          <div className="text-sm breadcrumbs mb-4">
            <ul>
              <li>
                <a onClick={() => navigate("/summary")} className="cursor-pointer">
                  Summary
                </a>
              </li>
              <li>{course.subject}</li>
            </ul>
          </div>

          <h1 className="font-bold text-xl mb-4">{course.description} - List of Enrolled Students</h1>

          {/* Course Information Card */}
          <div className="card bg-white shadow-xl p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h2 className="text-lg font-bold mb-2">Course Information</h2>
                <p>
                  <span className="font-semibold">Subject Code:</span> {course.subject}
                </p>
                <p>
                  <span className="font-semibold">Description:</span> {course.description}
                </p>
                <p>
                  <span className="font-semibold">Units:</span> {course.units}
                </p>
                <p>
                  <span className="font-semibold">Year Level:</span> {formatYearLevel(course.year)}
                  <span className={`ml-2 ${getYearLevelBadgeClass(course.year)}`}>{formatYearLevel(course.year)}</span>
                </p>
                <p>
                  <span className="font-semibold">Semester:</span> {course.sem}
                  <span className="ml-2 badge">{course.sem === 1 ? "1st Semester" : "2nd Semester"}</span>
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="col-span-2">
                <h2 className="text-lg font-bold mb-2">Student Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="stat bg-base-100 rounded-lg shadow">
                    <div className="stat-title">Total Students</div>
                    <div className="stat-value text-2xl">{statistics.totalStudents}</div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow">
                    <div className="stat-title">Passed</div>
                    <div className="stat-value text-2xl text-green-600">{statistics.passedStudents}</div>
                    <div className="stat-desc">{statistics.passRate}% Pass Rate</div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow">
                    <div className="stat-title">Failed</div>
                    <div className="stat-value text-2xl text-red-600">{statistics.failedStudents}</div>
                    <div className="stat-desc">{statistics.failRate}% Fail Rate</div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow">
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value text-2xl text-yellow-600">{statistics.ipStudents}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Filters and Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="form-control">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="input input-bordered w-full md:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button className="btn btn-square" onClick={() => setSearchQuery("")}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={`btn btn-sm ${remarkFilter === "ALL" ? "btn-neutral" : "btn-outline"}`}
                      onClick={() => setRemarkFilter("ALL")}
                    >
                      All
                    </button>
                    <button
                      className={`btn btn-sm ${remarkFilter === "PASSED" ? "bg-green-600 text-white" : "btn-outline"}`}
                      onClick={() => setRemarkFilter("PASSED")}
                    >
                      Passed
                    </button>
                    <button
                      className={`btn btn-sm ${remarkFilter === "FAILED" ? "bg-red-600 text-white" : "btn-outline"}`}
                      onClick={() => setRemarkFilter("FAILED")}
                    >
                      Failed
                    </button>
                    <button
                      className={`btn btn-sm ${remarkFilter === "IP" ? "bg-yellow-600 text-white" : "btn-outline"}`}
                      onClick={() => setRemarkFilter("IP")}
                    >
                      In Progress
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? "Hide Filters" : "More Filters"}
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={exportToCSV}
                    disabled={sortedStudents.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="bg-base-100 p-4 rounded-lg mb-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Year Level</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                      >
                        <option value="ALL">All Years</option>
                        <option value="FIRST">1st Year</option>
                        <option value="SECOND">2nd Year</option>
                        <option value="THIRD">3rd Year</option>
                        <option value="FOURTH">4th Year</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Remark</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={remarkFilter}
                        onChange={(e) => setRemarkFilter(e.target.value)}
                      >
                        <option value="ALL">All Remarks</option>
                        <option value="PASSED">Passed</option>
                        <option value="FAILED">Failed</option>
                        <option value="IP">In Progress (IP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Filters */}
              {(remarkFilter !== "ALL" || yearFilter !== "ALL" || searchQuery) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm font-medium">Active Filters:</span>
                  {remarkFilter !== "ALL" && (
                    <div className="badge badge-outline gap-2">
                      Remark: {remarkFilter}
                      <button onClick={() => setRemarkFilter("ALL")}>×</button>
                    </div>
                  )}
                  {yearFilter !== "ALL" && (
                    <div className="badge badge-outline gap-2">
                      Year: {formatYearLevel(yearFilter)}
                      <button onClick={() => setYearFilter("ALL")}>×</button>
                    </div>
                  )}
                  {searchQuery && (
                    <div className="badge badge-outline gap-2">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")}>×</button>
                    </div>
                  )}
                </div>
              )}

              {/* Students Count */}
              <div className="text-sm mb-2">
                Showing {sortedStudents.length} of {students.filter((s) => s.remark !== "HOLD").length} students
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                {sortedStudents.length > 0 ? (
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="w-10">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedStudents.length === sortedStudents.length && sortedStudents.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("name")}>
                          Student Name
                          {sortConfig.key === "name" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("email")}>
                          Email
                          {sortConfig.key === "email" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("yearLevel")}>
                          Year Level
                          {sortConfig.key === "yearLevel" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("program")}>
                          Program
                          {sortConfig.key === "program" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("remark")}>
                          Remark
                          {sortConfig.key === "remark" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="cursor-pointer hover:bg-base-200"
                          onClick={() => navigate(`/my-students/${student.student.id}`)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => handleSelectStudent(e, student.id)}
                            />
                          </td>
                          <td>
                            {student.student.firstName} {student.student.lastName}
                          </td>
                          <td>{student.student.email}</td>
                          <td>
                            <span className={getYearLevelBadgeClass(student.student.yearLevel)}>
                              {formatYearLevel(student.student.yearLevel)}
                            </span>
                          </td>
                          <td>{student.student.program.code}</td>
                          <td>
                            <span className={getRemarkBadgeClass(student.remark)}>{student.remark}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <h3 className="font-bold text-lg">No students found</h3>
                    <p className="text-gray-500">
                      No students match your current filters. Try adjusting your filters or search query.
                    </p>
                    <button
                      className="btn btn-outline mt-4"
                      onClick={() => {
                        setRemarkFilter("ALL")
                        setYearFilter("ALL")
                        setSearchQuery("")
                      }}
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between mt-4">
                <button className="btn btn-outline" onClick={() => navigate("/summary")}>
                  Back to Summary
                </button>

                {selectedStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedStudents.length} students selected</span>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedStudents([])}>
                      Clear Selection
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={exportToCSV}>
                      Export Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
