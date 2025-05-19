"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export default function CoachDetails() {
  const { id } = useParams() // Get coach ID from URL
  const navigate = useNavigate()
  const [coach, setCoach] = useState(null)
  const [students, setStudents] = useState([])
  const [yearFilter, setYearFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })
  const [expandedStudent, setExpandedStudent] = useState(null)

  // Fetch coach details
  const fetchCoachDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${PORT}/coaches/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setCoach(response.data)
      setStudents(response.data.assignments.map((a) => a.student)) // Extract students
    } catch (error) {
      console.error("Error fetching coach details:", error)
      setError("Failed to load coach details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoachDetails()
  }, [id])

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Calculate student statistics
  const studentStats = useMemo(() => {
    const stats = {
      FIRST: 0,
      SECOND: 0,
      THIRD: 0,
      FOURTH: 0,
      total: students.length,
    }

    students.forEach((student) => {
      if (student.yearLevel) {
        stats[student.yearLevel.toUpperCase()] = (stats[student.yearLevel.toUpperCase()] || 0) + 1
      }
    })

    return stats
  }, [students])

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...students]

    // Apply year filter
    if (yearFilter !== "ALL") {
      result = result.filter((student) => student.yearLevel && student.yearLevel.toUpperCase() === yearFilter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (student) =>
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
          (student.studentId && student.studentId.toLowerCase().includes(query)) ||
          (student.email && student.email.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue

        if (sortConfig.key === "name") {
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
        } else {
          aValue = a[sortConfig.key] ? a[sortConfig.key].toLowerCase() : ""
          bValue = b[sortConfig.key] ? b[sortConfig.key].toLowerCase() : ""
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

    return result
  }, [students, yearFilter, searchQuery, sortConfig])

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  // Select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id))
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    let csv = "Student Name,Student ID,Email,Year Level\n"

    // Get students to export (either selected or all filtered)
    const studentsToExport =
      selectedStudents.length > 0
        ? filteredStudents.filter((student) => selectedStudents.includes(student.id))
        : filteredStudents

    // Add each student as a row
    studentsToExport.forEach((student) => {
      const name = `${student.firstName} ${student.lastName}`
      const studentId = student.studentId || ""
      const email = student.email || ""
      const yearLevel = student.yearLevel || ""

      csv += `"${name}","${studentId}","${email}","${yearLevel}"\n`
    })

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${coach.firstName}_${coach.lastName}_students.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Toggle expanded student
  const toggleExpandStudent = (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null)
    } else {
      setExpandedStudent(studentId)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <Sidebar />
        <div className="ml-60 bg-base-200">
          <Navbar />
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-bold text-xl">Curriculum Coach</h1>
              <button className="btn btn-sm btn-outline" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>

            {/* Skeleton loading */}
            <div className="card bg-white shadow-xl p-6 mb-4 animate-pulse">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gray-300 mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/5"></div>
                </div>
                <div className="w-1/4">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-10 bg-gray-300 rounded w-72"></div>
                  <div className="h-10 bg-gray-300 rounded w-40"></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="w-12"></th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Email</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(5)].map((_, index) => (
                        <tr key={index}>
                          <td className="w-12">
                            <div className="h-5 bg-gray-300 rounded-full w-5"></div>
                          </td>
                          <td>
                            <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                          </td>
                          <td>
                            <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                          </td>
                          <td>
                            <div className="h-5 bg-gray-300 rounded w-2/3"></div>
                          </td>
                          <td>
                            <div className="h-8 bg-gray-300 rounded w-24"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div>
        <Sidebar />
        <div className="ml-60 bg-base-200">
          <Navbar />
          <div className="p-8">
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={fetchCoachDetails}>
                Retry
              </button>
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
          {/* Header with breadcrumbs and back button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="font-bold text-xl">Curriculum Coach</h1>
              <div className="text-sm breadcrumbs">
                <ul>
                  <li>
                    <a onClick={() => navigate("/coaches")}>Coaches</a>
                  </li>
                  <li>
                    {coach.firstName} {coach.lastName}
                  </li>
                </ul>
              </div>
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          {/* Coach profile card */}
          <div className="card bg-white shadow-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="mr-4">
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {coach.firstName?.[0]}
                        {coach.lastName?.[0]}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    {coach.firstName} {coach.lastName}
                  </h2>
                  <p className="text-gray-500">Curriculum Coach</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">ID:</span> {coach.coachId}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {coach.email}
                  </p>
                </div>
              </div>

              <div className="divider md:divider-horizontal"></div>

              <div className="grid grid-cols-2 gap-4 md:flex md:space-x-6">
                <div className="stat p-2 bg-gray-50 rounded-lg">
                  <div className="stat-title text-xs">Total Students</div>
                  <div className="stat-value text-2xl">{students.length}</div>
                </div>
                <div className="stat p-2 bg-gray-50 rounded-lg">
                  <div className="stat-title text-xs">1st Year</div>
                  <div className="stat-value text-2xl">{studentStats.FIRST}</div>
                </div>
                <div className="stat p-2 bg-gray-50 rounded-lg">
                  <div className="stat-title text-xs">2nd Year</div>
                  <div className="stat-value text-2xl">{studentStats.SECOND}</div>
                </div>
                <div className="stat p-2 bg-gray-50 rounded-lg">
                  <div className="stat-title text-xs">3rd-4th Year</div>
                  <div className="stat-value text-2xl">{studentStats.THIRD + studentStats.FOURTH}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Student list card */}
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              {/* Tabs for year filtering */}
              <div className="tabs tabs-boxed bg-gray-100 p-1 mb-4">
                <a
                  className={`tab ${yearFilter === "ALL" ? "bg-white shadow" : ""}`}
                  onClick={() => setYearFilter("ALL")}
                >
                  All Years
                </a>
                <a
                  className={`tab ${yearFilter === "FIRST" ? "bg-white shadow" : ""}`}
                  onClick={() => setYearFilter("FIRST")}
                >
                  1st Year
                </a>
                <a
                  className={`tab ${yearFilter === "SECOND" ? "bg-white shadow" : ""}`}
                  onClick={() => setYearFilter("SECOND")}
                >
                  2nd Year
                </a>
                <a
                  className={`tab ${yearFilter === "THIRD" ? "bg-white shadow" : ""}`}
                  onClick={() => setYearFilter("THIRD")}
                >
                  3rd Year
                </a>
                <a
                  className={`tab ${yearFilter === "FOURTH" ? "bg-white shadow" : ""}`}
                  onClick={() => setYearFilter("FOURTH")}
                >
                  4th Year
                </a>
              </div>

              {/* Search and actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search by name, ID or email..."
                    className="input input-bordered w-full pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedStudents.length > 0 && (
                    <div className="badge badge-neutral">{selectedStudents.length} selected</div>
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={exportToCSV}
                    disabled={filteredStudents.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Students table */}
              <div className="overflow-x-auto">
                {filteredStudents.length > 0 ? (
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("name")}>
                          Student Name
                          {sortConfig.key === "name" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("studentId")}>
                          Student ID
                          {sortConfig.key === "studentId" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th className="cursor-pointer hover:bg-gray-100" onClick={() => requestSort("email")}>
                          Email
                          {sortConfig.key === "email" && (
                            <span className="ml-1">{sortConfig.direction === "ascending" ? "↑" : "↓"}</span>
                          )}
                        </th>
                        <th>Year</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <>
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td>
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                              />
                            </td>
                            <td className="font-medium cursor-pointer" onClick={() => toggleExpandStudent(student.id)}>
                              {student.firstName} {student.lastName}
                              <span className="ml-2 text-xs">{expandedStudent === student.id ? "▼" : "▶"}</span>
                            </td>
                            <td>{student.studentId}</td>
                            <td>{student.email}</td>
                            <td>
                              <div className="badge badge-outline">
                                {student.yearLevel === "FIRST" && "1st Year"}
                                {student.yearLevel === "SECOND" && "2nd Year"}
                                {student.yearLevel === "THIRD" && "3rd Year"}
                                {student.yearLevel === "FOURTH" && "4th Year"}
                                {!student.yearLevel && "N/A"}
                              </div>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => window.location.assign(`/programs/student-subjects/${student.id}`)}
                                >
                                  View subjects
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedStudent === student.id && (
                            <tr className="bg-gray-50">
                              <td colSpan="6" className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Student Information</h4>
                                    <p className="text-sm">
                                      <span className="font-medium">Program:</span> {student.program?.name || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">Year Level:</span> {student.yearLevel || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-medium">Email:</span> {student.email || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Quick Actions</h4>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() =>
                                          window.location.assign(`/programs/student-subjects/${student.id}`)
                                        }
                                      >
                                        View Subjects
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => window.location.assign(`/academic-advising/${student.id}`)}
                                      >
                                        Academic Advising
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="font-bold text-lg">No students found</h3>
                    <p className="text-gray-500">
                      {searchQuery
                        ? "Try adjusting your search or filters"
                        : "No students are currently assigned to this coach"}
                    </p>
                    {searchQuery && (
                      <button
                        className="btn btn-sm btn-outline mt-4"
                        onClick={() => {
                          setSearchQuery("")
                          setYearFilter("ALL")
                        }}
                      >
                        Clear filters
                      </button>
                    )}
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
