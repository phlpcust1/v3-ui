"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"

export function MySubjects() {
  const [studentData, setStudentData] = useState(null)
  const [allCourses, setAllCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("My Subjects")
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const [schoolTerms, setSchoolTerms] = useState([])
  const [selectedSchoolTermId, setSelectedSchoolTermId] = useState("All")
  const [transcriptYearFilter, setTranscriptYearFilter] = useState("All")
  const [transcriptSemFilter, setTranscriptSemFilter] = useState("All")

  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setSchoolTerms(response.data)
      if (response.data.length > 0) {
        // Set the most recent term as default
        setSelectedSchoolTermId(response.data[0].id.toString())
      }
    } catch (error) {
      console.error("Error fetching school terms:", error)
      setError("Failed to load school terms. Please try again later.")
    }
  }

  const fetchStudentData = async () => {
    try {
      const studentId = localStorage.getItem("id")
      const response = await axios.get(`${PORT}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setStudentData(response.data)
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("Failed to load student data. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllCourses = async () => {
    try {
      const response = await axios.get(`${PORT}/courses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setAllCourses(response.data)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to load courses. Please try again later.")
    }
  }

  useEffect(() => {
    fetchStudentData()
    fetchAllCourses()
    fetchSchoolTerms()
  }, [])

  const calculateTotalUnits = (courses) => {
    return courses.reduce((total, course) => {
      const units = course.course ? Number(course.course.units) : Number(course.units) || 0
      return total + units
    }, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-600">Loading student data...</p>
        </div>
      </div>
    )
  }

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
          <button className="btn btn-sm" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="alert alert-warning max-w-lg">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">No Data Available</h3>
            <div className="text-sm">Unable to fetch student data. Please check your connection and try again.</div>
          </div>
          <button className="btn btn-sm" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Filter subjects based on selected school term
  const mySubjects = studentData.studentCourse.filter((course) => {
    return selectedSchoolTermId === "All" || course.schoolTermId?.toString() === selectedSchoolTermId
  })

  // Filter transcript courses
  let transcriptCourses = allCourses.filter((course) => course.programId === studentData.program.id)

  if (transcriptYearFilter !== "All") {
    transcriptCourses = transcriptCourses.filter((course) => course.year === transcriptYearFilter)
  }

  if (transcriptSemFilter !== "All") {
    transcriptCourses = transcriptCourses.filter((course) => course.sem.toString() === transcriptSemFilter)
  }

  // Group transcript courses by year and semester for better organization
  const groupedTranscriptCourses = transcriptCourses.reduce((acc, course) => {
    const key = `${course.year}-${course.sem}`
    if (!acc[key]) {
      acc[key] = {
        year: course.year,
        sem: course.sem,
        courses: [],
      }
    }
    acc[key].courses.push(course)
    return acc
  }, {})

  // Sort groups by year and semester
  const sortedGroups = Object.values(groupedTranscriptCourses).sort((a, b) => {
    const yearOrder = { FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4 }
    if (yearOrder[a.year] !== yearOrder[b.year]) {
      return yearOrder[a.year] - yearOrder[b.year]
    }
    return a.sem - b.sem
  })

  const getYearLabel = (year) => {
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-60 bg-base-200 min-h-screen">
        <Navbar />
        <div className="p-6">
          <div className="card bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              {/* Student Info Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h2 className="font-bold text-lg">
                      {studentData.firstName} {studentData.lastName}
                    </h2>
                    <p className="text-gray-600 mt-1">{studentData.studentId}</p>
                  </div>
                  <div className="mt-3 md:mt-0 flex flex-col md:items-end">
                    <p className="mb-1">
                      <span className="font-semibold">Program:</span> {studentData.program.name}
                    </p>
                    <p>
                      <span className="font-semibold">Year Level:</span>{" "}
                      <span className="badge badge-outline">{studentData.yearLevel}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs tabs-boxed bg-gray-100 mb-6">
                <button
                  className={`tab ${activeTab === "My Subjects" ? "bg-gray-200 text-black" : ""}`}
                  onClick={() => setActiveTab("My Subjects")}
                >
                  My Subjects
                </button>
                <button
                  className={`tab ${activeTab === "Transcript of Records" ? "bg-gray-200 text-black" : ""}`}
                  onClick={() => setActiveTab("Transcript of Records")}
                >
                  Transcript of Records
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "My Subjects" && (
                <>
                  <div className="mb-5">
                    <div className="form-control w-full max-w-xs">
                      <label className="label">
                        <span className="label-text font-medium">School Term</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={selectedSchoolTermId}
                        onChange={(e) => setSelectedSchoolTermId(e.target.value)}
                      >
                        <option value="All">All School Terms</option>
                        {schoolTerms.map((term) => (
                          <option key={term.id} value={term.id}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {mySubjects.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-3">Subject</th>
                            <th className="py-3">Description</th>
                            <th className="py-3">Units</th>
                            <th className="py-3">No of Take</th>
                            <th className="py-3">Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mySubjects.map((course) => (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="font-medium py-3">{course.course.subject}</td>
                              <td className="py-3">{course.course.description}</td>
                              <td className="py-3">{course.course.units}</td>
                              <td className="py-3">{course.noTake}</td>
                              <td className="py-3">
                                {course.remark === "HOLD" ? (
                                  <span className="badge badge-outline">Pending</span>
                                ) : course.remark === "PASSED" ? (
                                  <span className="badge bg-green-100 text-green-800 border-green-200">Passed</span>
                                ) : course.remark === "FAILED" ? (
                                  <span className="badge bg-red-100 text-red-800 border-red-200">Failed</span>
                                ) : (
                                  course.remark
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold bg-gray-50">
                            <td colSpan={2} className="text-right py-3">
                              Total Units:
                            </td>
                            <td className="py-3">{calculateTotalUnits(mySubjects)}</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-500 font-medium">No subjects found for the selected term</p>
                      <p className="text-sm text-gray-400 mt-2">Try selecting a different school term</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === "Transcript of Records" && (
                <>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="form-control w-full md:w-64">
                      <label className="label">
                        <span className="label-text font-medium">Year Level</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={transcriptYearFilter}
                        onChange={(e) => setTranscriptYearFilter(e.target.value)}
                      >
                        <option value="All">All Year Levels</option>
                        <option value="FIRST">First Year</option>
                        <option value="SECOND">Second Year</option>
                        <option value="THIRD">Third Year</option>
                        <option value="FOURTH">Fourth Year</option>
                      </select>
                    </div>
                    <div className="form-control w-full md:w-64">
                      <label className="label">
                        <span className="label-text font-medium">Semester</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={transcriptSemFilter}
                        onChange={(e) => setTranscriptSemFilter(e.target.value)}
                      >
                        <option value="All">All Semesters</option>
                        <option value="1">1st Semester</option>
                        <option value="2">2nd Semester</option>
                      </select>
                    </div>
                  </div>

                  {sortedGroups.length > 0 ? (
                    sortedGroups.map((group, index) => (
                      <div key={index} className="mb-8">
                        <div className="flex items-center mb-3">
                          <h3 className="font-bold text-lg">
                            {getYearLabel(group.year)} - {group.sem === 1 ? "First" : "Second"} Semester
                          </h3>
                          <div className="ml-3 badge badge-outline">{group.courses.length} courses</div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-3">Subject</th>
                                <th className="py-3">Description</th>
                                <th className="py-3">Units</th>
                                <th className="py-3">Remark</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.courses.map((course) => {
                                const studentRecord = studentData.studentCourse.find((sc) => sc.courseId === course.id)
                                return (
                                  <tr key={course.id} className="hover:bg-gray-50">
                                    <td className="font-medium py-3">{course.subject}</td>
                                    <td className="py-3">{course.description}</td>
                                    <td className="py-3">{course.units}</td>
                                    <td className="py-3">
                                      {studentRecord ? (
                                        studentRecord.remark === "HOLD" ? (
                                          <span className="badge badge-outline">Pending</span>
                                        ) : studentRecord.remark === "PASSED" ? (
                                          <span className="badge bg-green-100 text-green-800 border-green-200">
                                            Passed
                                          </span>
                                        ) : studentRecord.remark === "FAILED" ? (
                                          <span className="badge bg-red-100 text-red-800 border-red-200">Failed</span>
                                        ) : (
                                          studentRecord.remark
                                        )
                                      ) : (
                                        <span className="text-gray-400">Not Taken</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="font-bold bg-gray-50">
                                <td colSpan={2} className="text-right py-3">
                                  Total Units:
                                </td>
                                <td className="py-3">{calculateTotalUnits(group.courses)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="text-gray-500 font-medium">No courses found for the selected filters</p>
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your year level or semester filters</p>
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                <button className="btn btn-neutral" onClick={() => navigate(`/academic-advising/${studentData.id}`)}>
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
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View AcadForm
                </button>
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
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
