"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

// Import icons from react-icons instead of lucide-react
import {
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaBook,
  FaChevronRight,
  FaExternalLinkAlt,
  FaChartBar,
  FaFilter,
} from "react-icons/fa"

export function CoachDashboard() {
  const [students, setStudents] = useState([])
  const [onTrackCount, setOnTrackCount] = useState(0)
  const [notOnTrackCount, setNotOnTrackCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const coachId = localStorage.getItem("id") // Get coach ID from localStorage
      const response = await axios.get(`${PORT}/coaches/${coachId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      const processedStudents = response.data.assignments.map((assignment) => {
        const hasFailed = assignment.student.studentCourse.some((course) => course.remark === "FAILED")

        return {
          ...assignment.student,
          isOnTrack: !hasFailed,
        }
      })

      setStudents(processedStudents)
      setFilteredStudents(processedStudents)

      // Count on-track and not-on-track students
      const onTrack = processedStudents.filter((student) => student.isOnTrack).length
      const notOnTrack = processedStudents.filter((student) => !student.isOnTrack).length

      setOnTrackCount(onTrack)
      setNotOnTrackCount(notOnTrack)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    // Filter students based on search term and filters
    let result = students

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (student) =>
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isOnTrack = statusFilter === "onTrack"
      result = result.filter((student) => student.isOnTrack === isOnTrack)
    }

    // Apply year filter
    if (yearFilter !== "all") {
      result = result.filter((student) => student.yearLevel === yearFilter)
    }

    setFilteredStudents(result)
  }, [searchTerm, statusFilter, yearFilter, students])

  const handleViewStudent = (studentId) => {
    window.location.assign(`/my-students/${studentId}`)
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
          <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">No. of Students Handle</h2>
                <p className="text-3xl font-bold">{isLoading ? "..." : students.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">On Track Students</h2>
                <p className="text-3xl font-bold">{isLoading ? "..." : onTrackCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <FaTimesCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Not On Track Students</h2>
                <p className="text-3xl font-bold">{isLoading ? "..." : notOnTrackCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <FaChartBar className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium">Student Statistics</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {isLoading
                    ? "..."
                    : students.length > 0
                      ? `${Math.round((onTrackCount / students.length) * 100)}%`
                      : "0%"}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">First Year Students</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : students.filter((s) => s.yearLevel === "FIRST").length}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Second Year Students</p>
                <p className="text-2xl font-bold">
                  {isLoading ? "..." : students.filter((s) => s.yearLevel === "SECOND").length}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Advising Forms</p>
                <p className="text-2xl font-bold">{isLoading ? "..." : students.length}</p>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FaBook className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-lg font-medium">List of Students</h2>
                </div>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => window.location.assign("/my-students")}
                >
                  View All
                  <FaChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search by name or student number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFilter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="onTrack">On Track</option>
                      <option value="notOnTrack">Not On Track</option>
                    </select>
                  </div>

                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    <option value="FIRST">First Year</option>
                    <option value="SECOND">Second Year</option>
                    <option value="THIRD">Third Year</option>
                    <option value="FOURTH">Fourth Year</option>
                  </select>
                </div>
              </div>
            </div>

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
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student No.
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year Level
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.slice(0, 6).map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
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
                                <FaCheckCircle className="h-3 w-3 mr-1" />
                                On Track
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="h-3 w-3 mr-1" />
                                Not On Track
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            View Subjects
                            <FaExternalLinkAlt className="ml-1.5 h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredStudents.length > 6 && (
                  <div className="px-6 py-4 border-t flex justify-center">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => window.location.assign("/my-students")}
                    >
                      View All Students
                      <FaChevronRight className="ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
