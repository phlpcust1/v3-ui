"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { Navbar } from "../../components/ui/Navbar"
import { Sidebar } from "../../components/ui/Sidebar"
import { PORT } from "../../utils/constants"
import {
  FaSearch,
  FaFilter,
  FaUserPlus,
  FaFileUpload,
  FaFileDownload,
  FaTrashAlt,
  FaEye,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSyncAlt,
  FaUserGraduate,
  FaBook,
  FaEnvelope,
  FaIdCard,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa"

export function Students() {
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearLevel, setYearLevel] = useState("ALL")
  const [program, setProgram] = useState("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [studentsPerPage] = useState(10)
  const [sortField, setSortField] = useState("firstName")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [bulkActionOpen, setBulkActionOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm()

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${PORT}/students`, {
        params: {
          q: searchQuery,
          filterByYearLevel: yearLevel !== "ALL" ? yearLevel : undefined,
          filterByProgram: program !== "ALL" ? program : undefined,
          filterBySchoolTerm: schoolTerm !== "ALL" ? schoolTerm : undefined,
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

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        programId: Number.parseInt(data.programId),
        password: "password",
      }
      if (selectedStudent) {
        // Update existing student
        await axios.patch(`${PORT}/students/${selectedStudent.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
      } else {
        // Create new student
        await axios.post(`${PORT}/students`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
      }
      setIsModalOpen(false)
      setIsViewModalOpen(false)
      reset()
      fetchStudents()
    } catch (error) {
      console.error("Error saving student:", error)
    }
  }

  const handleDelete = async (studentId) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this student?")
      if (!confirmed) return

      await axios.delete(`${PORT}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      fetchStudents() // Refresh the students' list after deletion
      alert("Student deleted successfully!")
    } catch (error) {
      console.error("Error deleting student:", error)
      alert("Failed to delete the student. Please try again.")
    }
  }

  const handleViewDetails = async (student) => {
    try {
      const response = await axios.get(`${PORT}/students/${student.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      setSelectedStudent(response.data)
      setIsViewModalOpen(true)

      // Populate form fields with student data
      for (const [key, value] of Object.entries(response.data)) {
        setValue(key, value)
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
    }
  }

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadError("No file selected")
      return
    }

    setUploadProgress(0)
    setUploadError("")
    setUploadSuccess(false)

    const formData = new FormData()
    formData.append("file", csvFile)

    try {
      await axios.post(`${PORT}/students/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })
      setIsUploadModalOpen(false)
      setCsvFile(null)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
      fetchStudents()
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadError("Failed to upload file. Please check the format and try again.")
    }
  }

  // CSV download handler
  const handleDownloadCsv = () => {
    // Build CSV header
    let csv = "Student Name,Student No.,Email,Year Level,Program,Curriculum\n"

    // Append each student as a CSV row
    students.forEach((student) => {
      const studentName = `${student.firstName} ${student.lastName}`
      const studentNo = student.studentId
      const email = student.email
      const year = formatYearLevel(student.yearLevel)
      const course = student.program.code
      const curriculum = student.studentCourse[0]?.course.curriculum.code || "None"

      // Wrap fields in quotes and separate by commas
      csv += `"${studentName}","${studentNo}","${email}","${year}","${course}","${curriculum}"\n`
    })

    // Create a Blob from the CSV string and create a temporary download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const [schoolTerms, setSchoolTerms] = useState([])
  const [schoolTerm, setSchoolTerm] = useState("ALL")
  const [schoolTermModalOpen, setSchoolTermModalOpen] = useState(false)
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState([])

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

  useEffect(() => {
    fetchPrograms()
    fetchSchoolTerms()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [searchQuery, yearLevel, program, schoolTerm])

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

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get sorted and paginated students
  const getSortedStudents = () => {
    // First apply sorting
    const sorted = [...students].sort((a, b) => {
      let aValue, bValue

      if (sortField === "name") {
        aValue = `${a.firstName} ${a.lastName}`
        bValue = `${b.firstName} ${b.lastName}`
      } else if (sortField === "studentId") {
        aValue = a.studentId
        bValue = b.studentId
      } else if (sortField === "email") {
        aValue = a.email
        bValue = b.email
      } else if (sortField === "yearLevel") {
        aValue = a.yearLevel
        bValue = b.yearLevel
      } else if (sortField === "program") {
        aValue = a.program?.code || ""
        bValue = b.program?.code || ""
      } else if (sortField === "curriculum") {
        aValue = a.studentCourse[0]?.course.curriculum.code || ""
        bValue = b.studentCourse[0]?.course.curriculum.code || ""
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

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student")
      return
    }

    if (selectedAction === "delete") {
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)
      if (!confirmed) return

      try {
        await Promise.all(
          selectedStudents.map((id) =>
            axios.delete(`${PORT}/students/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              },
            }),
          ),
        )
        alert("Students deleted successfully!")
        setSelectedStudents([])
        fetchStudents()
      } catch (error) {
        console.error("Error deleting students:", error)
        alert("Failed to delete some students. Please try again.")
      }
    } else if (selectedAction === "updateTerm") {
      setSchoolTermModalOpen(true)
    }

    setBulkActionOpen(false)
  }

  // Get student statistics
  const getStudentStats = () => {
    const totalStudents = students.length
    const firstYearCount = students.filter((s) => s.yearLevel === "FIRST").length
    const secondYearCount = students.filter((s) => s.yearLevel === "SECOND").length
    const thirdYearCount = students.filter((s) => s.yearLevel === "THIRD").length
    const fourthYearCount = students.filter((s) => s.yearLevel === "FOURTH").length

    return {
      totalStudents,
      firstYearCount,
      secondYearCount,
      thirdYearCount,
      fourthYearCount,
    }
  }

  const stats = getStudentStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-60">
        <Navbar />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Students</h1>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <FaUserPlus className="mr-2" />
                Add Student
              </button>
              <button
                className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <FaFileUpload className="mr-2 text-gray-500" />
                Upload
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FaUserGraduate className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Students</h2>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FaUserGraduate className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">1st Year</h2>
                <p className="text-2xl font-bold">{stats.firstYearCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <FaUserGraduate className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">2nd Year</h2>
                <p className="text-2xl font-bold">{stats.secondYearCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <div className="rounded-full bg-orange-100 p-3 mr-4">
                <FaUserGraduate className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">3rd Year</h2>
                <p className="text-2xl font-bold">{stats.thirdYearCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <FaUserGraduate className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">4th Year</h2>
                <p className="text-2xl font-bold">{stats.fourthYearCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
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
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <FaFilter className="mr-2 text-gray-500" />
                    {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
                  </button>

                  <div className="relative">
                    <button
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setBulkActionOpen(!bulkActionOpen)}
                      disabled={selectedStudents.length === 0}
                    >
                      Bulk Actions ({selectedStudents.length})
                    </button>

                    {bulkActionOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedAction("updateTerm")
                              handleBulkAction()
                            }}
                          >
                            <FaCalendarAlt className="inline mr-2" />
                            Update School Term
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedAction("delete")
                              handleBulkAction()
                            }}
                          >
                            <FaTrashAlt className="inline mr-2" />
                            Delete Selected
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center text-sm hover:bg-gray-50 transition-colors"
                    onClick={handleDownloadCsv}
                  >
                    <FaFileDownload className="mr-2 text-gray-500" />
                    Export CSV
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <select
                    className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={schoolTerm}
                    onChange={(e) => setSchoolTerm(e.target.value)}
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
                <FaUserGraduate className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          onChange={(e) => setSelectedStudents(e.target.checked ? students.map((s) => s.id) : [])}
                          checked={students.length > 0 && selectedStudents.length === students.length}
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          <FaUserGraduate className="mr-1 text-gray-400" />
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
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("studentId")}
                      >
                        <div className="flex items-center">
                          <FaIdCard className="mr-1 text-gray-400" />
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
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center">
                          <FaEnvelope className="mr-1 text-gray-400" />
                          Email
                          {sortField === "email" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("program")}
                      >
                        <div className="flex items-center">
                          <FaBook className="mr-1 text-gray-400" />
                          Program
                          {sortField === "program" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("curriculum")}
                      >
                        <div className="flex items-center">
                          Curriculum
                          {sortField === "curriculum" &&
                            (sortDirection === "asc" ? (
                              <FaSortAmountUp className="ml-1" />
                            ) : (
                              <FaSortAmountDown className="ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
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
                            onChange={() => {
                              if (selectedStudents.includes(student.id)) {
                                setSelectedStudents(selectedStudents.filter((id) => id !== student.id))
                              } else {
                                setSelectedStudents([...selectedStudents, student.id])
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentCourse[0]?.course.curriculum.code || "None"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              onClick={() => handleViewDetails(student)}
                            >
                              <FaEye className="mr-1" />
                              View
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 flex items-center"
                              onClick={() => handleDelete(student.id)}
                            >
                              <FaTrashAlt className="mr-1" />
                              Delete
                            </button>
                          </div>
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

      {/* Update School Term Modal */}
      {schoolTermModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update School Term for Selected Students</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select School Term</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedSchoolTerm || ""}
                onChange={(e) => setSelectedSchoolTerm(e.target.value)}
              >
                <option value="">Select Term</option>
                {schoolTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setSelectedSchoolTerm(null)
                  setSchoolTermModalOpen(false)
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={!selectedSchoolTerm}
                onClick={async () => {
                  try {
                    await axios.patch(
                      `${PORT}/students/update/schoolTerm`,
                      {
                        userIds: selectedStudents,
                        schoolTermId: Number.parseInt(selectedSchoolTerm),
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                        },
                      },
                    )
                    alert("School term updated successfully!")
                    setSelectedStudents([])
                    setSelectedSchoolTerm(null)
                    setSchoolTermModalOpen(false)
                    fetchStudents()
                  } catch (error) {
                    console.error("Error updating school term:", error)
                    alert("Update failed. Try again.")
                  }
                }}
              >
                Update {selectedStudents.length} Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setIsModalOpen(false)}>
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("studentId", {
                    required: "Student ID is required",
                  })}
                />
                {errors.studentId && <span className="text-red-500 text-sm">{errors.studentId.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("programId", { required: "Program is required" })}
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
                {errors.programId && <span className="text-red-500 text-sm">{errors.programId.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && <span className="text-red-500 text-sm">{errors.address.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("yearLevel", { required: "Year level is required" })}
                >
                  <option value="">Select Year Level</option>
                  <option value="FIRST">First Year</option>
                  <option value="SECOND">Second Year</option>
                  <option value="THIRD">Third Year</option>
                  <option value="FOURTH">Fourth Year</option>
                </select>
                {errors.yearLevel && <span className="text-red-500 text-sm">{errors.yearLevel.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none"
                  value="password"
                  disabled
                  {...register("password")}
                />
                <p className="text-xs text-gray-500 mt-1">Default password will be set</p>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FaSyncAlt className="animate-spin inline mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Student Information</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setIsViewModalOpen(false)}>
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("studentId", {
                    required: "Student ID is required",
                  })}
                />
                {errors.studentId && <span className="text-red-500 text-sm">{errors.studentId.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("programId", { required: "Program is required" })}
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code} - {prog.name}
                    </option>
                  ))}
                </select>
                {errors.programId && <span className="text-red-500 text-sm">{errors.programId.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && <span className="text-red-500 text-sm">{errors.address.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  {...register("yearLevel", { required: "Year level is required" })}
                >
                  <option value="">Select Year Level</option>
                  <option value="FIRST">First Year</option>
                  <option value="SECOND">Second Year</option>
                  <option value="THIRD">Third Year</option>
                  <option value="FOURTH">Fourth Year</option>
                </select>
                {errors.yearLevel && <span className="text-red-500 text-sm">{errors.yearLevel.message}</span>}
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FaSyncAlt className="animate-spin inline mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Students Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Students</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setIsUploadModalOpen(false)}>
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files[0])}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV file up to 10MB</p>
                  </div>
                </div>
                {csvFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected file: <span className="font-medium">{csvFile.name}</span> (
                    {Math.round(csvFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  </div>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Uploading... {uploadProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaCheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">Upload successful!</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleUpload}
                  disabled={!csvFile}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {uploadSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-4 shadow-lg z-50 flex items-center">
          <FaCheckCircle className="h-5 w-5 text-green-400 mr-3" />
          <div>
            <p className="font-medium">Success!</p>
            <p className="text-sm">Students have been uploaded successfully.</p>
          </div>
        </div>
      )}
    </div>
  )
}
